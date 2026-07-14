export type Role = 'STUDENT' | 'WORKER' | 'ADMIN' | 'SUPERVISOR' | 'MANAGEMENT';
export type ComplaintStatus = 'RAISED' | 'VERIFIED' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'ARCHIVED' | 'CANCELLED';
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type JobStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  profile?: StudentProfile | WorkerProfile | AdminProfile;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  phone?: string;
  hostelId?: string;
  roomId?: string;
  department?: string;
  year?: number;
}

export interface WorkerProfile {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone?: string;
  hostelId?: string;
  specialization: string[];
  isAvailable: boolean;
  rating: number;
}

export interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hostelId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
}

export interface ComplaintImage {
  id: string;
  url: string;
  publicId: string;
  type: string;
  caption?: string;
}

export interface StatusHistory {
  id: string;
  fromStatus?: ComplaintStatus;
  toStatus: ComplaintStatus;
  changedBy: string;
  note?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  workerId: string;
  worker?: WorkerProfile;
  status: JobStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: Priority;
  categoryId: string;
  category: Category;
  subcategoryId?: string;
  subcategory?: Subcategory;
  studentId: string;
  student: StudentProfile;
  hostelId: string;
  hostel: { name: string; code: string };
  roomId?: string;
  room?: { roomNumber: string; floor: number; block: string };
  slaBreached: boolean;
  slaDeadline?: string;
  images: ComplaintImage[];
  assignments: Assignment[];
  statusHistory?: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  complaintId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  thisMonthComplaints: number;
  lastMonthComplaints: number;
  monthlyGrowth: number;
  slaBreaches: number;
  availableWorkers: number;
  avgResolutionHours: number;
  resolutionRate: number;
}
