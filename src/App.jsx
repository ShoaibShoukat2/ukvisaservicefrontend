import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// ─── API helper with timeout + proper error messages ──────────────────────────
async function apiFetch(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) {
      let errMsg = `Server error (${res.status})`
      try { const d = await res.json(); errMsg = d.error || d.detail || errMsg } catch {}
      throw new Error(errMsg)
    }
    return await res.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error('Request timed out. Please check your connection.')
    if (err.message === 'Failed to fetch') throw new Error('Cannot reach server. Please try again later.')
    throw err
  }
}

// ─── useSiteData hook ─────────────────────────────────────────────────────────
function useSiteData() {
  const [config, setConfig] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([
      apiFetch(`${API_BASE}/config/`),
      apiFetch(`${API_BASE}/products/`),
    ])
      .then(([cfg, prods]) => {
        setConfig(cfg)
        setProducts(prods.map(p => ({ ...p, price: parseFloat(p.price) })))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return { config, products, loading, error, retry: load }
}
