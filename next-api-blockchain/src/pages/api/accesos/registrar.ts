import { registrarAcceso } from '@/lib/fabric';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { medicoId, pacienteId, cid, timestamp, medicoName, nombreArchivo } = req.body;
    console.log("📥 Acceso recibido:", { medicoId, pacienteId, cid, timestamp, medicoName, nombreArchivo });

    await registrarAcceso(medicoId, pacienteId, cid, timestamp, medicoName, nombreArchivo);
  
    console.log("✅ Acceso registrado en blockchain.");

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("❌ Error registrando acceso:", e);
    res.status(500).json({ error: e.message });
  }
}

