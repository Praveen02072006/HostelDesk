import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Star, TrendingUp, CheckCircle2, User } from 'lucide-react';

export default function WorkerAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['supervisorWorkers'],
    queryFn: async () => {
      const res = await api.get('/users/workers');
      return res.data;
    },
  });

  const workers = data || [];

  const columns: Column<any>[] = [
    {
      header: 'Worker',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            {item.firstName?.[0] || 'W'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {item.firstName} {item.lastName}
            </p>
            <p className="text-xs text-slate-500">ID: {item.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isAvailable',
      cell: (item: any) => (
        <Badge 
          className={item.isAvailable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}
        >
          {item.isAvailable ? 'Available' : 'Busy'}
        </Badge>
      ),
    },
    {
      header: 'Specialization',
      cell: (item: any) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {item.specialization?.length > 0 ? (
            item.specialization.map((spec: string, idx: number) => (
              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {spec}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">General</span>
          )}
        </div>
      ),
    },
    {
      header: 'Performance',
      cell: (item: any) => (
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {item._count?.assignments || 0}
            </span>
            <span className="text-xs text-slate-500">Jobs Done</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              {item.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-slate-500">Rating</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (item: any) => (
        <Button variant="ghost" size="sm" leftIcon={<TrendingUp size={16} />}>
          View Stats
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Worker Analytics</h1>
          <p className="page-subtitle">Track performance, availability, and workload of maintenance staff</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <DataTable
              data={workers}
              columns={columns}
              isLoading={isLoading}
              searchable={true}
              searchKey="firstName"
              searchPlaceholder="Search workers by name..."
              emptyMessage="No workers found."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
