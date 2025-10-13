import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, TrendingUp, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

interface FormHistory {
  id: string;
  formType: string;
  formTitle: string;
  completedAt: string;
  status: 'completed' | 'in_progress' | 'draft';
  data: Record<string, any>;
}

interface DashboardStats {
  totalForms: number;
  completedForms: number;
  drafts: number;
  timeSaved: number; // in minutes
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [formHistory, setFormHistory] = useState<FormHistory[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0,
    completedForms: 0,
    drafts: 0,
    timeSaved: 0
  });

  useEffect(() => {
    if (user) {
      loadUserHistory();
    }
  }, [user]);

  const loadUserHistory = () => {
    const history = JSON.parse(localStorage.getItem('digitalclerk_user_history') || '[]');
    setFormHistory(history);

    // Calculate stats
    const completed = history.filter((h: FormHistory) => h.status === 'completed').length;
    const drafts = history.filter((h: FormHistory) => h.status === 'draft').length;
    const timeSaved = history.length * 25; // Assume 25 minutes saved per form

    setStats({
      totalForms: history.length,
      completedForms: completed,
      drafts,
      timeSaved
    });
  };

  const getFormTypeIcon = (formType: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadFormData = (form: FormHistory) => {
    const dataStr = JSON.stringify(form.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.formTitle}_data.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.user_metadata?.full_name || user.email}!
          </h1>
          <p className="text-muted-foreground">
            Track your form submissions and manage your government applications
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Forms</p>
                  <p className="text-2xl font-bold">{stats.totalForms}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedForms}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.drafts}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Time Saved</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.timeSaved}m</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Form Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
                <p className="text-gray-600 mb-4">Start by filling your first government form</p>
                <Button onClick={() => window.location.href = '/intelligent-automation'}>
                  Fill Your First Form
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formHistory.slice(0, 10).map((form) => (
                  <div key={form.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getFormTypeIcon(form.formType)}
                      </div>
                      <div>
                        <h4 className="font-medium">{form.formTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(form.status || 'completed')}>
                            {form.status || 'completed'}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(form.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFormData(form)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to form with pre-filled data
                          localStorage.setItem('digitalclerk_prefill_data', JSON.stringify(form.data));
                          window.location.href = `/intelligent-automation?form=${form.formType}`;
                        }}
                      >
                        Edit/Reuse
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Fill New Form</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start a new government form application
              </p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/intelligent-automation'}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Track Applications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor your submitted applications
              </p>
              <Button variant="outline" className="w-full">
                View Status
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View your form filling statistics
              </p>
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}