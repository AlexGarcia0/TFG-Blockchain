import { obtenerClave } from '@/lib/fabric';
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { medicoId, cid } = req.query;
    const clave = await obtenerClave(medicoId as string, cid as string);
    res.status(200).send(clave);
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
}
