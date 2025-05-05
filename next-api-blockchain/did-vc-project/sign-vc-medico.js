/*import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
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

// Contextos locales
const contexts = {
  'https://w3id.org/security/suites/ed25519-2020/v1': JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'public', 'contexts', 'ed25519-2020-v1.json'), 'utf-8')
  ),
  'https://example.com/context': {
    '@context': {
      VerifiableAttestation: 'https://example.com/terms/VerifiableAttestation',
      VerifiablePID: 'https://example.com/terms/VerifiablePID',
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

// Custom document loader
const customLoader = async url => {
  if (contexts[url]) return { document: contexts[url] };

  if (url.startsWith('did:key:')) {
    const did = url.split('#')[0];
    const knownKeys = {
      'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d4PRNJBn5B1CoaBH5q9oyoTF4jkfbSKZR7C4XZLD1AFB9jGgg5e25NC6J8wXzU':
        'z6Mkhu6G6yB49C44LCJMgqNbEVaeYz3Ay2UmKV8vpD5w5QPQ'
    };
    const publicKey = knownKeys[did];
    if (!publicKey) throw new Error(`🔐 Clave pública no conocida para ${did}`);

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

// Claves del médico (reutilizando la misma de ejemplo)
const keyPair = await Ed25519VerificationKey2020.from({
  id: 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d4PRNJBn5B1CoaBH5q9oyoTF4jkfbSKZR7C4XZLD1AFB9jGgg5e25NC6J8wXzU#key-1',
  controller: 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d4PRNJBn5B1CoaBH5q9oyoTF4jkfbSKZR7C4XZLD1AFB9jGgg5e25NC6J8wXzU',
  publicKeyMultibase: 'z6Mkhu6G6yB49C44LCJMgqNbEVaeYz3Ay2UmKV8vpD5w5QPQ',
  privateKeyMultibase: 'zrv47zg9rSHQm1PXwvyk9tNpFmyJmqRx4ExCgXDKAZ3Gjuc2bBgu9XV16bqpFSmwqPXvaGuFEpskSUWL2e6fck9fz6S'
});

// Emisor y doctor
const issuerDidEbsi = 'did:ebsi:123';
const medicoName = 'Dr. Medina';
const now = new Date();
const oneYearLater = new Date(now);
oneYearLater.setFullYear(now.getFullYear() + 1);

// Construcción de la VC
const credential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://example.com/context'
  ],
  id: 'https://example.com/credentials/medico-ebsi',
  type: ['VerifiableCredential', 'VerifiableAttestation', 'VerifiablePID', 'MedicoCredential'],
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
      family_name: 'Medina',
      given_name: medicoName,
      birth_date: '1975-08-25',
      birth_place: 'ES',
      nationality: ['ES'],
      resident_address: '123 Medical St, Madrid, ES',
      resident_country: 'ES',
      resident_state: 'Madrid',
      resident_city: 'Madrid',
      resident_postal_code: '28001',
      resident_street: 'Medical St',
      resident_house_number: '123',
      personal_administrative_number: 'MD987654321',
      sex: 1,
      expiry_date: oneYearLater.toISOString(),
      issuing_authority: 'Health Ministry',
      issuing_country: 'ES'
    }
  }
};

// Firmar la VC
const signedVC = await vc.issue({
  credential,
  suite: new Ed25519Signature2020({ key: keyPair }),
  documentLoader: customLoader
});

// Guardar el archivo
const fileName = `vc-${medicoName.toLowerCase().replace(/\s+/g, '-')}.json`;
fs.writeFileSync(path.join(__dirname, '..', 'public', fileName), JSON.stringify(signedVC, null, 2));
console.log(`✅ VC Médico emitida por ${issuerDidEbsi} guardada como public/${fileName}`);
*/
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

// Contextos locales
const contexts = {
  'https://w3id.org/security/suites/ed25519-2020/v1': JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'public', 'contexts', 'ed25519-2020-v1.json'), 'utf-8')
  ),
  'https://example.com/context': {
    '@context': {
      VerifiableAttestation: 'https://example.com/terms/VerifiableAttestation',
      VerifiablePID: 'https://example.com/terms/VerifiablePID',
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

// Custom document loader
const customLoader = async url => {
  if (contexts[url]) return { document: contexts[url] };

  return extendContextLoader(nodeDocumentLoader())(url);
};

// Claves del nuevo médico
const keyPair = await Ed25519VerificationKey2020.from({
  id: 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d2qcJ41HbZXCNYRMUvzcYkYveR3jB8QP8pCScUnrCCe95rZLuZMqbuGJcLuCP6#key-1',
  controller: 'did:key:zmYg9bgKmRiCqTTd9MA1ufVE9tfzUptwQp4GMRxptXquJWw4Uj5d2qcJ41HbZXCNYRMUvzcYkYveR3jB8QP8pCScUnrCCe95rZLuZMqbuGJcLuCP6',
  publicKeyMultibase: 'z6MkkEHvq9jq9K1zaeC1kkfRRE3LDd5rw4Y5oKxQRXem4G7u',
  privateKeyMultibase: 'zrv5SSqE2a4mF9TfT6WTqQ56TSdnEYMHUgcS698wYN6FpRFepT88F2fZmp2SQmbpEf2dcWNHni7sBGDV9xuHwud5rSP'
});

// Emisor y datos del médico
const issuerDidEbsi = 'did:ebsi:123';
const medicoName = 'Dr. Juan';
const now = new Date();
const oneYearLater = new Date(now);
oneYearLater.setFullYear(now.getFullYear() + 1);

// Construcción de la VC
const credential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://example.com/context'
  ],
  id: 'https://example.com/credentials/medico-ebsi-juan',
  type: ['VerifiableCredential', 'VerifiableAttestation', 'VerifiablePID', 'MedicoCredential'],
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
      family_name: 'Pérez',
      given_name: medicoName,
      birth_date: '1980-03-10',
      birth_place: 'ES',
      nationality: ['ES'],
      resident_address: '789 Health Ave, Barcelona, ES',
      resident_country: 'ES',
      resident_state: 'Cataluña',
      resident_city: 'Barcelona',
      resident_postal_code: '08001',
      resident_street: 'Health Ave',
      resident_house_number: '789',
      personal_administrative_number: 'MD123456789',
      sex: 1,
      expiry_date: oneYearLater.toISOString(),
      issuing_authority: 'Health Ministry',
      issuing_country: 'ES'
    }
  }
};

// Firmar la VC
const signedVC = await vc.issue({
  credential,
  suite: new Ed25519Signature2020({ key: keyPair }),
  documentLoader: customLoader
});

// Guardar el archivo
const fileName = `vc-${medicoName.toLowerCase().replace(/\s+/g, '-')}.json`;
fs.writeFileSync(path.join(__dirname, '..', 'public', fileName), JSON.stringify(signedVC, null, 2));
console.log(`✅ VC Médico emitida por ${issuerDidEbsi} guardada como public/${fileName}`);