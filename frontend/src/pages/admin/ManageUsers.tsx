import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { formatRelativeTime } from '../../lib/utils';
import { Shield, ShieldOff, Edit, UserPlus, Clock } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface ProfileData {
  firstName: string;
  lastName: string;
}

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users?limit=100');
      return res.data.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsConfirmOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Failed to update user status');
    }
  });

  const handleToggleStatus = () => {
    if (selectedUser) {
      toggleStatusMutation.mutate({
        id: selectedUser.id,
        isActive: !selectedUser.isActive,
      });
    }
  };

  const users = data?.users || [];

  const getProfile = (user: any): ProfileData => {
    return user.student || user.worker || user.admin || user.supervisor || user.management || { firstName: 'Unknown', lastName: 'User' };
  };

  const columns: Column<any>[] = [
    {
      header: 'Name',
      cell: (item) => {
        const profile = getProfile(item);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              {profile.firstName?.[0] || item.email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: (item) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {item.role}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (item) => (
        <Badge 
          className={item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}
        >
          {item.isActive ? 'Active' : 'Suspended'}
        </Badge>
      ),
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: (item) => (
        <span className="text-sm text-slate-500 flex items-center gap-1">
          <Clock size={14} />
          {formatRelativeTime(item.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Edit size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`p-2 h-8 w-8 ${item.isActive ? 'text-slate-400 hover:text-rose-600' : 'text-rose-500 hover:text-emerald-600'}`}
            onClick={() => {
              setSelectedUser(item);
              setIsConfirmOpen(true);
            }}
            title={item.isActive ? "Suspend User" : "Activate User"}
          >
            {item.isActive ? <ShieldOff size={16} /> : <Shield size={16} />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">View and manage all students, workers, and staff members</p>
        </div>
        <Button leftIcon={<UserPlus size={18} />}>
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <DataTable
              data={users}
              columns={columns}
              isLoading={isLoading}
              searchable={true}
              searchKey="email"
              searchPlaceholder="Search by email..."
              emptyMessage="No users found."
            />
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleToggleStatus}
          title={selectedUser.isActive ? "Suspend User" : "Activate User"}
          message={`Are you sure you want to ${selectedUser.isActive ? 'suspend' : 'activate'} the account for ${selectedUser.email}?`}
          confirmText={selectedUser.isActive ? "Yes, Suspend" : "Yes, Activate"}
          variant={selectedUser.isActive ? 'danger' : 'success'}
          isLoading={toggleStatusMutation.isPending}
        />
      )}
    </div>
  );
}
