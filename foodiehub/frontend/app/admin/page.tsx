'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function AdminPage() {
  return (
    <ProtectedLayout allowedRoles={['super_admin']}>
      <PageShell title="Super Admin Dashboard">Manage all restaurants, onboarding statuses, bots, orders, and analytics.</PageShell>
    </ProtectedLayout>
  );
}
