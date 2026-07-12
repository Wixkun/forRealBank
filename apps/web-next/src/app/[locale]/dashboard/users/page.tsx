import { Suspense } from 'react';
import { UsersPage } from '@/features/users/components/UsersPage';

export default function DashboardUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersPage />
    </Suspense>
  );
}
