import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { apiUrl } from '../../config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface AddMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, token } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)

  const quickAmounts = [100, 500, 1000, 2000, 5000]

  const markTransactionFailed = async (_orderId: string) => {
    try {
      // The webhook will handle marking as failed, but we can trigger cleanup
      await fetch(apiUrl('/api/v1/wallet/cleanup-pending'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Failed to cleanup:', error)
    }
  }

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create order
      const orderResponse = await fetch(apiUrl('/api/v1/wallet/topup'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(amount), currency: 'INR' })
      })

      if (!orderResponse.ok) throw new Error('Failed to create order')

      const orderData = await orderResponse.json()
      setCurrentOrderId(orderData.order_id)

      // Step 2: Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)

        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'CreatorX',
        description: 'Wallet Top-up',
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            // Step 4: Verify payment
            const verifyResponse = await fetch(apiUrl('/api/v1/wallet/verify-payment'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            if (verifyResponse.ok) {
              toast.success('✅ Payment successful! Wallet credited.')
              setCurrentOrderId(null)
              onSuccess()
              onClose()
              setAmount('')
            } else {
              const errorData = await verifyResponse.json()
              toast.error(`❌ Payment verification failed: ${errorData.detail || 'Unknown error'}`)
              await markTransactionFailed(response.razorpay_order_id)
              onSuccess() // Refresh to show failed status
            }
          } catch (error) {
            toast.error('Payment verification failed')
          }
        },
        prefill: {
          name: user?.full_name || user?.username,
          email: user?.email
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: async () => {
            setLoading(false)
            if (currentOrderId) {
              await markTransactionFailed(currentOrderId)
              onSuccess() // Refresh transaction list to show failed status
            }
            toast.error('Payment cancelled')
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment')
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Money to Wallet"
      size="md"
    >
      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Enter Amount (INR)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <p className="text-sm text-neutral-600 mb-2">Quick Select</p>
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="px-3 py-2 border border-neutral-300 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition text-sm font-medium"
              >
                ₹{quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddMoney} isLoading={loading}>
            Proceed to Pay
          </Button>
        </div>
      </div>
    </Modal>
  )
}
