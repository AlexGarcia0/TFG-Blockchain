import type { NextApiRequest, NextApiResponse } from 'next';
import { listarHistoriales } from '@/controllers/permisosController';
import { getTokenData } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const userData = getTokenData(token);

    if (userData.role !== 'paciente') {
      return res.status(403).json({ error: 'Solo los pacientes pueden listar sus historiales' });
    }

    const historiales = await listarHistoriales(userData.id);
    return res.status(200).json({ historiales });
  } catch (err) {
    console.error('Error al listar historiales:', err);
    return res.status(500).json({ error: 'Error al consultar historiales' });
  }
}
