import { useState, useEffect, useCallback } from 'react';
import { ExtensionService } from '@/services/ExtensionService';

interface ExtensionStatus {
  isAvailable: boolean;
  isDetecting: boolean;
  extensionId: string | null;
  lastCheck: number | null;
}

export const useExtension = () => {
  const [status, setStatus] = useState<ExtensionStatus>({
    isAvailable: false,
    isDetecting: false,
    extensionId: null,
    lastCheck: null
  });

  const extensionService = ExtensionService.getInstance();

  // Check extension availability
  const checkExtension = useCallback(async () => {
    setStatus(prev => ({ ...prev, isDetecting: true }));
    
    try {
      const isAvailable = await extensionService.detectExtension();
      setStatus({
        isAvailable,
        isDetecting: false,
        extensionId: extensionService.getExtensionId(),
        lastCheck: Date.now()
      });
    } catch (error) {
      console.error('Failed to check extension:', error);
      setStatus(prev => ({
        ...prev,
        isDetecting: false,
        lastCheck: Date.now()
      }));
    }
  }, [extensionService]);

  // Send document data to extension
  const sendDocumentData = useCallback(async (
    extractedData: Record<string, any>,
    documentText: string,
    documentType: string = 'document'
  ): Promise<boolean> => {
    if (!status.isAvailable) {
      console.warn('Cannot send data: Extension not available');
      return false;
    }

    try {
      const success = await extensionService.sendExtractionResults(
        extractedData,
        documentText,
        documentType
      );
      
      if (success) {
        console.log('Document data sent to extension successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to send document data:', error);
      return false;
    }
  }, [status.isAvailable, extensionService]);

  // Initialize extension detection
  useEffect(() => {
    checkExtension();

    // Listen for extension status changes
    extensionService.onExtensionStatusChange((isAvailable) => {
      setStatus(prev => ({
        ...prev,
        isAvailable,
        extensionId: extensionService.getExtensionId(),
        lastCheck: Date.now()
      }));
    });
  }, [checkExtension, extensionService]);

  // Periodic check for extension availability
  useEffect(() => {
    const interval = setInterval(() => {
      if (!status.isDetecting) {
        checkExtension();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [checkExtension, status.isDetecting]);

  return {
    ...status,
    checkExtension,
    sendDocumentData,
    extensionService
  };
};