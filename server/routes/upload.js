import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { marked } from 'marked'
import { auth } from '../middleware/auth.js'

const router = Router()

const ALLOWED_EXTENSIONS = ['.txt', '.md']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`Only .txt and .md files are accepted. Received: ${ext || 'no extension'}`))
    }
  },
})

// ─── POST /api/upload ─────────────────────────────────────────────────────────

router.post('/', auth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File exceeds the 5 MB size limit' })
    }
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' })
    }

    const ext = path.extname(req.file.originalname).toLowerCase()
    const rawText = req.file.buffer.toString('utf-8')

    // Derive document title from filename (strip extension)
    const title = path.basename(req.file.originalname, ext).replace(/[-_]+/g, ' ').trim()

    let content
    if (ext === '.md') {
      // Convert Markdown → HTML for TipTap
      content = await marked.parse(rawText)
    } else {
      // .txt — wrap each non-empty paragraph in <p> tags
      content = rawText
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('')

      if (!content) content = '<p></p>'
    }

    res.json({ data: { title, content } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
