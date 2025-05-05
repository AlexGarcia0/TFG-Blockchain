import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenData } from '@/middleware/auth';
import { getClave } from '@/controllers/permisosController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { cid } = req.query;

  if (!cid || typeof cid !== 'string') {
    return res.status(400).json({ error: 'CID inválido' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const userData = getTokenData(token);
  const userId = userData.id;
  const role = userData.role;

  try {
    console.log(`Petición de clave -> userId: ${userId}, role: ${role}, cid: ${cid}`);

    const clave = await getClave(userId, cid);

    if (!clave) {
      return res.status(404).json({ error: 'Clave no encontrada' });
    }

    return res.status(200).json({ clave });
  } catch (error: any) {
    console.error('Error obteniendo clave:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
