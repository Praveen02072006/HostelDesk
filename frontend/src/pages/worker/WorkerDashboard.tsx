import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, CheckCircle2, AlertTriangle, Briefcase, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WorkerDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['workerStats'],
    queryFn: async () => {
      const res = await api.get('/workers/stats');
      return res.data.data;
    },
  });

  const stats = [
    { title: 'Today\'s Jobs', value: statsData?.todayJobs || 0, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
    { title: 'Pending', value: statsData?.pending || 0, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
    { title: 'In Progress', value: statsData?.inProgress || 0, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
    { title: 'Average Rating', value: `${statsData?.averageRating || 0}/5`, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header mb-0">
        <div>
          <h1 className="page-title">Worker Dashboard</h1>
          <p className="page-subtitle">Track and manage your maintenance jobs</p>
        </div>
        <Link to="/worker/jobs">
          <Button variant="primary">View Job Board</Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-8 border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center relative overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all duration-1000 ease-out" 
                style={{ height: `${statsData?.completionRate || 0}%` }}
              ></div>
              <span className="relative z-10 font-bold text-xl text-slate-900 dark:text-white mix-blend-difference">
                {Math.round(statsData?.completionRate || 0)}%
              </span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Great Job!</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                You have completed {statsData?.completed || 0} jobs successfully. Keep up the good work and maintain your high completion rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
