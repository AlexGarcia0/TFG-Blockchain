import { listarAccesosPorPaciente } from '@/lib/fabric';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { pacienteId } = req.query;
    const accesos = await listarAccesosPorPaciente(pacienteId as string);
    res.status(200).json({ accesos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
