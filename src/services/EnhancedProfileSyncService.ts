// Enhanced Profile Sync Service - Real-time cross-device synchronization
import { supabase } from '@/integrations/supabase/client';
import { ProfileDatabaseService } from './ProfileDatabaseService';

export interface SyncEvent {
  id: string;
  type: 'profile_created' | 'profile_updated' | 'profile_deleted' | 'data_updated';
  profileId: string;
  userId: string;
  timestamp: number;
  data?: any;
  deviceId: string;
  changes?: Record<string, any>;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  profileId: string;
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: number;
}

class EnhancedProfileSyncService {
  private static instance: EnhancedProfileSyncService;
  private syncQueue: SyncEvent[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private deviceId: string;
  private subscribers: ((status: SyncStatus) => void)[] = [];
  private conflictResolver?: (conflicts: SyncConflict[]) => Promise<Record<string, any>>;

  static getInstance(): EnhancedProfileSyncService {
    if (!EnhancedProfileSyncService.instance) {
      EnhancedProfileSyncService.instance = new EnhancedProfileSyncService();
    }
    return EnhancedProfileSyncService.instance;
  }

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupNetworkMonitoring();
    this.setupRealtimeSubscription();
    this.startPeriodicSync();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Enhanced Profile Sync Service...');
      
      // Load pending changes from localStorage
      await this.loadPendingChanges();
      
      // Perform initial sync if online
      if (this.isOnline) {
        await this.performFullSync();
      }
      
      console.log('✅ Profile sync service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize sync service:', error);
      throw error;
    }
  }

  // Real-time synchronization methods
  private setupRealtimeSubscription(): void {
    supabase
      .channel('profile-sync')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_profiles' 
        }, 
        (payload) => this.handleRealtimeProfileChange(payload)
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profile_data' 
        }, 
        (payload) => this.handleRealtimeDataChange(payload)
      )
      .subscribe();
  }

  private async handleRealtimeProfileChange(payload: any): Promise<void> {
    try {
      console.log('📡 Received realtime profile change:', payload);
      
      // Skip if this change originated from this device
      if (payload.new?.device_id === this.deviceId) {
        return;
      }

      const event: SyncEvent = {
        id: this.generateEventId(),
        type: payload.eventType === 'INSERT' ? 'profile_created' : 
              payload.eventType === 'UPDATE' ? 'profile_updated' : 'profile_deleted',
        profileId: payload.new?.id || payload.old?.id,
        userId: payload.new?.user_id || payload.old?.user_id,
        timestamp: Date.now(),
        data: payload.new,
        deviceId: payload.new?.device_id || 'unknown',
        changes: this.calculateChanges(payload.old, payload.new)
      };

      await this.processRealtimeEvent(event);
    } catch (error) {
      console.error('❌ Error handling realtime profile change:', error);
    }
  }

  private async handleRealtimeDataChange(payload: any): Promise<void> {
    try {
      console.log('📡 Received realtime data change:', payload);
      
      const event: SyncEvent = {
        id: this.generateEventId(),
        type: 'data_updated',
        profileId: payload.new?.profile_id || payload.old?.profile_id,
        userId: '', // Will be resolved from profile
        timestamp: Date.now(),
        data: payload.new,
        deviceId: payload.new?.device_id || 'unknown',
        changes: this.calculateChanges(payload.old, payload.new)
      };

      await this.processRealtimeEvent(event);
    } catch (error) {
      console.error('❌ Error handling realtime data change:', error);
    }
  }

  private async processRealtimeEvent(event: SyncEvent): Promise<void> {
    // Check for conflicts with local changes
    const conflicts = await this.detectConflicts(event);
    
    if (conflicts.length > 0) {
      await this.resolveConflicts(conflicts);
    } else {
      await this.applyRemoteChanges(event);
    }

    this.notifySubscribers();
  }

  // Conflict resolution
  private async detectConflicts(event: SyncEvent): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];
    
    try {
      // Get local profile data
      const localProfile = await ProfileDatabaseService.getProfileData(event.profileId);
      
      if (!localProfile || !event.changes) {
        return conflicts;
      }

      // Check each changed field for conflicts
      for (const [field, remoteValue] of Object.entries(event.changes)) {
        const localValue = (localProfile as any)[field];
        
        // If values differ and local has been modified recently
        if (localValue !== remoteValue && this.hasRecentLocalChanges(event.profileId, field)) {
          conflicts.push({
            id: this.generateConflictId(),
            profileId: event.profileId,
            field,
            localValue,
            remoteValue,
            timestamp: event.timestamp
          });
        }
      }
    } catch (error) {
      console.error('❌ Error detecting conflicts:', error);
    }

    return conflicts;
  }

  private async resolveConflicts(conflicts: SyncConflict[]): Promise<void> {
    try {
      if (this.conflictResolver) {
        // Use custom conflict resolver
        const resolutions = await this.conflictResolver(conflicts);
        await this.applyConflictResolutions(resolutions);
      } else {
        // Default conflict resolution: prefer remote changes
        await this.resolveConflictsWithRemote(conflicts);
      }
    } catch (error) {
      console.error('❌ Error resolving conflicts:', error);
    }
  }

  private async resolveConflictsWithRemote(conflicts: SyncConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      await ProfileDatabaseService.updateProfile(
        conflict.profileId,
        { [conflict.field]: conflict.remoteValue }
      );
    }
  }

  // Offline support
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
  }

  private async handleNetworkChange(isOnline: boolean): Promise<void> {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    
    console.log(`🌐 Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (!wasOnline && isOnline) {
      // Back online - sync pending changes
      await this.syncPendingChanges();
    }

    this.notifySubscribers();
  }

  async queueChange(change: Partial<SyncEvent>): Promise<void> {
    const event: SyncEvent = {
      id: this.generateEventId(),
      type: change.type || 'profile_updated',
      profileId: change.profileId || '',
      userId: change.userId || '',
      timestamp: Date.now(),
      deviceId: this.deviceId,
      ...change
    };

    this.syncQueue.push(event);
    await this.savePendingChanges();

    if (this.isOnline) {
      await this.syncPendingChanges();
    }

    this.notifySubscribers();
  }

  private async syncPendingChanges(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      console.log('🔄 Syncing pending changes:', this.syncQueue.length);
      
      const changes = [...this.syncQueue];
      this.syncQueue = [];

      for (const change of changes) {
        await this.uploadChange(change);
      }

      await this.savePendingChanges();
      console.log('✅ All pending changes synced');
    } catch (error) {
      console.error('❌ Error syncing pending changes:', error);
      // Re-queue failed changes
      this.syncQueue.unshift(...this.syncQueue);
    } finally {
      this.syncInProgress = false;
      this.notifySubscribers();
    }
  }

  private async uploadChange(change: SyncEvent): Promise<void> {
    try {
      switch (change.type) {
        case 'profile_created':
          await this.uploadProfileCreation(change);
          break;
        case 'profile_updated':
          await this.uploadProfileUpdate(change);
          break;
        case 'profile_deleted':
          await this.uploadProfileDeletion(change);
          break;
        case 'data_updated':
          await this.uploadDataUpdate(change);
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to upload change ${change.id}:`, error);
      throw error;
    }
  }

  private async uploadProfileCreation(change: SyncEvent): Promise<void> {
    // Implementation for uploading profile creation
    await ProfileDatabaseService.createProfile(change.data);
  }

  private async uploadProfileUpdate(change: SyncEvent): Promise<void> {
    // Implementation for uploading profile update
    await ProfileDatabaseService.updateProfile(change.profileId, change.data);
  }

  private async uploadProfileDeletion(change: SyncEvent): Promise<void> {
    // Implementation for uploading profile deletion
    await ProfileDatabaseService.deleteProfile(change.profileId);
  }

  private async uploadDataUpdate(change: SyncEvent): Promise<void> {
    // Implementation for uploading data update
    await ProfileDatabaseService.saveProfileData(change.profileId, change.data);
  }

  // Full synchronization
  private async performFullSync(): Promise<void> {
    try {
      console.log('🔄 Performing full sync...');
      
      // Get all remote profiles
      const remoteProfiles = await ProfileDatabaseService.getUserProfiles();
      
      // Compare with local profiles and sync differences
      for (const remoteProfile of remoteProfiles) {
        await this.syncProfileFromRemote(remoteProfile);
      }

      console.log('✅ Full sync completed');
    } catch (error) {
      console.error('❌ Full sync failed:', error);
    }
  }

  private async syncProfileFromRemote(remoteProfile: any): Promise<void> {
    // Implementation for syncing individual profile from remote
    // This would compare timestamps and update local data as needed
  }

  // Utility methods
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('digitalclerk_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('digitalclerk_device_id', deviceId);
    }
    return deviceId;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChanges(oldData: any, newData: any): Record<string, any> {
    const changes: Record<string, any> = {};
    
    if (!oldData) return newData;
    if (!newData) return {};

    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = newData[key];
      }
    }

    return changes;
  }

  private hasRecentLocalChanges(profileId: string, field: string): boolean {
    // Check if this field was modified locally in the last few minutes
    const recentChangeKey = `recent_change_${profileId}_${field}`;
    const lastChange = localStorage.getItem(recentChangeKey);
    
    if (!lastChange) return false;
    
    const changeTime = parseInt(lastChange);
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    return changeTime > fiveMinutesAgo;
  }

  private async loadPendingChanges(): Promise<void> {
    try {
      const stored = localStorage.getItem('digitalclerk_pending_sync');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error loading pending changes:', error);
      this.syncQueue = [];
    }
  }

  private async savePendingChanges(): Promise<void> {
    try {
      localStorage.setItem('digitalclerk_pending_sync', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('❌ Error saving pending changes:', error);
    }
  }

  private async applyRemoteChanges(event: SyncEvent): Promise<void> {
    // Apply remote changes to local storage
    // Implementation depends on specific change type
  }

  private async applyConflictResolutions(resolutions: Record<string, any>): Promise<void> {
    // Apply resolved conflict values
    for (const [field, value] of Object.entries(resolutions)) {
      // Update local data with resolved value
    }
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    setInterval(async () => {
      if (this.isOnline && !this.syncInProgress) {
        await this.syncPendingChanges();
      }
    }, 30000);
  }

  // Public API
  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      lastSync: Date.now(),
      pendingChanges: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      conflicts: [] // Would be populated with current conflicts
    };

    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('❌ Error in sync subscriber:', error);
      }
    });
  }

  setConflictResolver(resolver: (conflicts: SyncConflict[]) => Promise<Record<string, any>>): void {
    this.conflictResolver = resolver;
  }

  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: Date.now(),
      pendingChanges: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      conflicts: []
    };
  }

  async forceFullSync(): Promise<void> {
    await this.performFullSync();
  }
}

export default EnhancedProfileSyncService;