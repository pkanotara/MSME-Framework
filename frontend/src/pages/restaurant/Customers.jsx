import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Users, Loader2 } from 'lucide-react'

export default function RestaurantCustomers() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['restaurant-customers'],
    queryFn: () => api.get('/restaurant/customers').then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-surface-900">Customers</h2>
        <p className="text-surface-500 text-sm mt-0.5">{customers.length} total customers</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-surface-400" size={24} /></div>
      ) : customers.length === 0 ? (
        <div className="card p-16 text-center text-surface-400">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No customers yet — start taking orders via WhatsApp!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                {['WhatsApp Number', 'Name', 'Total Orders', 'Total Spent', 'Last Order'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-surface-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {customers.map(c => (
                <tr key={c._id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-mono text-xs text-surface-700">{c.whatsappNumber}</td>
                  <td className="px-4 py-3 text-surface-900">{c.name || <span className="text-surface-400 italic">Unknown</span>}</td>
                  <td className="px-4 py-3 font-semibold text-surface-900">{c.totalOrders}</td>
                  <td className="px-4 py-3 font-semibold text-brand-600">₹{c.totalSpent?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-surface-400 text-xs">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
