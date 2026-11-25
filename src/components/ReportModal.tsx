import React, { useState } from 'react';
import { Flag, X, Send } from 'lucide-react';
import { REPORT_REASONS } from '../data/constants';
import { submitFraudReport } from '../firebase';
import type { UserAccount } from '../types';

export interface ReportTarget {
  targetType: 'live_request' | 'job' | 'worker';
  targetId: string;
  targetName: string;
  targetPhone: string;
}

interface ReportModalProps {
  target: ReportTarget | null;
  currentUser: UserAccount | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  target,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    reason: REPORT_REASONS[0],
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitFraudReport({
        targetType: target.targetType,
        targetId: target.targetId,
        targetName: target.targetName,
        targetPhone: target.targetPhone,
        reason: form.reason,
        details: form.details,
        reporterPhone: currentUser?.phone || '0000000000',
        reporterName: currentUser?.name || 'Guest User',
      });
      setForm({ reason: REPORT_REASONS[0], details: '' });
      onSuccess('Your report has been submitted. Thank you!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-rose-50">
          <div className="flex items-center gap-2 text-rose-800">
            <Flag className="w-5 h-5" />
            <h2 id="report-modal-title" className="text-base font-bold">
              Report Fraud / Fake Listing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-rose-700 hover:bg-rose-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="font-semibold text-slate-900">{target.targetName}</span>
            <span className="mx-1.5">·</span>
            <span className="font-mono tabular-nums">{target.targetPhone}</span>
          </div>

          <div>
            <label
              htmlFor="report-reason-select"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Reason for Report
            </label>
            <select
              id="report-reason-select"
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            >
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="report-details-input"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Additional Details (Optional)
            </label>
            <textarea
              id="report-details-input"
              rows={3}
              value={form.details}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, details: e.target.value }))
              }
              placeholder="Describe what happened..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-sm font-bold text-white inline-flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
