import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
  QrCode, 
  Smartphone, 
  Check, 
  Copy, 
  RefreshCw,
  Wifi,
  WifiOff,
  Timer
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SyncSession {
  id: string;
  token: string;
  user_id: string;
  expires_at: string;
  is_active: boolean;
  device_info?: string;
}

export const QRSync = () => {
  const [syncSession, setSyncSession] = useState<SyncSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [syncCode, setSyncCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (syncSession && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setSyncSession(null);
            setIsConnected(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncSession, timeLeft]);

  const generateSyncSession = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Generate a unique sync token
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      const newSession: SyncSession = {
        id: crypto.randomUUID(),
        token,
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        device_info: navigator.userAgent
      };

      // Store session in localStorage for demo
      localStorage.setItem('qr_sync_session', JSON.stringify(newSession));
      
      setSyncSession(newSession);
      setTimeLeft(10 * 60); // 10 minutes in seconds
      setIsConnected(true);

      toast({
        title: "QR Code Generated",
        description: "Scan with another device to sync your profile data",
      });

    } catch (error) {
      console.error('Error generating sync session:', error);
      toast({
        title: "Sync Error",
        description: "Failed to generate sync session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const connectWithCode = async () => {
    if (!syncCode.trim()) return;

    setIsConnecting(true);
    try {
      // In a real app, this would validate the code with the backend
      const storedSession = localStorage.getItem('qr_sync_session');
      
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session.token === syncCode.trim()) {
          setIsConnected(true);
          setSyncSession(session);
          
          toast({
            title: "Successfully Connected",
            description: "Your device is now synced. Profile data is available.",
          });
        } else {
          throw new Error('Invalid sync code');
        }
      } else {
        throw new Error('No active sync session found');
      }

    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Invalid sync code or session expired.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const copyToken = () => {
    if (syncSession) {
      navigator.clipboard.writeText(syncSession.token);
      toast({
        title: "Token Copied",
        description: "Sync token has been copied to clipboard",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateQRCodeURL = (token: string) => {
    const baseUrl = window.location.origin;
    const syncUrl = `${baseUrl}/sync?token=${token}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(syncUrl)}`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-feature">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Cross-Device Sync
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sync your profile data across devices for seamless form filling
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!syncSession ? (
            // Generate QR Code Section
            <div className="text-center space-y-4">
              <div className="mx-auto w-24 h-24 bg-gradient-button rounded-lg flex items-center justify-center">
                <Smartphone className="w-12 h-12 text-white" />
              </div>
              
              <div>
                <h3 className="font-medium">Generate Sync Code</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a secure connection to access your data on another device
                </p>
              </div>
              
              <Button 
                onClick={generateSyncSession}
                disabled={isGenerating}
                className="gap-2 bg-gradient-button hover:shadow-glow"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                Generate QR Code
              </Button>
            </div>
          ) : (
            // Active Session Section
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {isConnected ? 'Connected' : 'Waiting for connection'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border text-center">
                <img 
                  src={generateQRCodeURL(syncSession.token)}
                  alt="QR Code for device sync"
                  className="mx-auto mb-4"
                />
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sync Token:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                      {syncSession.token}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyToken}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setSyncSession(null)}
                className="w-full"
              >
                End Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect with Code Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Connect with Sync Code</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a sync code from another device to access shared profile data
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter sync code..."
              value={syncCode}
              onChange={(e) => setSyncCode(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={connectWithCode}
              disabled={!syncCode.trim() || isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Connect
            </Button>
          </div>
          
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              <Check className="w-4 h-4" />
              Successfully connected to sync session
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};