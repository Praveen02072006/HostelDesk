import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Plus, Settings2, Trash2, Edit } from 'lucide-react';
import { Category } from '../../types';

export default function ManageCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await api.get('/categories?includeSub=true');
      return res.data;
    },
  });

  const categories = data || [];

  const columns: Column<Category>[] = [
    {
      header: 'Category',
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: item.color || '#6366f1' }}
          >
            <Settings2 size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
            <p className="text-xs text-slate-500 max-w-[200px] truncate">{item.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Subcategories',
      cell: (item: any) => (
        <div className="flex flex-wrap gap-1 max-w-[300px]">
          {item.subcategories?.length > 0 ? (
            item.subcategories.map((sub: any) => (
              <span key={sub.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {sub.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">None</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (item: any) => (
        <Badge 
          className={item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}
        >
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-slate-400 hover:text-rose-600">
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title">Manage Categories</h1>
          <p className="page-subtitle">Configure maintenance categories and subcategories</p>
        </div>
        <Button leftIcon={<Plus size={18} />}>
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <DataTable
              data={categories}
              columns={columns}
              isLoading={isLoading}
              searchable={true}
              searchKey="name"
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
