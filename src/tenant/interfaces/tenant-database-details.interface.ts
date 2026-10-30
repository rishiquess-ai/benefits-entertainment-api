// Connection details of a tenant's database. dbPassword is decrypted.
export interface TenantDatabaseDetails {
  tenantId: string;
  tenantName: string;
  subDomain: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbPassword: string;
  dbUsername: string;
}
