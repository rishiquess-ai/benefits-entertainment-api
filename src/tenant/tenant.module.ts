import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TenantService } from './tenant.service.js';

@Module({
  imports: [CommonModule, PrismaModule],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
