import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, FileText } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchable?: boolean;
  searchKey?: keyof T; // Simple search implementation for one key
  itemsPerPage?: number;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = 'Search...',
  searchable = false,
  searchKey,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);

  // Simple filtering
  const filteredData = React.useMemo(() => {
    if (!searchable || !searchKey || !deferredSearchTerm) return data;
    return data.filter((item) => {
      const val = item[searchKey as keyof T];
      if (typeof val === 'string') {
        return val.toLowerCase().includes(deferredSearchTerm.toLowerCase());
      }
      return false;
    });
  }, [data, searchable, searchKey, deferredSearchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex justify-between items-center">
          <div className="w-full sm:w-72">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
              className="bg-white dark:bg-slate-800"
            />
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading State
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((_, colIdx) => (
                    <td key={colIdx}>
                      <div className="skeleton h-6 w-full rounded"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <FileText size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">{emptyMessage}</p>
                    {searchTerm && (
                      <p className="text-sm mt-1">No results found for "{searchTerm}"</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={col.className}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? (item as any)[col.accessorKey] as React.ReactNode
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && filteredData.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-slate-100">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">{filteredData.length}</span> results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-1 h-8 w-8"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <div className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-sm font-medium">
              {currentPage} / {totalPages}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 h-8 w-8"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 h-8 w-8"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
