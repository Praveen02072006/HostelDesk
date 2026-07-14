import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, Users, Clock, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SupervisorDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['supervisorStats'],
    queryFn: async () => {
      // Mocking endpoint for supervisor stats specifically
      // In a real app, this would be a dedicated endpoint or filtered admin stats
      return {
        escalated: 5,
        activeWorkers: 12,
        slaBreaches: 2,
        avgResolution: '4.5 hrs',
        recentEscalations: [
          { id: '1', ticket: 'HD24051201', issue: 'Water pipe burst in B Block', status: 'IN_PROGRESS' },
          { id: '2', ticket: 'HD24051254', issue: 'Main power failure', status: 'ASSIGNED' },
        ]
      };
    },
  });

  const stats = [
    { title: 'Escalated Issues', value: statsData?.escalated || 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-500/20' },
    { title: 'SLA Breaches', value: statsData?.slaBreaches || 0, icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20' },
    { title: 'Active Workers', value: statsData?.activeWorkers || 0, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
    { title: 'Avg Resolution Time', value: statsData?.avgResolution || '0 hrs', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header mb-0">
        <div>
          <h1 className="page-title">Supervisor Dashboard</h1>
          <p className="page-subtitle">Monitor escalations and worker performance</p>
        </div>
        <Link to="/supervisor/escalations">
          <Button variant="danger" leftIcon={<ShieldAlert size={18} />}>View Escalations</Button>
        </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Escalations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {statsData?.recentEscalations?.map((esc: any) => (
                <div key={esc.id} className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">{esc.issue}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{esc.ticket}</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              ))}
              {!statsData?.recentEscalations?.length && (
                <div className="p-8 text-center text-slate-500">No recent escalations</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
