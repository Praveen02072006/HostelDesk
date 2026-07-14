import { FileText, Users, Wrench, Building2, BarChart3, ClipboardList, Bell, Settings, AlertTriangle, Home, TrendingUp, Package, FileSpreadsheet, Zap, Wifi, Sofa, Droplets, ShieldCheck, Bug, Wind, Hammer, Leaf, MoreHorizontal, Plug } from 'lucide-react';

export type UserRole = 'STUDENT' | 'ADMIN' | 'WORKER' | 'SUPERVISOR' | 'MANAGEMENT';

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH — complaint category taxonomy
// Matches the backend CATEGORY_DATA exactly. Update here when adding categories.
// ─────────────────────────────────────────────────────────────────────────────
export const COMPLAINT_TAXONOMY = [
  {
    name: 'Electrical',
    icon: '⚡',
    color: '#F59E0B',
    subcategories: ['Fan not working', 'Tube light not working', 'Switch damaged', 'Socket issue', 'Power outage', 'Loose wiring', 'Fuse issue', 'Charging point issue'],
  },
  {
    name: 'Plumbing',
    icon: '🔧',
    color: '#3B82F6',
    subcategories: ['Water leakage', 'Tap damaged', 'Shower issue', 'Pipe leakage', 'Wash basin blockage', 'Toilet flush issue', 'Drain blockage'],
  },
  {
    name: 'Furniture',
    icon: '🪑',
    color: '#8B5CF6',
    subcategories: ['Broken bed', 'Broken chair', 'Damaged table', 'Cupboard issue', 'Shelf damaged', 'Mattress issue'],
  },
  {
    name: 'Internet & Network',
    icon: '📶',
    color: '#6366F1',
    subcategories: ['Wi-Fi not working', 'Slow internet', 'LAN issue', 'Router problem'],
  },
  {
    name: 'Appliances',
    icon: '🔌',
    color: '#EF4444',
    subcategories: ['Water cooler issue', 'Washing machine issue', 'Water purifier issue', 'Air conditioner issue'],
  },
  {
    name: 'Cleaning & Housekeeping',
    icon: '🧹',
    color: '#10B981',
    subcategories: ['Room cleaning', 'Washroom cleaning', 'Garbage collection', 'Corridor cleaning'],
  },
  {
    name: 'Doors & Windows',
    icon: '🚪',
    color: '#A8A29E',
    subcategories: ['Door lock issue', 'Broken door', 'Window damaged', 'Broken handle'],
  },
  {
    name: 'Safety & Security',
    icon: '🛡️',
    color: '#DC2626',
    subcategories: ['Fire extinguisher issue', 'CCTV issue', 'Emergency light issue', 'Security concern'],
  },
  {
    name: 'Pest Control',
    icon: '🐛',
    color: '#84CC16',
    subcategories: ['Mosquitoes', 'Cockroaches', 'Ants', 'Rats', 'Termites'],
  },
  {
    name: 'Water Supply',
    icon: '💧',
    color: '#0EA5E9',
    subcategories: ['No water', 'Low water pressure', 'Hot water issue'],
  },
  {
    name: 'Civil & Structural',
    icon: '🏗️',
    color: '#78716C',
    subcategories: ['Ceiling damage', 'Wall crack', 'Paint peeling', 'Floor damage'],
  },
  {
    name: 'Common Area Maintenance',
    icon: '🏢',
    color: '#14B8A6',
    subcategories: ['Lift issue', 'Staircase lighting', 'Corridor maintenance', 'Garden maintenance'],
  },
  {
    name: 'Others',
    icon: '📋',
    color: '#6B7280',
    subcategories: ['Custom issue'],
  },
] as const;

// All category names (for filter dropdowns)
export const ALL_CATEGORY_NAMES = COMPLAINT_TAXONOMY.map((c) => c.name);

// All subcategory names flattened (for smart suggestions)
export const ALL_SUBCATEGORY_NAMES = COMPLAINT_TAXONOMY.flatMap((c) => c.subcategories);

/**
 * Given a partial query string, returns smart suggestions that include
 * matching subcategory names and their parent categories.
 * Used by the global search bar for typeahead hints.
 */
export function getSmartSuggestions(query: string): string[] {
  if (!query || query.trim().length < 2) return [];
  const lower = query.toLowerCase().trim();
  const results: string[] = [];

  for (const cat of COMPLAINT_TAXONOMY) {
    // Match category name itself
    if (cat.name.toLowerCase().includes(lower)) {
      results.push(cat.name);
    }
    // Match subcategory names and include them
    for (const sub of cat.subcategories) {
      if (sub.toLowerCase().includes(lower)) {
        results.push(sub);
      }
    }
  }

  // Deduplicate and cap at 8
  return [...new Set(results)].slice(0, 8);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────
export interface SearchSuggestion {
  label: string;
  query: string;
  icon: any;
  color: string;
}

export interface QuickAction {
  label: string;
  path: string;
  icon: any;
  color: string;
}

export interface SearchFilter {
  key: string;
  label: string;
  options: string[];
}

export interface RoleSearchConfig {
  placeholder: string;
  exampleSearches: string[];
  suggestions: SearchSuggestion[];
  quickActions: QuickAction[];
  filters: SearchFilter[];
  resultSections: string[];
  commands: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS OPTIONS (shared)
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['RAISED', 'VERIFIED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED'];
const PRIORITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

// ─────────────────────────────────────────────────────────────────────────────
// ROLE SEARCH CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_SEARCH_CONFIG: Record<UserRole, RoleSearchConfig> = {
  STUDENT: {
    placeholder: 'Search complaints, categories (e.g. Fan, Water leakage, Lift)...',
    exampleSearches: [
      'Water leakage', 'Fan not working', 'Wi-Fi issue',
      'Broken bed', 'Cockroach', 'Lift issue', 'Room cleaning',
    ],
    suggestions: [
      { label: 'Raise New Complaint', query: 'new complaint', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
      { label: 'My Pending Complaints', query: 'complaints:pending', icon: ClipboardList, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
      { label: 'Complaint History', query: 'history', icon: FileSpreadsheet, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
      { label: 'My Room', query: 'room', icon: Home, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
    ],
    quickActions: [
      { label: 'Raise New Complaint', path: '/student/complaints/new', icon: FileText, color: 'text-indigo-600' },
      { label: 'View Complaint History', path: '/student/complaints', icon: ClipboardList, color: 'text-slate-600' },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
      { key: 'category', label: 'Category', options: ALL_CATEGORY_NAMES },
    ],
    resultSections: ['complaints', 'rooms'],
    commands: {
      'complaints:pending': 'Show pending complaints',
      'complaints:resolved': 'Show resolved complaints',
      'room:': 'Search by room number',
      'category:': 'Filter by category',
      'status:': 'Filter by status',
    },
  },

  ADMIN: {
    placeholder: 'Search complaints, students, workers, rooms (e.g. Electrical, Fan, Room A-203)...',
    exampleSearches: [
      'Pending complaints', 'High priority', 'Fan not working',
      'Water leakage', 'Electrical', 'Block A', 'Lift issue',
    ],
    suggestions: [
      { label: 'Pending Complaints', query: 'complaints:pending', icon: FileText, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' },
      { label: 'Assign Workers', query: 'workers', icon: Users, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
      { label: 'High Priority', query: 'priority:high', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
      { label: 'View Reports', query: 'reports', icon: BarChart3, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
      { label: 'Manage Rooms', query: 'rooms', icon: Building2, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
      { label: 'Dashboard', query: 'dashboard', icon: Zap, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/30' },
    ],
    quickActions: [
      { label: 'View All Complaints', path: '/admin/complaints', icon: FileText, color: 'text-rose-600' },
      { label: 'Manage Workers', path: '/admin/users', icon: Users, color: 'text-indigo-600' },
    ],
    filters: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
      { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
      { key: 'category', label: 'Category', options: ALL_CATEGORY_NAMES },
    ],
    resultSections: ['complaints', 'users', 'rooms'],
    commands: {
      'complaints:pending': 'Show pending complaints',
      'priority:high': 'Show high priority complaints',
      'priority:critical': 'Show critical complaints',
      'worker:': 'Search by worker name',
      'student:': 'Search by student name/email',
      'room:': 'Search by room number',
      'block:': 'Search by block',
      'category:': 'Filter by category',
      'status:': 'Filter by status',
      'today': "Show today's complaints",
      'this week': "Show this week's complaints",
    },
  },

  WORKER: {
    placeholder: 'Search assigned jobs, room numbers, categories...',
    exampleSearches: [
      "Today's jobs", 'Room A-203', 'Plumbing',
      'Fan not working', 'Pending repairs', 'Water leakage',
    ],
    suggestions: [
      { label: "Today's Jobs", query: 'today', icon: ClipboardList, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
      { label: 'Pending Repairs', query: 'complaints:pending', icon: Wrench, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
      { label: 'Completed Tasks', query: 'complaints:resolved', icon: FileText, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
      { label: 'My Profile', query: 'profile', icon: Users, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
    ],
    quickActions: [
      { label: 'View Job Board', path: '/worker/jobs', icon: Wrench, color: 'text-indigo-600' },
      { label: 'My Dashboard', path: '/worker/dashboard', icon: ClipboardList, color: 'text-slate-600' },
    ],
    filters: [
      { key: 'category', label: 'Category', options: ALL_CATEGORY_NAMES },
      { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
    resultSections: ['complaints', 'rooms'],
    commands: {
      'complaints:pending': 'Show pending jobs',
      'complaints:resolved': 'Show completed jobs',
      'room:': 'Search by room number',
      'category:': 'Filter by category',
      'today': "Show today's jobs",
      'priority:': 'Filter by priority',
    },
  },

  SUPERVISOR: {
    placeholder: 'Search workers, delayed complaints, inventory...',
    exampleSearches: [
      'Delayed complaints', 'Worker performance', 'SLA violations',
      'Inventory', 'Room history', 'Escalated complaints',
    ],
    suggestions: [
      { label: 'Delayed Complaints', query: 'delayed', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' },
      { label: 'Worker Analytics', query: 'worker performance', icon: BarChart3, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
      { label: 'Escalated Cases', query: 'escalated', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
      { label: 'Inventory', query: 'inventory', icon: Package, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
    ],
    quickActions: [
      { label: 'View Escalations', path: '/supervisor/escalations', icon: AlertTriangle, color: 'text-rose-600' },
      { label: 'Worker Analytics', path: '/supervisor/workers', icon: Users, color: 'text-indigo-600' },
    ],
    filters: [
      { key: 'category', label: 'Category', options: ALL_CATEGORY_NAMES },
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
      { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
    ],
    resultSections: ['complaints', 'users', 'rooms'],
    commands: {
      'worker:': 'Search by worker name',
      'delayed': 'Show delayed complaints',
      'escalated': 'Show escalated cases',
      'sla:violated': 'Show SLA violations',
      'category:': 'Filter by category',
    },
  },

  MANAGEMENT: {
    placeholder: 'Search analytics, reports, maintenance trends, hostels...',
    exampleSearches: [
      'Monthly reports', 'Complaint trends', 'Electrical complaints',
      'Maintenance costs', 'Worker performance', 'Resolution time',
    ],
    suggestions: [
      { label: 'Analytics', query: 'analytics', icon: BarChart3, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
      { label: 'Monthly Reports', query: 'reports', icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
      { label: 'Complaint Trends', query: 'complaint trends', icon: TrendingUp, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' },
      { label: 'Worker Performance', query: 'worker performance', icon: Users, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
    ],
    quickActions: [
      { label: 'Global Analytics', path: '/management/analytics', icon: BarChart3, color: 'text-indigo-600' },
      { label: 'View Reports', path: '/management/reports', icon: FileSpreadsheet, color: 'text-emerald-600' },
    ],
    filters: [
      { key: 'category', label: 'Category', options: ALL_CATEGORY_NAMES },
      { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
    resultSections: ['complaints', 'users', 'rooms'],
    commands: {
      'reports': 'View reports',
      'analytics': 'View analytics',
      'hostel:': 'Search by hostel',
      'trends': 'Show complaint trends',
      'performance': 'View performance metrics',
      'this month': "Show this month's data",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RESULT SECTION META
// ─────────────────────────────────────────────────────────────────────────────
export const RESULT_SECTION_META: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  complaints: { label: 'Complaints', icon: FileText, color: 'text-rose-500', bgColor: 'bg-rose-100 dark:bg-rose-500/20' },
  users: { label: 'Users', icon: Users, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-500/20' },
  rooms: { label: 'Rooms', icon: Building2, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20' },
};

// ─────────────────────────────────────────────────────────────────────────────
// RECENT SEARCHES HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const RECENT_SEARCHES_KEY = 'hosteldesk_recent_searches';
export const MAX_RECENT_SEARCHES = 8;

export function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  const searches = getRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES)));
}

export function removeRecentSearch(query: string): void {
  const searches = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGHLIGHT HELPER
// ─────────────────────────────────────────────────────────────────────────────
export function highlightMatch(text: string, query: string): { text: string; highlighted: boolean }[] {
  if (!query.trim()) return [{ text, highlighted: false }];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part) => ({
    text: part,
    highlighted: regex.test(part),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function detectCommand(query: string): { command: string; value: string } | null {
  const colonIdx = query.indexOf(':');
  if (colonIdx > 0) {
    return { command: query.slice(0, colonIdx).toLowerCase(), value: query.slice(colonIdx + 1).trim() };
  }
  const knownPhrases = ['today', 'this week', 'this month', 'analytics', 'reports', 'history', 'delayed', 'escalated', 'pending', 'critical'];
  const lower = query.toLowerCase().trim();
  if (knownPhrases.includes(lower)) {
    return { command: lower, value: '' };
  }
  return null;
}
