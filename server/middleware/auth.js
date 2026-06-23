import { supabase } from '../supabase.js'

/**
 * Verifies the Supabase JWT in the Authorization header.
 * Attaches the authenticated user to req.user on success.
 */
export async function auth(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }

  const token = header.slice(7)

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Authentication failed' })
  }
}
