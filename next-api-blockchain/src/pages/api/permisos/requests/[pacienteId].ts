import type { NextApiRequest, NextApiResponse } from 'next';
import { listRequests } from '@/controllers/permisosController';
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
    const pacienteId = userData.id; 

    const solicitudes = await listRequests(pacienteId);

    res.status(200).json({ solicitudes });
  } catch (error: any) {
    console.error('Error en handler solicitudes:', error);
    res.status(500).json({ error: error.message || 'Error interno' });
  }
}
