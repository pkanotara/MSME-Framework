'use client';

import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { PageShell } from '@/components/PageShell';

export default function AdminAnalyticsPage() {
  return (
    <ProtectedLayout allowedRoles={['super_admin']}>
      <PageShell title="Platform Analytics">Track total restaurants, orders, revenue, and chatbot operations.</PageShell>
    </ProtectedLayout>
  );
}
