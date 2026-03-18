import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle, ExternalLink, Loader2, Wifi } from 'lucide-react'

const publicApi = axios.create({ baseURL: '/api' })

export default function OnboardPage() {
  const { restaurantId } = useParams()

  const { data: status, isLoading } = useQuery({
    queryKey: ['onboarding-status', restaurantId],
    queryFn: () => publicApi.get(`/onboarding/status/${restaurantId}`).then(r => r.data),
    refetchInterval: 5000,
    enabled: !!restaurantId,
  })

  const { data: linkData, isLoading: linkLoading } = useQuery({
    queryKey: ['signup-link', restaurantId],
    queryFn: () => publicApi.get(`/embedded-signup/link/${restaurantId}`).then(r => r.data),
    enabled: !!restaurantId,
    retry: 1,
    staleTime: 60000,
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <Loader2 className="animate-spin text-orange-500" size={32} />
    </div>
  )

  const isConfigured = status?.whatsapp?.signupStatus === 'configured'
  const targetNumber = status?.whatsapp?.targetBusinessNumber || linkData?.targetBusinessNumber

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
            <Wifi size={32} className="text-white" />
          </div>
          <h1 className="font-bold text-2xl text-zinc-900">Connect Your WhatsApp Business</h1>
          <p className="text-zinc-500 mt-2">One last step to activate {status?.restaurantName}</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          {isConfigured ? (
            <div className="text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">All Set!</h2>
              <p className="text-zinc-500 text-sm">Your WhatsApp Business is configured and your chatbot is live.</p>
            </div>
          ) : (
            <div>
              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">Log into Facebook</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Use the account linked to your business</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">Select/Create Business Account</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Choose your Meta Business Account</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">3</div>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">Verify your WhatsApp number</p>
                    <p className="text-zinc-500 text-xs mt-0.5">We will set up: {targetNumber || '...'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">4</div>
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">Grant permissions</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Allow FoodieHub to manage messaging</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <p className="text-amber-700 text-xs">
                  You must complete this step yourself. Meta requires the business owner to authenticate and verify the phone number. After you finish, everything else is automatic.
                </p>
              </div>

              {linkData && linkData.signupUrl ? (
                <a
                  href={linkData.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors text-base"
                >
                  <ExternalLink size={18} />
                  Start WhatsApp Business Setup
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 w-full py-3 bg-orange-300 text-white font-medium rounded-lg cursor-not-allowed"
                >
                  <Loader2 size={18} className="animate-spin" />
                  {linkLoading ? 'Loading setup link...' : 'Setup link unavailable'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}