import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, FileText, BadgeCheck, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { formatRelativeTime } from '../../lib/utils';
import { Complaint } from '../../types';

export default function StudentComplaintDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const res = await api.get(`/complaints/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const complaint: Complaint | undefined = data?.complaint;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle>{complaint?.title || 'Complaint Detail'}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{complaint?.ticketNumber}</p>
          </div>
          <Link to="/student/complaints" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to List
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : complaint ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="status" status={complaint.status} />
                <span className="text-sm text-slate-600 dark:text-slate-300">{complaint.status}</span>
              </div>
              <p className="text-base">{complaint.description}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Clock size={14} /> {formatRelativeTime(complaint.createdAt)}</span>
                <span>•</span>
                <span>{complaint.category.name}</span>
                <span>•</span>
                <span>{complaint.room?.roomNumber ?? 'Room N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <FileText className="mx-auto mb-4" size={48} />
              <h3 className="text-xl font-medium">Complaint not found</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
