import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createFakeTenantDb } from '../../test/utils/fake-tenant-db.js';
import type { MasterDatabaseService } from '../database/master-database.service.js';
import type { TenantDatabaseService } from '../database/tenant-database.service.js';
import type { SsoService, SsoUser } from '../common/services/sso.service.js';
import { EmployeeDetailsService } from './employee-details.service.js';

const tokenUser: SsoUser = {
  uniqueIdentifier: 'EMP001234',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  mobile: '9876543210',
};

const tenantDbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'tenant',
  username: 'tenant_user',
  password: 'tenant_password',
};

// Builds the service with fake versions of everything it depends on.
function createService(options: {
  tokenUser?: SsoUser;
  tenantExists?: boolean;
  existingUsers?: Record<string, unknown>[];
}) {
  const fakeDb = createFakeTenantDb(options.existingUsers);

  const ssoService = {
    getUserFromToken: () => options.tokenUser ?? tokenUser,
  };
  const masterDatabase = {
    findTenantDbConfig: async () =>
      options.tenantExists === false ? undefined : tenantDbConfig,
  };
  const tenantDatabase = { getConnection: () => fakeDb.db };

  const service = new EmployeeDetailsService(
    ssoService as unknown as SsoService,
    masterDatabase as unknown as MasterDatabaseService,
    tenantDatabase as unknown as TenantDatabaseService,
  );
  return { service, users: fakeDb.users };
}

describe('EmployeeDetailsService', () => {
  it('returns the user when they already exist', async () => {
    const existingUser = { id: 7, unique_identifier_ref: 'EMP001234' };
    const { service, users } = createService({ existingUsers: [existingUser] });

    const result = await service.getEmployeeDetails('tenant', 'token');

    expect(result).toEqual(existingUser);
    expect(users).toHaveLength(1);
  });

  it('creates the user from the token on their first login', async () => {
    const { service, users } = createService({});

    const result = await service.getEmployeeDetails('tenant', 'token');

    expect(users).toEqual([
      {
        id: 1,
        unique_identifier_ref: 'EMP001234',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        mobile: '9876543210',
      },
    ]);
    expect(result).toEqual(users[0]);
  });

  it('throws 404 when the subdomain is unknown', async () => {
    const { service } = createService({ tenantExists: false });

    await expect(
      service.getEmployeeDetails('unknown', 'token'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 422 when a new user is missing required details', async () => {
    const { service, users } = createService({
      tokenUser: { uniqueIdentifier: 'EMP999' },
    });

    await expect(
      service.getEmployeeDetails('tenant', 'token'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(users).toHaveLength(0);
  });
});
