import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { api } from '../../lib/axios';
import { FileSpreadsheet, Download, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState('complaints');

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsExporting(true);
      // Simulate API call for report generation
      // const res = await api.get(`/analytics/export?type=${reportType}`, { responseType: 'blob' });
      // const url = window.URL.createObjectURL(new Blob([res.data]));
      
      await new Promise(r => setTimeout(r, 1500)); // Simulated delay

      toast.success('Report generated successfully. Downloading...');
      
      // Dummy download logic
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `report-${reportType}-${new Date().toISOString()}.csv`);
      // document.body.appendChild(link);
      // link.click();
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="page-header mb-0">
        <h1 className="page-title">Generate Reports</h1>
        <p className="page-subtitle">Export data for auditing, compliance, and offline analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} className="text-indigo-500" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleExport} className="space-y-6">
              <Select
                label="Report Type"
                options={[
                  { label: 'Complaints & Issues', value: 'complaints' },
                  { label: 'Worker Performance', value: 'workers' },
                  { label: 'Inventory Usage', value: 'inventory' },
                  { label: 'SLA Breaches', value: 'sla' },
                ]}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                leftIcon={<FileSpreadsheet size={18} />}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  leftIcon={<Calendar size={18} />}
                />
                <Input
                  label="End Date"
                  type="date"
                  leftIcon={<Calendar size={18} />}
                />
              </div>

              <Select
                label="Hostel (Optional)"
                options={[
                  { label: 'All Hostels', value: 'all' },
                  { label: 'Boys Hostel A', value: 'bha' },
                  { label: 'Girls Hostel B', value: 'ghb' },
                ]}
              />

              <Button 
                type="submit" 
                className="w-full"
                leftIcon={<Download size={18} />}
                isLoading={isExporting}
              >
                Generate & Download CSV
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800">
            <CardContent className="p-6">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 text-lg">Scheduled Reports</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                Automated weekly summary reports are currently sent to management@hosteldesk.com every Monday at 8:00 AM.
              </p>
              <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900">
                Manage Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
