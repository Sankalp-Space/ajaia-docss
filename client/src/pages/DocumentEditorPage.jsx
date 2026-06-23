import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { getDoc, updateDoc } from '../lib/api'
import Navbar from '../components/Navbar'
import ShareModal from '../components/ShareModal'

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      title={title}
      // onMouseDown prevents editor blur before the command fires
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={`px-2.5 py-1 text-sm rounded transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900 font-semibold'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-4 bg-gray-200 mx-0.5 inline-block" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | 'error' | null

  // Keep title in both state (for controlled input) and a ref (for stable save callback)
  const [title, setTitle] = useState('')
  const titleRef = useRef('')
  const hasChangesRef = useRef(false)

  // ── Editor ──────────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editorProps: {
      attributes: {
        class: 'editor-content focus:outline-none',
      },
    },
    onUpdate: () => {
      hasChangesRef.current = true
    },
  })

  // ── Load document ───────────────────────────────────────────────────────────

  const [initialContent, setInitialContent] = useState(null)

  useEffect(() => {
    getDoc(id)
      .then((doc) => {
        setTitle(doc.title ?? '')
        titleRef.current = doc.title ?? ''
        setIsOwner(doc.isOwner)
        setInitialContent(doc.content || '<p></p>')
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Set editor content once both editor and fetched content are ready
  useEffect(() => {
    if (editor && initialContent !== null) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  // ── Save ────────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    if (!editor) return
    setSaveStatus('saving')
    try {
      await updateDoc(id, {
        title: titleRef.current,
        content: editor.getHTML(),
      })
      hasChangesRef.current = false
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('error')
    }
  }, [id, editor])

  // Auto-save every 30 seconds if unsaved changes exist
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasChangesRef.current) save()
    }, 30_000)
    return () => clearInterval(interval)
  }, [save])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    titleRef.current = e.target.value
    hasChangesRef.current = true
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          Loading document…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Action bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400">Saving…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-500">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500">Save failed</span>
          )}

          {isOwner && (
            <button
              onClick={() => setShowShare(true)}
              className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Share
            </button>
          )}

          <button
            onClick={save}
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Editable title */}
        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Document"
          className="w-full text-3xl font-bold text-gray-900 mb-6 focus:outline-none placeholder-gray-300 bg-transparent"
        />

        {/* Formatting toolbar */}
        <div className="flex items-center flex-wrap gap-0.5 border border-gray-200 rounded-lg px-2 py-1.5 mb-4 w-fit bg-white">
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold')}
            title="Bold"
          >
            <strong>B</strong>
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic')}
            title="Italic"
          >
            <em>I</em>
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor?.isActive('underline')}
            title="Underline"
          >
            <span className="underline">U</span>
          </ToolBtn>

          <Divider />

          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor?.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolBtn>

          <Divider />

          <ToolBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList')}
            title="Bullet List"
          >
            • List
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList')}
            title="Numbered List"
          >
            1. List
          </ToolBtn>
        </div>

        {/* TipTap editor */}
        <div className="border border-gray-200 rounded-xl overflow-hidden min-h-[480px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showShare && (
        <ShareModal docId={id} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
