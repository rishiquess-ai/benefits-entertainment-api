import { ConfigService } from '@nestjs/config';
import { TEST_SSO_ENV } from '../../../test/utils/test-sso-env.js';
import { EncryptionService } from './encryption.service.js';

describe('EncryptionService', () => {
  const encryptionService = new EncryptionService(
    new ConfigService(TEST_SSO_ENV),
  );

  it('decrypts what it encrypted', () => {
    const encrypted = encryptionService.encrypt('hello world');

    expect(encrypted).not.toBe('hello world');
    expect(encryptionService.decrypt(encrypted)).toBe('hello world');
  });

  it('throws for text that is not encrypted', () => {
    expect(() => encryptionService.decrypt('not-encrypted')).toThrow();
  });

  it('throws for text encrypted with a different key', () => {
    const otherService = new EncryptionService(
      new ConfigService({
        ...TEST_SSO_ENV,
        SSO_ENCRYPTION_KEY: 'a-different-key-of-32-characters',
      }),
    );
    const encrypted = otherService.encrypt('{"secret":true}');

    expect(() => encryptionService.decrypt(encrypted)).toThrow();
  });

  it('refuses to start when the key has the wrong length', () => {
    const config = new ConfigService({
      ...TEST_SSO_ENV,
      SSO_ENCRYPTION_KEY: 'too-short',
    });

    expect(() => new EncryptionService(config)).toThrow('Invalid key length');
  });
});
