import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';

export default function Terms() {
  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto">
      <div className="page-header mb-0">
        <h1 className="page-title">Terms of Service</h1>
        <p className="page-subtitle">Last updated: October 2023</p>
      </div>

      <Card>
        <CardContent className="p-8 prose dark:prose-invert max-w-none">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing or using the HostelDesk service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h3>2. User Accounts</h3>
          <p>
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
          </p>

          <h3>3. Acceptable Use</h3>
          <p>
            You agree not to use the service in any way that causes, or may cause, damage to the service or impairment of the availability or accessibility of the service.
          </p>

          <h3>4. Termination</h3>
          <p>
            We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h3>5. Changes</h3>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
