'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';

const adminLinks = [
  { href: '/admin', label: 'Admin Home' },
  { href: '/admin/restaurants', label: 'Restaurants' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/analytics', label: 'Analytics' }
];

const ownerLinks = [
  { href: '/owner', label: 'Dashboard' },
  { href: '/owner/menu', label: 'Menu' },
  { href: '/owner/orders', label: 'Orders' },
  { href: '/owner/settings', label: 'Settings' }
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, logout } = useAuthContext();
  const links = session.role === 'super_admin' ? adminLinks : ownerLinks;

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-xl font-bold mb-8">FoodieHub</h1>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-3 py-2 ${pathname === link.href ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button className="mt-8 w-full rounded-lg bg-slate-800 py-2 text-sm" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}
