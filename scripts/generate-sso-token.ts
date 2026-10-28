// Makes a test SSO token using the key and IV in .env, so you can try
// POST /employee-details locally without the real SSO provider. Usage:
//   npm run sso:token
//   npm run sso:token -- '{"unique_identifier":"EMP000002","first_name":"Asha","email":"asha@example.com"}'
import { createCipheriv } from 'node:crypto';

process.loadEnvFile();

const userJson =
  process.argv[2] ??
  JSON.stringify({
    unique_identifier: 'EMP001234',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    mobile: '9876543210',
  });

const cipher = createCipheriv(
  process.env.SSO_ENCRYPTION_ALGORITHM ?? 'aes-256-cbc',
  Buffer.from(process.env.SSO_ENCRYPTION_KEY ?? ''),
  Buffer.from(process.env.SSO_IV ?? ''),
);
const token =
  cipher.update(userJson, 'utf8', 'base64') + cipher.final('base64');

console.log(token);
