import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function Analytics() {
  const { data: resolutionData, isLoading: isLoadingRes } = useQuery({
    queryKey: ['managementResolutionTime'],
    queryFn: async () => {
      const res = await api.get('/analytics/resolution-time');
      return res.data;
    },
  });

  const { data: slaData, isLoading: isLoadingSla } = useQuery({
    queryKey: ['managementSla'],
    queryFn: async () => {
      const res = await api.get('/analytics/sla');
      return res.data;
    },
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0">
        <h1 className="page-title">Deep Analytics</h1>
        <p className="page-subtitle">Detailed insights into resolution times and SLA compliance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Average Resolution Time (hrs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {resolutionData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Line type="monotone" dataKey="avgTime" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full skeleton rounded-xl"></div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance (%)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[300px] w-full">
              {slaData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Within SLA', value: slaData.compliantCount || 85, color: '#10b981' },
                        { name: 'Breached SLA', value: slaData.breachedCount || 15, color: '#f43f5e' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[{ color: '#10b981' }, { color: '#f43f5e' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-48 h-48 rounded-full skeleton mx-auto"></div>
              )}
            </div>
            
            {slaData && (
              <div className="flex justify-center gap-6 mt-4 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium">Within SLA ({slaData.compliantCount || 85}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="text-sm font-medium">Breached SLA ({slaData.breachedCount || 15}%)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
