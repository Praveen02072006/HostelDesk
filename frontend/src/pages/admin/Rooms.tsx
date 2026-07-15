import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Users, DoorOpen } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export default function Rooms() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminRooms'],
    queryFn: async () => {
      const res = await api.get('/rooms?limit=500');
      return res.data;
    },
  });

  const rooms = data || [];

  const columns: Column<any>[] = [
    {
      header: 'Room',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <DoorOpen size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{item.roomNumber}</p>
            <p className="text-xs text-slate-500">{item.hostel?.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      cell: (item) => (
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">Block {item.block}</p>
          <p className="text-xs text-slate-500">Floor {item.floor}</p>
        </div>
      ),
    },
    {
      header: 'Occupancy',
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <Users size={16} />
          <span>{item.students?.length || 0} / {item.capacity}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (item) => (
        <Badge 
          className={item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}
        >
          {item.isActive ? 'Active' : 'Maintenance'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-subtitle">Manage hostel rooms and locations</p>
        </div>
        <Button leftIcon={<Plus size={18} />}>
          Add Room
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <DataTable
              data={rooms}
              columns={columns}
              isLoading={isLoading}
              searchable={true}
              searchKey="roomNumber"
              searchPlaceholder="Search by room number..."
              emptyMessage="No rooms found."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
