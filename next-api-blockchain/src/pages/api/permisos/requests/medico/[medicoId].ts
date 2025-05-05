import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/middleware/auth';
import { connectToContract } from '@/lib/fabric';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyToken(req, res)) return;

  const medicoId = req.query.medicoId as string;

  try {
    const { contract, gateway } = await connectToContract();
    const result = await contract.evaluateTransaction('listRequestsByMedico', medicoId);
    await gateway.disconnect();

    return res.status(200).json({ solicitudes: JSON.parse(result.toString()) });
  } catch (error: any) {
    console.error('Error en listRequestsByMedico:', error);
    return res.status(500).json({ error: error.message });
  }
}
