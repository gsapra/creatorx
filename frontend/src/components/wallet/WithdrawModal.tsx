import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { apiUrl } from '../../config'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  maxAmount: number
  onSuccess: () => void
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  maxAmount,
  onSuccess
}) => {
  const { token } = useAuth()
  const [amount, setAmount] = useState('')
  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    account_name: '',
    bank_name: ''
  })
  const [loading, setLoading] = useState(false)

  const processingFee = Math.max(10, parseFloat(amount || '0') * 0.02)
  const netAmount = parseFloat(amount || '0') - processingFee

  const handleWithdraw = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > maxAmount) {
      toast.error('Amount exceeds available balance')
      return
    }

    if (parseFloat(amount) < 100) {
      toast.error('Minimum withdrawal amount is ₹100')
      return
    }

    if (bankDetails.account_number !== bankDetails.confirm_account_number) {
      toast.error('Account numbers do not match')
      return
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifsc_code.toUpperCase())) {
      toast.error('Invalid IFSC code')
      return
    }

    if (!bankDetails.account_name.trim()) {
      toast.error('Please enter account holder name')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/v1/wallet/payout'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bank_account_number: bankDetails.account_number,
          bank_ifsc_code: bankDetails.ifsc_code.toUpperCase(),
          bank_account_name: bankDetails.account_name,
          bank_name: bankDetails.bank_name
        })
      })

      if (response.ok) {
        toast.success('Withdrawal request submitted successfully!')
        onSuccess()
        onClose()
        // Reset form
        setAmount('')
        setBankDetails({
          account_number: '',
          confirm_account_number: '',
          ifsc_code: '',
          account_name: '',
          bank_name: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to process withdrawal')
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast.error('Failed to process withdrawal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw to Bank Account"
      size="lg"
    >
      <div className="space-y-6">
        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Processing time: 1-2 business days</p>
            <p>A processing fee of 2% (min ₹10) will be deducted from the withdrawal amount.</p>
          </div>
        </div>

        {/* Amount Section */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Withdrawal Amount (INR)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="100"
            max={maxAmount}
            step="0.01"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Available: ₹{maxAmount.toFixed(2)} | Min: ₹100
          </p>
        </div>

        {/* Fee Breakdown */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Withdrawal Amount</span>
              <span className="font-medium">₹{parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Processing Fee</span>
              <span className="font-medium text-red-600">-₹{processingFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-neutral-200 pt-2 flex justify-between">
              <span className="font-semibold">You'll Receive</span>
              <span className="font-semibold text-green-600">₹{netAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Bank Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-neutral-900">Bank Account Details</h4>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Account Holder Name
            </label>
            <Input
              type="text"
              placeholder="As per bank records"
              value={bankDetails.account_name}
              onChange={(e) => setBankDetails({ ...bankDetails, account_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Account Number
            </label>
            <Input
              type="text"
              placeholder="Enter account number"
              value={bankDetails.account_number}
              onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Confirm Account Number
            </label>
            <Input
              type="text"
              placeholder="Re-enter account number"
              value={bankDetails.confirm_account_number}
              onChange={(e) => setBankDetails({ ...bankDetails, confirm_account_number: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              IFSC Code
            </label>
            <Input
              type="text"
              placeholder="e.g., SBIN0001234"
              value={bankDetails.ifsc_code}
              onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bank Name (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., State Bank of India"
              value={bankDetails.bank_name}
              onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleWithdraw} isLoading={loading}>
            Submit Withdrawal Request
          </Button>
        </div>
      </div>
    </Modal>
  )
}
