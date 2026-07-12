import { Suspense } from 'react';
import { SettingsPage } from '@/features/settings/SettingsPage';

export default function DashboardSettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  );
}
