// src/lib/identity/signCredential.ts

import * as vc from '@digitalbazaar/vc';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';

const publicKeyMultibase = process.env.DID_PUBLIC_KEY!;
const privateKeyMultibase = process.env.DID_PRIVATE_KEY!;
const controller = process.env.DID_CONTROLLER!;

export async function signVerifiableCredential(subjectDid: string, subjectData: any) {
  const keyPair = await Ed25519VerificationKey2020.from({
    id: `${controller}#key-1`,
    controller,
    publicKeyMultibase,
    privateKeyMultibase,
  });

  const credential = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://api-pilot.ebsi.eu/trusted-schemas/v2/natural-person.json"
    ],
    id: `https://example.com/credentials/${Date.now()}`,
    type: ["VerifiableCredential", "VerifiableId"],
    issuer: { id: controller },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDid,
      ...subjectData
    }
  };

  const suite = new Ed25519Signature2020({ key: keyPair });

  const signedVC = await vc.issue({
    credential,
    suite,
    documentLoader: vc.defaultDocumentLoader,
  });

  return signedVC;
}
