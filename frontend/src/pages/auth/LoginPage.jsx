import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ChefHat, Eye, EyeOff, Loader2, ShieldCheck, Store } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: 'restaurant_owner' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password, form.role)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(user.role === 'super_admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-zinc-100 via-white to-orange-50 px-4 py-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1380px] overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_20px_80px_rgba(0,0,0,0.07)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">

        {/* Left Section */}
        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-orange-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.20),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.05),_transparent_22%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between px-10 py-9 xl:px-12 xl:py-10">
            <div>
              <div className="inline-flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 shadow-lg backdrop-blur-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-[0_12px_30px_rgba(249,115,22,0.35)]">
                  <ChefHat size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-[2.1rem] font-semibold leading-none tracking-tight text-white">
                    FoodieHub
                  </h1>
                  <p className="mt-1 text-base text-zinc-300">
                    WhatsApp Restaurant Platform
                  </p>
                </div>
              </div>

              <div className="mt-16 max-w-[580px]">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-300">
                  Business onboarding
                </p>

                <h2 className="mt-6 text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-[4.25rem]">
                  Manage restaurant operations with a modern login experience.
                </h2>

                <p className="mt-6 max-w-[520px] text-lg leading-8 text-zinc-300">
                  Secure access for restaurant owners and platform administrators to manage
                  onboarding, automation, WhatsApp integrations, and daily operations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                  <Store size={18} />
                </div>
                <h3 className="text-base font-semibold text-white">Restaurant Access</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  Dedicated workspace for each restaurant owner and their operations.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-base font-semibold text-white">Admin Control</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  Centralized platform management with secure role-based authentication.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-center bg-white/55 px-4 py-5 sm:px-6 lg:px-8">
          <div className="w-full max-w-[520px]">

            {/* Mobile Header */}
            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
                <ChefHat size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">FoodieHub</h1>
              <p className="mt-1 text-sm text-zinc-500">WhatsApp Restaurant Platform</p>
            </div>

            <div className="rounded-[30px] border border-zinc-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-7 lg:p-8">
              <div className="mb-6">
                <p className="text-sm font-medium text-orange-600">Welcome back</p>
                <h2 className="mt-2 text-[2.15rem] font-bold leading-tight tracking-tight text-zinc-900">
                  Sign in to your account
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-zinc-500">
                  Access your dashboard and manage your restaurant or platform settings.
                </p>
              </div>

              {/* Role Selector */}
              <div className="mb-6">
                <div className="relative grid grid-cols-2 rounded-2xl bg-zinc-100 p-1.5">
                  <div
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-sm ring-1 ring-orange-200 transition-all duration-300 ease-out ${
                      form.role === 'restaurant_owner'
                        ? 'left-1.5'
                        : 'left-[calc(50%+4px)]'
                    }`}
                  />

                  {[
                    { value: 'restaurant_owner', label: 'Restaurant Owner', icon: Store },
                    { value: 'super_admin', label: 'Platform Admin', icon: ShieldCheck },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: value }))}
                      className={`relative z-10 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ${
                        form.role === value
                          ? 'text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={`transition-all duration-300 ${
                          form.role === value ? 'text-orange-500 scale-105' : 'text-zinc-400'
                        }`}
                      />
                      <span className="whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    placeholder="you@restaurant.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 hover:shadow-lg active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 size={17} className="animate-spin" />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Compact Demo Credentials */}
              <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
                    Demo credentials
                  </p>
                  <div className="hidden h-px flex-1 bg-orange-100 sm:block" />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-3">
                    <p className="text-xs font-semibold text-zinc-800">Restaurant Owner</p>
                    <p className="mt-2 text-xs leading-6 text-zinc-600">
                      <span className="font-medium text-zinc-900">Email:</span> demo@spicegarden.com
                    </p>
                    <p className="text-xs leading-6 text-zinc-600">
                      <span className="font-medium text-zinc-900">Password:</span> Demo@1234!
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-white/90 p-3">
                    <p className="text-xs font-semibold text-zinc-800">Platform Admin</p>
                    <p className="mt-2 text-xs leading-6 text-zinc-600">
                      <span className="font-medium text-zinc-900">Email:</span> admin@foodiehub.com
                    </p>
                    <p className="text-xs leading-6 text-zinc-600">
                      <span className="font-medium text-zinc-900">Password:</span> Admin@1234!
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}