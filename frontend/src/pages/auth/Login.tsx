import React, { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Building2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logo from '../../assests/logo.png';

const loginSchema = z.object({
  email: z.string().min(1, 'Email address or Student ID is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useRHForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const res: any = await api.post('/auth/login', data);
      
      const { user, accessToken } = res.data;
      setAuth(user, accessToken);
      toast.success('Login successful!');
      
      // Navigate to respective dashboard
      switch (user.role) {
        case 'STUDENT': navigate('/student/dashboard'); break;
        case 'WORKER': navigate('/worker/dashboard'); break;
        case 'ADMIN': navigate('/admin/dashboard'); break;
        case 'SUPERVISOR': navigate('/supervisor/dashboard'); break;
        case 'MANAGEMENT': navigate('/management/dashboard'); break;
        default: navigate('/');
      }
    } catch (error: any) {
      // Error handled by axios interceptor or specific component logic
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-brand opacity-90 mix-blend-multiply"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 h-full text-white">
          <div className="flex items-start">
            <img src={logo} alt="HostelDesk" className="h-24 md:h-32 w-auto object-contain" />
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Smart Hostel Management, Simplified.
            </h1>
            <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">
              Replace outdated WhatsApp groups with a professional digital system. Track complaints, manage maintenance, and improve resident satisfaction.
            </p>
          </div>

          <div className="text-sm text-indigo-200">
            &copy; {new Date().getFullYear()} HostelDesk Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:w-[400px]"
        >
          <div className="mb-10 lg:hidden flex justify-center">
            <img src={logo} alt="HostelDesk" className="h-20 sm:h-24 w-auto object-contain" />
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Please sign in to your account
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email address or Student ID"
                type="text"
                autoComplete="username"
                placeholder="name@example.com or SEC24CS001"
                leftIcon={<Mail size={18} />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900"
                    {...register('rememberMe')}
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Remember me
                  </label>
                </div>

                <div className="text-sm leading-6">
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </form>
          </div>
          
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Demo credentials:</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">admin1@hosteldesk.com</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">student1@hosteldesk.com</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">worker1@hosteldesk.com</span>
              <span className="w-full mt-1">Password: <strong>Password123</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
