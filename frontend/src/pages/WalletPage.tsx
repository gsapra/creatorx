import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { apiUrl } from '../config'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { AddMoneyModal } from '../components/wallet/AddMoneyModal'
import { WithdrawModal } from '../components/wallet/WithdrawModal'

interface WalletData {
  id: number
  user_id: number
  balance: number
  currency: string
}

interface Transaction {
  id: number
  type: string
  amount: number
  status: string
  description: string
  created_at: string
  completed_at: string | null
}

export default function WalletPage() {
  const { user, token } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  useEffect(() => {
    loadWalletData()
    loadTransactions()
    cleanupPendingTransactions()
  }, [])

  const cleanupPendingTransactions = async () => {
    try {
      await fetch(apiUrl('/api/v1/wallet/cleanup-pending'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  const loadWalletData = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/wallet/balance'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setWallet(data)
      }
    } catch (error) {
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/wallet/transactions'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Failed to load transactions')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={20} />
      case 'pending': return <Clock className="text-yellow-500" size={20} />
      case 'failed': return <XCircle className="text-red-500" size={20} />
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <Wallet className="text-indigo-600" size={32} />
            My Wallet
          </h1>
          <p className="text-neutral-600 mt-1">Manage your payments and earnings</p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm mb-2">Available Balance</p>
              <h2 className="text-4xl font-bold">
                ₹{wallet?.balance.toFixed(2) || '0.00'}
              </h2>
            </div>
            <Wallet size={64} className="opacity-20" />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setShowAddMoneyModal(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowUpCircle size={18} />
              Add Money
            </button>

            {user?.role === 'creator' && (
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <ArrowDownCircle size={18} />
                Withdraw
              </button>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">Transaction History</h3>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-medium text-neutral-900">{transaction.description}</p>
                      <p className="text-sm text-neutral-500">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount >= 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">{transaction.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Money Modal */}
        <AddMoneyModal
          isOpen={showAddMoneyModal}
          onClose={() => setShowAddMoneyModal(false)}
          onSuccess={() => {
            loadWalletData()
            loadTransactions()
          }}
        />

        {/* Withdraw Modal */}
        {user?.role === 'creator' && (
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            maxAmount={wallet?.balance || 0}
            onSuccess={() => {
              loadWalletData()
              loadTransactions()
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
