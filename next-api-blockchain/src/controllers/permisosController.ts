import { connectToContract } from '@/lib/fabric';

export async function requestAccess(medicoId: string, pacienteId: string, cid: string, nombreArchivo: string, medicoName: string) {
  const { contract, gateway } = await connectToContract();
  await contract.submitTransaction('requestAccess', medicoId, pacienteId, cid, nombreArchivo, medicoName);
  await gateway.disconnect();
}


export async function approveAccess(medicoId: string, cid: string, clave: string, nombreArchivo: string) {
  const { contract, gateway } = await connectToContract();
  await contract.submitTransaction('approveAccess', medicoId, cid, clave, nombreArchivo); 
  await gateway.disconnect();
}


export async function denyAccess(medicoId: string, cid: string) {
  const { contract, gateway } = await connectToContract();
  await contract.submitTransaction('denyAccess', medicoId, cid);
  await gateway.disconnect();
}

export async function revokeAccess(medicoId: string, cid: string) {
  const { contract, gateway } = await connectToContract();
  await contract.submitTransaction('revokeAccess', medicoId, cid);
  await gateway.disconnect();
}

export async function checkAccess(medicoId: string, cid: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('checkAccess', medicoId, cid);
  await gateway.disconnect();
  return result.toString() === 'true';
}

export async function listAuthorizedHistoriales(medicoId: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('listAuthorizedHistoriales', medicoId);
  await gateway.disconnect();
  return JSON.parse(result.toString());
}


export async function guardarHistorial(pacienteId: string, cid: string, timestamp: string, nombreArchivo: string, clave: string, given_name: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.submitTransaction(
    'guardarHistorial',
    pacienteId,
    cid,
    timestamp,
    nombreArchivo,
    clave,
    given_name 
  );
  await gateway.disconnect();
  return result.toString();
}

export async function listarHistoriales(pacienteId: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('listHistoriales', pacienteId);
  await gateway.disconnect();
  return JSON.parse(result.toString());
}

export async function getAllHistoriales() {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('getAllHistoriales');
  await gateway.disconnect();
  return JSON.parse(result.toString());
}

export async function listRequests(pacienteId: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('listRequests', pacienteId);
  await gateway.disconnect();
  return JSON.parse(result.toString());
}


export async function registrarAcceso(
  medicoId: string,
  pacienteId: string,
  cid: string,
  timestamp: string,
  medicoName: string,
  nombreArchivo: string
) {
  const { contract, gateway } = await connectToContract();
  await contract.submitTransaction('registrarAcceso', medicoId, pacienteId, cid, timestamp, medicoName, nombreArchivo);
  await gateway.disconnect();
}



export async function listarAccesosPorPaciente(pacienteId: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('listarAccesosPorPaciente', pacienteId);
  await gateway.disconnect();
  return JSON.parse(result.toString());
}

export async function obtenerClave(medicoId: string, cid: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('obtenerClave', medicoId, cid);
  await gateway.disconnect();
  return result.toString(); // devuelve la clave si hay permiso
}


// ====================
// Manejo de claves en memoria (opcional y temporal)
// ====================
const clavesGuardadas: Record<string, string> = {};

export async function saveClave(medicoId: string, cid: string, clave: string) {
  const key = `${medicoId}_${cid}`;
  console.log(`Guardando clave -> key: ${key}, clave: ${clave}`);
  clavesGuardadas[key] = clave;
}

export async function getClave(medicoId: string, cid: string) {
  const { contract, gateway } = await connectToContract();
  const accessKey = `access_${medicoId}_${cid}`;
  const result = await contract.evaluateTransaction('GetState', accessKey);
  await gateway.disconnect();

  if (!result || !result.toString()) return null;

  const data = JSON.parse(result.toString());
  return data.clave || null;
}

