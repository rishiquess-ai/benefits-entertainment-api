# benefits-entertainment-api

NestJS API for Benefits Entertainment. It is multi-tenant: each tenant is identified by its sub-domain and has its own PostgreSQL database. A master database holds the list of tenants and how to connect to each tenant's database.

## Setup

Requires Node.js 24 and network access to the master database.

1. Install dependencies. This also runs `prisma generate`, which writes the Prisma client to `src/generated/prisma` (gitignored).
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with the variables below.
3. Apply database migrations to the master database:
   ```bash
   npx prisma migrate deploy
   ```
4. Start the server:
   ```bash
   npm run start:dev
   ```

### Environment variables

| Variable                                                  | Purpose                                                                                                                                                                                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`                                                    | HTTP port. Defaults to `3000`.                                                                                                                                                                                                                   |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Master database. Wrap `DB_PASSWORD` in double quotes if it contains special characters.                                                                                                                                                          |
| `DB_PASSWORD_ENCRYPTION_KEY`                              | Encrypts tenant database passwords (`tenant_databases.db_password_enc`) with `aes-256-gcm`. 32 random bytes, base64 encoded: `openssl rand -base64 32`. Every server must use the same key; if it is lost, stored passwords cannot be decrypted. |
| `PROFILE_API_BASE_URL`                                    | Base URL of the tenant profile APIs, e.g. `https://worq-marqet-api.billionscareer.com`. `tenant_details.profile_api_url` is a path on it; a full URL there is used as is.                                                                        |

The app will not start if any of these (except `PORT`) is missing.

## API

All routes are prefixed with `/api/v1`. Successful responses are wrapped as `{ statusCode, message, data }`; errors use `{ statusCode, message, error }`.

### `POST /api/v1/employee/details`

```json
{ "subDomain": "benefits-entertainment", "ssoToken": "<encrypted token>" }
```

1. Finds the tenant and connects to its database.
2. Decrypts `ssoToken` with that tenant's `encryption_cipher`, `encryption_key` and `encryption_iv` from `tenant_details`. The token must be JSON with a string `unique_identifier`.
3. Calls the tenant's profile API to get the employee's profile.
4. Finds the `customers` row with `domain` = profile `identifier` and `customer_ref_id` = profile `customer_ref_id`, creating it if there is none.
5. Finds that customer's `players` row with `player_reference_id` = profile `employee_unique_id`, creating it if there is none.
6. Returns the player.

Existing customers and players are not updated from the profile. If the existing customer or player has `active_flag = false` or `deleted_at` set, the request is rejected with 403 and no player is created. New rows get `display_name` = first and last name joined with a space, and `true` for `active_flag` and `leaderboard_enabled_flag`.

The profile API call is `POST {PROFILE_API_BASE_URL}{profile_api_url}` with `Authorization: Bearer {profile_api_token}` and the body `{ "data": encrypt({ "unique_identifier": ... }) }`. It answers `{ "data": { "response": encrypt(profile) } }`. Both are encrypted with the same tenant key and IV as the SSO token.

The decrypted profile has `first_name`, `last_name`, `identifier`, `customer_ref_id`, `customer_name`, `emp_id`, `employee_unique_id`, `contact_no`, `email_id` and `active_flag`.

The response `data` is the `players` row: `id`, `customerId`, `firstName`, `lastName`, `playerId`, `playerReferenceId`, `displayName`, `contactNo`, `emailId`, `lastLoginAt`, `activeFlag`, `createdAt`, `updatedAt`, `deletedAt`.

| Status | When                                                                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200    | Player found or created.                                                                                                                            |
| 400    | `subDomain` or `ssoToken` is missing or not a string.                                                                                               |
| 401    | `ssoToken` could not be decrypted with the tenant's key, is not JSON, or has no `unique_identifier`.                                                |
| 403    | `Customer is inactive` or `Player is inactive`: the row has `active_flag = false` or is soft-deleted.                                               |
| 404    | No active tenant with that sub-domain, the tenant has no `tenant_databases` or `tenant_details` row, or the profile API does not know the employee. |
| 502    | The profile API failed, timed out (10 seconds) or returned something that could not be decrypted.                                                   |
| 503    | The tenant database could not be reached.                                                                                                           |

### How a tenant is resolved

1. Find the row in `tenants` with that `sub_domain` (case-insensitive), `active_flag = true` and `deleted_at` null.
2. Find the row in `tenant_databases` with that `tenant_id`, decrypt `db_password_enc` and connect.
3. Find the row in `tenant_details` with that `tenant_id`: SSO token encryption, profile API, branding and so on.

The `tenant_databases` and `tenant_details` rows are cached in memory, and the connection to each tenant database is opened once; all of these are kept until the app restarts. **After deactivating a tenant or editing its `tenant_databases` or `tenant_details` row, restart the app.** Lookups that fail, such as an unknown sub-domain, are not cached.

## Master database

The schema is split into one file per module in `prisma/schema/`:

| File              | Contains                                                   |
| ----------------- | ---------------------------------------------------------- |
| `schema.prisma`   | Generator and datasource only.                             |
| `tenant.prisma`   | `tenants`, `tenant_databases` and `tenant_details` tables. |
| `customer.prisma` | `customers` table, unique on `(domain, customer_ref_id)`.  |
| `player.prisma`   | `players` table, linked to `customers`.                    |

A new module with master-database tables gets its own `<module>.prisma` file in that folder. Models can reference models in other files. Prisma merges all the files into one schema, so there is still a single `prisma/migrations` folder.

Only master-database tables belong here. Tables inside the tenant databases need a separate Prisma setup, because `migrate deploy` applies to the master database.

### Changing the schema

Do not run `prisma migrate dev` against the shared database: it can reset it. Instead:

1. Edit or add a file in `prisma/schema/`.
2. Generate the migration SQL by comparing the database, with all current migrations applied, to the new schema:
   ```bash
   mkdir prisma/migrations/20261101120000_describe_change
   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema \
     --script -o prisma/migrations/20261101120000_describe_change/migration.sql
   ```
3. Review the SQL, then apply it with `npx prisma migrate deploy`.
4. Regenerate the client with `npx prisma generate`.

### Adding a tenant

1. Insert a row into `tenants`.
2. Insert a row into `tenant_databases` with that tenant's `id` as `tenant_id`. `db_password_enc` must be the password encrypted by `CryptoService.encryptSecret()` with `DB_PASSWORD_ENCRYPTION_KEY`; a plain-text password will not work. There is no command for this yet.
3. Insert a row into `tenant_details` with that tenant's `id` as `tenant_id`. `encryption_cipher`, `encryption_key` and `encryption_iv` are the values the tenant's SSO provider encrypts tokens with. For `aes-256-cbc` the key must be 32 characters and the IV 16.

## Project structure

```
prisma/
  schema/            one .prisma file per module
  migrations/        migration history for the master database
prisma.config.ts     Prisma CLI config; builds the database URL from DB_* in .env
src/
  main.ts            starts the server
  app.setup.ts       /api/v1 prefix, validation and response format
  app.module.ts
  common/            CryptoService, response interceptor, @ResponseMessage()
  prisma/            PrismaService for the master database
  tenant/            tenant lookup, cache and tenant database connections
  employee/          POST /employee/details and the profile API client
  customer/          find or create customers
  player/            find or create players
  generated/prisma/  generated Prisma client (gitignored)
```

## Scripts

| Command              | Does                    |
| -------------------- | ----------------------- |
| `npm run start:dev`  | Start with auto-reload. |
| `npm run build`      | Compile to `dist/`.     |
| `npm run start:prod` | Run the compiled app.   |
| `npm run lint`       | Lint with oxlint.       |
| `npm run format`     | Format with Prettier.   |
