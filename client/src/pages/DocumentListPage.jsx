import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocs, createDoc } from '../lib/api'
import Navbar from '../components/Navbar'
import FileUploadButton from '../components/FileUploadButton'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function DocRow({ doc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors"
    >
      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate pr-4">
        {doc.title || 'Untitled Document'}
      </span>
      <span className="text-xs text-gray-400 shrink-0">{formatDate(doc.updated_at)}</span>
    </button>
  )
}

export default function DocumentListPage() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState({ owned: [], shared: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getDocs()
      .then(setDocs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleNew = async () => {
    setCreating(true)
    try {
      const doc = await createDoc({ title: 'Untitled Document' })
      navigate(`/documents/${doc.id}`)
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <div className="flex items-center gap-3">
            <FileUploadButton />
            <button
              onClick={handleNew}
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating…' : '+ New Document'}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-6">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Loading documents…</p>
        ) : (
          <>
            {/* My Documents */}
            <section className="mb-10">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                My Documents
              </h2>
              {docs.owned.length === 0 ? (
                <p className="text-sm text-gray-400 px-1">
                  No documents yet — create one or upload a file.
                </p>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {docs.owned.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Shared With Me */}
            {docs.shared.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Shared With Me
                </h2>
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {docs.shared.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
