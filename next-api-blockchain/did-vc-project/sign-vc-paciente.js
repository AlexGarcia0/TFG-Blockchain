import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import * as vc from '@digitalbazaar/vc';
import jsonldSignatures from 'jsonld-signatures';
const { extendContextLoader } = jsonldSignatures;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodeDocumentLoader from 'jsonld/lib/documentLoaders/node.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contextos JSON-LD
const contexts = {
  'https://w3id.org/security/suites/ed25519-2020/v1': JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'public', 'contexts', 'ed25519-2020-v1.json'), 'utf-8')
  ),
  'https://example.com/context': {
    '@context': {
      VerifiableAttestation: 'https://example.com/terms/VerifiableAttestation',
      VerifiablePID: 'https://example.com/terms/VerifiablePID',
      JsonSchema: 'https://w3id.org/security#JsonSchema',
      CredentialStatusType2023: 'https://example.com/terms/credentialStatus/Type/2023',
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
      issuing_country: 'https://schema.org/issuingCountry',
      PacienteCredential: 'https://example.com/terms/PacienteCredential'
    }
  }
};

const customLoader = async (url) => {
  if (contexts[url]) return { document: contexts[url] };

  if (url.startsWith('did:key:')) {
    const did = url.split('#')[0];
    const knownKeys = {
      'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d4PRNJBn5B1CoaBH5q9oyoTF4jkfbSKZR7C4XZLD1AFB9jGgg5e25NC6J8wXzU':
        'z6Mkhu6G6yB49C44LCJMgqNbEVaeYz3Ay2UmKV8vpD5w5QPQ'
    };
    const publicKey = knownKeys[did];
    if (!publicKey) throw new Error(`Clave pública no conocida para ${did}`);
    const key = await Ed25519VerificationKey2020.from({
      id: `${did}#key-1`,
      controller: did,
      publicKeyMultibase: publicKey
    });
    const didDoc = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: did,
      verificationMethod: [await key.export({ publicKey: true })],
      assertionMethod: [`${did}#key-1`]
    };
    return { document: didDoc };
  }

  return extendContextLoader(nodeDocumentLoader())(url);
};

// Clave paciente
const keyPair = await Ed25519VerificationKey2020.from({
  id: 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d4PRNJBn5B1CoaBH5q9oyoTF4jkfbSKZR7C4XZLD1AFB9jGgg5e25NC6J8wXzU#key-1',
  controller: 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d4PRNJBn5B1CoaBH5q9oyoTF4jkfbSKZR7C4XZLD1AFB9jGgg5e25NC6J8wXzU',
  publicKeyMultibase: 'z6Mkhu6G6yB49C44LCJMgqNbEVaeYz3Ay2UmKV8vpD5w5QPQ',
  privateKeyMultibase: 'zrv47zg9rSHQm1PXwvyk9tNpFmyJmqRx4ExCgXDKAZ3Gjuc2bBgu9XV16bqpFSmwqPXvaGuFEpskSUWL2e6fck9fz6S'
});

const issuerDidEbsi = 'did:ebsi:123';
const pacienteName = 'Alex Garcia';

const now = new Date();
const oneYearLater = new Date(now);
oneYearLater.setFullYear(now.getFullYear() + 1);

const credential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://example.com/context'
  ],
  id: 'https://example.com/credentials/paciente-ebsi',
  type: ['VerifiableCredential', 'VerifiableAttestation', 'VerifiablePID', 'PacienteCredential'],
  issuer: { id: issuerDidEbsi },
  issuanceDate: now.toISOString(),
  validFrom: now.toISOString(),
  validUntil: oneYearLater.toISOString(),
  credentialSchema: {
    id: 'https://api.ebsi.eu/tsr',
    type: 'https://w3id.org/security#JsonSchema'
  },
  credentialStatus: {
    id: 'https://api.ebsi.eu/csl',
    type: 'https://example.com/terms/credentialStatus/Type/2023'
  },
  credentialSubject: {
    id: keyPair.controller,
    personIdentificationData: {
      family_name: 'Dubois',
      given_name: pacienteName,
      birth_date: '1985-05-20',
      birth_place: 'BE',
      nationality: ['BE'],
      resident_address: '456 Elm Ave, Leuven, VBR 3000, Belgium',
      resident_country: 'BE',
      resident_state: 'VBR',
      resident_city: 'Leuven',
      resident_postal_code: '3000',
      resident_street: 'Elm Ave',
      resident_house_number: '456',
      personal_administrative_number: '987654321',
      sex: 2,
      expiry_date: oneYearLater.toISOString(),
      issuing_authority: '',
      issuing_country: 'BE'
    }
  }
};

const signedVC = await vc.issue({
  credential,
  suite: new Ed25519Signature2020({ key: keyPair }),
  documentLoader: customLoader
});

const fileName = `vc-${pacienteName.toLowerCase().replace(/\s+/g, '-')}.json`;
fs.writeFileSync(path.join(__dirname, '..', 'public', fileName), JSON.stringify(signedVC, null, 2));
console.log(`✅ VC Paciente emitida por ${issuerDidEbsi} guardada como public/${fileName}`);
