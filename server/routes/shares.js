import { Router } from 'express'
import { supabase } from '../supabase.js'
import { auth } from '../middleware/auth.js'

// mergeParams: true lets us access :id from the parent router (documents/:id/...)
const router = Router({ mergeParams: true })

// ─── helper ───────────────────────────────────────────────────────────────────

async function assertOwner(docId, userId) {
  const { data: doc, error } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', docId)
    .single()

  if (error || !doc) return { httpStatus: 404, message: 'Document not found' }
  if (doc.owner_id !== userId) return { httpStatus: 403, message: 'Only the owner can manage shares' }
  return { ok: true }
}

// ─── POST /api/documents/:id/share ───────────────────────────────────────────

router.post('/', auth, async (req, res) => {
  try {
    const { id: docId } = req.params
    const { email } = req.body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' })
    }

    const check = await assertOwner(docId, req.user.id)
    if (!check.ok) return res.status(check.httpStatus).json({ error: check.message })

    const normalized = email.trim().toLowerCase()

    if (normalized === req.user.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot share a document with yourself' })
    }

    const { data, error } = await supabase
      .from('shares')
      .insert({
        document_id: docId,
        owner_id: req.user.id,
        shared_with_email: normalized,
      })
      .select()
      .single()

    if (error) {
      // Unique constraint violation → already shared
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Document is already shared with this email' })
      }
      throw error
    }

    res.status(201).json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/documents/:id/shares ───────────────────────────────────────────

router.get('/', auth, async (req, res) => {
  try {
    const { id: docId } = req.params

    const check = await assertOwner(docId, req.user.id)
    if (!check.ok) return res.status(check.httpStatus).json({ error: check.message })

    const { data, error } = await supabase
      .from('shares')
      .select('id, shared_with_email, created_at')
      .eq('document_id', docId)
      .order('created_at', { ascending: true })

    if (error) throw error

    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/documents/:id/shares/:shareId ───────────────────────────────
// Owner revokes a specific share entry.

router.delete('/:shareId', auth, async (req, res) => {
  try {
    const { id: docId, shareId } = req.params

    const check = await assertOwner(docId, req.user.id)
    if (!check.ok) return res.status(check.httpStatus).json({ error: check.message })

    const { error } = await supabase
      .from('shares')
      .delete()
      .eq('id', shareId)
      .eq('document_id', docId)

    if (error) throw error

    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
