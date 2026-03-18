import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import { Megaphone, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminBroadcast() {
  const [message, setMessage] = useState('')
  const [restaurantId, setRestaurantId] = useState('')

  const send = useMutation({
    mutationFn: () => api.post('/admin/broadcast', { message, restaurantId: restaurantId || undefined }),
    onSuccess: (res) => {
      toast.success(res.data.message)
      setMessage('')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Broadcast failed'),
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-surface-900">Broadcast Message</h2>
        <p className="text-surface-500 text-sm mt-0.5">Send a WhatsApp message to all restaurant owners</p>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl border border-brand-100">
          <Megaphone size={20} className="text-brand-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-surface-900">Platform Broadcast</p>
            <p className="text-xs text-surface-500">Messages will be sent via the main FoodieHub WhatsApp bot</p>
          </div>
        </div>

        <div>
          <label className="label">Target (optional)</label>
          <input className="input" placeholder="Restaurant ID (leave blank for all owners)"
            value={restaurantId} onChange={e => setRestaurantId(e.target.value)} />
          <p className="text-xs text-surface-400 mt-1">Leave blank to send to all restaurant owners</p>
        </div>

        <div>
          <label className="label">Message</label>
          <textarea className="input min-h-[140px] resize-none"
            placeholder="Type your announcement here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <p className="text-xs text-surface-400 mt-1">{message.length} characters</p>
        </div>

        {message && (
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-4">
            <p className="text-xs font-medium text-surface-500 mb-2">Preview (WhatsApp format):</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-xs">
              <p className="text-xs font-semibold text-green-800 mb-1">📢 FoodieHub Update</p>
              <p className="text-xs text-surface-700 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => send.mutate()}
          disabled={!message.trim() || send.isPending}
          className="btn-primary"
        >
          {send.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {send.isPending ? 'Sending...' : 'Send Broadcast'}
        </button>
      </div>
    </div>
  )
}
