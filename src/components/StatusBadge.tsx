import { CheckCircle2, Clock3, PauseCircle, AlertCircle } from 'lucide-react';
import type { UserStatus } from '../../shared/types';
import { useI18n } from '../i18n';

export function StatusBadge({ status, className = '' }: { status: UserStatus; className?: string }) {
  const { t } = useI18n();
  const config = {
    approved: { label: t('common.approved'), cls: 'badge-ok', Icon: CheckCircle2 },
    pending: { label: t('common.pending'), cls: 'badge-warn', Icon: Clock3 },
    rejected: { label: t('common.rejected'), cls: 'badge-danger', Icon: AlertCircle },
    suspended: { label: t('common.suspended'), cls: 'badge-danger', Icon: PauseCircle }
  }[status];
  const Icon = config.Icon;
  return (
    <span className={`badge ${config.cls} ${className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}
