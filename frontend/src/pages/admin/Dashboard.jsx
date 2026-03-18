import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import StatCard from '../../components/common/StatCard'
import { Store, ShoppingBag, DollarSign, Users, TrendingUp, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: dailyOrders } = useQuery({
    queryKey: ['admin-daily-orders'],
    queryFn: () => api.get('/analytics/daily-orders?days=14').then(r => r.data),
  })

  const { data: restaurants } = useQuery({
    queryKey: ['admin-restaurants-recent'],
    queryFn: () => api.get('/admin/restaurants?limit=5').then(r => r.data),
  })

  const { data: orders } = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => api.get('/admin/orders?limit=5').then(r => r.data),
  })

  const fmt = (n) => n?.toLocaleString('en-IN') ?? '—'
  const fmtCur = (n) => n != null ? `₹${n.toLocaleString('en-IN')}` : '—'

  const statusBadge = (s) => {
    const map = { active: 'badge-active', pending_meta: 'badge-pending', inactive: 'badge-inactive', suspended: 'badge-error', onboarding: 'badge-pending' }
    return <span className={map[s] || 'badge-inactive'}>{s?.replace('_', ' ')}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-surface-900">Platform Overview</h2>
        <p className="text-surface-500 text-sm mt-0.5">Real-time metrics across all restaurants</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Restaurants" value={fmt(stats?.totalRestaurants)} icon={Store} color="brand" sub={`${stats?.activeRestaurants ?? 0} active`} />
        <StatCard label="Total Orders" value={fmt(stats?.totalOrders)} icon={ShoppingBag} color="blue" sub={`${stats?.ordersThisMonth ?? 0} this month`} />
        <StatCard label="Platform Revenue" value={fmtCur(stats?.totalRevenue)} icon={DollarSign} color="green" />
        <StatCard label="Restaurant Owners" value={fmt(stats?.totalOwners)} icon={Users} color="purple" sub={`${stats?.pendingRestaurants ?? 0} pending setup`} />
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Orders — Last 14 Days</h3>
        {dailyOrders?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-56 flex items-center justify-center text-surface-400 text-sm">No order data yet</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent Restaurants */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Recent Restaurants</h3>
          <div className="space-y-3">
            {restaurants?.data?.length ? restaurants.data.map(r => (
              <div key={r._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900">{r.name}</p>
                  <p className="text-xs text-surface-400">{r.owner?.name}</p>
                </div>
                {statusBadge(r.status)}
              </div>
            )) : <p className="text-sm text-surface-400">No restaurants yet</p>}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {orders?.data?.length ? orders.data.map(o => (
              <div key={o._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900">{o.orderNumber}</p>
                  <p className="text-xs text-surface-400">{o.restaurant?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-surface-900">₹{o.total}</p>
                  {statusBadge(o.status)}
                </div>
              </div>
            )) : <p className="text-sm text-surface-400">No orders yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
