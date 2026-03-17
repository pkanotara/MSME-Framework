'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function OwnerPage() {
  return (
    <ProtectedLayout allowedRoles={['restaurant_owner', 'manager']}>
      <PageShell title="Restaurant Dashboard">Manage your restaurant profile, menu, orders, and WhatsApp bot settings.</PageShell>
    </ProtectedLayout>
  );
}
