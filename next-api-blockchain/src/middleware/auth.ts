import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

export function verifyToken(req: NextApiRequest, res: NextApiResponse): boolean {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(403).json({ error: 'Token no proporcionado' })
    return false
  }

  const token = authHeader.split(' ')[1]

  try {
    jwt.verify(token, process.env.JWT_SECRET as string)
    return true
  } catch (err) {
    res.status(403).json({ error: 'Token inválido o expirado' })
    return false
  }
}

export function getTokenData(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string)
    return decoded as any
  } catch (error) {
    throw new Error('Token inválido')
  }
}
