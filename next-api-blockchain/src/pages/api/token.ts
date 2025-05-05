import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id, role } = req.body;

  if (!id || !role || (role !== 'medico' && role !== 'paciente')) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  const token = jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: '2h' }
  );

  return res.status(200).json({ token });
}
