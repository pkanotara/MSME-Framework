import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Loader2, Search } from 'lucide-react'

const STATUS_COLORS = { pending:'badge-pending', confirmed:'badge-active', preparing:'badge-pending', ready:'badge-active', delivered:'badge-active', cancelled:'badge-error' }

export default function AdminOrders() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => api.get('/admin/orders', { params: { status, page, limit: 25 } }).then(r => r.data),
    keepPreviousData: true,
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-surface-900">All Orders</h2>
        <p className="text-surface-500 text-sm mt-0.5">{data?.meta?.total ?? 0} total orders across all restaurants</p>
      </div>

      <div className="flex gap-3">
        <select className="input w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['pending','confirmed','preparing','ready','delivered','cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                {['Order #', 'Restaurant', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-surface-400" size={24} /></td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-surface-400">No orders found</td></tr>
              ) : data?.data?.map(o => (
                <tr key={o._id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-mono text-xs text-surface-700">{o.orderNumber}</td>
                  <td className="px-4 py-3 font-medium text-surface-900">{o.restaurant?.name}</td>
                  <td className="px-4 py-3 text-surface-600 font-mono text-xs">{o.customerNumber}</td>
                  <td className="px-4 py-3 text-surface-600">{o.items?.length}</td>
                  <td className="px-4 py-3 font-semibold text-surface-900">₹{o.total}</td>
                  <td className="px-4 py-3 text-surface-500 text-xs">{o.paymentMethod?.replace('_',' ')}</td>
                  <td className="px-4 py-3"><span className={STATUS_COLORS[o.status] || 'badge-inactive'}>{o.status}</span></td>
                  <td className="px-4 py-3 text-surface-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.meta?.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-surface-100 flex items-center justify-between text-sm">
            <p className="text-surface-500">Page {data.meta.page} of {data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary py-1 px-3">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={!data.meta.hasNext} className="btn-secondary py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
