import type { Knex } from 'knex';

type Row = Record<string, unknown>;

/**
 * A pretend tenant database that keeps users in an array. It only understands
 * the two queries EmployeeDetailsService makes:
 *   db('user').select(...).where('unique_identifier_ref', value).first()
 *   db('user').insert(row).onConflict(...).ignore()
 */
export function createFakeTenantDb(users: Row[] = []) {
  const findUser = (uniqueIdentifier: unknown) =>
    users.find((user) => user.unique_identifier_ref === uniqueIdentifier);

  const db = () => ({
    select: () => ({
      where: (_column: string, value: string) => ({
        first: async () => findUser(value),
      }),
    }),
    insert: (row: Row) => ({
      onConflict: () => ({
        ignore: async () => {
          if (!findUser(row.unique_identifier_ref)) {
            users.push({ id: users.length + 1, ...row });
          }
        },
      }),
    }),
  });

  return { db: db as unknown as Knex, users };
}
