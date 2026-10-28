import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { Knex } from 'knex';
import { createKnex, type DbConnectionConfig } from './knex.factory.js';

/**
 * Gives out a connection to a tenant's own database.
 *
 * Connections are cached by subdomain: the first request for a tenant connects,
 * every later request reuses that same connection.
 *
 * Note: if a tenant's database details change in the master database,
 * restart the app so the new details are used.
 */
@Injectable()
export class TenantDatabaseService implements OnModuleDestroy {
  // subdomain -> that tenant's Knex connection
  private readonly connections = new Map<string, Knex>();

  getConnection(subdomain: string, config: DbConnectionConfig): Knex {
    let db = this.connections.get(subdomain);

    if (!db) {
      db = createKnex(config);
      this.connections.set(subdomain, db);
    }

    return db;
  }

  // Nest calls this when the app shuts down: close every tenant connection.
  async onModuleDestroy() {
    for (const db of this.connections.values()) {
      await db.destroy();
    }
    this.connections.clear();
  }
}
