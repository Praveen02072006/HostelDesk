import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Mail, Phone, MessageSquare, Book } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function HelpCenter() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0">
        <h1 className="page-title">Help Center</h1>
        <p className="page-subtitle">We're here to help you with any issues you might face.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <Book size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Guides & Manuals</h3>
            <p className="text-sm text-slate-500 mb-4">Learn how to use HostelDesk effectively.</p>
            <Button variant="outline" className="w-full">Read Guides</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Live Chat</h3>
            <p className="text-sm text-slate-500 mb-4">Chat with our support team in real-time.</p>
            <Button variant="outline" className="w-full">Start Chat</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4">
              <Phone size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Phone Support</h3>
            <p className="text-sm text-slate-500 mb-4">Call us directly for urgent matters.</p>
            <Button variant="outline" className="w-full">Call Us</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Email Support</h3>
            <p className="text-sm text-slate-500 mb-4">Send us an email and we'll reply soon.</p>
            <Button variant="outline" className="w-full">Email Us</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input type="text" className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Your Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500" placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <input type="text" className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500" placeholder="What do you need help with?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
              <textarea rows={4} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe your issue..."></textarea>
            </div>
            <Button type="button">Send Message</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
