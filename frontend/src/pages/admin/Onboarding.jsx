import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Loader2, UserCheck } from 'lucide-react'

export default function AdminOnboarding() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-sessions', status, page],
    queryFn: () => api.get('/onboarding/sessions', { params: { status, page, limit: 20 } }).then(r => r.data),
    keepPreviousData: true,
  })

  const statusColors = { in_progress: 'badge-pending', completed: 'badge-active', abandoned: 'badge-error' }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-surface-900">Onboarding Sessions</h2>
        <p className="text-surface-500 text-sm mt-0.5">Track restaurant owner onboarding via WhatsApp bot</p>
      </div>

      <div className="flex gap-3">
        <select className="input w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Sessions</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              {['Sender Number', 'Current Step', 'Restaurant', 'Owner', 'Status', 'Last Activity'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-surface-400" size={24} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-surface-400">
                <UserCheck size={32} className="mx-auto mb-2 opacity-30" />
                No onboarding sessions yet
              </td></tr>
            ) : data?.data?.map(s => (
              <tr key={s._id} className="hover:bg-surface-50">
                <td className="px-4 py-3 font-mono text-xs text-surface-700">{s.senderNumber}</td>
                <td className="px-4 py-3">
                  <span className="bg-surface-100 text-surface-600 px-2 py-0.5 rounded text-xs font-mono">
                    {s.step}
                  </span>
                </td>
                <td className="px-4 py-3 text-surface-900">{s.restaurant?.name || s.data?.restaurantName || '—'}</td>
                <td className="px-4 py-3 text-surface-600">{s.owner?.name || s.data?.ownerName || '—'}</td>
                <td className="px-4 py-3">
                  <span className={statusColors[s.status] || 'badge-inactive'}>{s.status?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-surface-400 text-xs">
                  {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.meta?.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-surface-100 flex items-center justify-between text-sm">
            <p className="text-surface-500">Page {page} of {data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn-secondary py-1 px-3">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page>=data.meta.totalPages} className="btn-secondary py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
