import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { formatRelativeTime } from '../../lib/utils';
import { Clock, AlertTriangle, Eye, ArrowUpRight } from 'lucide-react';
import { Complaint } from '../../types';

export default function Escalations() {
  const { data, isLoading } = useQuery({
    queryKey: ['supervisorEscalations'],
    queryFn: async () => {
      const res = await api.get('/complaints?slaBreached=true&limit=100');
      return res.data.data;
    },
  });

  const escalations: Complaint[] = data?.complaints || [];

  const columns: Column<Complaint>[] = [
    {
      header: 'Ticket ID',
      accessorKey: 'ticketNumber',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-500" />
          <span className="font-medium text-slate-900 dark:text-slate-100">{item.ticketNumber}</span>
        </div>
      ),
    },
    {
      header: 'Issue',
      cell: (item) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={item.title}>
            {item.title}
          </p>
          <p className="text-xs text-rose-500 mt-0.5 font-medium">
            SLA Breached
          </p>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (item) => <Badge variant="priority" priority={item.priority} />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item) => <Badge variant="status" status={item.status} />,
    },
    {
      header: 'Overdue By',
      cell: (item) => (
        <span className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <Clock size={14} />
          {item.slaDeadline ? formatRelativeTime(item.slaDeadline) : 'Unknown'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Eye size={16} />
          </Button>
          <Button variant="danger" size="sm" className="hidden lg:flex" leftIcon={<ArrowUpRight size={14} />}>
            Intervene
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-rose-600 dark:text-rose-500 flex items-center gap-2">
            <AlertTriangle size={24} />
            Escalations
          </h1>
          <p className="page-subtitle">Immediate attention required for SLA breached complaints</p>
        </div>
      </div>

      <Card className="border-rose-100 dark:border-rose-900/50 shadow-sm">
        <CardContent className="p-0">
          <div className="p-6">
            <DataTable
              data={escalations}
              columns={columns}
              isLoading={isLoading}
              searchable={true}
              searchKey="ticketNumber"
              searchPlaceholder="Search escalations..."
              emptyMessage="No escalations at the moment. Great job!"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
