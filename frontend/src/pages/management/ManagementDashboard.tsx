import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { TrendingUp, Building2, Wallet, Activity } from 'lucide-react';
import { DashboardStats } from '../../types';

export default function ManagementDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['managementStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data as DashboardStats;
    },
  });

  const stats = [
    { title: 'Total Hostels', value: '3', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
    { title: 'Overall Satisfaction', value: '4.2/5', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { title: 'Active Issues', value: statsData?.openComplaints || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
    { title: 'Maintenance Cost', value: '₹45,200', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0">
        <h1 className="page-title">Global Management Dashboard</h1>
        <p className="page-subtitle">Executive overview of all hostel operations</p>
      </div>

      <div className="grid grid-auto-fill-md gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-slate-800/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{isLoading ? '-' : stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mocked advanced reporting view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Hostel Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hostel Name</th>
                    <th>Total Issues</th>
                    <th>Resolution Rate</th>
                    <th>Avg Time</th>
                    <th>Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Ganga Hostel (GH)</td>
                    <td>145</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[92%]"></div>
                        </div>
                        <span className="text-xs">92%</span>
                      </div>
                    </td>
                    <td>4.2 hrs</td>
                    <td>4.5/5</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Kaveri Hostel (KH)</td>
                    <td>89</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[88%]"></div>
                        </div>
                        <span className="text-xs">88%</span>
                      </div>
                    </td>
                    <td>5.1 hrs</td>
                    <td>4.1/5</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Yamuna Hostel (YH)</td>
                    <td>112</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-[76%]"></div>
                        </div>
                        <span className="text-xs">76%</span>
                      </div>
                    </td>
                    <td>8.4 hrs</td>
                    <td>3.8/5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
