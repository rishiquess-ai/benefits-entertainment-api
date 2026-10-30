// Decrypted SSO token. Only unique_identifier is relied on; the token can
// carry any number of other fields.
export interface SsoUser {
  unique_identifier: string;
  [key: string]: unknown;
}
