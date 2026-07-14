import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { QrCode, Plus, Users, DoorOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';

export default function RoomsAndQR() {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminRooms'],
    queryFn: async () => {
      const res = await api.get('/rooms?limit=500');
      return res.data.data;
    },
  });

  const generateQRMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/rooms/${id}/generate-qr`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('QR Code generated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminRooms'] });
    },
    onError: () => {
      toast.error('Failed to generate QR Code');
    }
  });

  const rooms = data?.rooms || [];

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
    {
      header: 'QR Code',
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.qrCodeUrl ? (
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<QrCode size={14} />}
              onClick={() => setSelectedRoom(item)}
            >
              View QR
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => generateQRMutation.mutate(item.id)}
              isLoading={generateQRMutation.isPending && generateQRMutation.variables === item.id}
            >
              Generate QR
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Rooms & QR Codes</h1>
          <p className="page-subtitle">Manage hostel rooms and generate QR codes for quick issue reporting</p>
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

      {/* QR Code Modal */}
      <Modal
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        title={`Room ${selectedRoom?.roomNumber} QR Code`}
        maxWidth="sm"
      >
        {selectedRoom && (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
              <img src={selectedRoom.qrCodeUrl} alt="Room QR Code" className="w-48 h-48" />
            </div>
            <p className="text-sm text-slate-500 mb-6 text-center">
              Print and place this QR code in Room {selectedRoom.roomNumber} ({selectedRoom.hostel?.name}). 
              Students can scan it to quickly raise a complaint for this specific room.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedRoom(null)}>
                Close
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => window.print()}>
                Print QR
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
