import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenData } from '@/middleware/auth';
import formidable from 'formidable';
import { create } from 'ipfs-http-client';
import { guardarHistorial } from '@/controllers/permisosController';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ipfs = create({
  host: 'localhost',
  port: 5001,
  protocol: 'http'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  const userData = getTokenData(token);

  if (userData.role.toLowerCase() !== 'paciente') {
    return res.status(403).json({ error: 'Solo los pacientes pueden subir historiales' });
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error procesando el formulario:', err);
      return res.status(500).json({ error: 'Error procesando archivo' });
    }

    const file = files.file?.[0] || files.file;
    const pacienteId = fields.pacienteId?.[0] || userData.id;
    const clave = fields.clave?.[0];
    const nombreArchivo = fields.nombreArchivo?.[0] || 'archivo_sin_nombre.pdf'; 

    if (!file || !pacienteId || !clave || !nombreArchivo) {
      return res.status(400).json({ error: 'Archivo, pacienteId o clave faltante' });
    }

    try {
      const fileData = fs.readFileSync(file.filepath);  
      const result = await ipfs.add(fileData);  

      const cid = result.path; 
      const timestamp = new Date().toISOString(); 
      const archivoGuardado = await guardarHistorial(
        pacienteId,
        cid,
        timestamp,
        nombreArchivo,
        clave,
        userData.name // <-- nombre del paciente extraído del token (given_name + family_name)
      );

      return res.status(200).json({ message: 'Historial subido y guardado correctamente', cid, nombreArchivo });
    } catch (error) {
      console.error('Error subiendo historial:', error);
      return res.status(500).json({ error: 'Error subiendo historial' });
    }
  });
}
