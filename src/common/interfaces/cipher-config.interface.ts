// An algorithm, key and IV checked by CryptoService.createCipherConfig, ready
// to pass to CryptoService.encrypt and decrypt.
export interface CipherConfig {
  readonly algorithm: string;
  readonly key: Buffer;
  readonly iv: Buffer;
}
