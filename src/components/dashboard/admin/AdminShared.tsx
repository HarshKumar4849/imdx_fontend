import type { ReactNode } from 'react';
import type { ApplicationReviewStatus } from '../../../types/dashboard';
import { ActivityPulseIcon } from '../../icons/ImdxIcons';

export type BadgeTone = ApplicationReviewStatus | 'Active' | 'Suspended' | 'Pending' | 'Inactive' | 'Failed' | 'Provisioning' | 'Live';

export interface VerificationRecord {
  id: string;
  type: 'Event Hash' | 'Date Range';
  requestedBy: string;
  timestamp: string;
  recordsChecked: number;
  result: 'Verified' | 'Failed';
  summary: string;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isGreen =
    normalized === 'approved' ||
    normalized === 'active' ||
    normalized === 'live' ||
    normalized === 'verified' ||
    normalized === 'published' ||
    normalized === 'healthy' ||
    normalized === 'operational';
  const isRed =
    normalized === 'changes requested' ||
    normalized === 'suspended' ||
    normalized === 'rejected' ||
    normalized === 'failed' ||
    normalized === 'setup_failed' ||
    normalized === 'degraded';
  const isNeutral = normalized === 'inactive' || normalized === 'paused' || normalized === 'draft';

  const styles = isGreen
    ? 'bg-[#dcfce7] text-[#15803d]'
    : isRed
      ? 'bg-[#fee2e2] text-[#dc2626]'
      : isNeutral
        ? 'bg-[#f1f5f9] text-[#475569]'
        : 'bg-[#fef3c7] text-[#b45309]';

  const dotColor = isGreen
    ? 'bg-[#16a34a]'
    : isRed
      ? 'bg-[#dc2626]'
      : isNeutral
        ? 'bg-[#64748b]'
        : 'bg-[#d97706]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${styles}`}
    >
      <span className={`size-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

interface AdminKpiCardProps {
  label: string;
  value: string | number;
  subtext: string;
  index: number;
  boxBg?: string;
  iconColor?: string;
  dotColor?: string;
  icon?: ReactNode;
}

export function AdminKpiCard({
  label,
  value,
  subtext,
  index,
  boxBg = 'bg-[#e9fffa]',
  iconColor = 'text-[#059669]',
  icon,
}: AdminKpiCardProps) {
  return (
    <div
      style={{ ['--stagger-i' as string]: index }}
      className="imdx-stagger-card imdx-card-interactive rounded-[12px] px-4 py-3.5 flex items-start justify-between gap-3"
    >
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-[#64748b] truncate">{label}</p>
        <p className="mt-1 text-[22px] font-bold leading-tight imdx-gradient-text">{value}</p>
        <p className="mt-1 text-[11.5px] text-[#94a3b8] truncate">{subtext}</p>
      </div>
      <div
        className={`h-[36px] w-[36px] rounded-[9px] shrink-0 flex items-center justify-center ${boxBg} ${iconColor}`}
      >
        {icon ?? <ActivityPulseIcon size={16} />}
      </div>
    </div>
  );
}
