import {
  createCipheriv,
  createDecipheriv,
  getCipherInfo,
  randomBytes,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CipherConfig } from '../interfaces/cipher-config.interface.js';

const SECRET_ALGORITHM = 'aes-256-gcm';
const SECRET_KEY_LENGTH = 32;
const SECRET_IV_LENGTH = 12;
const SECRET_AUTH_TAG_LENGTH = 16;

// These modes also need an auth tag, which encrypt() and decrypt() don't
// handle. Use encryptSecret() for authenticated encryption.
const AUTHENTICATED_MODES = new Set(['gcm', 'ccm', 'ocb']);

@Injectable()
export class CryptoService {
  private readonly secretKey: Buffer;

  constructor(configService: ConfigService) {
    this.secretKey = Buffer.from(
      configService.getOrThrow<string>('DB_PASSWORD_ENCRYPTION_KEY'),
      'base64',
    );
    if (this.secretKey.length !== SECRET_KEY_LENGTH) {
      throw new Error(
        `DB_PASSWORD_ENCRYPTION_KEY must be ${SECRET_KEY_LENGTH} bytes, base64 encoded`,
      );
    }
  }

  // Checks an algorithm, key and IV once so they can be reused. The key and IV
  // are used as their raw UTF-8 bytes, not base64/hex decoded.
  createCipherConfig(algorithm: string, key: string, iv: string): CipherConfig {
    const cipherInfo = getCipherInfo(algorithm);
    if (!cipherInfo?.ivLength || AUTHENTICATED_MODES.has(cipherInfo.mode)) {
      throw new Error(`Unsupported cipher "${algorithm}"`);
    }
    const keyBytes = Buffer.from(key, 'utf8');
    const ivBytes = Buffer.from(iv, 'utf8');
    if (keyBytes.length !== cipherInfo.keyLength) {
      throw new Error(
        `Key must be ${cipherInfo.keyLength} bytes for ${algorithm}`,
      );
    }
    if (ivBytes.length !== cipherInfo.ivLength) {
      throw new Error(
        `IV must be ${cipherInfo.ivLength} bytes for ${algorithm}`,
      );
    }
    return Object.freeze({ algorithm, key: keyBytes, iv: ivBytes });
  }

  encrypt(plainText: string, config: CipherConfig): string {
    const cipher = createCipheriv(config.algorithm, config.key, config.iv);
    return Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]).toString('base64');
  }

  // Accepts standard or URL-safe base64. Throws if the text was not encrypted
  // with this config.
  decrypt(cipherText: string, config: CipherConfig): string {
    const decipher = createDecipheriv(config.algorithm, config.key, config.iv);
    return Buffer.concat([
      decipher.update(cipherText, 'base64'),
      decipher.final(),
    ]).toString('utf8');
  }

  // Secrets we store ourselves, such as tenant DB passwords. Only the key is
  // secret: a random IV is generated each time and stored with the result as
  // base64(iv | authTag | cipherText), so the same input never encrypts the
  // same way twice.
  encryptSecret(plainText: string): string {
    const iv = randomBytes(SECRET_IV_LENGTH);
    const cipher = createCipheriv(SECRET_ALGORITHM, this.secretKey, iv, {
      authTagLength: SECRET_AUTH_TAG_LENGTH,
    });
    const cipherText = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), cipherText]).toString(
      'base64',
    );
  }

  // Throws if the value was not made by encryptSecret with this key, or was
  // changed after.
  decryptSecret(encrypted: string): string {
    const data = Buffer.from(encrypted, 'base64');
    const tagEnd = SECRET_IV_LENGTH + SECRET_AUTH_TAG_LENGTH;
    if (data.length < tagEnd) {
      throw new Error('Encrypted secret is too short');
    }
    const decipher = createDecipheriv(
      SECRET_ALGORITHM,
      this.secretKey,
      data.subarray(0, SECRET_IV_LENGTH),
      { authTagLength: SECRET_AUTH_TAG_LENGTH },
    );
    decipher.setAuthTag(data.subarray(SECRET_IV_LENGTH, tagEnd));
    return Buffer.concat([
      decipher.update(data.subarray(tagEnd)),
      decipher.final(),
    ]).toString('utf8');
  }
}
