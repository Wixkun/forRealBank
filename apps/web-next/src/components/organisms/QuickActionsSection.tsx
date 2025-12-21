'use client';
import { QuickActionButton } from '../molecules/QuickActionButton';

type QuickAction = {
  icon: string;
  label: string;
  variant: 'teal' | 'cyan' | 'gray';
};

type QuickActionsSectionProps = {
  actions: QuickAction[];
};

export function QuickActionsSection({ actions }: QuickActionsSectionProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, idx) => (
        <QuickActionButton
          key={idx}
          icon={action.icon}
          label={action.label}
          variant={action.variant}
        />
      ))}
    </div>
  );
}
