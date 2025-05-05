import type { NextApiRequest, NextApiResponse } from 'next';
import { checkAccess } from '@/controllers/permisosController';
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

    if (userData.role !== 'medico') {
      return res.status(403).json({ error: 'Solo los médicos pueden verificar accesos' });
    }

    const pacienteId = req.query.pacienteId as string;

    const access = await checkAccess(userData.id, pacienteId);
    return res.status(200).json({ access });
  } catch (error: any) {
    console.error('Error verificando acceso:', error);
    return res.status(500).json({ error: error.message });
  }
}
