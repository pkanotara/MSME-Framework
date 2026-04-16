import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, KeyRound, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const getStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-400' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

export default function PasswordResetModal({ ownerId, ownerName, ownerEmail, onClose }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const strength = getStrength(password)

  const resetPassword = useMutation({
    mutationFn: () => api.post(`/admin/restaurants/${ownerId}/reset-password`, { newPassword: password }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Password reset successfully')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to reset password'),
  })

  const canSubmit = password.length >= 8 && confirmed && !resetPassword.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-orange-500" />
            <h2 className="font-semibold text-zinc-900">Reset Owner Password</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Owner info */}
          <div className="bg-zinc-50 rounded-xl px-4 py-3 text-sm">
            <p className="font-medium text-zinc-900">{ownerName}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{ownerEmail}</p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              This will <strong>immediately invalidate</strong> the owner's current session.
              They will need to log in with the new password. An email notification will be sent to them.
            </p>
          </div>

          {/* New Password */}
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strength.color : 'bg-zinc-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-500">Strength: <span className="font-medium text-zinc-700">{strength.label}</span></p>
              </div>
            )}
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-orange-500"
            />
            <span className="text-xs text-zinc-600 leading-relaxed">
              I understand this will reset the owner's access and they will be logged out of all active sessions.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button
            onClick={() => resetPassword.mutate()}
            disabled={!canSubmit}
            className="btn-primary flex-1 justify-center"
          >
            {resetPassword.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Resetting...</>
              : <><KeyRound size={14} /> Reset Password</>}
          </button>
        </div>
      </div>
    </div>
  )
}
