'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export function ProtectedLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { session } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!session.token) router.replace('/login');
    else if (session.role && !allowedRoles.includes(session.role)) router.replace('/login');
  }, [session, router, allowedRoles]);

  return <>{children}</>;
}
