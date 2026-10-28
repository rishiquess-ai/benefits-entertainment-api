import knexPkg, { type Knex } from 'knex';

// knex is a CommonJS package, so we take the `knex` function off its default export.
const { knex } = knexPkg;

export interface DbConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * Creates a Knex instance for one PostgreSQL database.
 *
 * Knex keeps a pool of open connections and reuses them for every query.
 * It only connects when the first query runs, so this never fails on its own.
 */
export function createKnex(config: DbConnectionConfig): Knex {
  return knex({
    client: 'pg',
    connection: {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
    },
    // min: 0 lets idle connections close; max caps open connections per database.
    pool: { min: 0, max: 10 },
  });
}
