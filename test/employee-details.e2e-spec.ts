import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { EncryptionService } from './../src/common/services/encryption.service.js';
import { MasterDatabaseService } from './../src/database/master-database.service.js';
import { TenantDatabaseService } from './../src/database/tenant-database.service.js';
import { createFakeTenantDb } from './utils/fake-tenant-db.js';

const tenantDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'tenant',
  username: 'tenant_user',
  password: 'tenant_password',
};

describe('POST /employee-details (e2e)', () => {
  let app: INestApplication;
  let users: Record<string, unknown>[];
  let encryptSsoToken: (data: object) => string;

  beforeEach(async () => {
    const fakeDb = createFakeTenantDb([
      { id: 1, unique_identifier_ref: 'EMP000001', first_name: 'Existing' },
    ]);
    users = fakeDb.users;

    // Run the real app, but swap both databases for fakes.
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MasterDatabaseService)
      .useValue({
        findTenantDbConfig: async (subdomain: string) =>
          subdomain === 'benefits-entertainment' ? tenantDbConfig : undefined,
      })
      .overrideProvider(TenantDatabaseService)
      .useValue({ getConnection: () => fakeDb.db })
      .compile();

    app = moduleRef.createNestApplication();
    // Same as main.ts.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    // Make test tokens with the app's own EncryptionService.
    const encryptionService = app.get(EncryptionService);
    encryptSsoToken = (data) => encryptionService.encrypt(JSON.stringify(data));
  });

  afterEach(async () => {
    await app.close();
  });

  const postEmployeeDetails = (body: object) =>
    request(app.getHttpServer()).post('/employee-details').send(body);

  it('returns an existing employee', async () => {
    const token = encryptSsoToken({ unique_identifier: 'EMP000001' });

    const response = await postEmployeeDetails({
      subdomain: 'benefits-entertainment',
      token,
    }).expect(200);

    expect(response.body).toEqual({
      id: 1,
      unique_identifier_ref: 'EMP000001',
      first_name: 'Existing',
    });
  });

  it('creates the employee on their first login', async () => {
    const token = encryptSsoToken({
      unique_identifier: 'EMP001234',
      first_name: 'John',
      email: 'john.doe@example.com',
      role: 'admin',
    });

    const response = await postEmployeeDetails({
      subdomain: 'benefits-entertainment',
      token,
    }).expect(200);

    expect(response.body).toMatchObject({
      id: 2,
      unique_identifier_ref: 'EMP001234',
      first_name: 'John',
    });
    expect(users[1]).not.toHaveProperty('role');
  });

  it.each([
    ['subdomain is missing', { token: 'abc' }],
    ['token is missing', { subdomain: 'benefits-entertainment' }],
    [
      'subdomain has invalid characters',
      { subdomain: '../admin', token: 'abc' },
    ],
    ['body has an unknown field', { subdomain: 'a', token: 'abc', extra: 1 }],
  ])('returns 400 when %s', async (_, body) => {
    await postEmployeeDetails(body).expect(400);
  });

  it('returns 401 for an invalid token', async () => {
    await postEmployeeDetails({
      subdomain: 'benefits-entertainment',
      token: 'not-a-real-token',
    }).expect(401);
  });

  it('returns 404 for an unknown subdomain', async () => {
    const token = encryptSsoToken({ unique_identifier: 'EMP000001' });

    await postEmployeeDetails({ subdomain: 'unknown', token }).expect(404);
  });
});
