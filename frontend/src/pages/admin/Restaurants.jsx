import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Search, ChevronRight, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  active: 'badge-active',
  pending_meta: 'badge-pending',
  onboarding: 'badge-pending',
  inactive: 'badge-inactive',
  suspended: 'badge-error',
}

export default function AdminRestaurants() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants', search, statusFilter, page],
    queryFn: () => api.get('/admin/restaurants', {
      params: { search, status: statusFilter, page, limit: 20 }
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, newStatus }) => api.patch(`/admin/restaurants/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-restaurants'])
      toast.success('Restaurant status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-surface-900">Restaurants</h2>
          <p className="text-surface-500 text-sm mt-0.5">{data?.meta?.total ?? 0} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            className="input pl-9"
            placeholder="Search restaurants..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending_meta">Pending Meta</option>
          <option value="onboarding">Onboarding</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">Restaurant</th>
                <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">WhatsApp</th>
                <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">Bot</th>
                <th className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-surface-400">
                  <Loader2 className="animate-spin mx-auto" size={24} />
                </td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-surface-400">No restaurants found</td></tr>
              ) : data?.data?.map(r => (
                <tr key={r._id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.logoUrl
                        ? <img src={r.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        : <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold text-sm">{r.name[0]}</div>
                      }
                      <div>
                        <p className="font-medium text-surface-900">{r.name}</p>
                        <p className="text-xs text-surface-400 truncate max-w-xs">{r.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-surface-900">{r.owner?.name}</p>
                    <p className="text-xs text-surface-400">{r.owner?.whatsappNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-surface-600">{r.whatsappConfig?.targetBusinessNumber || '—'}</p>
                    <p className="text-xs text-surface-400">{r.whatsappConfig?.signupStatus?.replace('_', ' ') || 'not configured'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_COLORS[r.status] || 'badge-inactive'}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.whatsappConfig?.botEnabled
                      ? <span className="badge-active">● Live</span>
                      : <span className="badge-inactive">○ Off</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus.mutate({
                          id: r._id,
                          newStatus: r.status === 'active' ? 'inactive' : 'active'
                        })}
                        disabled={toggleStatus.isPending}
                        className="text-xs text-surface-500 hover:text-brand-600 transition-colors"
                      >
                        {r.status === 'active' ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <Link to={`/admin/restaurants/${r._id}`}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                        View <ChevronRight size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-surface-100 flex items-center justify-between text-sm">
            <p className="text-surface-500">Page {data.meta.page} of {data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!data.meta.hasNext} className="btn-secondary py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
