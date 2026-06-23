import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFile, createDoc } from '../lib/api'

const ALLOWED = ['txt', 'md']

export default function FileUploadButton() {
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!ALLOWED.includes(ext)) {
      setError('Only .txt and .md files are accepted')
      e.target.value = ''
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { title, content } = await uploadFile(file)
      const doc = await createDoc({ title, content })
      navigate(`/documents/${doc.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-start">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md"
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={() => {
          setError(null)
          inputRef.current?.click()
        }}
        disabled={loading}
        className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Uploading…' : 'Upload File'}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
