import { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Users, 
  Download,
  Settings,
  LogOut,
  Bell,
  Activity,
  Chrome
} from 'lucide-react';

export default function Dashboard() {
  const [userData] = useState({
    companyName: 'ABC CA Firm',
    email: 'abc@example.com',
    plan: 'Professional',
    documentsUsed: 247,
    documentsLimit: 1000,
    timeSaved: 62,
    lastLogin: '2024-10-25 09:30 AM'
  });

  const recentActivity = [
    { id: 1, form: 'GST Registration Form', time: '2 hours ago', status: 'completed' },
    { id: 2, form: 'PAN Card Application', time: '5 hours ago', status: 'completed' },
    { id: 3, form: 'Income Tax Return', time: '1 day ago', status: 'completed' },
    { id: 4, form: 'TDS Return Form', time: '2 days ago', status: 'completed' }
  ];

  const stats = [
    {
      icon: FileText,
      label: 'Documents Filled',
      value: userData.documentsUsed,
      total: userData.documentsLimit,
      color: 'blue'
    },
    {
      icon: Clock,
      label: 'Hours Saved',
      value: `${userData.timeSaved}h`,
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Efficiency Gain',
      value: '120x',
      color: 'purple'
    },
    {
      icon: Activity,
      label: 'Active Users',
      value: '3/5',
      color: 'orange'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DigitalClerk</h1>
            <p className="text-sm text-gray-600">Welcome back, {userData.companyName}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings className="w-6 h-6" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const colorClass = stat.color === 'blue' ? 'text-blue-500' :
                              stat.color === 'green' ? 'text-green-500' :
                              stat.color === 'purple' ? 'text-purple-500' :
                              'text-orange-500';
            const bgClass = stat.color === 'blue' ? 'bg-blue-500' :
                           stat.color === 'green' ? 'bg-green-500' :
                           stat.color === 'purple' ? 'bg-purple-500' :
                           'bg-orange-500';
            
            return (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-8 h-8 ${colorClass}`} />
                </div>
                <h3 className="text-gray-600 text-sm mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                  {stat.total && <span className="text-lg text-gray-400">/{stat.total}</span>}
                </p>
                {stat.total && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${bgClass} h-2 rounded-full`}
                      style={{ width: `${(stat.value / stat.total) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Plan Details */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Your Plan</h2>
              <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {userData.plan}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="border rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Monthly Limit</p>
                <p className="text-2xl font-bold">{userData.documentsLimit}</p>
                <p className="text-xs text-gray-500">documents</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Used This Month</p>
                <p className="text-2xl font-bold text-blue-600">{userData.documentsUsed}</p>
                <p className="text-xs text-gray-500">documents</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">Remaining</p>
                <p className="text-2xl font-bold text-green-600">{userData.documentsLimit - userData.documentsUsed}</p>
                <p className="text-xs text-gray-500">documents</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                Upgrade Plan
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition">
                View Billing
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Quick Start</h2>
            <div className="space-y-3">
              <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2">
                <Chrome className="w-5 h-5" />
                Download Extension
              </button>
              <button className="w-full bg-white/20 text-white py-3 rounded-lg font-semibold hover:bg-white/30 transition">
                View Tutorial
              </button>
              <button className="w-full bg-white/20 text-white py-3 rounded-lg font-semibold hover:bg-white/30 transition">
                API Documentation
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{activity.form}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow p-6 text-white">
          <h2 className="text-xl font-bold mb-2">💡 Pro Tip</h2>
          <p>Upload documents in bulk to save even more time. Drag and drop multiple files at once in the Chrome extension!</p>
        </div>
      </main>
    </div>
  );
}
