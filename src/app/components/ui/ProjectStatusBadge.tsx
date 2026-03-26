import React from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export function ProjectStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'On Progress': 'bg-primary/10 text-primary border-primary/20',
    Completed: 'bg-green-50 text-green-700 border-green-100',
    Delayed: 'bg-red-50 text-red-700 border-red-100',
  };

  const Icon: React.ComponentType<{ size?: number }> =
    ({
      'On Progress': Clock,
      Completed: CheckCircle2,
      Delayed: AlertTriangle,
    } as Record<string, React.ComponentType<{ size?: number }>>)[status] ?? Clock;

  return (
    <span
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        styles[status] ?? 'bg-gray-50 text-gray-700 border-gray-100'
      }`}
    >
      <Icon size={14} />
      {status}
    </span>
  );
}

