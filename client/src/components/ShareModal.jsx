import { useState, useEffect } from 'react'
import { shareDoc, getShares } from '../lib/api'

export default function ShareModal({ docId, onClose }) {
  const [email, setEmail] = useState('')
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingShares, setFetchingShares] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    getShares(docId)
      .then(setShares)
      .catch(() => {})
      .finally(() => setFetchingShares(false))
  }, [docId])

  const handleShare = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await shareDoc(docId, email)
      setSuccess(`Shared with ${email}`)
      setEmail('')
      const updated = await getShares(docId)
      setShares(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Share Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5">
          <form onSubmit={handleShare} className="flex gap-2 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Sharing…' : 'Share'}
            </button>
          </form>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Shared with
            </p>
            {fetchingShares ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-400">Not shared with anyone yet.</p>
            ) : (
              <ul className="space-y-1">
                {shares.map((s) => (
                  <li
                    key={s.id}
                    className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    {s.shared_with_email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
