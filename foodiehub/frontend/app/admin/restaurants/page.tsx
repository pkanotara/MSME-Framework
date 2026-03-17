'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function AdminRestaurantsPage() {
  return (
    <ProtectedLayout allowedRoles={['super_admin']}>
      <PageShell title="All Restaurants">Search/filter all restaurants, activate/deactivate accounts, and inspect WhatsApp configuration.</PageShell>
    </ProtectedLayout>
  );
}
