import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EncryptionService } from './encryption.service.js';

/** The user details we accept from an SSO token. */
export interface SsoUser {
  uniqueIdentifier: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
}

/**
 * Reads the user out of the SSO token sent by the frontend.
 * The token is encrypted JSON; EncryptionService does the decrypting.
 */
@Injectable()
export class SsoService {
  constructor(private readonly encryptionService: EncryptionService) {}

  getUserFromToken(token: string): SsoUser {
    const data = this.readToken(token);

    // Copy ONLY these approved fields. Anything else in the token
    // (role, is_admin, password, ...) is ignored on purpose.
    // TODO: change the field names to match the real SSO token.
    const user: SsoUser = {
      uniqueIdentifier: toText(data.unique_identifier) ?? '',
      firstName: toText(data.first_name),
      lastName: toText(data.last_name),
      email: toText(data.email),
      mobile: toText(data.mobile),
    };

    if (!user.uniqueIdentifier) {
      throw new UnauthorizedException('Invalid SSO token');
    }

    // `exp` (expiry time in seconds) is only checked if the token has one.
    if (typeof data.exp === 'number' && data.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('SSO token has expired');
    }

    return user;
  }

  /** Decrypts the token and parses the JSON inside it. */
  private readToken(token: string): Record<string, unknown> {
    try {
      // A "+" in a URL query string can arrive as a space, so put it back.
      const json = this.encryptionService.decrypt(token.replaceAll(' ', '+'));

      const data = JSON.parse(json);
      if (typeof data !== 'object' || data === null) {
        throw new Error('Token is not a JSON object');
      }
      return data;
    } catch {
      // Same message for every failure, so a caller can't tell which step failed.
      throw new UnauthorizedException('Invalid SSO token');
    }
  }
}

/** Turns a string or number into trimmed text; anything else becomes undefined. */
function toText(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}
