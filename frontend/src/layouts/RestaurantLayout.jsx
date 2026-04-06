import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  Users, MessageCircle, UserCircle, LogOut, ChefHat, Copy
} from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/dashboard/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/dashboard/customers', icon: Users, label: 'Customers' },
  { to: '/dashboard/whatsapp', icon: MessageCircle, label: 'WhatsApp Setup' },
  { to: '/dashboard/profile', icon: UserCircle, label: 'Restaurant Profile' },
]

export default function RestaurantLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: profile } = useQuery({
    queryKey: ['restaurant-profile'],
    queryFn: () => api.get('/restaurant/profile').then(r => r.data),
    staleTime: 60000,
  })

  const restaurantName = profile?.name || 'My Restaurant'
  const restaurantId = profile?._id

  const copyRestaurantId = () => {
    if (restaurantId) {
      navigator.clipboard.writeText(restaurantId)
      toast.success('Restaurant ID copied!')
    }
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        {/* Brand — shows restaurant name */}
        <div className="px-5 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            {profile?.logoUrl
              ? <img src={profile.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover shrink-0" />
              : <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{restaurantName[0]}</span>
                </div>
            }
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 text-sm leading-tight truncate">{restaurantName}</p>
              <p className="text-zinc-400 text-xs">Restaurant Panel</p>
            </div>
          </div>
          {/* Restaurant ID */}
          {restaurantId && (
            <button
              onClick={copyRestaurantId}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Restaurant ID</p>
                <p className="font-mono text-xs text-zinc-600 truncate">{restaurantId}</p>
              </div>
              <Copy size={11} className="text-zinc-400 group-hover:text-orange-500 shrink-0 ml-2 transition-colors" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-600 border border-orange-100'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`
            }>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-900 text-xs font-medium truncate">{user?.name}</p>
              <p className="text-zinc-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            className="flex items-center gap-2 text-zinc-400 hover:text-red-500 text-xs transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header shows restaurant name */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 shrink-0 flex items-center justify-between">
          <div>
            <p className="font-semibold text-zinc-900 text-base">{restaurantName}</p>
            <p className="text-zinc-400 text-xs">Powered by ChatServe</p>
          </div>
          {profile?.whatsappConfig?.botEnabled && (
            <span className="badge-active">● Bot Live</span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}