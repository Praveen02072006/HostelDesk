import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      <div className="max-w-md w-full text-center z-10 animate-fade-in-up">
        <h1 className="text-[120px] font-extrabold text-transparent bg-clip-text bg-gradient-brand leading-none mb-4 select-none">
          404
        </h1>
        
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Page not found
        </h2>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft size={18} />}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>
          <Link to="/">
            <Button 
              variant="primary" 
              leftIcon={<Home size={18} />}
              className="w-full sm:w-auto"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
