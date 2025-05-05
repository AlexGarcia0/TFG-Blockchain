import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';

const generateKeyPair = async () => {
  const keyPair = await Ed25519VerificationKey2020.generate();

  const multibase = keyPair.publicKeyMultibase;
  const didKey = `did:key:${multibase}`;

  console.log("✅ Clave generada:");
  console.log("🔐 PrivateKeyMultibase:", keyPair.privateKeyMultibase);
  console.log("🔑 PublicKeyMultibase:", multibase);
  console.log("🆔 DID:key:", didKey);
  console.log("📦 Key Pair completo:", JSON.stringify(keyPair, null, 2));
};

generateKeyPair();
