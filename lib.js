"use strict";

const { subtle, getRandomValues } = require("crypto").webcrypto;

////////////////////////////////////////////////////////////////////////////////
//  Cryptographic Primitives
//
// All of the cryptographic functions you need for this assignment
// are contained within this library.
//
// For your convinience, we have abstracted away all of the pesky
// underlying data types (bitarrays, etc) so that you can focus
// on building messenger.js without getting caught up with conversions.
// Keys, hash outputs, ciphertexts, and signatures are always hex-encoded
// strings (except for ElGamal and DSA key pairs, which are objects),
// and input plaintexts are also strings (hex-encoded or not, either is fine).
////////////////////////////////////////////////////////////////////////////////

let decoder = new TextDecoder();

export function byteArrayToString(arr) {
  // Converts from ArrayBuffer to string
  // Used to go from output of decryptWithGCM to string
  return decoder.decode(arr);
}

export function genRandomSalt(len = 16) {
  // Used to generate IVs for AES encryption
  // Used in combination with encryptWithGCM and decryptWithGCM
  return byteArrayToString(getRandomValues(new Uint8Array(len)));
}

export async function generateEG() {
  // returns a pair of ElGamal keys as an object
  // private key is keypairObject.sec
  // public key is keypairObject.pub
  let keypair = await subtle.generateKey({ name: "ECDH", namedCurve: "P-384"}, false, ["deriveKey"]);
  const keypairObject = { pub: keypair.publicKey, sec: keypair.privateKey }
  return keypairObject;
}

//outputs (g^a)^b where b = myPrivateKey and g^a = theirPublicKey. This is the "shared secret key"
export async function computeDH(myPrivateKey, theirPublicKey) {
  // computes Diffie-Hellman key exchange for an EG private key and EG public key
  // myPrivateKey should be pair.sec from generateEG output
  // theirPublicKey should be pair.pub from generateEG output
  // myPrivateKey and theirPublicKey should be from different calls to generateEG
  // outputs shared secret result of DH exchange
  // return type is CryptoKey with derivedKeyAlgorithm of HMAC
  return await subtle.deriveKey({ name: "ECDH", public: theirPublicKey}, myPrivateKey,
    { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign", "verify"]);
}

export async function verifyWithECDSA(publicKey, message, signature) {
  // returns true if signature is correct for message and publicKey
  // publicKey should be pair.pub from generateECDSA
  // message must be a string
  // signature must be exact output of signWithECDSA
  // returns true if verification is successful, throws exception if fails
  return await subtle.verify({ name: "ECDSA", hash: { name: "SHA-384" }}, publicKey, signature, message);
}

export async function HMACtoAESKey(key, data, exportToArrayBuffer = false) {
  // Performs HMAC to derive a new key with derivedKeyAlgorithm AES
  // if exportToArrayBuffer is true, return key as ArrayBuffer. Otherwise, output CryptoKey
  // key is a CryptoKey
  // data is a string

  // first compute HMAC output
  const HMAC_buff = await subtle.sign({ name: "HMAC" }, key, data);

  // Then, re-import with derivedKeyAlgorithm AES-GCM
  let out = await subtle.importKey("raw", HMAC_buff, "AES-GCM", true, ["encrypt", "decrypt"]);

  // If exportToArrayBuffer is true, exportKey as ArrayBuffer
  // (Think: what part of the assignment can this help with?) 
  if (exportToArrayBuffer) {
    return await subtle.exportKey("raw", out);
  }

  // otherwise, export as cryptoKey
  return out;
}

export async function HMACtoHMACKey(key, data) {
  // Performs HMAC to derive a new key with derivedKeyAlgorithm HMAC
  // key is a CryptoKey
  // data is a string

  // first compute HMAC output
  const HMAC_buff = await subtle.sign({ name: "HMAC" }, key, data);
  // Then, re-import with derivedKeyAlgorithm HMAC
  return await subtle.importKey("raw", HMAC_buff, { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign"]);
}

export async function HKDF(inputKey, salt, infoStr) {
  // Calculates HKDF outputs
  // inputKey is a cryptoKey with derivedKeyAlgorithm HMAC
  // salt is a second cryptoKey with derivedKeyAlgorithm HMAC
  // infoStr is a string (can be an arbitrary constant e.g. "ratchet-str")
  // returns an array of two HKDF outputs [HKDF_out1, HKDF_out2]

  // since inputKey's derivedKeyAlgorithm is HMAC, we need to sign an arbitrary constant and
  // then re-import as a a CryptoKey with derivedKeyAlgorithm HKDF
  let inputKey_buff = await subtle.sign({ name: "HMAC" }, inputKey, "0");
  let inputKey_HKDF = await subtle.importKey("raw", inputKey_buff, "HKDF", false, ["deriveKey"]);

  // Generate salts that will be needed for deriveKey calls later on
  let salt1 = await subtle.sign({ name: "HMAC" }, salt, "salt1");
  let salt2 = await subtle.sign({ name: "HMAC" }, salt, "salt2");

  // calculate first HKDF output (with salt1)
  const HKDF_out1 = await subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: salt1, info: infoStr },
    inputKey_HKDF, { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign"]);

  // calculate second HKDF output (with salt2)
  const HKDF_out2 = await subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: salt2, info: infoStr },
    inputKey_HKDF, { name: "HMAC", hash: "SHA-256", length: 256 }, false, ["sign"]);

  return [HKDF_out1, HKDF_out2];
}

export async function encryptWithGCM(key, plaintext, iv, authenticatedData="") {
  // Encrypts using the GCM mode.
  // key is a cryptoKey with derivedKeyAlgorithm AES-GCM
  // plaintext is a string of the message you want to encrypt.
  // iv is used for encryption and must be unique for every use of the same key
  // use the genRandomSalt() function to generate iv and store it in the header for decryption
  // authenticatedData is an optional argument string
  // returns ciphertext as ArrayBuffer
  // The authenticatedData is not encrypted into the ciphertext, but it will
  // not be possible to decrypt the ciphertext unless it is passed.
  // (If there is no authenticatedData passed when encrypting, then it is not
  // necessary while decrypting.)
  return await subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: authenticatedData }, key, plaintext);
}

export async function decryptWithGCM(key, ciphertext, iv, authenticatedData="") {
  // Decrypts using the GCM mode.
  // key is a cryptoKey with derivedKeyAlgorithm AES-GCM
  // ciphertext is an ArrayBuffer
  // iv used during encryption is necessary to decrypt
  // iv should have been passed through the message header
  // authenticatedData is optional, but if it was passed when
  // encrypting, it has to be passed now, otherwise the decrypt will fail.
  // returns plaintext as ArrayBuffer if successful
  // throws exception if decryption fails (key incorrect, tampering detected, etc)
  return await subtle.decrypt({ name: "AES-GCM", iv: iv, additionalData: authenticatedData }, key, ciphertext);
}

////////////////////////////////////////////////////////////////////////////////
// Addtional ECDSA functions for test-messenger.js
//
// YOU DO NOT NEED THESE FUNCTIONS FOR MESSENGER.JS,
// but they may be helpful if you want to write additional
// tests for certificate signatures in test-messenger.js.
////////////////////////////////////////////////////////////////////////////////

export async function generateECDSA() {
  // returns a pair of Digital Signature Algorithm keys as an object
  // private key is keypairObject.sec
  // public key is keypairObject.pub
  let keypair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-384",}, true, ["sign", "verify"]);
  const keypairObject = { pub: keypair.publicKey, sec: keypair.privateKey }
  return keypairObject;  
}

export async function signWithECDSA(privateKey, message) {
  // returns signature of message with privateKey
  // privateKey should be pair.sec from generateECDSA
  // message is a string
  // signature returned as an ArrayBuffer
  return await subtle.sign({ name: "ECDSA", hash: { name: "SHA-384" },}, privateKey, message);
}
