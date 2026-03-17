'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/menu', label: 'Menu' },
  { href: '/orders', label: 'Orders' },
  { href: '/logs', label: 'Logs' }
];

export function Sidebar() {
  const pathname = usePathname();

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
    </aside>
  );
}
