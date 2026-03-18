'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function OwnerSettingsPage() {
  return (
    <ProtectedLayout allowedRoles={['restaurant_owner', 'manager']}>
      <PageShell title="Restaurant Settings">Edit profile, business hours, contact details, and WhatsApp onboarding status.</PageShell>
    </ProtectedLayout>
  );
}
