// Mock SSO settings for tests (aes-256-cbc needs a 32-character key and a 16-character IV).
export const TEST_SSO_ENV = {
  SSO_ENCRYPTION_ALGORITHM: 'aes-256-cbc',
  SSO_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
  SSO_IV: 'abcdef9876543210',
};
