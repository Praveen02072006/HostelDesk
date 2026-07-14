import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLE_SEARCH_CONFIG, UserRole } from '../../lib/searchConfig';

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const isOnSearchPage = location.pathname === '/search';
  const role = (user?.role as UserRole) || 'STUDENT';
  const config = ROLE_SEARCH_CONFIG[role];

  // Pre-fill from URL when on search page
  useEffect(() => {
    if (isOnSearchPage && inputRef.current) {
      inputRef.current.value = searchParams.get('q') || '';
    }
  }, [isOnSearchPage, searchParams]);

  // Ctrl+K / Cmd+K → open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!isOnSearchPage) navigate('/search');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isOnSearchPage]);

  const handleFocus = () => {
    if (!isOnSearchPage) navigate('/search');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value.trim();
    if (e.key === 'Enter') {
      navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-4">
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 gap-2 transition-all duration-200">
        <Search size={16} className="flex-shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          onFocus={handleFocus}
          onChange={(e) => {
            if (e.target.value === '' && isOnSearchPage) {
              navigate('/search');
            }
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 min-w-0 cursor-pointer"
          placeholder={config.placeholder}
          readOnly={!isOnSearchPage}
        />
        <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 flex-shrink-0 font-mono bg-white dark:bg-slate-900">
          ⌘K
        </kbd>
      </div>
    </div>
  );
};
