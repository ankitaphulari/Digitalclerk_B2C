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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data
      setAnalyticsData(generateMockAnalyticsData());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = (): AnalyticsData => {
    const multiplier = selectedTimeRange === '7d' ? 1 : selectedTimeRange === '30d' ? 4 : 12;
    
    return {
      formFillingStats: {
        totalForms: 45 * multiplier,
        successfulFills: 42 * multiplier,
        averageTime: 180, // 3 minutes
        accuracyRate: 93.3
      },
      documentProcessing: {
        totalDocuments: 38 * multiplier,
        processedSuccessfully: 36 * multiplier,
        averageConfidence: 94.2,
        topDocumentTypes: [
          { type: 'Passport', count: 12 * multiplier },
          { type: 'Aadhar Card', count: 10 * multiplier },
          { type: 'PAN Card', count: 8 * multiplier },
          { type: 'Driving License', count: 5 * multiplier },
          { type: 'Bank Statement', count: 3 * multiplier }
        ]
      },
      userBehavior: {
        mostUsedForms: [
          { formType: 'Visa Application', count: 15 * multiplier, successRate: 95 },
          { formType: 'Job Application', count: 12 * multiplier, successRate: 92 },
          { formType: 'Insurance Form', count: 8 * multiplier, successRate: 88 },
          { formType: 'Bank Account', count: 6 * multiplier, successRate: 97 },
          { formType: 'Tax Filing', count: 4 * multiplier, successRate: 90 }
        ],
        timeSpentAnalytics: [
          { day: 'Mon', timeSpent: 85 },
          { day: 'Tue', timeSpent: 120 },
          { day: 'Wed', timeSpent: 95 },
          { day: 'Thu', timeSpent: 145 },
          { day: 'Fri', timeSpent: 110 },
          { day: 'Sat', timeSpent: 60 },
          { day: 'Sun', timeSpent: 45 }
        ],
        deviceUsage: [
          { device: 'Desktop', percentage: 65 },
          { device: 'Mobile', percentage: 25 },
          { device: 'Tablet', percentage: 10 }
        ]
      },
      performance: {
        ocrProcessingTime: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            avgTime: Math.floor(Math.random() * 2000) + 2500
          };
        }),
        formFillSuccess: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            successRate: Math.floor(Math.random() * 10) + 88
          };
        }),
        userSatisfaction: 92
      }
    };
  };

  const exportAnalytics = async () => {
    try {
      const dataToExport = {
        exportDate: new Date().toISOString(),
        timeRange: selectedTimeRange,
        analytics: analyticsData,
        note: 'This is sample data for MVP demonstration'
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
