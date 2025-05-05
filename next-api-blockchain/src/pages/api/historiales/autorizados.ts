import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenData } from '@/middleware/auth';
import { listAuthorizedHistoriales } from '@/controllers/permisosController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const userData = getTokenData(token);
    if (userData.role !== 'medico') {
      return res.status(403).json({ error: 'Solo médicos pueden ver historiales autorizados' });
    }

    const accesos = await listAuthorizedHistoriales(userData.id);
    res.status(200).json({ accesos });
  } catch (error) {
    console.error('❌ Error en autorizados.ts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
