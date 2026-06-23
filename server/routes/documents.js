import { Router } from 'express'
import { supabase } from '../supabase.js'
import { auth } from '../middleware/auth.js'

const router = Router()

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetches a document and checks the caller has access.
 * If requireOwner is true, also verifies ownership.
 * Returns { doc, isOwner } on success, or { httpStatus, message } on failure.
 */
async function resolveDoc(docId, userId, userEmail, requireOwner = false) {
  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', docId)
    .single()

  if (error || !doc) return { httpStatus: 404, message: 'Document not found' }

  const isOwner = doc.owner_id === userId

  if (!isOwner) {
    if (requireOwner) return { httpStatus: 403, message: 'Only the owner can perform this action' }

    const { data: share } = await supabase
      .from('shares')
      .select('id')
      .eq('document_id', docId)
      .eq('shared_with_email', userEmail)
      .maybeSingle()

    if (!share) return { httpStatus: 404, message: 'Document not found' }
  }

  return { doc, isOwner }
}

// ─── GET /api/documents ───────────────────────────────────────────────────────
// Returns owned docs and docs shared with the user separately.

router.get('/', auth, async (req, res) => {
  try {
    const { id: userId, email: userEmail } = req.user

    const [{ data: owned, error: ownedErr }, { data: shareRows, error: sharesErr }] =
      await Promise.all([
        supabase
          .from('documents')
          .select('*')
          .eq('owner_id', userId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('shares')
          .select('document_id')
          .eq('shared_with_email', userEmail),
      ])

    if (ownedErr) throw ownedErr
    if (sharesErr) throw sharesErr

    let shared = []
    if (shareRows.length > 0) {
      const ids = shareRows.map((s) => s.document_id)
      const { data: sharedDocs, error: sharedErr } = await supabase
        .from('documents')
        .select('*')
        .in('id', ids)
        .order('updated_at', { ascending: false })

      if (sharedErr) throw sharedErr
      shared = sharedDocs
    }

    res.json({
      data: {
        owned: owned.map((d) => ({ ...d, isOwner: true })),
        shared: shared.map((d) => ({ ...d, isOwner: false })),
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/documents ──────────────────────────────────────────────────────

router.post('/', auth, async (req, res) => {
  try {
    const { title = 'Untitled Document', content = '' } = req.body

    const { data, error } = await supabase
      .from('documents')
      .insert({ title, content, owner_id: req.user.id })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ data: { ...data, isOwner: true } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/documents/:id ───────────────────────────────────────────────────

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await resolveDoc(req.params.id, req.user.id, req.user.email)
    if (result.httpStatus) return res.status(result.httpStatus).json({ error: result.message })

    res.json({ data: { ...result.doc, isOwner: result.isOwner } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PATCH /api/documents/:id ─────────────────────────────────────────────────
// Owner and shared users can update title and content.

router.patch('/:id', auth, async (req, res) => {
  try {
    const result = await resolveDoc(req.params.id, req.user.id, req.user.email)
    if (result.httpStatus) return res.status(result.httpStatus).json({ error: result.message })

    const { title, content } = req.body
    const updates = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update: title, content' })
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', result.doc.id)
      .select()
      .single()

    if (error) throw error

    res.json({ data: { ...data, isOwner: result.isOwner } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/documents/:id ────────────────────────────────────────────────
// Owner only.

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await resolveDoc(req.params.id, req.user.id, req.user.email, true)
    if (result.httpStatus) return res.status(result.httpStatus).json({ error: result.message })

    const { error } = await supabase.from('documents').delete().eq('id', req.params.id)
    if (error) throw error

    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
