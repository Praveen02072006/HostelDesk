import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, Loader2, FileText, User, Home, X, Clock, ArrowRight,
  Command, Zap, ChevronRight, Filter, SlidersHorizontal
} from 'lucide-react';
import { api } from '../../lib/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  ROLE_SEARCH_CONFIG, RESULT_SECTION_META, UserRole,
  getRecentSearches, addRecentSearch, removeRecentSearch,
  clearRecentSearches, highlightMatch, detectCommand, getSmartSuggestions,
} from '../../lib/searchConfig';

/* ─────────────────────────────── helpers ─────────────────────────────── */
const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  const parts = highlightMatch(text, query);
  return (
    <span>
      {parts.map((p, i) =>
        p.highlighted ? (
          <mark key={i} className="bg-indigo-100 dark:bg-indigo-800/60 text-indigo-700 dark:text-indigo-300 rounded px-0.5 not-italic font-semibold">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-3/5" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-2/5" />
    </div>
    <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
  </div>
);

/* ─────────────────────────────── main component ─────────────────────────── */
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>({ complaints: [], users: [], rooms: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [pendingFilter, setPendingFilter] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = (user?.role as UserRole) || 'STUDENT';
  const config = ROLE_SEARCH_CONFIG[role];

  const detectedCmd = debouncedQuery ? detectCommand(debouncedQuery) : null;

  /* ── compute filtered results ── */
  const filteredResults = useMemo(() => {
    if (!activeFilter || Object.keys(activeFilter).length === 0) return results;

    const apply = (item: any, type: string) => {
      for (const [key, val] of Object.entries(activeFilter)) {
        const lowerVal = val.toLowerCase();
        if (key === 'status') {
          if (type !== 'complaint') return false;
          if (item.status?.toLowerCase().replace(/_/g, ' ') !== lowerVal.replace(/_/g, ' ')) return false;
        } else if (key === 'category') {
          if (type !== 'complaint') return false;
          if (item.category?.name?.toLowerCase() !== lowerVal) return false;
        } else if (key === 'priority') {
          if (type !== 'complaint') return false;
          if (item.priority?.toLowerCase() !== lowerVal) return false;
        } else if (key === 'role') {
          if (type !== 'user') return false;
          if (item.role?.toLowerCase() !== lowerVal) return false;
        } else if (key === 'hostel') {
          if (type === 'room') {
            if (item.hostel?.name?.toLowerCase() !== lowerVal) return false;
          } else if (type === 'complaint') {
            if (item.room?.hostel?.name?.toLowerCase() !== lowerVal) return false;
          } else {
            return false;
          }
        } else if (key === 'block') {
          if (type === 'room') {
            if (item.block?.toLowerCase() !== lowerVal) return false;
          } else if (type === 'complaint') {
            if (item.room?.block?.toLowerCase() !== lowerVal) return false;
          } else {
            return false;
          }
        }
      }
      return true;
    };

    return {
      complaints: (results.complaints || []).filter((c: any) => apply(c, 'complaint')),
      users: (results.users || []).filter((u: any) => apply(u, 'user')),
      rooms: (results.rooms || []).filter((r: any) => apply(r, 'room')),
    };
  }, [results, activeFilter]);

  const hasResults = filteredResults.complaints.length > 0 || filteredResults.users.length > 0 || filteredResults.rooms.length > 0;
  const totalResults = filteredResults.complaints.length + filteredResults.users.length + filteredResults.rooms.length;

  /* ── load recent searches ── */
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  /* ── keep query in sync with URL ── */
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  /* ── debounce query ── */
  useEffect(() => {
    if (!query.trim()) {
      // Reset immediately when input is cleared
      setDebouncedQuery('');
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  /* ── fetch results ── */
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ complaints: [], users: [], rooms: [] });
      return;
    }
    const controller = new AbortController();
    const run = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal });
        setResults(res.data || { complaints: [], users: [], rooms: [] });
        setSearchParams({ q: debouncedQuery }, { replace: true });
        addRecentSearch(debouncedQuery.trim());
        setRecentSearches(getRecentSearches());
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [debouncedQuery]);

  /* ── keyboard nav ── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      navigate(-1);
    }
  }, [navigate]);

  const handleSuggestionClick = (q: string) => {
    setSearchParams({ q });
  };

  const handleResultNavigate = (path: string) => {
    navigate(path);
  };

  const getComplaintPath = (id: string) => {
    if (role === 'STUDENT') return `/student/complaints/${id}`;
    if (role === 'ADMIN') return '/admin/complaints';
    if (role === 'WORKER') return '/worker/jobs';
    return '/';
  };

  const clearFilter = (key: string) => {
    setActiveFilter((prev) => { const next = { ...prev }; delete next[key]; return next; });
    setPendingFilter((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const applyFilters = () => {
    setActiveFilter({ ...pendingFilter });
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setActiveFilter({});
    setPendingFilter({});
  };

  const activeFilterCount = Object.keys(activeFilter).length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950" onKeyDown={handleKeyDown}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Filter Strip ─────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          {Object.entries(activeFilter).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 font-medium">
              {key}: {val}
              <button onClick={() => clearFilter(key)} className="ml-0.5 hover:text-indigo-800">
                <X size={11} />
              </button>
            </span>
          ))}

          {/* Detected command badge */}
          {detectedCmd && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700 font-medium">
              <Command size={11} />
              Command: {detectedCmd.command}
              {detectedCmd.value && ` → ${detectedCmd.value}`}
            </span>
          )}
        </div>

        {/* ── Filter Panel ─────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-5 flex flex-wrap gap-4 items-end">
            {config.filters.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1.5 min-w-[140px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {filter.label}
                </label>
                <select
                  className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:ring-0 cursor-pointer"
                  value={pendingFilter[filter.key] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPendingFilter((prev) => {
                      const next = { ...prev };
                      if (!val) delete next[filter.key];
                      else next[filter.key] = val;
                      return next;
                    });
                  }}
                >
                  <option value="">Any</option>
                  {filter.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              {Object.keys(pendingFilter).length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-slate-400 hover:text-rose-500 font-medium py-1.5 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                onClick={applyFilters}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* ── Empty / Initial State ────────────────────────── */}
        {!query.trim() && !isLoading && (
          <div>


            {/* Example Searches */}
            <div className="mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                Try Searching
              </p>
              <div className="flex flex-wrap gap-2">
                {config.exampleSearches.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleSuggestionClick(ex)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                  >
                    <Search size={11} className="text-slate-400" />
                    {ex}
                  </button>
                ))}
              </div>
            </div>



            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Recent Searches
                  </p>
                  <button
                    onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                    className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/50">
                  {recentSearches.map((s) => (
                    <div key={s} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <Clock size={14} className="text-slate-300 flex-shrink-0" />
                      <button
                        className="flex-1 text-sm text-slate-600 dark:text-slate-300 text-left truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        onClick={() => handleSuggestionClick(s)}
                      >
                        {s}
                      </button>
                      <button
                        onClick={() => {
                          removeRecentSearch(s);
                          setRecentSearches(getRecentSearches());
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full w-40 mb-6 animate-pulse" />
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
            </div>
          </div>
        )}

        {/* ── No Results ───────────────────────────────────── */}
        {query.trim() && !isLoading && !hasResults && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
              <Search size={30} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No results found</p>
            <p className="text-sm mt-1 text-slate-400">
              No matches for "<span className="font-medium text-indigo-500">{query}</span>"
            </p>
            <p className="text-xs mt-1 text-slate-400 mb-8">Try a different keyword or use a smart command</p>

            {/* Role-specific quick actions in empty state */}
            <div className="flex flex-wrap gap-3 justify-center">
              {config.quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => handleResultNavigate(a.path)}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                >
                  <a.icon size={15} className={a.color} />
                  <span className="text-slate-700 dark:text-slate-200">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────── */}
        {!isLoading && hasResults && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5 px-1">
              {totalResults} result{totalResults !== 1 ? 's' : ''} for "{debouncedQuery}"
            </p>
            <div className="space-y-5">

              {/* Complaints */}
              {filteredResults.complaints.length > 0 && (
                <ResultSection
                  title="Complaints"
                  meta={RESULT_SECTION_META.complaints}
                  count={filteredResults.complaints.length}
                >
                  {filteredResults.complaints.map((c: any) => (
                    <ResultRow
                      key={c.id}
                      onClick={() => handleResultNavigate(getComplaintPath(c.id))}
                      icon={<FileText size={18} />}
                      iconClass={RESULT_SECTION_META.complaints.color}
                      iconBg={RESULT_SECTION_META.complaints.bgColor}
                      primary={<HighlightedText text={c.title} query={debouncedQuery} />}
                      secondary={`${c.ticketNumber || ''} • ${c.status || ''} ${c.category?.name ? `• ${c.category.name}` : ''}`}
                      badge={c.status}
                      badgeColor={
                        c.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                        c.status === 'RESOLVED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        c.status === 'IN_PROGRESS' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }
                    />
                  ))}
                </ResultSection>
              )}

              {/* Users */}
              {filteredResults.users.length > 0 && (
                <ResultSection
                  title="Users"
                  meta={RESULT_SECTION_META.users}
                  count={filteredResults.users.length}
                >
                  {filteredResults.users.map((u: any) => (
                    <ResultRow
                      key={u.id}
                      onClick={() => handleResultNavigate('/admin/users')}
                      icon={<span className="text-sm font-bold">{u.email?.[0]?.toUpperCase()}</span>}
                      iconClass={RESULT_SECTION_META.users.color}
                      iconBg={RESULT_SECTION_META.users.bgColor}
                      primary={<HighlightedText text={`${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email} query={debouncedQuery} />}
                      secondary={<HighlightedText text={u.email} query={debouncedQuery} />}
                      badge={u.role}
                      badgeColor="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    />
                  ))}
                </ResultSection>
              )}

              {/* Rooms */}
              {filteredResults.rooms.length > 0 && (
                <ResultSection
                  title="Rooms"
                  meta={RESULT_SECTION_META.rooms}
                  count={filteredResults.rooms.length}
                >
                  {filteredResults.rooms.map((r: any) => (
                    <ResultRow
                      key={r.id}
                      onClick={() => handleResultNavigate('/admin/rooms')}
                      icon={<Home size={18} />}
                      iconClass={RESULT_SECTION_META.rooms.color}
                      iconBg={RESULT_SECTION_META.rooms.bgColor}
                      primary={<HighlightedText text={`Room ${r.roomNumber}`} query={debouncedQuery} />}
                      secondary={`${r.hostel?.name || ''} • Block ${r.block || ''} • Floor ${r.floor || ''}`}
                    />
                  ))}
                </ResultSection>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── sub-components ─────────────────────────── */
function ResultSection({
  title, meta, count, children,
}: {
  title: string; meta: any; count: number; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${meta.bgColor}`}>
          <meta.icon size={11} className={meta.color} />
        </div>
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {title}
          <span className="ml-1.5 font-normal text-slate-400">({count})</span>
        </h3>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
        {children}
      </div>
    </section>
  );
}

function ResultRow({
  onClick, icon, iconClass, iconBg, primary, secondary, badge, badgeColor,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconClass: string;
  iconBg: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors text-left group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {primary}
        </p>
        {secondary && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{secondary}</p>
        )}
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 uppercase tracking-wide ${badgeColor}`}>
          {badge.replace(/_/g, ' ')}
        </span>
      )}
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
