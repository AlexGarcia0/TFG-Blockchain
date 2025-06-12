import { Gateway, Wallets } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

const ccpPath = path.resolve(
  process.cwd(),
  'test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json'
);

export async function connectToContract() {
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

  const walletPath = path.resolve(process.cwd(), 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identity = await wallet.get('appUser');
  if (!identity) {
    throw new Error('No se encontró la identidad "appUser" en el wallet.');
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: 'appUser',
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork('mychannel');
  const contract = network.getContract('permisos');

  return { contract, gateway };
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
  await contract.submitTransaction(
    'registrarAcceso',
    medicoId,
    pacienteId,
    cid,
    timestamp,
    medicoName,
    nombreArchivo
  );
  await gateway.disconnect();
}

export async function obtenerClave(medicoId: string, cid: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('obtenerClave', medicoId, cid);
  await gateway.disconnect();
  return result.toString();
}

export async function listarAccesosPorPaciente(pacienteId: string) {
  const { contract, gateway } = await connectToContract();
  const result = await contract.evaluateTransaction('listarAccesosPorPaciente', pacienteId);
  await gateway.disconnect();
  return JSON.parse(result.toString());
}
