import { useState, useEffect, useCallback } from 'react'
import { fetchTransactions, fetchAnalytics, createTransaction, queryAI } from './utils/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  Zap, ArrowUpRight, ArrowDownLeft, RotateCcw, TrendingUp,
  AlertCircle, CheckCircle2, Clock, Send, Plus, X
} from 'lucide-react'

const STATUS_COLORS = {
  SETTLED: '#00e5b4',
  PENDING: '#ffd166',
  FAILED: '#ff4d6d',
  REFUNDED: '#4cc9f0',
}

const TYPE_COLORS = {
  PAYMENT: '#00e5b4',
  TRANSFER: '#b5a4ff',
  REFUND: '#4cc9f0',
  DEPOSIT: '#ffd166',
  WITHDRAWAL: '#ff4d6d',
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#888'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4,
      background: color + '18', border: `1px solid ${color}40`,
      color, fontSize: 11, fontFamily: 'var(--font-mono)',
      letterSpacing: '0.05em', fontWeight: 500,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {status}
    </span>
  )
}

function StatCard({ label, value, sub, color = 'var(--accent)', icon: Icon, delay = 0 }) {
  return (
    <div className="fade-up" style={{
      animationDelay: `${delay}ms`,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '60'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && <Icon size={14} color={color} />}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sub}</div>}
    </div>
  )
}

function CreateTxModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    sender: '', recipient: '', amount: '', currency: 'USD',
    type: 'PAYMENT', description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.sender || !form.recipient || !form.amount) {
      setError('Sender, recipient, and amount are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const tx = await createTransaction({ ...form, amount: parseFloat(form.amount) })
      onCreated(tx)
      onClose()
    } catch (e) {
      setError('Failed to create transaction. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)', fontSize: 13, width: '100%',
    outline: 'none', transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
        borderRadius: 16, padding: 32, width: 480, maxWidth: '90vw',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>New Transaction</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Sender', 'sender', 'alice@example.com'], ['Recipient', 'recipient', 'bob@example.com'], ['Description', 'description', 'Optional']].map(([label, key, ph]) => (
            <div key={key}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
              <input style={inputStyle} placeholder={ph} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Amount</label>
              <input style={inputStyle} type="number" placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Currency</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {['USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Type</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['PAYMENT', 'TRANSFER', 'REFUND', 'DEPOSIT', 'WITHDRAWAL'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13,
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: '10px 0', borderRadius: 8,
            background: loading ? 'var(--accent-dim)' : 'var(--accent)',
            border: 'none', color: loading ? 'var(--accent)' : '#0a0a0f',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
          }}>{loading ? 'Processing...' : 'Submit Transaction'}</button>
        </div>
      </div>
    </div>
  )
}

function AiChat({ transactions, analytics }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m PaySense AI. Ask me anything about your payment data — refund rates, failed transactions, top senders, volume trends, and more.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const SUGGESTIONS = [
    'What is my refund rate?',
    'Which users sent the most payments?',
    'How much volume failed this period?',
    'Summarize my transaction health',
  ]

  const send = async (question) => {
    const q = question || input.trim()
    if (!q) return
    setMessages(m => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const res = await queryAI(q)
      setMessages(m => [...m, { role: 'ai', text: res.answer }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Could not reach the AI service. Make sure the backend is running.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, display: 'flex', flexDirection: 'column', height: 460,
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Zap size={14} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>PaySense AI</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, letterSpacing: '0.08em',
          color: 'var(--accent)', background: 'var(--accent-dim)',
          padding: '2px 8px', borderRadius: 20,
        }}>POWERED BY CLAUDE</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 10,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
              color: m.role === 'user' ? '#0a0a0f' : 'var(--text-primary)',
              border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
              fontSize: 13, lineHeight: 1.6,
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '10px 14px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)', opacity: 0.5,
                animation: `pulse-glow 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => send(s)} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', borderRadius: 20, padding: '3px 10px',
            fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
          >{s}</button>
        ))}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your payments..."
          style={{
            flex: 1, background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '9px 14px', color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button onClick={() => send()} style={{
          background: 'var(--accent)', border: 'none', borderRadius: 8,
          padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <Send size={14} color="#0a0a0f" />
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    try {
      const [txs, an] = await Promise.all([fetchTransactions(), fetchAnalytics()])
      setTransactions(txs)
      setAnalytics(an)
      setError('')
    } catch {
      setError('Cannot connect to backend. Start the Spring Boot server on port 8080.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const chartData = transactions.slice(0, 20).reverse().map((t, i) => ({
    name: i,
    amount: parseFloat(t.amount),
    status: t.status,
  }))

  const typeData = analytics?.byType
    ? Object.entries(analytics.byType).map(([type, s]) => ({ type, count: s.count, volume: parseFloat(s.volume) }))
    : []

  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${parseFloat(n).toFixed(0)}`

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>LOADING LEDGER</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)', padding: '0 32px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(12px)', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, background: 'var(--accent)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#0a0a0f" fill="#0a0a0f" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
            Pay<span style={{ color: 'var(--accent)' }}>Sense</span>
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.1em', marginLeft: 4 }}>PAYMENT ANALYTICS</span>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--accent)', border: 'none', borderRadius: 8,
          padding: '8px 16px', color: '#0a0a0f', fontFamily: 'var(--font-mono)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
        }}>
          <Plus size={13} /> NEW TRANSACTION
        </button>
      </header>

      {error && (
        <div style={{
          background: 'rgba(255,77,109,0.1)', borderBottom: '1px solid rgba(255,77,109,0.3)',
          padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 13,
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>
        {/* Stats Row */}
        {analytics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Transactions" value={analytics.totalTransactions} icon={TrendingUp} delay={0} />
            <StatCard label="Settled Volume" value={fmt(analytics.totalSettledVolume)} icon={CheckCircle2} delay={60} />
            <StatCard label="Failed" value={analytics.failedCount} color="var(--red)" icon={AlertCircle} delay={120}
              sub={`${((analytics.failedCount / analytics.totalTransactions) * 100).toFixed(1)}% failure rate`} />
            <StatCard label="Refunded" value={analytics.refundedCount} color="var(--blue)" icon={RotateCcw} delay={180}
              sub={`${analytics.pendingCount} pending`} />
          </div>
        )}

        {/* Charts + AI */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          {/* Volume Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Transaction Volume</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>last 20 txns</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5b4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00e5b4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`$${v.toFixed(2)}`, 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="#00e5b4" fill="url(#grad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Type Breakdown */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Volume by Type</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeData} barSize={28}>
                <XAxis dataKey="type" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Volume']}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {typeData.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.type] || '#888'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Chat */}
        <div style={{ marginBottom: 32 }}>
          <AiChat transactions={transactions} analytics={analytics} />
        </div>

        {/* Transaction Table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Ledger</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{transactions.length} transactions</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Type', 'Sender', 'Recipient', 'Amount', 'Status', 'Created'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      color: 'var(--text-muted)', fontSize: 10, fontWeight: 500,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 25).map((t, i) => (
                  <tr key={t.id} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: TYPE_COLORS[t.type] || '#888', fontSize: 11, letterSpacing: '0.06em' }}>{t.type}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      {t.sender.split('@')[0]}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      {t.recipient.split('@')[0]}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      ${parseFloat(t.amount).toFixed(2)} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t.currency}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={t.status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11 }}>
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>PaySense — built with Java Spring Boot + React + Claude API</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>H2 in-memory ledger</span>
        </div>
      </main>

      {showModal && (
        <CreateTxModal onClose={() => setShowModal(false)} onCreated={() => load()} />
      )}
    </div>
  )
}
