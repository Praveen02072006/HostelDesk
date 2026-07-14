import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Validation schema
const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string({ required_error: 'Select a category' }).min(1, 'Select a category'),
  roomNumber: z.string().min(1, 'Room number is required').regex(/^[a-zA-Z0-9\-\s]+$/, 'Invalid format (e.g., A-203)'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

type ComplaintForm = z.infer<typeof complaintSchema>;

export default function NewComplaint() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load categories from backend.
  // The axios interceptor already unwraps response.data once,
  // so `res` is { success: true, data: [...] } — NOT the raw AxiosResponse.
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories') as any;
      return (res.data ?? []) as any[];
    },
  });

  const categoryOptions = (categoriesData ?? []).map((c: any) => ({
    value: c.id,
    label: `${c.icon ?? ''} ${c.name}`.trim(),
  }));

  const mutation = useMutation({
    mutationFn: async (form: ComplaintForm) => {
      const res = await api.post('/complaints', {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        roomNumber: form.roomNumber,
        priority: form.priority,
      }) as any;
      return res;
    },
    onSuccess: () => {
      toast.success('Complaint submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['studentComplaintsFull'] });
      navigate('/student/dashboard');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to submit complaint';
      toast.error(msg);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComplaintForm>({
    resolver: zodResolver(complaintSchema),
    defaultValues: { 
      priority: 'MEDIUM',
      categoryId: '',
      title: '',
      description: '',
      roomNumber: '',
    },
  });

  const onSubmit = (data: ComplaintForm) => mutation.mutate(data);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <Card>
        <CardHeader>
          <CardTitle>Raise a New Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            {/* Title */}
            <div>
              <Input
                label="Complaint Title"
                placeholder="E.g., Fan not working in room"
                {...register('title')}
                error={errors.title?.message}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Input
                label="Description"
                placeholder="Describe the issue in detail..."
                {...register('description')}
                error={errors.description?.message}
                required
              />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Category"
                  {...register('categoryId')}
                  options={categoryOptions}
                  error={errors.categoryId?.message}
                  required
                  defaultValue=""
                />
                {categoriesLoading && (
                  <p className="text-xs text-slate-400 mt-1">Loading categories...</p>
                )}
              </div>
              <div>
                <Select
                  label="Priority"
                  {...register('priority')}
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                  ]}
                  error={errors.priority?.message}
                  required
                />
              </div>
            </div>

            {/* Room Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Room Number"
                  placeholder="Enter Room Number (e.g., A-203)"
                  {...register('roomNumber')}
                  error={errors.roomNumber?.message}
                  required
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
              </div>
            </div>

            <Button type="submit" isLoading={mutation.isPending} className="mt-2">
              Submit Complaint
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
