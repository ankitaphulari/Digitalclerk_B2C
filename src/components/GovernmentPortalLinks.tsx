import React from 'react';
import { ExternalLink, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPortalsForDocument, type GovernmentPortal } from '@/utils/GovernmentPortals';

interface GovernmentPortalLinksProps {
  documentType: string;
  className?: string;
  onPortalSelect?: (portal: GovernmentPortal) => void;
}

export const GovernmentPortalLinks: React.FC<GovernmentPortalLinksProps> = ({
  documentType,
  className = '',
  onPortalSelect
}) => {
  const portals = getPortalsForDocument(documentType);

  if (portals.length === 0) {
    return null;
  }

  const handlePortalClick = (portal: GovernmentPortal) => {
    // Notify Chrome extension about the selected portal
    if ((window as any).chrome?.runtime?.sendMessage) {
      try {
        (window as any).chrome.runtime.sendMessage(
          'extension-id', // This would be the actual extension ID
          {
            action: 'navigateToPortal',
            portal: portal
          },
          (response: any) => {
            if ((window as any).chrome.runtime.lastError) {
              console.log('Extension not available or not installed');
            }
          }
        );
      } catch (error) {
        console.log('Chrome extension communication failed:', error);
      }
    }
    
    // Open portal in new tab
    window.open(portal.officialUrl, '_blank', 'noopener,noreferrer');
    
    // Callback for parent component
    onPortalSelect?.(portal);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Official Government Portals</h3>
        <Badge variant="secondary" className="ml-auto">
          <Shield className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      </div>

      <div className="grid gap-3">
        {portals.map((portal, index) => (
          <Card key={index} className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium flex items-center space-x-2">
                    <span>{portal.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Official
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {portal.description}
                  </CardDescription>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePortalClick(portal)}
                  className="ml-3 flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  {new URL(portal.officialUrl).hostname}
                </span>
                
                {portal.supportedStates && (
                  <Badge variant="secondary" className="text-xs">
                    {portal.supportedStates.length === 1 && portal.supportedStates[0] === 'All States' 
                      ? 'All States' 
                      : `${portal.supportedStates.length} States`
                    }
                  </Badge>
                )}
              </div>

              {portal.formSelectors && (
                <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                  <div className="flex items-center space-x-1 text-green-600">
                    <Shield className="w-3 h-3" />
                    <span>Chrome Extension Compatible</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Auto-Fill Available
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Our Chrome extension can automatically fill forms on these official websites using your extracted document data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};