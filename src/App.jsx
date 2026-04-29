import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// ─── API Helper ───────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  const token = localStorage.getItem('auth_token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}), ...options.headers }
  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) {
      let msg = `Server error (${res.status})`
      try { const d = await res.json(); msg = d.error || d.detail || Object.values(d)[0] || msg } catch {}
      throw new Error(typeof msg === 'object' ? JSON.stringify(msg) : msg)
    }
    return res.status === 204 ? null : await res.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error('Request timed out. Please check your connection.')
    if (err.message === 'Failed to fetch') throw new Error('Cannot reach server. Please try again later.')
    throw err
  }
}

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null)
function useAuth() { return useContext(AuthContext) }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const login = (userData, token) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    try { await apiFetch(`${API_BASE}/auth/logout/`, { method: 'POST' }) } catch {}
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (data) => {
    const updated = { ...user, ...data }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>
}

// ─── useSiteData ──────────────────────────────────────────────────────────────
function useSiteData() {
  const [config, setConfig] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true); setError('')
    Promise.all([apiFetch(`${API_BASE}/config/`), apiFetch(`${API_BASE}/products/`)])
      .then(([cfg, prods]) => { setConfig(cfg); setProducts(prods.map(p => ({ ...p, price: parseFloat(p.price) }))) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  return { config, products, loading, error, retry: load }
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  const colors = { success: 'bg-green-500', error: 'bg-[#d4351c]', info: 'bg-[#003078]' }
  return (
    <div className={`fixed top-6 right-6 z-[100] ${colors[type] || colors.info} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm animate-fade-in`}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ siteName, tagline, cartCount, onCartClick, onNavigate }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const handleLogout = async () => { await logout(); onNavigate('home') }

  return (
    <nav className="bg-[#003078] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-3">
          <div className="bg-[#f3a712] rounded-full w-10 h-10 flex items-center justify-center font-bold text-[#003078] text-lg">UK</div>
          <div className="text-left">
            <div className="font-bold text-xl tracking-wide">{siteName}</div>
            <div className="text-xs text-blue-200">{tagline}</div>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button onClick={() => onNavigate('home')} className="hover:text-[#f3a712] transition">Home</button>
          <a href="#services" className="hover:text-[#f3a712] transition">Services</a>
          <a href="#products" className="hover:text-[#f3a712] transition">Fees</a>
          <a href="#contact" className="hover:text-[#f3a712] transition">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onCartClick} className="relative bg-[#f3a712] hover:bg-yellow-400 text-[#003078] font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition">
            🛒 Cart
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-[#d4351c] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
          </button>

          {user ? (
            <div className="relative">
              <button onClick={() => setDropOpen(!dropOpen)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition">
                <div className="w-7 h-7 bg-[#f3a712] rounded-full flex items-center justify-center text-[#003078] font-bold text-sm">
                  {user.first_name?.[0] || user.username?.[0] || '?'}
                </div>
                <span className="text-sm hidden md:block">{user.first_name || user.username}</span>
                <span className="text-xs">▾</span>
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-12 bg-white text-gray-800 rounded-2xl shadow-2xl w-48 py-2 z-50">
                  <button onClick={() => { onNavigate('profile'); setDropOpen(false) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2">👤 My Profile</button>
                  <button onClick={() => { onNavigate('orders'); setDropOpen(false) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2">📋 My Orders</button>
                  <hr className="my-1" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-[#d4351c] text-sm flex items-center gap-2">🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <button onClick={() => onNavigate('login')} className="border border-white/40 hover:bg-white/10 px-4 py-2 rounded-lg text-sm transition">Login</button>
              <button onClick={() => onNavigate('register')} className="bg-[#f3a712] hover:bg-yellow-400 text-[#003078] font-bold px-4 py-2 rounded-lg text-sm transition">Register</button>
            </div>
          )}
          <button className="md:hidden text-white text-2xl" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#002060] px-4 pb-4 flex flex-col gap-3 text-sm font-medium">
          <button onClick={() => { onNavigate('home'); setMenuOpen(false) }} className="text-left hover:text-[#f3a712]">Home</button>
          <a href="#services" className="hover:text-[#f3a712]">Services</a>
          <a href="#products" className="hover:text-[#f3a712]">Fees</a>
          <a href="#contact" className="hover:text-[#f3a712]">Contact</a>
          {user ? (
            <>
              <button onClick={() => { onNavigate('profile'); setMenuOpen(false) }} className="text-left hover:text-[#f3a712]">👤 Profile</button>
              <button onClick={() => { onNavigate('orders'); setMenuOpen(false) }} className="text-left hover:text-[#f3a712]">📋 My Orders</button>
              <button onClick={handleLogout} className="text-left text-red-300">🚪 Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { onNavigate('login'); setMenuOpen(false) }} className="text-left hover:text-[#f3a712]">Login</button>
              <button onClick={() => { onNavigate('register'); setMenuOpen(false) }} className="text-left hover:text-[#f3a712]">Register</button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────
function LoginPage({ onNavigate, onToast }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const data = await apiFetch(`${API_BASE}/auth/login/`, { method: 'POST', body: JSON.stringify(form) })
      login(data.user, data.token)
      onToast('Welcome back! 👋', 'success')
      onNavigate('home')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003078] to-[#0066cc] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-[#f3a712] rounded-full w-16 h-16 flex items-center justify-center font-bold text-[#003078] text-2xl mx-auto mb-4">UK</div>
          <h1 className="text-2xl font-extrabold text-[#003078]">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your UKVI Services account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Username</label>
            <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm" placeholder="your_username" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Password</label>
            <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm" placeholder="••••••••" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-[#d4351c] text-sm rounded-xl p-3 flex gap-2"><span>⚠️</span>{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#003078] hover:bg-[#004aad] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition">
            {loading ? '⏳ Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} className="text-[#003078] font-bold hover:underline">Register here</button>
        </p>
        <button onClick={() => onNavigate('home')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3">← Back to Home</button>
      </div>
    </div>
  )
}

function RegisterPage({ onNavigate, onToast }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', password: '', password2: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      const data = await apiFetch(`${API_BASE}/auth/register/`, { method: 'POST', body: JSON.stringify(form) })
      login(data.user, data.token)
      onToast('Account created successfully! 🎉', 'success')
      onNavigate('home')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const fields = [
    { label: 'First Name', key: 'first_name', type: 'text', placeholder: 'John' },
    { label: 'Last Name', key: 'last_name', type: 'text', placeholder: 'Smith' },
    { label: 'Username', key: 'username', type: 'text', placeholder: 'john_smith' },
    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
    { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
    { label: 'Confirm Password', key: 'password2', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003078] to-[#0066cc] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-[#f3a712] rounded-full w-16 h-16 flex items-center justify-center font-bold text-[#003078] text-2xl mx-auto mb-4">UK</div>
          <h1 className="text-2xl font-extrabold text-[#003078]">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join UKVI Services today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.slice(0, 2).map(f => (
              <div key={f.key}>
                <label className="block text-sm font-semibold text-gray-600 mb-1">{f.label}</label>
                <input required type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm" placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          {fields.slice(2).map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{f.label}</label>
              <input required type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm" placeholder={f.placeholder} />
            </div>
          ))}
          {error && <div className="bg-red-50 border border-red-200 text-[#d4351c] text-sm rounded-xl p-3 flex gap-2"><span>⚠️</span>{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#003078] hover:bg-[#004aad] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition">
            {loading ? '⏳ Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-[#003078] font-bold hover:underline">Sign in</button>
        </p>
        <button onClick={() => onNavigate('home')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3">← Back to Home</button>
      </div>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ onNavigate, onToast }) {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const data = await apiFetch(`${API_BASE}/auth/profile/`, { method: 'PUT', body: JSON.stringify(form) })
      updateUser(data.user)
      onToast('Profile updated successfully!', 'success')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => onNavigate('home')} className="text-[#003078] hover:underline text-sm mb-6 flex items-center gap-1">← Back to Home</button>
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-[#003078] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.first_name?.[0] || user?.username?.[0] || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#003078]">My Profile</h1>
              <p className="text-gray-500 text-sm">@{user?.username}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'First Name', key: 'first_name' }, { label: 'Last Name', key: 'last_name' }].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Username</label>
              <input value={user?.username} disabled className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed" />
            </div>
            {error && <div className="bg-red-50 text-[#d4351c] text-sm rounded-xl p-3">⚠️ {error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#003078] hover:bg-[#004aad] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition">
              {loading ? '⏳ Saving...' : 'Save Changes'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t">
            <button onClick={() => onNavigate('orders')} className="w-full border-2 border-[#003078] text-[#003078] hover:bg-[#003078] hover:text-white font-bold py-3 rounded-xl transition">
              📋 View My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── My Orders Page ───────────────────────────────────────────────────────────
function MyOrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(`${API_BASE}/orders/my/`)
      .then(data => setOrders(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const statusColors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => onNavigate('home')} className="text-[#003078] hover:underline text-sm mb-6 flex items-center gap-1">← Back to Home</button>
        <h1 className="text-3xl font-extrabold text-[#003078] mb-8">📋 My Orders</h1>
        {loading && <div className="text-center py-20 text-[#003078] font-semibold">⏳ Loading orders...</div>}
        {error && <div className="bg-red-50 text-[#d4351c] rounded-2xl p-6 text-center">⚠️ {error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-3xl shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-[#003078] mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <button onClick={() => onNavigate('home')} className="bg-[#003078] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#004aad] transition">Browse Fee Options</button>
          </div>
        )}
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-bold text-[#003078] text-lg">Order #{order.id}</div>
                  <div className="text-gray-400 text-sm">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status_display}
                  </span>
                  <span className="text-xl font-extrabold text-[#003078]">£{parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.product_icon} {item.product_name} × {item.quantity}</span>
                    <span className="font-semibold text-[#003078]">£{parseFloat(item.unit_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Payment Result Page ──────────────────────────────────────────────────────
function PaymentResultPage({ status, orderId, onNavigate }) {
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (orderId) {
      apiFetch(`${API_BASE}/orders/${orderId}/`).then(setOrder).catch(() => {})
    }
  }, [orderId])

  if (status === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
        <div className="text-7xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold text-[#003078] mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-4">Your payment has been processed successfully.</p>
        {order && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-left">
            <div className="text-sm font-bold text-[#003078] mb-2">Order Summary</div>
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-600">
                <span>{item.product_icon} {item.product_name}</span>
                <span>£{parseFloat(item.unit_price).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold text-[#003078]">
              <span>Total</span><span>£{parseFloat(order.total_amount).toLocaleString()}</span>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mb-6">Order ID: #{orderId} • Confirmation sent to your email</p>
        <button onClick={() => onNavigate('home')} className="w-full bg-[#003078] text-white font-bold py-3 rounded-xl hover:bg-[#004aad] transition">Back to Home</button>
        <button onClick={() => onNavigate('orders')} className="w-full mt-3 border-2 border-[#003078] text-[#003078] font-bold py-3 rounded-xl hover:bg-[#003078] hover:text-white transition">View My Orders</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
        <div className="text-7xl mb-4">❌</div>
        <h1 className="text-2xl font-extrabold text-[#d4351c] mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 mb-6">Your payment was cancelled. No charges were made.</p>
        <button onClick={() => onNavigate('home')} className="w-full bg-[#003078] text-white font-bold py-3 rounded-xl hover:bg-[#004aad] transition">Try Again</button>
      </div>
    </div>
  )
}

// ─── Home Page Components ─────────────────────────────────────────────────────
function Hero({ config }) {
  const stats = [
    { value: config.stat_1_value, label: config.stat_1_label },
    { value: config.stat_2_value, label: config.stat_2_label },
    { value: config.stat_3_value, label: config.stat_3_label },
  ]
  return (
    <section id="home" className="bg-gradient-to-br from-[#003078] via-[#004aad] to-[#0066cc] text-white py-24 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-block bg-[#f3a712] text-[#003078] text-xs font-bold px-4 py-1 rounded-full mb-6 uppercase tracking-widest">Official UKVI Fee Payment Portal</div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          {config.hero_title.includes('Fee Payment') ? (
            <>{config.hero_title.split('Fee Payment')[0]}<span className="text-[#f3a712]">Fee Payment</span>{config.hero_title.split('Fee Payment')[1]}</>
          ) : config.hero_title}
        </h1>
        <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">{config.hero_subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#products" className="bg-[#f3a712] hover:bg-yellow-400 text-[#003078] font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg">View Fee Options →</a>
          <a href="#services" className="border-2 border-white hover:bg-white hover:text-[#003078] text-white font-bold px-8 py-4 rounded-xl text-lg transition">Learn More</a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
          {stats.map((s, i) => (
            <div key={i}><div className="text-3xl font-extrabold text-[#f3a712]">{s.value}</div><div className="text-blue-200 text-sm">{s.label}</div></div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Services() {
  const items = [
    { icon: '🛂', title: 'Visa Fee Payment', desc: 'Pay your UK visa application fee quickly and securely online.' },
    { icon: '🏥', title: 'IHS Payment', desc: 'Immigration Health Surcharge — access NHS services during your stay.' },
    { icon: '🔒', title: 'Secure Transactions', desc: 'All payments are encrypted and processed via trusted gateways.' },
    { icon: '📧', title: 'Instant Confirmation', desc: 'Receive your payment receipt instantly via email.' },
  ]
  return (
    <section id="services" className="py-20 bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#003078] mb-3">Our Services</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Everything you need to complete your UK visa application fees in one place.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition border border-gray-100 text-center">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="font-bold text-[#003078] text-lg mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product, onAddToCart }) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 ${product.is_popular ? 'border-[#f3a712]' : 'border-gray-100'} overflow-hidden flex flex-col`}>
      {product.is_popular && <div className="absolute top-4 right-4 bg-[#f3a712] text-[#003078] text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>}
      <div className="bg-gradient-to-br from-[#003078] to-[#0066cc] p-6 text-center">
        <div className="text-5xl mb-2">{product.icon}</div>
        <span className="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full">{product.category_display}</span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-[#003078] text-lg mb-2">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-4 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-3xl font-extrabold text-[#003078]">£{product.price.toLocaleString()}</span>
          <button onClick={() => onAddToCart(product)} className="bg-[#003078] hover:bg-[#004aad] text-white font-semibold px-5 py-2 rounded-xl transition text-sm">Add to Cart</button>
        </div>
      </div>
    </div>
  )
}

function ProductsSection({ products, onAddToCart }) {
  const [filter, setFilter] = useState('All')
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category_display)))]
  const filtered = filter === 'All' ? products : products.filter(p => p.category_display === filter)
  return (
    <section id="products" className="py-20 bg-white px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#003078] mb-3">Fee Options</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Select the fee type that applies to your application and add it to your cart.</p>
        </div>
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${filter === c ? 'bg-[#003078] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
          ))}
        </div>
        {products.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📋</div><p>No fee options available.</p></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />)}
        </div>
      </div>
    </section>
  )
}

function CartModal({ cart, onClose, onRemove, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#003078]">🛒 Your Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-10"><div className="text-5xl mb-3">🛒</div><p>Your cart is empty</p></div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div>
                    <div className="font-semibold text-[#003078] text-sm">{item.name}</div>
                    <div className="text-gray-400 text-xs">{item.category_display}</div>
                    <div className="text-[#003078] font-bold mt-1">£{item.price.toLocaleString()} × {item.qty}</div>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="text-[#d4351c] hover:bg-red-50 rounded-lg p-2 transition">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-6 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-600">Total</span>
              <span className="text-2xl font-extrabold text-[#003078]">£{total.toLocaleString()}</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-[#003078] hover:bg-[#004aad] text-white font-bold py-4 rounded-xl transition text-lg">Proceed to Payment →</button>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckoutModal({ cart, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '',
    email: user?.email || '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate(); if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const data = await apiFetch(`${API_BASE}/orders/create/`, {
        method: 'POST',
        body: JSON.stringify({
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim(),
          items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
        }),
      })
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else if (data.order_id) {
        onSuccess(data.order_id)
      } else {
        setError('Unexpected response. Please try again.')
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#003078]">💳 Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Smith' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
            { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+44 7700 000000' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-gray-600 mb-1">{f.label}</label>
              <input required type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003078] text-sm" placeholder={f.placeholder} />
            </div>
          ))}
          <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-gray-600 font-semibold">Total Amount</span>
            <span className="text-2xl font-extrabold text-[#003078]">£{total.toLocaleString()}</span>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-[#d4351c] text-sm rounded-xl p-3 flex gap-2"><span>⚠️</span>{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#003078] hover:bg-[#004aad] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition text-lg flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin inline-block">⏳</span> Processing...</> : '🔒 Pay Now'}
          </button>
          <p className="text-center text-xs text-gray-400">🔒 Secured by Stripe. Your data is safe.</p>
        </form>
      </div>
    </div>
  )
}

function TrustBar() {
  return (
    <section className="bg-[#003078] text-white py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[{ icon: '🔒', label: 'SSL Encrypted' }, { icon: '🏦', label: 'Stripe Secured' }, { icon: '📋', label: 'UKVI Compliant' }, { icon: '⚡', label: 'Instant Receipt' }].map((t, i) => (
          <div key={i}><div className="text-3xl mb-2">{t.icon}</div><div className="text-sm font-semibold text-blue-100">{t.label}</div></div>
        ))}
      </div>
    </section>
  )
}

function Contact({ config }) {
  return (
    <section id="contact" className="py-20 bg-gray-50 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#003078] mb-3">Need Help?</h2>
        <p className="text-gray-500 mb-10">Our support team is available 24/7 to assist you with your application.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ icon: '📧', title: 'Email Us', value: config.contact_email }, { icon: '📞', title: 'Call Us', value: config.contact_phone }, { icon: '💬', title: 'Live Chat', value: 'Available 24/7' }].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow border border-gray-100">
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="font-bold text-[#003078] mb-1">{c.title}</div>
              <div className="text-gray-500 text-sm">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer({ config, onNavigate }) {
  return (
    <footer className="bg-[#001a4d] text-white py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-3">
          <div className="bg-[#f3a712] rounded-full w-9 h-9 flex items-center justify-center font-bold text-[#003078]">UK</div>
          <div className="text-left"><div className="font-bold">{config.site_name}</div><div className="text-xs text-blue-300">{config.site_tagline}</div></div>
        </button>
        <div className="text-blue-300 text-sm text-center">© {new Date().getFullYear()} {config.site_name}. All rights reserved. | {config.footer_text}</div>
        <div className="flex gap-4 text-sm text-blue-300">
          <a href="#" className="hover:text-white transition">Privacy</a>
          <a href="#" className="hover:text-white transition">Terms</a>
          <a href="#" className="hover:text-white transition">Refunds</a>
        </div>
      </div>
    </footer>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#003078] flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4 animate-pulse">🛂</div>
        <div className="text-xl font-bold">Loading UKVI Services...</div>
        <div className="text-blue-300 text-sm mt-2">Connecting to server...</div>
      </div>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[#d4351c] mb-2">Connection Error</h2>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <button onClick={onRetry} className="bg-[#003078] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#004aad] transition">🔄 Retry</button>
      </div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
function AppContent() {
  const { config, products, loading, error, retry } = useSiteData()
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') return 'payment-success'
    if (params.get('payment') === 'cancelled') return 'payment-cancelled'
    return 'home'
  })
  const [paymentOrderId, setPaymentOrderId] = useState(() => new URLSearchParams(window.location.search).get('order_id'))
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [toast, setToast] = useState(null)

  const navigate = (p) => { setPage(p); window.scrollTo(0, 0) }
  const showToast = (message, type = 'info') => setToast({ message, type })

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    showToast(`${product.name} added to cart!`, 'success')
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const handleOrderSuccess = (orderId) => {
    setCart([]); setShowCheckout(false); setShowCart(false)
    setPaymentOrderId(orderId); navigate('payment-success')
  }

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} onRetry={retry} />

  // Non-home pages
  if (page === 'login') return <LoginPage onNavigate={navigate} onToast={showToast} />
  if (page === 'register') return <RegisterPage onNavigate={navigate} onToast={showToast} />
  if (page === 'profile') return <ProfilePage onNavigate={navigate} onToast={showToast} />
  if (page === 'orders') return <MyOrdersPage onNavigate={navigate} />
  if (page === 'payment-success') return <PaymentResultPage status="success" orderId={paymentOrderId} onNavigate={navigate} />
  if (page === 'payment-cancelled') return <PaymentResultPage status="cancelled" onNavigate={navigate} />

  return (
    <div className="min-h-screen font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Navbar siteName={config.site_name} tagline={config.site_tagline}
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onCartClick={() => setShowCart(true)}
        onNavigate={navigate} />
      <Hero config={config} />
      <Services />
      <ProductsSection products={products} onAddToCart={addToCart} />
      <TrustBar />
      <Contact config={config} />
      <Footer config={config} onNavigate={navigate} />

      {showCart && <CartModal cart={cart} onClose={() => setShowCart(false)}
        onRemove={removeFromCart} onCheckout={() => { setShowCart(false); setShowCheckout(true) }} />}
      {showCheckout && <CheckoutModal cart={cart} onClose={() => setShowCheckout(false)} onSuccess={handleOrderSuccess} />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
