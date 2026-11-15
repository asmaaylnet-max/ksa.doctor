import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  body,
  action
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
        <Icon size={26} />
      </span>
      <h2 className="mt-4 text-lg font-extrabold">{title}</h2>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
