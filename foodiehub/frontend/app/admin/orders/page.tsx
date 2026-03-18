'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function AdminOrdersPage() {
  return (
    <ProtectedLayout allowedRoles={['super_admin']}>
      <PageShell title="Global Orders">View and monitor all orders across all onboarded restaurants.</PageShell>
    </ProtectedLayout>
  );
}
