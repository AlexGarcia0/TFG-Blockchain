import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, getTokenData } from '@/middleware/auth';
import { requestAccess } from '@/controllers/permisosController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { pacienteId, cid, nombreArchivo, medicoName } = req.body;

    if (!pacienteId || !cid || !nombreArchivo || !medicoName) {
      return res.status(400).json({ error: 'Faltan datos para la solicitud (pacienteId, cid, nombreArchivo o medicoName)' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    const medicoData = getTokenData(token);
    const medicoDid = medicoData.id;
    

    await requestAccess(medicoDid, pacienteId, cid, nombreArchivo, medicoName);

    return res.status(200).json({ message: `Solicitud registrada para el médico ${medicoDid}` });
  } catch (error: any) {
    console.error('Error en request.ts:', error);
    return res.status(500).json({ error: error.message });
  }
}
