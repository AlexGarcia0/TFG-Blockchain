// src/pages/api/credentials/issue.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { signVerifiableCredential } from '@/lib/identity/signCredential';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { subjectDid, subjectData } = req.body;

    if (!subjectDid || !subjectData) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const credential = await signVerifiableCredential(subjectDid, subjectData);
    return res.status(200).json(credential);
  } catch (error) {
    console.error('Error al emitir credencial:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
