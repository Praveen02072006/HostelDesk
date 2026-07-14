import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';

export default function Privacy() {
  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto">
      <div className="page-header mb-0">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">Last updated: October 2023</p>
      </div>

      <Card>
        <CardContent className="p-8 prose dark:prose-invert max-w-none">
          <h3>1. Information We Collect</h3>
          <p>
            We collect information you provide directly to us, such as your name, email address, phone number, and hostel room details when you register for an account.
          </p>

          <h3>2. How We Use Your Information</h3>
          <p>
            We use the information we collect to provide, maintain, and improve our services, to process transactions, to send you related information, including confirmations and receipts.
          </p>

          <h3>3. Information Sharing</h3>
          <p>
            We do not share your personal information with third parties except as described in this privacy policy or as required by law.
          </p>

          <h3>4. Data Security</h3>
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
          </p>

          <h3>5. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@hosteldesk.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
