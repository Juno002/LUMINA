// Simple Zero-Knowledge Crypto Enclave for Iterum

const SPANISH_WORDS = [
  "acero", "brillo", "cadena", "dorado", "escudo", "fuego", "gloria", "hierro", 
  "ideal", "jornada", "luz", "mente", "noble", "orgullo", "piedra", "quimera", 
  "roble", "sangre", "tiempo", "universo", "valor", "yunque", "zenit", "alma",
  "bosque", "cielo", "destino", "espada", "fuerza", "gracia", "honor", "impulso"
];

export async function generateRecoveryPhrase(): Promise<string> {
  const phrase = [];
  const array = new Uint32Array(12);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    phrase.push(SPANISH_WORDS[array[i] % SPANISH_WORDS.length]);
  }
  return phrase.join(' ');
}

async function getDerivationMaterial(phrase: string) {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(phrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

export async function deriveKeyFromPhrase(phrase: string, salt: string = "iterum-salt-v1"): Promise<CryptoKey> {
  const material = await getDerivationMaterial(phrase.toLowerCase().trim());
  const enc = new TextEncoder();
  return window.crypto.subtle.deriveKey(
    {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100000,
        hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(text: string, key: CryptoKey): Promise<{ cipher: string, iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    enc.encode(text)
  );
  
  // Convert ArrayBuffer to Base64
  const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  return { cipher: cipherBase64, iv: ivBase64 };
}

export async function decryptData(cipherBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const cipherBytes = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    cipherBytes
  );
  return new TextDecoder().decode(decrypted);
}

// Minimal IndexedDB Wrapper for the Crypto Enclave
export const EnclaveStore = {
  async saveKeyReference(phrase: string) {
    // In a real app we'd wrap the CryptoKey and store it securely
    // For this prototype, we store the phrase in IDB to simulate device-persistence
    return new Promise((resolve) => {
      const request = indexedDB.open("IterumEnclave", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("keys");
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("keys", "readwrite");
        tx.objectStore("keys").put(phrase, "master_phrase");
        resolve(true);
      };
    });
  },
  async loadKeyReference(): Promise<string | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open("IterumEnclave", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("keys");
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("keys", "readonly");
        const getReq = tx.objectStore("keys").get("master_phrase");
        getReq.onsuccess = () => resolve(getReq.result || null);
      };
    });
  }
};
