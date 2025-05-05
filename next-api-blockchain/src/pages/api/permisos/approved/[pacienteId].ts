import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToContract } from '@/lib/fabric';
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

    if (userData.role !== 'paciente') {
      return res.status(403).json({ error: 'Solo los pacientes pueden listar accesos otorgados' });
    }

    const pacienteDid = userData.id;

    const { contract, gateway } = await connectToContract();
    const result = await contract.evaluateTransaction('listApprovedAccesses', pacienteDid);
    await gateway.disconnect();

    const accesos = JSON.parse(result.toString());

    return res.status(200).json({ accesos });
  } catch (error) {
    console.error('Error listando accesos otorgados:', error);
    return res.status(500).json({ error: 'Error listando accesos otorgados' });
  }
}
