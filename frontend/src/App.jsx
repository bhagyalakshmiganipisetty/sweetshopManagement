import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  createSweet,
  deleteSweet,
  fetchMetrics,
  fetchSweets,
  purchaseSweet,
  restockSweet,
  updateSweet,
} from './api'
import { useAuth } from './hooks/useAuth'

const emptySweet = {
  name: '',
  category: '',
  description: '',
  price: '',
  quantity: 0,
}

function App() {
  const { auth, isAuthenticated, login, register, logout } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' })
  const [sweetForm, setSweetForm] = useState(emptySweet)
  const [filters, setFilters] = useState({ name: '', category: '', min_price: '', max_price: '' })
  const [sweets, setSweets] = useState([])
  const [meta, setMeta] = useState({ count: 0 })
  const [editingSweet, setEditingSweet] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState([])

  const isAdmin = useMemo(() => Boolean(auth?.user?.is_staff), [auth])

  useEffect(() => {
    if (!isAuthenticated) return
    loadSweets()
    fetchMetrics().then(setMetrics)
  }, [isAuthenticated])

  const loadSweets = async (override = filters) => {
    if (!auth?.access) return
    try {
      setLoading(true)
      const response = await fetchSweets({ token: auth.access, filters: override })
      if (Array.isArray(response)) {
        setSweets(response)
        setMeta({ count: response.length })
      } else {
        setSweets(response.results || [])
        setMeta({ count: response.count || 0 })
      }
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    try {
      if (authMode === 'login') {
        await login({ username: authForm.username, password: authForm.password })
      } else {
        await register(authForm)
      }
      setAuthForm({ username: '', email: '', password: '' })
      setStatus('Welcome! Use the catalog below to manage sweets.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleSweetSubmit = async (event) => {
    event.preventDefault()
    try {
      if (editingSweet) {
        await updateSweet({ token: auth.access, sweetId: editingSweet.id, payload: sweetForm })
        setStatus(`Updated ${sweetForm.name}`)
      } else {
        await createSweet({ token: auth.access, payload: sweetForm })
        setStatus(`Created ${sweetForm.name}`)
      }
      setSweetForm(emptySweet)
      setEditingSweet(null)
      loadSweets()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handlePurchase = async (sweetId, amount = 1) => {
    try {
      await purchaseSweet({ token: auth.access, sweetId, amount })
      loadSweets()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleRestock = async (sweetId) => {
    const amount = Number(prompt('Restock amount', '5'))
    if (!Number.isFinite(amount) || amount <= 0) return
    try {
      await restockSweet({ token: auth.access, sweetId, amount })
      loadSweets()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleDelete = async (sweetId) => {
    if (!confirm('Delete this sweet?')) return
    try {
      await deleteSweet({ token: auth.access, sweetId })
      loadSweets()
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadSweets(filters)
  }

  const handleSweetEdit = (sweet) => {
    setSweetForm({
      name: sweet.name,
      category: sweet.category,
      description: sweet.description,
      price: Number(sweet.price),
      quantity: sweet.quantity,
    })
    setEditingSweet(sweet)
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>Sweet Shop Management</h1>
          <p>End-to-end management of inventory, purchases, and analytics.</p>
          {status && <span className="status">{status}</span>}
        </div>
        {isAuthenticated && (
          <div className="user-chip">
            <span>{auth.user.username}</span>
            {isAdmin && <span className="role">Admin</span>}
            <button onClick={logout}>Sign out</button>
          </div>
        )}
      </header>

      {!isAuthenticated ? (
        <section className="panel">
          <div className="panel-header">
            <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              Switch to {authMode === 'login' ? 'Register' : 'Login'}
            </button>
          </div>
          <form onSubmit={handleAuthSubmit} className="form-grid">
            <label>
              Username
              <input
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                required
              />
            </label>
            {authMode === 'register' && (
              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                />
              </label>
            )}
            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
                minLength={8}
              />
            </label>
            <button type="submit" className="primary">
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="panel">
            <div className="panel-header">
              <h2>Sweet Catalog</h2>
              <span>{meta.count} sweets</span>
            </div>
            <form className="filters" onSubmit={handleSearch}>
              <input
                placeholder="Name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
              <input
                placeholder="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              />
              <input
                placeholder="Min price"
                type="number"
                value={filters.min_price}
                onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
              />
              <input
                placeholder="Max price"
                type="number"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
              />
              <button type="submit" disabled={loading}>
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({ name: '', category: '', min_price: '', max_price: '' })
                  loadSweets({})
                }}
              >
                Reset
              </button>
            </form>
            <div className="sweet-grid">
              {sweets.map((sweet) => (
                <article key={sweet.id} className="sweet-card">
                  <header>
                    <h3>{sweet.name}</h3>
                    <span className="badge">{sweet.category}</span>
                  </header>
                  <p>{sweet.description || 'No description provided.'}</p>
                  <div className="sweet-meta">
                    <strong>${Number(sweet.price).toFixed(2)}</strong>
                    <span>{sweet.quantity} in stock</span>
                  </div>
                  <div className="actions">
                    <button
                      onClick={() => handlePurchase(sweet.id)}
                      disabled={!sweet.quantity}
                      className="primary"
                    >
                      Purchase
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleSweetEdit(sweet)}>Edit</button>
                        <button onClick={() => handleRestock(sweet.id)}>Restock</button>
                        <button className="danger" onClick={() => handleDelete(sweet.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
              {!sweets.length && <p>No sweets found.</p>}
            </div>
          </section>

          {isAdmin && (
            <section className="panel">
              <div className="panel-header">
                <h2>{editingSweet ? 'Edit Sweet' : 'Add New Sweet'}</h2>
                {editingSweet && (
                  <button
                    onClick={() => {
                      setEditingSweet(null)
                      setSweetForm(emptySweet)
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form className="form-grid" onSubmit={handleSweetSubmit}>
                <label>
                  Name
                  <input
                    value={sweetForm.name}
                    onChange={(e) => setSweetForm({ ...sweetForm, name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Category
                  <input
                    value={sweetForm.category}
                    onChange={(e) => setSweetForm({ ...sweetForm, category: e.target.value })}
                    required
                  />
                </label>
                <label className="span-2">
                  Description
                  <textarea
                    value={sweetForm.description}
                    onChange={(e) => setSweetForm({ ...sweetForm, description: e.target.value })}
                    rows={3}
                  />
                </label>
                <label>
                  Price
                  <input
                    type="number"
                    step="0.01"
                    value={sweetForm.price}
                    onChange={(e) => setSweetForm({ ...sweetForm, price: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    value={sweetForm.quantity}
                    onChange={(e) => setSweetForm({ ...sweetForm, quantity: Number(e.target.value) })}
                    min={0}
                    required
                  />
                </label>
                <button type="submit" className="primary span-2">
                  {editingSweet ? 'Update Sweet' : 'Create Sweet'}
                </button>
              </form>
            </section>
          )}

          {!!metrics.length && (
            <section className="panel">
              <div className="panel-header">
                <h2>Inventory Metrics (Flask)</h2>
                <span>Live category breakdown</span>
              </div>
              <div className="metrics-grid">
                {metrics.map((row) => (
                  <div key={row.category} className="metric-card">
                    <h4>{row.category}</h4>
                    <p>{row.sweet_count} sweets</p>
                    <span>{row.total_quantity} items in stock</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default App
