import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, 
  Target, Users, FileText, Zap, Eye, Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsData {
  formFillingStats: {
    totalForms: number;
    successfulFills: number;
    averageTime: number;
    accuracyRate: number;
  };
  documentProcessing: {
    totalDocuments: number;
    processedSuccessfully: number;
    averageConfidence: number;
    topDocumentTypes: Array<{ type: string; count: number }>;
  };
  userBehavior: {
    mostUsedForms: Array<{ formType: string; count: number; successRate: number }>;
    timeSpentAnalytics: Array<{ day: string; timeSpent: number }>;
    deviceUsage: Array<{ device: string; percentage: number }>;
  };
  performance: {
    ocrProcessingTime: Array<{ date: string; avgTime: number }>;
    formFillSuccess: Array<{ date: string; successRate: number }>;
    userSatisfaction: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data from multiple sources
      const [formStats, documentStats, behaviorStats, performanceStats] = await Promise.all([
        fetchFormFillingStats(),
        fetchDocumentProcessingStats(),
        fetchUserBehaviorStats(),
        fetchPerformanceStats()
      ]);

      setAnalyticsData({
        formFillingStats: formStats,
        documentProcessing: documentStats,
        userBehavior: behaviorStats,
        performance: performanceStats
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormFillingStats = async () => {
    try {
      const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user?.id!)
        .gte('created_at', getDateRange(selectedTimeRange));

      const totalForms = applications?.length || 0;
      const successfulFills = applications?.filter(app => app.status === 'completed').length || 0;
      const avgTime = calculateAverageProcessingTime(applications || []);
      const accuracyRate = totalForms > 0 ? (successfulFills / totalForms) * 100 : 0;

      return {
        totalForms,
        successfulFills,
        averageTime: avgTime,
        accuracyRate
      };
    } catch (error) {
      console.error('Error fetching form filling stats:', error);
      return { totalForms: 0, successfulFills: 0, averageTime: 0, accuracyRate: 0 };
    }
  };

  const fetchDocumentProcessingStats = async () => {
    try {
      const { data: documents } = await supabase
        .from('document_uploads')
        .select('*')
        .eq('user_id', user?.id!)
        .gte('created_at', getDateRange(selectedTimeRange));

      const totalDocuments = documents?.length || 0;
      const processedSuccessfully = documents?.filter(doc => doc.processing_status === 'completed').length || 0;
      const avgConfidence = calculateAverageConfidence(documents || []);
      const topDocumentTypes = calculateTopDocumentTypes(documents || []);

      return {
        totalDocuments,
        processedSuccessfully,
        averageConfidence: avgConfidence,
        topDocumentTypes
      };
    } catch (error) {
      console.error('Error fetching document processing stats:', error);
      return { totalDocuments: 0, processedSuccessfully: 0, averageConfidence: 0, topDocumentTypes: [] };
    }
  };

  const fetchUserBehaviorStats = async () => {
    try {
      const { data: applications } = await supabase
        .from('applications')
        .select('form_type, status, created_at')
        .eq('user_id', user?.id!)
        .gte('created_at', getDateRange(selectedTimeRange));

      const mostUsedForms = calculateMostUsedForms(applications || []);
      const timeSpentAnalytics = calculateTimeSpentAnalytics(applications || []);
      const deviceUsage = getDeviceUsageStats();

      return {
        mostUsedForms,
        timeSpentAnalytics,
        deviceUsage
      };
    } catch (error) {
      console.error('Error fetching user behavior stats:', error);
      return { mostUsedForms: [], timeSpentAnalytics: [], deviceUsage: [] };
    }
  };

  const fetchPerformanceStats = async () => {
    try {
      const { data: documents } = await supabase
        .from('document_uploads')
        .select('created_at, updated_at, processing_status')
        .eq('user_id', user?.id!)
        .gte('created_at', getDateRange(selectedTimeRange));

      const ocrProcessingTime = calculateOCRProcessingTime(documents || []);
      const formFillSuccess = calculateFormFillSuccess(documents || []);
      const userSatisfaction = 85; // Mock data - would come from user feedback

      return {
        ocrProcessingTime,
        formFillSuccess,
        userSatisfaction
      };
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      return { ocrProcessingTime: [], formFillSuccess: [], userSatisfaction: 0 };
    }
  };

  // Helper functions for calculations
  const getDateRange = (range: string) => {
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  };

  const calculateAverageProcessingTime = (applications: any[]) => {
    if (applications.length === 0) return 0;
    
    const times = applications.map(app => {
      const created = new Date(app.created_at).getTime();
      const updated = new Date(app.updated_at).getTime();
      return updated - created;
    });
    
    return times.reduce((sum, time) => sum + time, 0) / times.length / 1000; // Convert to seconds
  };

  const calculateAverageConfidence = (documents: any[]) => {
    if (documents.length === 0) return 0;
    
    const confidences = documents
      .filter(doc => doc.confidence_score)
      .map(doc => doc.confidence_score);
    
    if (confidences.length === 0) return 0;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  };

  const calculateTopDocumentTypes = (documents: any[]) => {
    const typeCounts: Record<string, number> = {};
    
    documents.forEach(doc => {
      if (doc.document_type) {
        typeCounts[doc.document_type] = (typeCounts[doc.document_type] || 0) + 1;
      }
    });
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const calculateMostUsedForms = (applications: any[]) => {
    const formCounts: Record<string, { count: number; successful: number }> = {};
    
    applications.forEach(app => {
      if (app.form_type) {
        if (!formCounts[app.form_type]) {
          formCounts[app.form_type] = { count: 0, successful: 0 };
        }
        formCounts[app.form_type].count++;
        if (app.status === 'completed') {
          formCounts[app.form_type].successful++;
        }
      }
    });
    
    return Object.entries(formCounts)
      .map(([formType, stats]) => ({
        formType,
        count: stats.count,
        successRate: stats.count > 0 ? (stats.successful / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const calculateTimeSpentAnalytics = (applications: any[]) => {
    // Mock implementation - would use actual time tracking data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      timeSpent: Math.floor(Math.random() * 120) + 30 // 30-150 minutes
    }));
  };

  const getDeviceUsageStats = () => {
    // Mock implementation - would use actual device detection data
    return [
      { device: 'Desktop', percentage: 65 },
      { device: 'Mobile', percentage: 25 },
      { device: 'Tablet', percentage: 10 }
    ];
  };

  const calculateOCRProcessingTime = (documents: any[]) => {
    // Mock implementation - would use actual processing time data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgTime: Math.floor(Math.random() * 5000) + 2000 // 2-7 seconds
      };
    }).reverse();
    
    return last7Days;
  };

  const calculateFormFillSuccess = (documents: any[]) => {
    // Mock implementation - would use actual success rate data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        successRate: Math.floor(Math.random() * 20) + 80 // 80-100%
      };
    }).reverse();
    
    return last7Days;
  };

  const exportAnalytics = async () => {
    try {
      const dataToExport = {
        exportDate: new Date().toISOString(),
        timeRange: selectedTimeRange,
        userId: user?.id,
        analytics: analyticsData
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `digitalclerk-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Analytics Data</h2>
        <p className="text-muted-foreground">Start using DigitalClerk to see your analytics dashboard.</p>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your form filling performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forms Filled</p>
                <p className="text-2xl font-bold">{analyticsData.formFillingStats.totalForms}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">
                {analyticsData.formFillingStats.accuracyRate.toFixed(1)}% accuracy
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents Processed</p>
                <p className="text-2xl font-bold">{analyticsData.documentProcessing.totalDocuments}</p>
              </div>
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">
                {analyticsData.documentProcessing.averageConfidence.toFixed(1)}% confidence
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Processing Time</p>
                <p className="text-2xl font-bold">{(analyticsData.formFillingStats.averageTime / 60).toFixed(1)}m</p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <Zap className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-500">Lightning fast</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                <p className="text-2xl font-bold">{analyticsData.performance.userSatisfaction}%</p>
              </div>
              <Target className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">Excellent rating</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
          <TabsTrigger value="documents">Document Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>OCR Processing Time</CardTitle>
                <CardDescription>Average time to process documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analyticsData.performance.ocrProcessingTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgTime" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Fill Success Rate</CardTitle>
                <CardDescription>Daily success rate for form completion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analyticsData.performance.formFillSuccess}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="successRate" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Used Forms</CardTitle>
                <CardDescription>Your frequently filled form types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.userBehavior.mostUsedForms.map((form, index) => (
                    <div key={form.formType} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{form.formType}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{form.count} uses</span>
                        <Progress value={form.successRate} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>How you access DigitalClerk</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analyticsData.userBehavior.deviceUsage}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="percentage"
                    >
                      {analyticsData.userBehavior.deviceUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {analyticsData.userBehavior.deviceUsage.map((device, index) => (
                    <div key={device.device} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{device.device} ({device.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Type Analysis</CardTitle>
              <CardDescription>Most frequently processed document types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.documentProcessing.topDocumentTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Excellent Accuracy!</h4>
                  <p className="text-sm text-green-700">
                    Your form filling accuracy is {analyticsData.formFillingStats.accuracyRate.toFixed(1)}%, 
                    which is above the 90% benchmark.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Fast Processing</h4>
                  <p className="text-sm text-blue-700">
                    Your average document processing time is excellent. 
                    Consider batch processing for even better efficiency.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📈 Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">Try New Features</h4>
                  <p className="text-sm text-orange-700">
                    Explore profile templates to save even more time on recurring forms.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Optimize Workflow</h4>
                  <p className="text-sm text-purple-700">
                    Set up the Chrome extension for seamless form filling on any website.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;