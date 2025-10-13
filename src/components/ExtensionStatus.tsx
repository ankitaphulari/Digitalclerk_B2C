import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExtension } from '@/hooks/useExtension';

interface ExtensionStatusProps {
  onDataSent?: () => void;
}

export const ExtensionStatus: React.FC<ExtensionStatusProps> = ({ onDataSent }) => {
  const { isAvailable, isDetecting, extensionId, lastCheck, checkExtension } = useExtension();

  const getStatusIcon = () => {
    if (isDetecting) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return isAvailable ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <AlertCircle className="h-4 w-4 text-warning" />
    );
  };

  const getStatusText = () => {
    if (isDetecting) return 'Detecting extension...';
    return isAvailable ? 'Extension connected' : 'Extension not found';
  };

  const getStatusBadge = () => {
    if (isDetecting) {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    return isAvailable ? (
      <Badge variant="default" className="bg-success">Connected</Badge>
    ) : (
      <Badge variant="outline" className="border-warning text-warning">Not Found</Badge>
    );
  };

  const formatLastCheck = () => {
    if (!lastCheck) return 'Never';
    const now = Date.now();
    const diff = now - lastCheck;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {getStatusIcon()}
            Chrome Extension
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {getStatusText()}
        </div>
        
        {extensionId && (
          <div className="text-xs text-muted-foreground">
            ID: {extensionId.substring(0, 8)}...
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Last check: {formatLastCheck()}
        </div>

        {isAvailable && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-success text-sm font-medium mb-1">
              <CheckCircle className="h-4 w-4" />
              Ready to Fill Forms
            </div>
            <div className="text-xs text-muted-foreground">
              Upload and process documents to automatically fill forms across the web.
            </div>
          </div>
        )}

        {!isAvailable && !isDetecting && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-warning text-sm font-medium mb-2">
              <AlertCircle className="h-4 w-4" />
              Extension Required
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              Install the Chrome extension to automatically fill forms on any website.
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('/chrome-extension.zip', '_blank')}
                className="flex items-center gap-1 text-xs"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://docs.formfiller.com/extension', '_blank')}
                className="flex items-center gap-1 text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                Guide
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={checkExtension}
          disabled={isDetecting}
          className="w-full text-xs"
        >
          {isDetecting ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Again'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};