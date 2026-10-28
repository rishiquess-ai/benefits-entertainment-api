import { TenantDatabaseService } from './tenant-database.service.js';

const tenantA = {
  host: 'localhost',
  port: 5432,
  database: 'tenant_a',
  username: 'tenant_user',
  password: 'tenant_password',
};
const tenantB = { ...tenantA, database: 'tenant_b' };

describe('TenantDatabaseService', () => {
  const tenantDatabase = new TenantDatabaseService();

  afterAll(() => tenantDatabase.onModuleDestroy());

  it('reuses the same connection for the same tenant', () => {
    const first = tenantDatabase.getConnection('tenant-a', tenantA);
    const second = tenantDatabase.getConnection('tenant-a', tenantA);

    expect(second).toBe(first);
  });

  it('uses a separate connection for each tenant', () => {
    const a = tenantDatabase.getConnection('tenant-a', tenantA);
    const b = tenantDatabase.getConnection('tenant-b', tenantB);

    expect(b).not.toBe(a);
  });
});
