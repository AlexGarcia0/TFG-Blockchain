import type { NextApiRequest, NextApiResponse } from 'next';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { verifyCredential } from '@digitalbazaar/vc';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { purposes, extendContextLoader } from 'jsonld-signatures';
import nodeDocumentLoader from 'jsonld/lib/documentLoaders/node.js';

const { AssertionProofPurpose } = purposes;

// Claves públicas conocidas
const issuerDidKey1 = 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d4PRNJBn5B1CoaBH5q9oyoTF4jkfbSKZR7C4XZLD1AFB9jGgg5e25NC6J8wXzU';
const issuerDidKey2 = 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d2qcJ41HbZXCNYRMUvzcYkYveR3jB8QP8pCScUnrCCe95rZLuZMqbuGJcLuCP6'; // Nueva clave del médico Juan
const issuerDidEbsi = 'did:ebsi:123';

const publicKeyMap: Record<string, string> = {
  [issuerDidKey1]: 'z6Mkhu6G6yB49C44LCJMgqNbEVaeYz3Ay2UmKV8vpD5w5QPQ',
  [issuerDidKey2]: 'z6MkkEHvq9jq9K1zaeC1kkfRRE3LDd5rw4Y5oKxQRXem4G7u', // Nueva clave pública de Juan
  [issuerDidEbsi]: 'z6Mkk1JnKCHiBPZF9NSkXcvfA972T3oZq8EgUqMVYtLw3kBo'
};



// Contextos locales
const contexts: Record<string, any> = {
  'https://w3id.org/security/suites/ed25519-2020/v1': JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/contexts/ed25519-2020-v1.json'), 'utf-8')
  ),
  'https://example.com/context': {
    '@context': {
      VerifiableAttestation: 'https://example.com/terms/VerifiableAttestation',
      VerifiablePID: 'https://example.com/terms/VerifiablePID',
      PacienteCredential: 'https://example.com/terms/PacienteCredential',
      MedicoCredential: 'https://example.com/terms/MedicoCredential',
      personIdentificationData: 'https://schema.org/PersonIdentificationData',
      family_name: 'https://schema.org/familyName',
      given_name: 'https://schema.org/givenName',
      birth_date: 'https://schema.org/birthDate',
      birth_place: 'https://schema.org/birthPlace',
      nationality: 'https://schema.org/nationality',
      resident_address: 'https://schema.org/address',
      resident_country: 'https://schema.org/addressCountry',
      resident_state: 'https://schema.org/addressRegion',
      resident_city: 'https://schema.org/addressLocality',
      resident_postal_code: 'https://schema.org/postalCode',
      resident_street: 'https://schema.org/streetAddress',
      resident_house_number: 'https://schema.org/houseNumber',
      personal_administrative_number: 'https://schema.org/identifier',
      sex: 'https://schema.org/gender',
      expiry_date: 'https://schema.org/expiryDate',
      issuing_authority: 'https://schema.org/issuingAuthority',
      issuing_country: 'https://schema.org/issuingCountry'
    }
  }
};

// Loader personalizado
const customLoader = async (url: string) => {
  if (contexts[url]) return { document: contexts[url] };

  if (url.startsWith('did:key:')) {
    const did = url.split('#')[0];
    const publicKeyMultibase = publicKeyMap[did];
    if (!publicKeyMultibase) throw new Error(`Clave pública no encontrada para ${did}`);
    const key = await Ed25519VerificationKey2020.from({
      id: `${did}#key-1`,
      controller: did,
      publicKeyMultibase
    });
    return {
      document: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: did,
        verificationMethod: [await key.export({ publicKey: true })],
        assertionMethod: [`${did}#key-1`]
      }
    };
  }

  return extendContextLoader(nodeDocumentLoader())(url);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { verifiableCredential: vc, role } = req.body;
  if (!vc || !role) {
    return res.status(400).json({ valid: false, error: 'Faltan verifiableCredential o role' });
  }

  try {
    const proof = Array.isArray(vc.proof) ? vc.proof[0] : vc.proof;
    const verificationMethod = proof.verificationMethod;
    const controllerDID = verificationMethod.split('#')[0];

    const publicKeyMultibase = publicKeyMap[controllerDID];
    if (!publicKeyMultibase) {
      return res.status(400).json({ valid: false, error: `Clave pública no conocida para ${controllerDID}` });
    }

    const keyPair = await Ed25519VerificationKey2020.from({
      id: verificationMethod,
      controller: controllerDID,
      publicKeyMultibase
    });

    const suite = new Ed25519Signature2020({ key: keyPair });

    const result = await verifyCredential({
      credential: vc,
      suite,
      documentLoader: customLoader,
      purpose: new AssertionProofPurpose(),
      checkStatus: async () => ({ verified: true }) // Suprime status check externo
    });

    if (!result.verified) {
      console.error("❌ Verificación fallida:", result);
      return res.status(400).json({ valid: false, error: 'Verificación fallida', details: result });
    }

    const vcTypes = Array.isArray(vc.type) ? vc.type : [];
    if (role === 'paciente' && !vcTypes.includes('PacienteCredential')) {
      return res.status(403).json({ valid: false, error: 'Credencial no válida para rol paciente' });
    }
    if (role === 'medico' && !vcTypes.includes('MedicoCredential')) {
      return res.status(403).json({ valid: false, error: 'Credencial no válida para rol médico' });
    }

    const pid = vc.credentialSubject?.personIdentificationData;
    const fullName = `${pid?.given_name || ''} ${pid?.family_name || ''}`.trim();

    const subject = typeof vc.credentialSubject === 'string'
      ? { id: vc.credentialSubject }
      : vc.credentialSubject;

    const token = jwt.sign(
      { id: subject.id, role, name: fullName },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    );

    return res.json({ valid: true, token });
  } catch (err: any) {
    console.error('🔴 Error en verificación:', err);
    return res.status(500).json({ valid: false, error: err.message });
  }
}
