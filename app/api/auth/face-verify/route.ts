import { NextResponse } from 'next/server'
import { dbOne, dbAll } from '@/lib/db'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const FACE_SECRET = process.env.FACE_LOGIN_SECRET || process.env.SESSION_SECRET || 'zgold-face-secret'

export async function POST(req: Request) {
  try {
    const { faceToken } = await req.json()

    if (!faceToken) {
      return NextResponse.json({ error: 'Face token required' }, { status: 400 })
    }

    // Verify ZFace token
    let payload: any
    try {
      payload = jwt.verify(faceToken, FACE_SECRET)
    } catch (err: any) {
      if (err.name === 'ExpiredSignatureError') {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!payload.face_login) {
      return NextResponse.json({ error: 'Not a face login token' }, { status: 400 })
    }

    const faceId = payload.sub
    const personName = payload.person_name

    if (!faceId) {
      return NextResponse.json({ error: 'No face ID' }, { status: 400 })
    }

    // Find user by face_id (exact match first)
    let user = await dbOne('SELECT * FROM users WHERE face_id = $1', [faceId])

    // Fallback: name match
    if (!user && personName) {
      const users = await dbAll('SELECT * FROM users WHERE is_active = true')
      const faceName = personName.toLowerCase().trim()
      const faceParts = faceName.split(/\s+/)

      let bestScore = 0
      for (const u of users) {
        const userName = (u.nama || '').toLowerCase().trim()
        const userParts = userName.split(/\s+/)
        let score = 0

        if (userName === faceName) score = 100
        else if (userName.includes(faceName) || faceName.includes(userName)) score = 80
        else {
          for (const fp of faceParts) {
            for (const up of userParts) {
              if (fp === up) score += 60
              else if (fp.includes(up) || up.includes(fp)) score += 30
            }
          }
        }

        if (score > bestScore) {
          bestScore = score
          user = u
        }
      }
      if (bestScore < 30) user = null
    }

    if (!user) {
      return NextResponse.json({
        error: `Wajah "${personName}" tidak cocok dengan user manapun`,
      }, { status: 404 })
    }

    // Link face_id if not linked yet
    if (!user.face_id) {
      await dbOne('UPDATE users SET face_id = $1 WHERE id = $2', [faceId, user.id])
    }

    // Create session (same as normal login)
    const sessionId = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await dbOne(
      'INSERT INTO sessions (id, user_id, tenant_id, expires_at) VALUES ($1, $2, $3, $4)',
      [sessionId, user.id, user.tenant_id, expires]
    )

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    })

    res.cookies.set('session_token', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return res
  } catch (error) {
    console.error('Face verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
