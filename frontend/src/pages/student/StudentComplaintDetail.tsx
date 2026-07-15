import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Clock, FileText, Calendar, AlertCircle, ArrowLeft, MapPin,
  User, CheckCircle2, Circle, Wrench, Star, MessageSquare,
  Image as ImageIcon, ChevronRight, Ban, Send, ShieldCheck, Eye,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { formatRelativeTime } from '../../lib/utils';
import { Complaint, StatusHistory, Assignment } from '../../types';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'RAISED', label: 'Raised', icon: Circle },
  { key: 'VERIFIED', label: 'Verified', icon: ShieldCheck },
  { key: 'ASSIGNED', label: 'Assigned', icon: User },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Wrench },
  { key: 'COMPLETED', label: 'Pending Verification', icon: Clock },
  { key: 'CLOSED', label: 'Verified & Closed', icon: CheckCircle2 },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
  MEDIUM: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  LOW: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
};

function getStatusIndex(status: string) {
  if (status === 'CANCELLED') return -1;
  return STATUS_STEPS.findIndex(s => s.key === status);
}

export default function StudentComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const handleNotification = () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      }
      queryClient.invalidateQueries({ queryKey: ['studentComplaints'] });
    };
    
    window.addEventListener('new_notification', handleNotification);
    return () => {
      window.removeEventListener('new_notification', handleNotification);
    };
  }, [queryClient, id]);

  const { data: complaint, isLoading, error } = useQuery<Complaint>({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const res = await api.get(`/complaints/${id}`) as any;
      return res.data;
    },
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      await api.patch(`/complaints/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      toast.success('Complaint cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      queryClient.invalidateQueries({ queryKey: ['studentComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['studentComplaintsFull'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel complaint');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: { rating: number; comment?: string; isAnonymous: boolean }) => {
      await api.post(`/complaints/${id}/feedback`, data);
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      queryClient.invalidateQueries({ queryKey: ['studentComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['studentComplaintsFull'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit feedback');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: { verified: boolean; rating?: number; comment?: string; isAnonymous?: boolean; rejectionReason?: string }) => {
      await api.post(`/complaints/${id}/verify`, data);
    },
    onSuccess: (_, variables) => {
      if (variables.verified) {
        toast.success('Work verified! Complaint closed successfully.');
      } else {
        toast.success('Work rejected. The worker has been notified.');
      }
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      queryClient.invalidateQueries({ queryKey: ['studentComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['studentComplaintsFull'] });
      setShowRejectForm(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to verify');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="skeleton h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={64} />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Complaint not found</h3>
            <p className="text-sm text-slate-500 mb-6">The complaint you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link to="/student/complaints">
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>Back to Complaints</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(complaint.status);
  const isCancelled = complaint.status === 'CANCELLED';
  const latestAssignment = complaint.assignments?.[0];
  const feedback = (complaint as any).feedback;
  const statusHistory: StatusHistory[] = complaint.statusHistory || [];
  const images = complaint.images || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/student/complaints" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} className="text-slate-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">{complaint.ticketNumber}</span>
              <Badge variant="status" status={complaint.status} />
              <Badge variant="priority" priority={complaint.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{complaint.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {complaint.status === 'RAISED' && !showCancelForm && (
            <Button variant="outline" size="sm" leftIcon={<Ban size={14} />} onClick={() => setShowCancelForm(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
            >
              Cancel Complaint
            </Button>
          )}
        </div>
      </div>

      {/* Cancel form */}
      {showCancelForm && (
        <Card className="border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5">
          <CardContent className="p-5">
            <h3 className="font-semibold text-rose-700 dark:text-rose-400 mb-3">Cancel Complaint</h3>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation (min 5 characters)..."
              className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => { setShowCancelForm(false); setCancelReason(''); }}>
                Never mind
              </Button>
              <Button variant="primary" size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                isLoading={cancelMutation.isPending}
                onClick={() => { if (cancelReason.length >= 5) cancelMutation.mutate(cancelReason); else toast.error('Reason must be at least 5 characters'); }}
              >
                Confirm Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Progress Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complaint Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {isCancelled ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
              <Ban className="text-rose-500" size={24} />
              <div>
                <p className="font-semibold text-rose-700 dark:text-rose-400">Complaint Cancelled</p>
                <p className="text-sm text-rose-600 dark:text-rose-300/70">{(complaint as any).cancelReason || 'No reason provided'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center overflow-x-auto pb-2">
              {STATUS_STEPS.map((step, i) => {
                const isActive = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                const StepIcon = step.icon;
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center min-w-[80px] relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-100 dark:ring-indigo-500/20'
                          : isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}>
                        <StepIcon size={18} />
                      </div>
                      <span className={`text-xs mt-2 font-medium text-center whitespace-nowrap ${
                        isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 min-w-[24px] rounded-full transition-colors ${
                        i < currentStatusIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>

              {/* Meta info */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{complaint.category?.name || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Priority</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${PRIORITY_COLORS[complaint.priority] || ''}`}>
                    {complaint.priority}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Location</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <MapPin size={12} />
                    {complaint.room?.roomNumber ? `Room ${complaint.room.roomNumber}` : (complaint as any).roomNumber || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Raised</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatRelativeTime(complaint.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon size={16} /> Attached Images ({images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.url)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all"
                    >
                      <img src={img.url} alt={img.caption || 'Complaint image'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock size={16} /> Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-6">
                    {statusHistory.map((entry, i) => (
                      <div key={entry.id} className="relative flex gap-4 pl-2">
                        <div className={`relative z-10 w-5 h-5 rounded-full mt-0.5 flex items-center justify-center ${
                          i === statusHistory.length - 1
                            ? 'bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-500/20'
                            : 'bg-emerald-500'
                        }`}>
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="status" status={entry.toStatus} />
                            {entry.fromStatus && (
                              <>
                                <span className="text-xs text-slate-400">from</span>
                                <Badge variant="status" status={entry.fromStatus} />
                              </>
                            )}
                          </div>
                          {entry.note && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{entry.note}</p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Section - Show when COMPLETED (worker done, needs student verification) */}
          {complaint.status === 'COMPLETED' && !feedback && (
            <Card className="border-orange-200 dark:border-orange-500/30 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-500/5 dark:to-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck size={16} className="text-orange-500" /> Verify Work Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 mb-5">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    🔧 The assigned worker has marked this job as done. Please verify if the work has been completed to your satisfaction.
                  </p>
                </div>

                {!showRejectForm ? (
                  <>
                    {/* Star Rating */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-medium">Rate the work (optional):</p>
                    <div className="flex items-center gap-1 mb-5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${
                              star <= (hoverRating || rating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    <textarea
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder="Tell us about the repair quality (optional)..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      rows={3}
                    />

                    {/* Anonymous toggle */}
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Submit feedback anonymously</span>
                    </label>

                    <div className="flex gap-3 mt-5">
                      <Button
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                        leftIcon={<CheckCircle2 size={16} />}
                        isLoading={verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate({
                          verified: true,
                          rating: rating || undefined,
                          comment: feedbackComment || undefined,
                          isAnonymous,
                        })}
                      >
                        ✅ Verify & Close
                      </Button>
                      <Button
                        variant="outline"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                        leftIcon={<Ban size={16} />}
                        onClick={() => setShowRejectForm(true)}
                      >
                        Reject
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Why is the work not satisfactory?</p>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Please describe what is still not fixed or needs more work..."
                      className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        className="bg-rose-600 hover:bg-rose-700 flex-1"
                        leftIcon={<Ban size={16} />}
                        isLoading={verifyMutation.isPending}
                        onClick={() => {
                          if (rejectReason.length < 5) { toast.error('Please provide at least 5 characters'); return; }
                          verifyMutation.mutate({ verified: false, rejectionReason: rejectReason });
                        }}
                      >
                        Submit Rejection
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowRejectForm(false); setRejectReason(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show submitted feedback */}
          {feedback && (
            <Card className="border-emerald-200 dark:border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-500" /> Your Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={20}
                      className={star <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{feedback.rating}/5</span>
                </div>
                {feedback.comment && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">"{feedback.comment}"</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Submitted {new Date(feedback.createdAt).toLocaleDateString()}
                  {feedback.isAnonymous && ' • Anonymous'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Assigned Worker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench size={16} /> Assigned Worker
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestAssignment?.worker ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                      {latestAssignment.worker.firstName?.[0] || 'W'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {latestAssignment.worker.firstName} {latestAssignment.worker.lastName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID: {latestAssignment.worker.employeeId}
                      </p>
                    </div>
                  </div>

                  {/* Worker rating */}
                  {latestAssignment.worker.rating !== undefined && latestAssignment.worker.rating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{latestAssignment.worker.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Assignment status */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Job Status</span>
                      <Badge variant="status" status={latestAssignment.status} />
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-slate-500 dark:text-slate-400">Assigned</span>
                      <span className="text-slate-700 dark:text-slate-300">{formatRelativeTime(latestAssignment.createdAt)}</span>
                    </div>
                    {latestAssignment.completedAt && (
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-slate-500 dark:text-slate-400">Completed</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatRelativeTime(latestAssignment.completedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-3 flex items-center justify-center">
                    <User size={24} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No worker assigned yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">An admin will assign a worker soon</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Info */}
          {complaint.slaDeadline && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle size={16} /> SLA Deadline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-3 rounded-xl border ${
                  complaint.slaBreached
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                }`}>
                  <p className={`text-sm font-semibold ${complaint.slaBreached ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {complaint.slaBreached ? '⚠️ SLA Breached' : '✅ Within SLA'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Deadline: {new Date(complaint.slaDeadline).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {complaint.hostel && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Hostel</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{complaint.hostel.name}</span>
                </div>
              )}
              {complaint.room && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Block</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{complaint.room.block}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Floor</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{complaint.room.floor}</span>
                  </div>
                </>
              )}
              {complaint.subcategory && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Subcategory</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{complaint.subcategory.name}</span>
                </div>
              )}
              {(complaint as any).isRecurring && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium text-center">
                  ♻️ Recurring Issue
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 text-sm font-medium"
            >
              ✕ Close
            </button>
            <img src={selectedImage} alt="Full size" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
