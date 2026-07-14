import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { formatRelativeTime } from '../../lib/utils';
import { Clock, Eye, UserPlus } from 'lucide-react';
import { Complaint } from '../../types';
import { Link } from 'react-router-dom';

export default function AdminComplaints() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminComplaints'],
    queryFn: async () => {
      const res = await api.get('/complaints?limit=200');
      return res.data.data;
    },
  });

  const complaints: Complaint[] = data?.complaints || [];

  const columns: Column<Complaint>[] = [
    {
      header: 'Ticket ID',
      accessorKey: 'ticketNumber',
      cell: (item) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">{item.ticketNumber}</span>
      ),
    },
    {
      header: 'Title & Category',
      accessorKey: 'title',
      cell: (item) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={item.title}>
            {item.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {item.category?.name}
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
      header: 'Created',
      accessorKey: 'createdAt',
      cell: (item) => (
        <span className="text-sm text-slate-500 flex items-center gap-1 whitespace-nowrap">
          <Clock size={14} />
          {formatRelativeTime(item.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          {/* Note: View details could link to a shared complaint details page or open a modal */}
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Eye size={16} />
          </Button>
          <Button variant="outline" size="sm" className="hidden lg:flex" leftIcon={<UserPlus size={14} />}>
            Assign
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">All Complaints</h1>
          <p className="page-subtitle">Manage and assign maintenance issues across all hostels</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <DataTable
              data={complaints}
              columns={columns}
              isLoading={isLoading}
              searchable={true}
              searchKey="ticketNumber"
              searchPlaceholder="Search by Ticket ID..."
              emptyMessage="No complaints found matching your criteria."
              itemsPerPage={10}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
