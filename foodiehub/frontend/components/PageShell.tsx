import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold mb-6">{title}</h2>
        <section className="rounded-xl bg-white p-6 shadow-sm">{children}</section>
      </main>
    </div>
  );
}
