import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Knex } from 'knex';
import { createKnex, type DbConnectionConfig } from './knex.factory.js';

/**
 * The master (default) database. Its connection details come from .env.
 * It stores, for every tenant subdomain, which database that tenant uses.
 */
@Injectable()
export class MasterDatabaseService implements OnModuleDestroy {
  private readonly db: Knex;

  constructor(configService: ConfigService) {
    // getOrThrow stops the app at startup if a variable is missing from .env.
    this.db = createKnex({
      host: configService.getOrThrow('DB_HOST'),
      port: Number(configService.getOrThrow('DB_PORT')),
      database: configService.getOrThrow('DB_DATABASE'),
      username: configService.getOrThrow('DB_USERNAME'),
      password: configService.getOrThrow('DB_PASSWORD'),
    });
  }

  /** Returns the tenant's database details, or undefined if the subdomain is unknown. */
  async findTenantDbConfig(
    subdomain: string,
  ): Promise<DbConnectionConfig | undefined> {
    // TODO: change the table and column names to match the real master database.
    return this.db('tenant_configs')
      .select({
        host: 'db_host',
        port: 'db_port',
        database: 'db_name',
        username: 'db_username',
        password: 'db_password',
      })
      .where('subdomain', subdomain)
      .first();
  }

  // Nest calls this when the app shuts down: close the connections cleanly.
  async onModuleDestroy() {
    await this.db.destroy();
  }
}
