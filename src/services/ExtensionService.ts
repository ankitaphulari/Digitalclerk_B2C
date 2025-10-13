// Extension Service for communicating with Chrome Extension

// Type definitions for Chrome extension API
export type ExtensionMessage = Record<string, unknown>;
export type ExtensionResponse = { success?: boolean; [key: string]: unknown };

// Types for extracted data fields
export type ExtractedField =
  | string
  | number
  | boolean
  | null
  | undefined
  | { value?: string; confidence?: number; source?: string };

export type ExtractedData = Record<string, ExtractedField>;

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (extensionId: string, message: ExtensionMessage, callback: (response?: ExtensionResponse) => void) => void;
        lastError?: { message: string };
      };
    };
  }
}

export class ExtensionService {
  private static instance: ExtensionService;
  private extensionId: string | null = null;
  private isExtensionAvailable = false;

  private constructor() {
    // Kick off detection but do not block construction
    void this.detectExtension();
  }

  static getInstance(): ExtensionService {
    if (!ExtensionService.instance) {
      ExtensionService.instance = new ExtensionService();
    }
    return ExtensionService.instance;
  }

  // Detect if extension is installed
  async detectExtension(): Promise<boolean> {
    const possibleIds = [
      'digitalclerk-extension', // Production extension ID
      'development-extension-id', // Development extension ID
      // Add actual extension IDs when published
    ];

    for (const id of possibleIds) {
      try {
        const response = await this.sendMessageToExtension(id, { action: 'checkExtension' });
        if (response && response.success) {
          this.extensionId = id;
          this.isExtensionAvailable = true;
          console.log('Chrome extension detected:', id);
          return true;
        }
      } catch {
        // Try next id
      }
    }

    this.isExtensionAvailable = false;
    this.extensionId = null;
    console.log('Chrome extension not detected');
    return false;
  }

  getExtensionId(): string | null {
    return this.extensionId;
  }

  // Send document data to extension
  async sendDocumentData(data: {
    extractedData: ExtractedData;
    documentText: string;
    documentType: string;
    sessionId: string;
  }): Promise<boolean> {
    if (!this.isExtensionAvailable || !this.extensionId) {
      console.warn('Extension not available for sending document data');
      return false;
    }

    try {
      const response = await this.sendMessageToExtension(this.extensionId, {
        action: 'receiveDocument',
        data: {
          ...data,
          timestamp: Date.now()
        }
      });

      if (response && response.success) {
        console.log('Document data sent to extension successfully');
        return true;
      } else {
        console.error('Extension failed to receive document data:', response);
        return false;
      }
    } catch (error) {
      console.error('Failed to send document data to extension:', error);
      return false;
    }
  }

  // Private helper to send a message to a given extension ID via chrome.runtime.sendMessage
  private async sendMessageToExtension(extensionId: string, message: ExtensionMessage): Promise<ExtensionResponse> {
    return new Promise((resolve, reject) => {
      const chrome = (window as Window).chrome;
      if (!chrome?.runtime?.sendMessage) {
        reject(new Error('Chrome runtime not available'));
        return;
      }

      try {
        chrome.runtime!.sendMessage(extensionId, message, (response?: ExtensionResponse) => {
          const lastError = chrome.runtime?.lastError;
          if (lastError) {
            reject(new Error(lastError.message || 'Unknown chrome.runtime.lastError'));
          } else {
            resolve(response || {});
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Format extracted data for extension
  formatDataForExtension(extractedData: ExtractedData): Record<string, ExtractedField> {
    const formatted: Record<string, ExtractedField> = {};

    const getValue = (v: unknown): ExtractedField => {
      if (v === null || v === undefined) return v as ExtractedField;

      // Handle object shapes that include a 'value' field (e.g., { value?: string; confidence?: number; source?: string })
      if (typeof v === 'object') {
        const obj = v as { value?: string; confidence?: number; source?: string };
        if ('value' in obj) {
          return obj as ExtractedField;
        }
        // If it's an object without a 'value' field, treat as undefined (skip)
        return undefined;
      }

      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (!trimmed) return undefined;
        return { value: trimmed, confidence: 0.8, source: 'extraction' };
      }

      if (typeof v === 'number' || typeof v === 'boolean') {
        return v as ExtractedField;
      }

      return undefined;
    };

    // Standard field mappings
    const ed = extractedData as Record<string, ExtractedField | undefined>;
    const fieldMappings: Record<string, ExtractedField | undefined> = {
      fullName: extractedData.fullName || ed.name,
      firstName: extractedData.firstName,
      lastName: extractedData.lastName,
      email: extractedData.email || ed.emailAddress,
      phone: extractedData.phone || ed.phoneNumber || ed.mobile,
      address: extractedData.address || ed.fullAddress,
      dateOfBirth: extractedData.dateOfBirth || ed.dob,
      gender: extractedData.gender || ed.sex,
      experience: extractedData.experience || ed.workExperience,
      education: extractedData.education || ed.qualification,
      skills: extractedData.skills || ed.technologies,
      documentNumber: extractedData.documentNumber || ed.idNumber,
      fatherName: extractedData.fatherName || ed.fathersName
    };

    Object.entries(fieldMappings).forEach(([key, value]) => {
      const v = getValue(value);
      if (v !== undefined) {
        formatted[key] = v;
      }
    });

    // Include any other fields passed in extractedData that are not part of mapping
    Object.entries(extractedData).forEach(([key, value]) => {
      if (!(key in formatted)) {
        const v = getValue(value);
        if (v !== undefined) {
          formatted[key] = v;
        }
      }
    });

    return formatted;
  }

  // Create session ID for tracking
  createSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // Send extraction results to extension
  async sendExtractionResults(
    extractedData: ExtractedData,
    documentText: string,
    documentType: string = 'document'
  ): Promise<boolean> {
    const formattedData = this.formatDataForExtension(extractedData);
    const sessionId = this.createSessionId();

    return await this.sendDocumentData({
      extractedData: formattedData,
      documentText,
      documentType,
      sessionId
    });
  }

  // Listen for extension status changes
  onExtensionStatusChange(callback: (isAvailable: boolean) => void): void {
    // Periodically check extension status
    setInterval(async () => {
      const wasAvailable = this.isExtensionAvailable;
      await this.detectExtension();

      if (wasAvailable !== this.isExtensionAvailable) {
        callback(this.isExtensionAvailable);
      }
    }, 5000); // Check every 5 seconds
  }
}