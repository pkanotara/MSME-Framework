import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Loader2, ChevronDown, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['pending','confirmed','preparing','ready','delivered','cancelled']
const STATUS_COLORS = { pending:'badge-pending', confirmed:'badge-active', preparing:'badge-pending', ready:'badge-active', delivered:'badge-active', cancelled:'badge-error' }
const NEXT_STATUS = { pending:'confirmed', confirmed:'preparing', preparing:'ready', ready:'delivered' }

export default function RestaurantOrders() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-orders', status, page],
    queryFn: () => api.get('/restaurant/orders', { params: { status, page, limit: 20 } }).then(r => r.data),
    refetchInterval: 15000,
    keepPreviousData: true,
  })

  const updateStatus = useMutation({
    mutationFn: ({ orderId, newStatus }) => api.patch(`/restaurant/orders/${orderId}/status`, { status: newStatus }),
    onSuccess: () => { qc.invalidateQueries(['restaurant-orders']); qc.invalidateQueries(['restaurant-stats']); toast.success('Order status updated') },
    onError: () => toast.error('Failed to update order status'),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-surface-900">Orders</h2>
        <p className="text-surface-500 text-sm mt-0.5">{data?.meta?.total ?? 0} total orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => { setStatus(''); setPage(1) }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${!status ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
          All
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap capitalize ${status === s ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-surface-400" size={24} /></div>
      ) : data?.data?.length === 0 ? (
        <div className="card p-16 text-center text-surface-400">
          <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No orders {status ? `with status "${status}"` : 'yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map(order => (
            <div key={order._id} className="card overflow-hidden">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-50 transition-colors"
                onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-surface-900">{order.orderNumber}</p>
                    <span className={STATUS_COLORS[order.status] || 'badge-inactive'}>{order.status}</span>
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">{order.customerNumber} · {order.items?.length} items · {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-surface-900">₹{order.total}</p>
                  <p className="text-xs text-surface-400">{order.paymentMethod?.replace('_',' ')}</p>
                </div>
                <ChevronDown size={16} className={`text-surface-400 transition-transform ${expandedId === order._id ? 'rotate-180' : ''}`} />
              </div>

              {expandedId === order._id && (
                <div className="border-t border-surface-100 p-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-2">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-surface-700">{item.name} <span className="text-surface-400">×{item.quantity}</span></span>
                        <span className="font-medium text-surface-900">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-surface-100 flex justify-between font-semibold">
                      <span>Total</span><span>₹{order.total}</span>
                    </div>
                  </div>

                  {/* Status Actions */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="flex gap-2 flex-wrap">
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => updateStatus.mutate({ orderId: order._id, newStatus: NEXT_STATUS[order.status] })}
                          disabled={updateStatus.isPending}
                          className="btn-primary">
                          {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                          Mark as {NEXT_STATUS[order.status]}
                        </button>
                      )}
                      {order.status !== 'cancelled' && (
                        <button
                          onClick={() => { if(confirm('Cancel this order?')) updateStatus.mutate({ orderId: order._id, newStatus: 'cancelled' }) }}
                          className="btn-danger">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}

                  {/* Status History */}
                  {order.statusHistory?.length > 0 && (
                    <div className="text-xs text-surface-400 space-y-1">
                      <p className="font-medium text-surface-500">History:</p>
                      {order.statusHistory.map((h, i) => (
                        <p key={i}>{h.status} — {new Date(h.changedAt).toLocaleString()}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data?.meta?.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm pt-2">
          <p className="text-surface-500">Page {page} of {data.meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn-secondary py-1 px-3">Prev</button>
            <button onClick={() => setPage(p => p+1)} disabled={page>=data.meta.totalPages} className="btn-secondary py-1 px-3">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
