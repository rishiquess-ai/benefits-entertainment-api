import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { CipherConfig } from '../common/interfaces/cipher-config.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { PromiseCache } from '../common/utils/promise-cache.js';
import type { Tenant, TenantDatabase } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantDatabaseDetails } from './interfaces/tenant-database-details.interface.js';
import {
  AppBranding,
  TenantDetails,
} from './interfaces/tenant-details.interface.js';

@Injectable()
export class TenantService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantService.name);
  // Both caches keep rows until the app restarts, so changes to a tenant's
  // rows in the master database need a restart to take effect.
  // Keyed by lower-cased sub-domain.
  private readonly databaseCache = new PromiseCache<TenantDatabaseDetails>();
  // Keyed by tenant id.
  private readonly detailsCache = new PromiseCache<TenantDetails>();
  // Keyed by tenant id. Stores the promise so concurrent first requests share
  // one pool instead of each opening their own.
  private readonly pools = new Map<string, Promise<Pool>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  getDatabaseDetails(subDomain: string): Promise<TenantDatabaseDetails> {
    const key = subDomain.toLowerCase();
    return this.databaseCache.get(key, () => this.loadDatabaseDetails(key));
  }

  // The tenant's tenant_details row: SSO token encryption, profile API,
  // branding and so on.
  getTenantDetails(tenant: TenantDatabaseDetails): Promise<TenantDetails> {
    return this.detailsCache.get(tenant.tenantId, () =>
      this.loadTenantDetails(tenant),
    );
  }

  getConnection(details: TenantDatabaseDetails): Promise<Pool> {
    let pool = this.pools.get(details.tenantId);
    if (!pool) {
      pool = this.openConnection(details);
      this.pools.set(details.tenantId, pool);
    }
    return pool;
  }

  private async loadDatabaseDetails(
    subDomain: string,
  ): Promise<TenantDatabaseDetails> {
    const tenant = await this.findBySubDomain(subDomain);
    const database = await this.findDatabase(tenant);
    this.logger.log(`Cached database details for tenant "${subDomain}"`);

    // Frozen because every caller shares this object.
    return Object.freeze({
      tenantId: tenant.id,
      tenantName: tenant.name,
      subDomain: tenant.subDomain,
      dbHost: database.dbHost,
      dbPort: database.dbPort,
      dbName: database.dbName,
      dbPassword: this.decryptPassword(database.dbPasswordEnc),
      dbUsername: database.dbUsername,
    });
  }

  private async loadTenantDetails(
    tenant: TenantDatabaseDetails,
  ): Promise<TenantDetails> {
    const details = await this.prisma.tenantDetail.findUnique({
      where: { tenantId: tenant.tenantId },
    });
    if (!details) {
      throw new NotFoundException(
        `Details for tenant "${tenant.subDomain}" not found`,
      );
    }

    let ssoCipher: CipherConfig;
    try {
      ssoCipher = this.cryptoService.createCipherConfig(
        details.encryptionCipher,
        details.encryptionKey,
        details.encryptionIv,
      );
    } catch (error) {
      throw new Error(
        `tenant_details for "${tenant.subDomain}" has invalid encryption settings: ${(error as Error).message}`,
      );
    }
    this.logger.log(`Cached details for tenant "${tenant.subDomain}"`);

    // Frozen because every caller shares this object.
    return Object.freeze({
      tenantId: details.tenantId,
      ssoCipher,
      profileApiUrl: details.profileApiUrl,
      profileApiToken: details.profileApiToken,
      redirectBackUrl: details.redirectBackUrl,
      isBackEnabled: details.isBackEnabled,
      defaultLeaderboardScope: details.defaultLeaderboardScope,
      appBranding: (details.appBranding ?? {}) as AppBranding,
    });
  }

  private async findBySubDomain(subDomain: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { subDomain, activeFlag: true, deletedAt: null },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant "${subDomain}" not found`);
    }
    return tenant;
  }

  private async findDatabase(tenant: Tenant): Promise<TenantDatabase> {
    const database = await this.prisma.tenantDatabase.findUnique({
      where: { tenantId: tenant.id },
    });
    if (!database) {
      throw new NotFoundException(
        `Database for tenant "${tenant.subDomain}" not found`,
      );
    }
    return database;
  }

  private async openConnection(details: TenantDatabaseDetails): Promise<Pool> {
    let pool: Pool | undefined;
    try {
      pool = new Pool({
        host: details.dbHost,
        port: details.dbPort,
        user: details.dbUsername,
        password: details.dbPassword,
        database: details.dbName,
      });
      pool.on('error', (error) =>
        this.logger.error(
          `Idle connection to tenant "${details.subDomain}" failed: ${error.message}`,
        ),
      );
      await pool.query('SELECT 1');

      this.logger.log(
        `Connected to tenant "${details.subDomain}" database "${details.dbName}" on ${details.dbHost}`,
      );
      return pool;
    } catch (error) {
      this.pools.delete(details.tenantId);
      await pool?.end();
      this.logger.error(
        `Could not connect to tenant "${details.subDomain}" database: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException('Tenant database is unavailable');
    }
  }

  private decryptPassword(dbPasswordEnc: string): string {
    try {
      return this.cryptoService.decryptSecret(dbPasswordEnc);
    } catch {
      throw new Error(
        'db_password_enc is not encrypted with DB_PASSWORD_ENCRYPTION_KEY',
      );
    }
  }

  async onModuleDestroy() {
    await Promise.allSettled(
      [...this.pools.values()].map(async (pool) => (await pool).end()),
    );
  }
}
