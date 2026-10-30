import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// Prisma client for the master database (tenants, tenant_databases).
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly databaseName: string;

  constructor(configService: ConfigService) {
    const databaseName = configService.getOrThrow<string>('DB_NAME');
    super({
      adapter: new PrismaPg({
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        user: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: databaseName,
      }),
    });
    this.databaseName = databaseName;
  }

  async onModuleInit() {
    await this.$queryRaw`SELECT 1`;
    this.logger.log(`Connected to database "${this.databaseName}"`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
