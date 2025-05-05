import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenData } from '@/middleware/auth';
import { approveAccess, saveClave } from '@/controllers/permisosController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ Token no proporcionado');
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const userData = getTokenData(token);
    const pacienteId = userData.id;
    console.log('✅ Token OK. Paciente ID:', pacienteId);

    if (userData.role !== 'paciente') {
      console.log('❌ Rol no permitido:', userData.role);
      return res.status(403).json({ error: 'Solo los pacientes pueden aprobar accesos' });
    }

    const { cid, clave, medicoDid, nombreArchivo } = req.body;

    if (!medicoDid || !cid || !clave || !nombreArchivo) {
      return res.status(400).json({
        error: 'Faltan datos necesarios (medicoDid, cid, clave o nombreArchivo)',
        medicoDid: !!medicoDid,
        cid: !!cid,
        clave: !!clave,
        nombreArchivo: !!nombreArchivo
      });
    }

    await approveAccess(medicoDid, cid, clave, nombreArchivo);


    console.log('🔓 approveAccess ejecutado correctamente');

    return res.status(200).json({ message: `Acceso concedido al médico ${medicoDid}` });

  } catch (error: any) {
    console.error('❌ Error en approve.ts:', error);
    return res.status(500).json({ error: 'Error aprobando acceso' });
  }
}
