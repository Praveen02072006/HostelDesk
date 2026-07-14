import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "How do I raise a new complaint?",
    answer: "You can raise a new complaint by navigating to your Dashboard and clicking the 'Raise Complaint' button. Fill in the details such as category, room number, and a brief description, then submit."
  },
  {
    question: "How long does it take for a complaint to be resolved?",
    answer: "Resolution times vary depending on the priority and category. Critical issues like plumbing bursts are addressed immediately, while low-priority issues may take 24-48 hours."
  },
  {
    question: "Can I update my room number?",
    answer: "Yes, you can request a room change through the administration. Once approved, your profile will be updated automatically. You cannot change it yourself to maintain security."
  },
  {
    question: "What should I do if a worker doesn't show up?",
    answer: "If a worker hasn't arrived within the SLA deadline, the complaint is automatically escalated to the supervisor. You can also add a comment to your complaint ticket."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to know about HostelDesk.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:border-indigo-500/50 transition-colors"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="text-indigo-600" />
                ) : (
                  <ChevronDown className="text-slate-400" />
                )}
              </div>
              {openIndex === index && (
                <div className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
