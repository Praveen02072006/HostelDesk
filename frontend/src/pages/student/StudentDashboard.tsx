import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { formatRelativeTime } from '../../lib/utils';
import { Complaint } from '../../types';

export default function StudentDashboard() {
  const { data: myComplaints, isLoading } = useQuery({
    queryKey: ['studentComplaints'],
    queryFn: async () => {
      const res = await api.get('/complaints/my?limit=5');
      return res.data.data;
    },
  });

  const complaints = myComplaints?.complaints || [];
  
  const stats = [
    { title: 'Total Raised', value: myComplaints?.pagination.total || 0, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
    { title: 'In Progress', value: complaints.filter((c: Complaint) => c.status === 'IN_PROGRESS' || c.status === 'ACCEPTED').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
    { title: 'Resolved', value: complaints.filter((c: Complaint) => c.status === 'COMPLETED' || c.status === 'CLOSED').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { title: 'Action Needed', value: complaints.filter((c: Complaint) => c.status === 'COMPLETED' && !(c as any).feedback).length, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header mb-0">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to your student portal</p>
        </div>
        <Link to="/student/complaints/new">
          <Button leftIcon={<Plus size={18} />}>Raise Complaint</Button>
        </Link>
      </div>

      <div className="grid grid-auto-fill-md gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm dark:bg-slate-800/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isLoading ? '-' : stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Complaints</CardTitle>
          <Link to="/student/complaints" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-16 w-full rounded-xl"></div>
              ))}
            </div>
          ) : complaints.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {complaints.map((complaint: Complaint) => (
                <div key={complaint.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{complaint.ticketNumber}</span>
                      <Badge variant="status" status={complaint.status} />
                    </div>
                    <h4 className="text-base font-medium text-slate-900 dark:text-slate-100 truncate">{complaint.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1"><Clock size={14} /> {formatRelativeTime(complaint.createdAt)}</span>
                      <span>•</span>
                      <span>{complaint.category.name}</span>
                    </p>
                  </div>
                  
                  <div className="w-full sm:w-auto flex flex-shrink-0">
                    <Link to={`/student/complaints/${complaint.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full">View Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText className="empty-state-icon" />
              <h3 className="empty-state-title">No complaints yet</h3>
              <p className="empty-state-desc">You haven't raised any complaints. Everything looks good!</p>
              <Link to="/student/complaints/new" className="mt-4">
                <Button variant="primary" leftIcon={<Plus size={18} />}>Raise Complaint</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
