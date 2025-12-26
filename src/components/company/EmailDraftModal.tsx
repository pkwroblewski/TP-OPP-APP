'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Company, TPAssessment } from '@/types/database';

interface EmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  assessment: TPAssessment | null;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '';
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${'\u20AC'}${(absValue / 1000000).toFixed(0)}M+`;
  } else if (absValue >= 1000) {
    return `${'\u20AC'}${(absValue / 1000).toFixed(0)}K`;
  }
  return `${'\u20AC'}${value.toFixed(0)}`;
}

function generateEmailBody(company: Company, assessment: TPAssessment | null): string {
  const icVolume = assessment?.estimated_ic_volume || 0;
  const icVolumeStr = formatCurrency(icVolume);

  const keyPoints: string[] = [];

  if (icVolume > 0) {
    keyPoints.push(`Intercompany financing structure (${icVolumeStr})`);
  }

  if (icVolume > 1000000) {
    keyPoints.push('Documentation requirements under Art. 56bis');
  }

  if (assessment?.has_rate_anomalies) {
    keyPoints.push('Interest rate benchmarking');
  }

  if (assessment?.has_thin_cap_indicators) {
    keyPoints.push('Thin capitalisation considerations');
  }

  if (assessment?.has_ic_services) {
    keyPoints.push('Management fee arrangements');
  }

  const bulletPoints = keyPoints.length > 0
    ? keyPoints.map((p) => `  \u2022 ${p}`).join('\n')
    : '  \u2022 Transfer pricing compliance review\n  \u2022 IC transaction documentation';

  return `Dear [Name],

I am writing regarding ${company.name} (RCS: ${company.rcs_number}). Our analysis of publicly available financial information suggests there may be opportunities to review your transfer pricing arrangements, particularly:

${bulletPoints}

I would welcome the opportunity to discuss how we might assist. Would you be available for a brief call next week?

Best regards,
[Your name]`;
}

export function EmailDraftModal({ isOpen, onClose, company, assessment }: EmailDraftModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const subject = `Transfer Pricing Review - ${company.name}`;
  const emailBody = generateEmailBody(company, assessment);

  const handleCopy = async () => {
    try {
      const fullEmail = `To: ${recipientEmail || '[recipient@email.com]'}
Subject: ${subject}

${emailBody}`;
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#1e3a5f]">
            Generate Outreach Email
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* To Field */}
          <div className="space-y-2">
            <Label htmlFor="email-to" className="text-sm font-medium text-gray-700">
              To:
            </Label>
            <Input
              id="email-to"
              type="email"
              placeholder="recipient@company.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20"
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Subject:
            </Label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-700 border border-gray-200">
              {subject}
            </div>
          </div>

          {/* Email Body */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Message:
            </Label>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {emailBody}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleCopy}
            className={cn(
              'gap-2',
              copied
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#1e3a5f] hover:bg-[#2a4a7f]'
            )}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
