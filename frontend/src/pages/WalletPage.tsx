import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ColumnDef } from '@tanstack/react-table'
import DashboardLayout from '../components/DashboardLayout'
import { DataTable } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiUrl } from '../config'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { AddMoneyModal } from '../components/wallet/AddMoneyModal'
import { WithdrawModal } from '../components/wallet/WithdrawModal'
import { getStatusColor } from '../utils/tableUtils'
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations'

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

  // Generate earnings trend data from transactions
  const earningsTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        earnings: 0
      };
    });

    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const daysDiff = Math.floor((Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7 && tx.amount > 0 && tx.status === 'completed') {
        last7Days[6 - daysDiff].earnings += tx.amount;
      }
    });

    return last7Days;
  }, [transactions]);

  // Define columns for DataTable
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getStatusIcon(row.original.status)}
            <Badge className={getStatusColor(row.original.status)}>
              <span className="capitalize">{row.original.status}</span>
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.description}</p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{row.original.type}</p>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span
            className={`font-semibold ${
              row.original.amount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {row.original.amount >= 0 ? '+' : ''}₹{Math.abs(row.original.amount).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{formatDate(row.original.created_at)}</span>
        ),
      },
    ],
    []
  );

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
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="max-w-7xl mx-auto px-4 py-8 space-y-6"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <Wallet className="text-indigo-600" size={32} />
            My Wallet
          </h1>
          <p className="text-neutral-600 mt-1">Manage your payments and earnings</p>
        </div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        >
          {/* Balance Card */}
          <motion.div
            variants={staggerItem}
            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-xl col-span-1 md:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-indigo-100 text-sm mb-2">Available Balance</p>
                <h2 className="text-4xl font-bold">
                  ₹{wallet?.balance.toFixed(2) || '0.00'}
                </h2>
              </div>
              <Wallet size={64} className="opacity-20" />
            </div>

            <div className="flex gap-4">
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
          </motion.div>

          {/* Total Earnings Card */}
          <motion.div
            variants={staggerItem}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ₹{transactions
                .filter(tx => tx.amount > 0 && tx.status === 'completed')
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">All time</p>
          </motion.div>
        </motion.div>

        {/* Earnings Trend Chart */}
        {earningsTrendData.some(d => d.earnings > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={earningsTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    return [`₹${numValue.toFixed(2)}`, 'Earnings'];
                  }}
                />
                <Line type="monotone" dataKey="earnings" stroke="#6366F1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transaction History with DataTable */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">Transaction History</h3>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No transactions yet
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              searchPlaceholder="Search transactions..."
              exportFilename="wallet-transactions"
              enableRowSelection={false}
              enableColumnVisibility={true}
              enableExport={true}
            />
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
      </motion.div>
    </DashboardLayout>
  )
}
