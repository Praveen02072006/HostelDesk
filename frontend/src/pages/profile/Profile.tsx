import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { User, Shield, Smartphone, Camera, CheckCircle2, Settings, MonitorSmartphone, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const profileSchema = z.object({
  personalEmail: z.string().email('Invalid email address').or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  guardianName: z.string().optional(),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'sessions'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user: authUser } = useAuthStore();

  // Fetch Profile
  const { data: user, isLoading } = useQuery({
    queryKey: ['myProfile', authUser?.email],
    queryFn: async () => {
      const res = await api.get('/profile') as any;
      return res.data;
    },
  });

  // Fetch Sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['mySessions', authUser?.email],
    queryFn: async () => {
      const res = await api.get('/profile/sessions') as any;
      return res.data;
    },
    enabled: activeTab === 'sessions',
  });

  const { register: registerPwd, handleSubmit: handlePwdSubmit, formState: { errors: pwdErrors }, reset: resetPwd } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, reset: resetProfile } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (user?.profile) {
      resetProfile({
        personalEmail: user.profile.personalEmail || '',
        phone: user.profile.phone || '',
        gender: user.profile.gender || '',
        guardianName: user.profile.guardianName || '',
        guardianRelation: user.profile.guardianRelation || '',
        guardianPhone: user.profile.guardianPhone || '',
      });
    }
  }, [user, resetProfile]);

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.patch('/profile', data) as any;
      return res;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  });

  const prefsMutation = useMutation({
    mutationFn: async (data: { emailNotifications?: boolean, complaintNotifications?: boolean }) => {
      await api.put('/profile', data);
    },
    onSuccess: () => {
      toast.success('Preferences saved');
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put('/profile/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPwd();
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  });

  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('images', file);
      formData.append('type', 'avatar');
      
      const uploadRes = await api.post('/uploads', formData) as any;
      
      const imageUrl = uploadRes.data.data[0].url;
      await api.patch('/profile', { avatar: imageUrl });
      
      return imageUrl;
    },
    onSuccess: () => {
      toast.success('Avatar updated successfully');
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    }
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarUploadMutation.mutate(file);
    }
    // Reset input value so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/profile/sessions/${sessionId}`);
    },
    onSuccess: () => {
      toast.success('Session revoked');
      queryClient.invalidateQueries({ queryKey: ['mySessions'] });
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex gap-8">
        <div className="w-64 skeleton h-64 rounded-2xl hidden lg:block"></div>
        <div className="flex-1 skeleton h-[600px] rounded-2xl"></div>
      </div>
    );
  }

  const profile = user?.profile;
  const isStudent = user?.role === 'STUDENT';

  // If student log in but no profile data is available, display a friendly empty state.
  if (isStudent && !profile) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <Card className="p-8 flex flex-col items-center justify-center space-y-4 shadow-md border border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
            <User size={32} />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Profile Data Unavailable</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            We couldn't find your student profile details in the database. Please contact your hostel administrator to set up and verify your student account.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="page-header mb-0">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your personal information, security, and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="lg:w-64 flex-shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}
          >
            <User size={18} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}
          >
            <Shield size={18} /> Password & Security
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}
          >
            <Settings size={18} /> Preferences
          </button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'sessions' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}
          >
            <MonitorSmartphone size={18} /> Active Sessions
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <>
              {/* Profile Header Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 p-1">
                        <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden">
                          {profile?.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : profile?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </div>
                      </div>
                      <button 
                        onClick={handleAvatarClick}
                        disabled={avatarUploadMutation.isPending}
                        className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        <Camera size={14} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'No Name Set'}
                        </h3>
                        {isStudent && <CheckCircle2 className="text-emerald-500" size={20} />}
                      </div>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                        {isStudent ? 'Verified Student' : user?.role}
                      </p>
                      {isStudent && (
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-sm text-slate-600 dark:text-slate-400">
                          <span><strong>ID:</strong> {profile?.studentId || 'N/A'}</span>
                          <span><strong>Dept:</strong> {profile?.department || 'N/A'} (Year {profile?.year || 'N/A'})</span>
                          <span><strong>Hostel:</strong> {profile?.hostel?.name || 'Unassigned'} {profile?.room?.roomNumber ? `- ${profile.room.roomNumber}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editable Information Form */}
              <form onSubmit={handleProfileSubmit((data) => profileMutation.mutate(data))} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Personal Email" type="email" placeholder="e.g. personal@gmail.com" {...registerProfile('personalEmail')} error={profileErrors.personalEmail?.message} />
                      <Input label="Phone Number" {...registerProfile('phone')} error={profileErrors.phone?.message} />
                      <Select 
                        label="Gender" 
                        {...registerProfile('gender')} 
                        options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} 
                        defaultValue=""
                      />
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">University Details (Read Only)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="First Name" value={profile?.firstName || ''} disabled />
                        <Input label="Last Name" value={profile?.lastName || ''} disabled />
                        <Input label="College Email" value={user?.email || ''} disabled />
                        {isStudent && (
                          <>
                            <Input label="Student ID" value={profile?.studentId || ''} disabled />
                            <Input label="Department" value={profile?.department || ''} disabled />
                            <Input label="Year" value={profile?.year || ''} disabled />
                          </>
                        )}
                        {user?.role === 'WORKER' && <Input label="Employee ID" value={profile?.employeeId || ''} disabled />}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isStudent && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Hostel Allocation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Hostel Name</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{profile?.hostel?.name || 'None'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Block</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{profile?.room?.block || '-'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Floor</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{profile?.room?.floor ?? '-'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Room Number</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{profile?.room?.roomNumber || '-'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Room Type</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{profile?.room?.capacity ? `${profile.room.capacity} Sharing` : '-'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Room Status</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${profile?.roomId ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'}`}>
                              {profile?.roomId ? 'Allocated' : 'Unallocated'}
                            </span>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 mb-1">Allocation Date</p>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Emergency Contact</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Input label="Guardian Name" {...registerProfile('guardianName')} error={profileErrors.guardianName?.message} />
                          <Input label="Relationship" placeholder="e.g. Father, Mother" {...registerProfile('guardianRelation')} error={profileErrors.guardianRelation?.message} />
                          <Input label="Guardian Phone" {...registerProfile('guardianPhone')} error={profileErrors.guardianPhone?.message} />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                <div className="flex justify-end">
                  <Button type="submit" isLoading={profileMutation.isPending} variant="primary">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Manage your password and security settings</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Last Password Change</p>
                    <p className="text-xs text-slate-500">
                      {user?.lastPasswordChange ? new Date(user.lastPasswordChange).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Never'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePwdSubmit((data) => passwordMutation.mutate(data))} className="space-y-4 max-w-md pt-4">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</h4>
                  <Input label="Current Password" type="password" {...registerPwd('currentPassword')} error={pwdErrors.currentPassword?.message as string} />
                  <Input label="New Password" type="password" {...registerPwd('newPassword')} error={pwdErrors.newPassword?.message as string} />
                  <Input label="Confirm New Password" type="password" {...registerPwd('confirmPassword')} error={pwdErrors.confirmPassword?.message as string} />
                  
                  <Button type="submit" isLoading={passwordMutation.isPending} className="mt-2">
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Customize your application experience</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Dark Mode</p>
                    <p className="text-sm text-slate-500">Toggle dark mode appearance for the dashboard</p>
                  </div>
                  <button 
                    onClick={() => {
                      const isDark = !document.documentElement.classList.contains('dark');
                      document.documentElement.classList.toggle('dark', isDark);
                      localStorage.setItem('theme', isDark ? 'dark' : 'light');
                    }}
                    className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Toggle Theme
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</p>
                    <p className="text-sm text-slate-500">Receive emails for important system updates</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-600 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                    checked={user?.emailNotifications ?? true}
                    onChange={(e) => prefsMutation.mutate({ emailNotifications: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Complaint Notifications</p>
                    <p className="text-sm text-slate-500">Get notified when complaint statuses change</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-600 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                    checked={user?.complaintNotifications ?? true}
                    onChange={(e) => prefsMutation.mutate({ complaintNotifications: e.target.checked })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'sessions' && (
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Manage devices that are currently logged in to your account</p>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-20 skeleton rounded-xl w-full"></div>)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions?.length === 0 && <p className="text-slate-500 text-center py-4">No active sessions found.</p>}
                    {sessions?.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <MonitorSmartphone size={24} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {session.userAgent ? (session.userAgent.includes('Edg') ? 'Microsoft Edge' : session.userAgent.includes('Chrome') ? 'Google Chrome' : session.userAgent.includes('Firefox') ? 'Mozilla Firefox' : session.userAgent.includes('Safari') ? 'Apple Safari' : 'Unknown Browser') : 'Unknown Device'}
                              {session.ipAddress === '::1' || session.ipAddress === '127.0.0.1' ? ' (Current Device)' : ''}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(session.createdAt).toLocaleDateString()}</span>
                              <span>IP: {session.ipAddress || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20"
                          onClick={() => revokeSessionMutation.mutate(session.id)}
                          isLoading={revokeSessionMutation.isPending}
                        >
                          Revoke Access
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
