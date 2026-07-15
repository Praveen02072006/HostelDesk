import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../../types';

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminCategoryStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminTrendsStats'] });
    };
    
    window.addEventListener('new_notification', handleNotification);
    return () => {
      window.removeEventListener('new_notification', handleNotification);
    };
  }, [queryClient]);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data as DashboardStats;
    },
  });

  const { data: categoryData } = useQuery({
    queryKey: ['adminCategoryStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/categories');
      return res.data;
    },
  });

  const { data: trendsData } = useQuery({
    queryKey: ['adminTrendsStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/trends?months=6');
      return res.data;
    },
  });

  const stats = [
    { title: 'Total Complaints', value: statsData?.totalComplaints || 0, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
    { title: 'Open Issues', value: statsData?.openComplaints || 0, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
    { title: 'Resolved', value: statsData?.resolvedComplaints || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { title: 'Available Workers', value: statsData?.availableWorkers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Overview of hostel maintenance and operations</p>
      </div>

      <div className="grid grid-auto-fill-md gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-slate-800/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{isLoading ? '-' : stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Complaint Trends (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {trendsData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="open" name="Open" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full skeleton rounded-xl"></div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              {categoryData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.category?.color || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-48 h-48 rounded-full skeleton mx-auto"></div>
              )}
            </div>
            
            <div className="w-full mt-4 space-y-2">
              {categoryData?.slice(0, 5).map((item: any) => (
                <div key={item.category.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.category.color }}></span>
                    <span className="text-slate-700 dark:text-slate-300">{item.category.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
