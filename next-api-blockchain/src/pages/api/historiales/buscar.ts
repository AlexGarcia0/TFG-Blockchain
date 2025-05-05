import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllHistoriales, checkAccess } from '@/controllers/permisosController';
import { getTokenData } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const nombre = req.query.nombre as string;
  if (!nombre) return res.status(400).json({ error: 'Nombre no proporcionado' });

  const token = req.headers.authorization?.split(' ')[1];
  const userData = getTokenData(token);

  if (userData.role !== 'medico') return res.status(403).json({ error: 'Solo médicos pueden buscar por nombre' });

  try {
    const historiales = await getAllHistoriales();
    const resultados = [];

    for (const h of historiales) {
      if (h.given_name?.toLowerCase() === nombre.toLowerCase()) {
        const yaAprobado = await checkAccess(userData.id, h.cid); 
        resultados.push({ ...h, yaAprobado }); 
      }
    }

    return res.status(200).json({ historiales: resultados });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
