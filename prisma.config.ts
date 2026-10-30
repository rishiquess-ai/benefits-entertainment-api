import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

export default defineConfig({
  // A folder: one .prisma file per module, merged into one schema.
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Built from the same DB_* variables the app uses. The user and password
    // are URL-encoded because the password can contain characters like ^ and %.
    // Left undefined when they're missing so `prisma generate` still works.
    url:
      DB_HOST && DB_NAME && DB_USER && DB_PASSWORD
        ? `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT ?? 5432}/${DB_NAME}`
        : undefined,
  },
});
