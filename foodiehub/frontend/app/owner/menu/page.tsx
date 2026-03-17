'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function OwnerMenuPage() {
  return (
    <ProtectedLayout allowedRoles={['restaurant_owner', 'manager']}>
      <PageShell title="My Menu">Create categories, add items, manage availability, and update prices.</PageShell>
    </ProtectedLayout>
  );
}
