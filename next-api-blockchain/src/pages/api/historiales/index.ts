import type { NextApiRequest, NextApiResponse } from 'next';
import { guardarHistorial } from '@/controllers/permisosController';
import { getTokenData } from '@/middleware/auth';

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
      return res.status(403).json({ error: 'Solo los pacientes pueden guardar historiales' });
    }

    const { pacienteId, cid } = req.body;

    if (!pacienteId || !cid) {
      return res.status(400).json({ error: 'Faltan parámetros (pacienteId o cid)' });
    }

    if (pacienteId !== userData.id) {
      return res.status(403).json({ error: 'No autorizado: el pacienteId no coincide con el token' });
    }

    const result = await guardarHistorial(pacienteId, cid);

    return res.status(200).json({ message: 'Historial guardado', result });
  } catch (error) {
    console.error('Error al guardar historial:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
