import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { formatRelativeTime } from '../../lib/utils';
import { Clock, Eye, UserPlus, FileText, CheckCircle2, Wrench, Ban, User, AlertCircle, Calendar } from 'lucide-react';
import { Complaint, WorkerProfile } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
  MEDIUM: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  LOW: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
};

export default function AdminComplaints() {
  const queryClient = useQueryClient();
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [assignComplaintId, setAssignComplaintId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  
  const [statusComplaintId, setStatusComplaintId] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Real-time updates
  useEffect(() => {
    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['adminComplaints'] });
    };
    
    window.addEventListener('new_notification', handleNotification);
    return () => {
      window.removeEventListener('new_notification', handleNotification);
    };
  }, [queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminComplaints'],
    queryFn: async () => {
      const res = await api.get('/complaints?limit=200');
      return res.data; // res.data is already unwrapped
    },
  });

  const complaints: Complaint[] = data?.complaints || [];

  const { data: workersData } = useQuery({
    queryKey: ['adminWorkers'],
    queryFn: async () => {
      const res = await api.get('/users/workers');
      return res.data;
    },
    enabled: isAssignModalOpen,
  });

  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['complaint', selectedComplaintId],
    queryFn: async () => {
      const res = await api.get(`/complaints/${selectedComplaintId}`);
      return res.data as Complaint;
    },
    enabled: !!selectedComplaintId,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/complaints/${assignComplaintId}/assign`, { workerId: selectedWorkerId });
    },
    onSuccess: () => {
      toast.success('Worker assigned successfully');
      setIsAssignModalOpen(false);
      setAssignComplaintId(null);
      setSelectedWorkerId('');
      queryClient.invalidateQueries({ queryKey: ['adminComplaints'] });
      if (selectedComplaintId) queryClient.invalidateQueries({ queryKey: ['complaint', selectedComplaintId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to assign worker');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/complaints/${statusComplaintId}/status`, { status: newStatus, note: statusNote });
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      setIsStatusModalOpen(false);
      setStatusComplaintId(null);
      setNewStatus('');
      setStatusNote('');
      queryClient.invalidateQueries({ queryKey: ['adminComplaints'] });
      if (selectedComplaintId) queryClient.invalidateQueries({ queryKey: ['complaint', selectedComplaintId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    },
  });

  const handleOpenDetail = (id: string) => {
    setSelectedComplaintId(id);
    setIsDetailModalOpen(true);
  };

  const handleOpenAssign = (id: string) => {
    setAssignComplaintId(id);
    setIsAssignModalOpen(true);
  };

  const handleOpenStatus = (id: string, currentStatus: string) => {
    setStatusComplaintId(id);
    setNewStatus(currentStatus);
    setIsStatusModalOpen(true);
  };

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
            {item.category?.name} {item.room ? `- Room ${item.room.roomNumber}` : ''}
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
      cell: (item) => (
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleOpenStatus(item.id, item.status)}
          title="Click to change status"
        >
          <Badge variant="status" status={item.status} />
        </div>
      ),
    },
    {
      header: 'Assigned To',
      cell: (item) => {
        const assignment = item.assignments?.[0];
        if (!assignment || !assignment.worker) {
          return <span className="text-xs text-slate-400 italic">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
              {assignment.worker.firstName?.[0] || 'W'}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {assignment.worker.firstName} {assignment.worker.lastName}
            </span>
          </div>
        );
      },
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
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleOpenDetail(item.id)}>
            <Eye size={16} />
          </Button>
          <Button variant="outline" size="sm" className="hidden lg:flex" leftIcon={<UserPlus size={14} />} onClick={() => handleOpenAssign(item.id)}>
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

      {/* Complaint Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedComplaintId(null); }}
        title="Complaint Details"
        maxWidth="2xl"
      >
        <div className="p-1 max-h-[75vh] overflow-y-auto">
          {isDetailLoading ? (
            <div className="space-y-4">
              <div className="skeleton h-8 w-1/3 rounded-lg" />
              <div className="skeleton h-24 w-full rounded-xl" />
              <div className="skeleton h-32 w-full rounded-xl" />
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{detailData.ticketNumber}</span>
                    <Badge variant="status" status={detailData.status} />
                    <Badge variant="priority" priority={detailData.priority} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{detailData.title}</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" leftIcon={<UserPlus size={14} />} onClick={() => handleOpenAssign(detailData.id)}>
                    Assign Worker
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenStatus(detailData.id, detailData.status)}>
                    Update Status
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Student</h4>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{detailData.student?.firstName} {detailData.student?.lastName}</p>
                  <p className="text-sm text-slate-500">{detailData.student?.studentId}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Location</h4>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{detailData.hostel?.name}</p>
                  <p className="text-sm text-slate-500">Room {detailData.room?.roomNumber || (detailData as any).roomNumber}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Description</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {detailData.description}
                </p>
              </div>

              {detailData.images && detailData.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Attachments</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {detailData.images.map(img => (
                      <img key={img.id} src={img.url} alt="Attachment" className="h-24 w-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                    ))}
                  </div>
                </div>
              )}

              {detailData.assignments && detailData.assignments.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Wrench size={16} /> Current Assignment
                  </h4>
                  <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      {detailData.assignments[0].worker?.firstName?.[0] || 'W'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {detailData.assignments[0].worker?.firstName} {detailData.assignments[0].worker?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">Assigned: {new Date(detailData.assignments[0].createdAt).toLocaleString()}</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="status" status={detailData.assignments[0].status} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">Could not load complaint details.</div>
          )}
        </div>
      </Modal>

      {/* Assign Worker Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setAssignComplaintId(null); setSelectedWorkerId(''); }}
        title="Assign Worker"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Select a worker to assign to this complaint.</p>
          <Select
            label="Select Worker"
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            options={(workersData || []).map((w: any) => ({
              value: w.id,
              label: `${w.firstName} ${w.lastName} - ${w.specialization?.join(', ') || 'General'}`,
            }))}
            leftIcon={<User size={16} />}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={() => assignMutation.mutate()} 
              isLoading={assignMutation.isPending}
              disabled={!selectedWorkerId}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => { setIsStatusModalOpen(false); setStatusComplaintId(null); }}
        title="Update Status"
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: 'RAISED', label: 'Raised' },
              { value: 'VERIFIED', label: 'Verified' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CLOSED', label: 'Closed' },
              { value: 'ARCHIVED', label: 'Archived' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          <div className="form-group">
            <label className="label">Note (Optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Add a note about this status change..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={() => statusMutation.mutate()} 
              isLoading={statusMutation.isPending}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
