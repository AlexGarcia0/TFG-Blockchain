import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenData } from '@/middleware/auth';
import { denyAccess } from '@/controllers/permisosController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const userData = getTokenData(token);

    if (userData.role !== 'paciente') {
      return res.status(403).json({ error: 'Solo los pacientes pueden denegar accesos' });
    }

    const { medicoDid, cid } = req.body;

    if (!medicoDid || !cid) {
      return res.status(400).json({ error: 'Faltan datos necesarios (medicoDid o cid)' });
    }

    await denyAccess(medicoDid, cid); 

    return res.status(200).json({ message: `Acceso denegado al médico ${medicoDid} para el historial ${cid}` });
  } catch (error) {
    console.error('Error denegando acceso:', error);
    return res.status(500).json({ error: 'Error denegando acceso' });
  }
}
