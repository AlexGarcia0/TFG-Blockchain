import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import * as vc from '@digitalbazaar/vc';
import jsonldSignatures from 'jsonld-signatures';
const AssertionProofPurpose = jsonldSignatures.purposes.AssertionProofPurpose;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DID del emisor
const issuerDid = 'did:key:z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo';

// Contextos y DID Document locales
const contexts = {
  "https://w3id.org/security/suites/ed25519-2020/v1": JSON.parse(
    fs.readFileSync(path.join(__dirname, 'contexts/ed25519-2020-v1.json'))
  ),
  [issuerDid]: {
    "@context": {
      "@vocab": "https://w3id.org/security#",
      "id": "@id",
      "type": "@type"
    },
    id: issuerDid,
    assertionMethod: [{
      id: issuerDid + "#key-1",
      type: "Ed25519VerificationKey2020",
      controller: issuerDid,
      publicKeyMultibase: 'z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo'
    }],
    verificationMethod: [{
      id: issuerDid + "#key-1",
      type: "Ed25519VerificationKey2020",
      controller: issuerDid,
      publicKeyMultibase: 'z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo'
    }]
  }
};

// Loader personalizado
const customLoader = async (url) => {
  if (contexts[url]) {
    return { document: contexts[url] };
  }
  return vc.defaultDocumentLoader(url);
};

// Cargar la VC firmada
const signedVC = JSON.parse(fs.readFileSync('signed-vc.json'));

// Crear suite con la clave pública
const keyPair = await Ed25519VerificationKey2020.from({
  id: issuerDid + '#key-1',
  controller: issuerDid,
  publicKeyMultibase: 'z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo'
});
const suite = new Ed25519Signature2020({ key: keyPair });

// Verificar
const result = await vc.verifyCredential({
  credential: signedVC,
  suite,
  documentLoader: customLoader,
  purpose: new AssertionProofPurpose()
});

console.log("✅ ¿Es válida?", result.verified);
if (!result.verified) {
  console.error("❌ Errores de verificación:", result.error || result);
}
