import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Upload, 
  Download, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  UserPlus,
  Settings,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';

interface BatchProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  formsFilled: number;
  totalForms: number;
}

interface BatchSession {
  id: string;
  name: string;
  profiles: BatchProfile[];
  status: 'ready' | 'running' | 'paused' | 'completed';
  createdAt: string;
  completedAt?: string;
  totalProgress: number;
}

export const BatchProcessing = () => {
  const [sessions, setSessions] = useState<BatchSession[]>([]);
  const [activeSession, setActiveSession] = useState<BatchSession | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const createNewSession = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session Name Required",
        description: "Please provide a name for the batch session",
        variant: "destructive",
      });
      return;
    }

    const newSession: BatchSession = {
      id: crypto.randomUUID(),
      name: sessionName.trim(),
      profiles: [],
      status: 'ready',
      createdAt: new Date().toISOString(),
      totalProgress: 0
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSession(newSession);
    setSessionName('');

    toast({
      title: "Batch Session Created",
      description: `"${newSession.name}" is ready for profile uploads`,
    });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const profiles: BatchProfile[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= headers.length && values[0]) {
            profiles.push({
              id: crypto.randomUUID(),
              name: values[0] || `Profile ${i}`,
              email: values[1] || undefined,
              phone: values[2] || undefined,
              status: 'pending',
              progress: 0,
              formsFilled: 0,
              totalForms: 5 // Default forms per profile
            });
          }
        }

        if (profiles.length === 0) {
          throw new Error('No valid profiles found in CSV');
        }

        const updatedSession = {
          ...activeSession,
          profiles: [...activeSession.profiles, ...profiles]
        };

        setSessions(prev => prev.map(s => 
          s.id === activeSession.id ? updatedSession : s
        ));
        setActiveSession(updatedSession);

        toast({
          title: "Profiles Imported",
          description: `Successfully imported ${profiles.length} profiles from CSV`,
        });

      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  const addManualProfile = () => {
    if (!activeSession) return;

    const newProfile: BatchProfile = {
      id: crypto.randomUUID(),
      name: `Profile ${activeSession.profiles.length + 1}`,
      status: 'pending',
      progress: 0,
      formsFilled: 0,
      totalForms: 5
    };

    const updatedSession = {
      ...activeSession,
      profiles: [...activeSession.profiles, newProfile]
    };

    setSessions(prev => prev.map(s => 
      s.id === activeSession.id ? updatedSession : s
    ));
    setActiveSession(updatedSession);
  };

  const startBatchProcessing = async () => {
    if (!activeSession || activeSession.profiles.length === 0) return;

    setIsProcessing(true);
    
    const updatedSession = {
      ...activeSession,
      status: 'running' as const
    };
    
    setSessions(prev => prev.map(s => 
      s.id === activeSession.id ? updatedSession : s
    ));
    setActiveSession(updatedSession);

    // Simulate batch processing
    for (let i = 0; i < activeSession.profiles.length; i++) {
      const profile = activeSession.profiles[i];
      
      // Update profile status to processing
      const processingUpdate = {
        ...updatedSession,
        profiles: updatedSession.profiles.map(p => 
          p.id === profile.id ? { ...p, status: 'processing' as const } : p
        )
      };
      
      setSessions(prev => prev.map(s => 
        s.id === activeSession.id ? processingUpdate : s
      ));
      setActiveSession(processingUpdate);

      // Simulate form filling progress
      for (let form = 0; form < profile.totalForms; form++) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        
        const progressUpdate = {
          ...processingUpdate,
          profiles: processingUpdate.profiles.map(p => 
            p.id === profile.id ? {
              ...p,
              formsFilled: form + 1,
              progress: ((form + 1) / profile.totalForms) * 100
            } : p
          )
        };
        
        setSessions(prev => prev.map(s => 
          s.id === activeSession.id ? progressUpdate : s
        ));
        setActiveSession(progressUpdate);
      }

      // Mark profile as completed
      const completedUpdate = {
        ...processingUpdate,
        profiles: processingUpdate.profiles.map(p => 
          p.id === profile.id ? { ...p, status: 'completed' as const } : p
        )
      };
      
      setSessions(prev => prev.map(s => 
        s.id === activeSession.id ? completedUpdate : s
      ));
      setActiveSession(completedUpdate);
    }

    // Mark session as completed
    const finalUpdate = {
      ...updatedSession,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      totalProgress: 100
    };
    
    setSessions(prev => prev.map(s => 
      s.id === activeSession.id ? finalUpdate : s
    ));
    setActiveSession(finalUpdate);
    setIsProcessing(false);

    toast({
      title: "Batch Processing Complete",
      description: `Successfully processed ${activeSession.profiles.length} profiles`,
    });
  };

  const getStatusIcon = (status: BatchProfile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: BatchProfile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-feature">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Batch Processing Console
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Process multiple profiles and forms simultaneously for cybercafés and consultants
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!activeSession ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-name">Batch Session Name</Label>
                <Input
                  id="session-name"
                  placeholder="e.g., Morning Batch - Scholarship Forms"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Button onClick={createNewSession} className="gap-2 w-full">
                <Plus className="w-4 h-4" />
                Create New Batch Session
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{activeSession.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeSession.profiles.length} profiles loaded
                  </p>
                </div>
                <Badge className={getStatusColor(activeSession.status as any)}>
                  {activeSession.status.toUpperCase()}
                </Badge>
              </div>

              {activeSession.status === 'ready' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-dashed border-2">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="mx-auto w-12 h-12 bg-gradient-button rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import from CSV</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload a CSV file with profile data
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Choose CSV File
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-2">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="mx-auto w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">Add Manually</h4>
                        <p className="text-sm text-muted-foreground">
                          Create profiles one by one
                        </p>
                      </div>
                      <Button variant="outline" onClick={addManualProfile} className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Add Profile
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSession.profiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Profiles ({activeSession.profiles.length})</h4>
                    {activeSession.status === 'ready' && (
                      <Button 
                        onClick={startBatchProcessing}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Processing
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activeSession.profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(profile.status)}
                          <div>
                            <p className="font-medium">{profile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {profile.email || profile.phone || 'No contact info'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right text-sm">
                            <p>{profile.formsFilled}/{profile.totalForms} forms</p>
                            <Progress value={profile.progress} className="w-20 h-2" />
                          </div>
                          <Badge className={getStatusColor(profile.status)}>
                            {profile.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeSession.status !== 'ready' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{Math.round(activeSession.totalProgress)}%</span>
                      </div>
                      <Progress value={activeSession.totalProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSession(null)}
                  className="flex-1"
                >
                  Close Session
                </Button>
                {activeSession.status === 'completed' && (
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Results
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Sessions */}
      {sessions.length > 0 && !activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Sessions</CardTitle>
            <p className="text-sm text-muted-foreground">
              View and manage your batch processing history
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 cursor-pointer"
                  onClick={() => setActiveSession(session)}
                >
                  <div>
                    <p className="font-medium">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.profiles.length} profiles • {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(session.status as any)}>
                      {session.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};