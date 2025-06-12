import type { NextApiRequest, NextApiResponse } from 'next';
import { checkAccess, listarHistoriales, getAllHistoriales, getClave } from '@/controllers/permisosController';
import { getTokenData } from '@/middleware/auth';
import { downloadFromIPFS } from '@/lib/ipfs/download';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { cid } = req.query;
  if (!cid || typeof cid !== 'string') {
    return res.status(400).json({ error: 'CID inválido' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const userData = getTokenData(token);
    const userId = userData?.id;
    const role = userData?.role;

    if (role === 'paciente') {
      const historiales = await listarHistoriales(userId);
      const tieneHistorial = historiales.some((h: any) => h.cid === cid);
      if (!tieneHistorial) {
        return res.status(403).json({ error: 'El historial no pertenece al paciente' });
      }
    }

    if (role === 'medico') {
      const tienePermiso = await checkAccess(userId, cid);
      if (!tienePermiso) {
        return res.status(403).json({ error: 'El médico no tiene acceso a este historial' });
      }
    }

    // Descargar desde IPFS
    const encryptedBuffer = await downloadFromIPFS(cid);
    const encryptedText = encryptedBuffer.toString();

    // Buscar en la blockchain los metadatos del historial
    const todos = await getAllHistoriales();
    const historial = todos.find((h: any) => h.cid === cid);

    if (!historial) {
      return res.status(404).json({ error: 'Historial no encontrado en la blockchain' });
    }

    const response: any = {
      contenido: encryptedText,
      pacienteId: historial.pacienteId,
      nombreArchivo: historial.nombreArchivo
    };

    if (role === 'medico') {
      const clave = await getClave(userId, cid);
      if (clave) response.clave = clave;
    }

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error al obtener historial:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
