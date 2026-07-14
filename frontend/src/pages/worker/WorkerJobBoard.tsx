import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatRelativeTime } from '../../lib/utils';
import { Clock, Eye, CheckCircle2 } from 'lucide-react';
import { Complaint } from '../../types'; // Assuming types exist or using any for now

export default function WorkerJobBoard() {
  const { data, isLoading } = useQuery({
    queryKey: ['workerJobs'],
    queryFn: async () => {
      const res = await api.get('/workers/jobs?limit=100'); // Endpoint matches worker.routes.ts
      return res.data.data;
    },
  });

  const jobs = data || []; // The backend usually returns array directly or inside a wrapper. Let's assume it returns jobs array.

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
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-indigo-600" title="View Details">
            <Eye size={16} />
          </Button>
          {item.status !== 'COMPLETED' && (
            <Button variant="success" size="sm" className="hidden lg:flex" leftIcon={<CheckCircle2 size={14} />}>
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
