import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import * as vc from '@digitalbazaar/vc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contexto local
const contexts = {
  "https://w3id.org/security/suites/ed25519-2020/v1": JSON.parse(
    fs.readFileSync(path.join(__dirname, 'contexts/ed25519-2020-v1.json'))
  )
};

const customLoader = async (url) => {
  if (contexts[url]) {
    return {
      document: contexts[url]
    };
  }
  // fallback: usar el loader por defecto si no es nuestro contexto
  return vc.defaultDocumentLoader(url);
};

const keyPair = await Ed25519VerificationKey2020.from({
  id: 'did:key:z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo#key-1',
  controller: 'did:key:z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo',
  publicKeyMultibase: 'z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo',
  privateKeyMultibase: 'zrv4vqGYe1DFzoqdoR323ucSwUY1bxDpM1P8yfg89H8Ae42GTRJDVoUsogNWXk1pTkn684aJ4Hvp1wNDdpfs8nvUBx9'
});

const credential = {
  "@context": [
  "https://www.w3.org/2018/credentials/v1",
  "https://w3id.org/security/suites/ed25519-2020/v1",
  {
    "name": "https://schema.org/name",
    "role": "https://schema.org/roleName"
  }
],

  id: "https://example.com/credentials/001",
  type: ["VerifiableCredential"],
  issuer: { id: "did:key:z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo" },
  issuanceDate: new Date().toISOString(),
  "credentialSubject": {
  "id": "did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5cudZtt8FR1svuKxGTd6Xkg7dWCuNPK7iLVrbFnnuQtYj2pApwgNqJyaiHxpbhW",
  "name": "Alex",
  "role": "Paciente"
}

};

const suite = new Ed25519Signature2020({ key: keyPair });

const signedVC = await vc.issue({
  credential,
  suite,
  documentLoader: customLoader
});

console.log("✅ VC firmada:");
console.log(JSON.stringify(signedVC, null, 2));

fs.writeFileSync(path.join(__dirname, '..', 'public', 'signed-vc.json'), JSON.stringify(signedVC, null, 2));
console.log("✅ VC guardada como public/signed-vc.json");

