import { ConfigService } from '@nestjs/config';
import { TEST_SSO_ENV } from '../../../test/utils/test-sso-env.js';
import { EncryptionService } from './encryption.service.js';
import { SsoService } from './sso.service.js';

describe('SsoService', () => {
  const encryptionService = new EncryptionService(
    new ConfigService(TEST_SSO_ENV),
  );
  const ssoService = new SsoService(encryptionService);

  // Makes a token the same way the SSO provider does: encrypted JSON.
  const makeToken = (data: object) =>
    encryptionService.encrypt(JSON.stringify(data));

  it('reads the user details from a valid token', () => {
    const token = makeToken({
      unique_identifier: 'EMP001234',
      first_name: ' John ',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      mobile: 9876543210,
    });

    expect(ssoService.getUserFromToken(token)).toEqual({
      uniqueIdentifier: 'EMP001234',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      mobile: '9876543210',
    });
  });

  it('ignores fields that are not on the approved list', () => {
    const token = makeToken({
      unique_identifier: 'EMP001234',
      role: 'admin',
      password: 'secret',
    });

    const user = ssoService.getUserFromToken(token);

    expect(user).not.toHaveProperty('role');
    expect(user).not.toHaveProperty('password');
  });

  it('rejects a token that cannot be decrypted', () => {
    expect(() => ssoService.getUserFromToken('not-a-real-token')).toThrow(
      'Invalid SSO token',
    );
  });

  it('rejects a token that is not JSON', () => {
    const token = encryptionService.encrypt('plain text');

    expect(() => ssoService.getUserFromToken(token)).toThrow(
      'Invalid SSO token',
    );
  });

  it('rejects a token without unique_identifier', () => {
    const token = makeToken({ first_name: 'John' });

    expect(() => ssoService.getUserFromToken(token)).toThrow(
      'Invalid SSO token',
    );
  });

  it('rejects an expired token', () => {
    const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
    const token = makeToken({
      unique_identifier: 'EMP001234',
      exp: oneMinuteAgo,
    });

    expect(() => ssoService.getUserFromToken(token)).toThrow(
      'SSO token has expired',
    );
  });
});
