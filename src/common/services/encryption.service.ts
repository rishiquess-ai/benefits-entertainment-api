import { createCipheriv, createDecipheriv } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Encrypts and decrypts text with the algorithm, key and IV from .env
 * (SSO_ENCRYPTION_ALGORITHM, SSO_ENCRYPTION_KEY, SSO_IV).
 * Encrypted text is base64.
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm: string;
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(configService: ConfigService) {
    this.algorithm = configService.getOrThrow('SSO_ENCRYPTION_ALGORITHM');
    this.key = Buffer.from(configService.getOrThrow('SSO_ENCRYPTION_KEY'));
    this.iv = Buffer.from(configService.getOrThrow('SSO_IV'));

    // Try the settings once at startup. A wrong key or IV length throws here,
    // instead of every decrypt failing later.
    createDecipheriv(this.algorithm, this.key, this.iv);
  }

  /** Encrypts plain text and returns it as base64. */
  encrypt(text: string): string {
    const cipher = createCipheriv(this.algorithm, this.key, this.iv);
    return cipher.update(text, 'utf8', 'base64') + cipher.final('base64');
  }

  /** Decrypts base64 text back to plain text. Throws if it can't be decrypted. */
  decrypt(encryptedText: string): string {
    const decipher = createDecipheriv(this.algorithm, this.key, this.iv);
    return (
      decipher.update(encryptedText, 'base64', 'utf8') + decipher.final('utf8')
    );
  }
}
