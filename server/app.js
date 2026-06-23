import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import documentsRouter from './routes/documents.js'
import sharesRouter from './routes/shares.js'
import uploadRouter from './routes/upload.js'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)

app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/documents', documentsRouter)
app.use('/api/documents/:id/share', sharesRouter)
app.use('/api/documents/:id/shares', sharesRouter)
app.use('/api/upload', uploadRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

export default app
