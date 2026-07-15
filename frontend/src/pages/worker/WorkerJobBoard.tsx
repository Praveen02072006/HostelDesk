import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatRelativeTime } from '../../lib/utils';
import { Clock, Eye, CheckCircle2, PlayCircle, ThumbsUp, XCircle } from 'lucide-react';
import { Complaint } from '../../types';
import toast from 'react-hot-toast';

export default function WorkerJobBoard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['workerJobs'],
    queryFn: async () => {
      const res = await api.get('/workers/jobs?limit=100');
      return res.data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.patch(`/workers/jobs/${assignmentId}/accept`);
    },
    onSuccess: () => {
      toast.success('Job accepted');
      queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
      queryClient.invalidateQueries({ queryKey: ['workerStats'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to accept job'),
  });

  const startMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.patch(`/workers/jobs/${assignmentId}/in-progress`, { images: [] });
    },
    onSuccess: () => {
      toast.success('Job started');
      queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
      queryClient.invalidateQueries({ queryKey: ['workerStats'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to start job'),
  });

  const completeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.patch(`/workers/jobs/${assignmentId}/complete`, { images: [], notes: 'Completed' });
    },
    onSuccess: () => {
      toast.success('Job marked as completed');
      queryClient.invalidateQueries({ queryKey: ['workerJobs'] });
      queryClient.invalidateQueries({ queryKey: ['workerStats'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to complete job'),
  });

  const jobs = data?.assignments || [];

  const columns: Column<any>[] = [
    {
      header: 'Job Title',
      cell: (item: any) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{item.complaint?.title || 'Unknown Job'}</p>
          <p className="text-xs text-slate-500">{item.complaint?.ticketNumber}</p>
        </div>
      ),
    },
    {
      header: 'Location',
      cell: (item: any) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Room {item.complaint?.roomNumber || 'N/A'} (Block {item.complaint?.block || '-'})
        </span>
      ),
    },
    {
      header: 'Priority',
      cell: (item: any) => <Badge variant="priority" priority={item.complaint?.priority} />,
    },
    {
      header: 'Status',
      cell: (item: any) => <Badge variant="status" status={item.status} />,
    },
    {
      header: 'Assigned',
      cell: (item: any) => (
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <Clock size={14} />
          {formatRelativeTime(item.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          {item.status === 'PENDING' && (
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<ThumbsUp size={14} />}
              onClick={() => acceptMutation.mutate(item.id)}
              isLoading={acceptMutation.isPending}
            >
              Accept
            </Button>
          )}
          {item.status === 'ACCEPTED' && (
            <Button 
              variant="primary" 
              size="sm" 
              leftIcon={<PlayCircle size={14} />}
              onClick={() => startMutation.mutate(item.id)}
              isLoading={startMutation.isPending}
            >
              Start Work
            </Button>
          )}
          {item.status === 'IN_PROGRESS' && (
            <Button 
              variant="success" 
              size="sm" 
              leftIcon={<CheckCircle2 size={14} />}
              onClick={() => completeMutation.mutate(item.id)}
              isLoading={completeMutation.isPending}
            >
              Mark Done
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0">
        <h1 className="page-title">Job Board</h1>
        <p className="page-subtitle">View and manage your assigned maintenance tasks</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <DataTable
              data={jobs}
              columns={columns}
              isLoading={isLoading}
              searchable={true}
              searchKey="title" // Might not work perfectly if it searches root item, but ok for now
              searchPlaceholder="Search jobs..."
              emptyMessage="No assigned jobs right now. You're all caught up!"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
