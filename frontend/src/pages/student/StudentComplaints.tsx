import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { formatRelativeTime } from '../../lib/utils';
import { Complaint } from '../../types';

export default function StudentComplaints() {
  const { data, isLoading } = useQuery({
    queryKey: ['studentComplaintsFull'],
    queryFn: async () => {
      const res = await api.get('/complaints/my?limit=100');
      return res.data.data;
    },
  });

  const complaints = data?.complaints || [];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Complaints</CardTitle>
          <Link to="/student/complaints/new" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Raise New
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-16 w-full rounded-xl" />
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
            <div className="p-8 text-center text-slate-500">
              <FileText className="mx-auto mb-4" size={48} />
              <h3 className="text-xl font-medium">No complaints yet</h3>
              <p className="mt-2">You haven't raised any complaints. Everything looks good!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
