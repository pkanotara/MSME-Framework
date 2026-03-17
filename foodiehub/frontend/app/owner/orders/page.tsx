'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function OwnerOrdersPage() {
  return (
    <ProtectedLayout allowedRoles={['restaurant_owner', 'manager']}>
      <PageShell title="My Orders">Receive and update incoming order statuses for your restaurant.</PageShell>
    </ProtectedLayout>
  );
}
