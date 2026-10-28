import { TEST_SSO_ENV } from './utils/test-sso-env.js';

// Mock .env values for the e2e tests, so they run without a real .env file.
Object.assign(process.env, {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'test_user',
  DB_PASSWORD: 'test_password',
  DB_DATABASE: 'test_master',
  ...TEST_SSO_ENV,
});
