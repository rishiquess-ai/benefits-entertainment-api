import { Module } from '@nestjs/common';
import { MasterDatabaseService } from './master-database.service.js';
import { TenantDatabaseService } from './tenant-database.service.js';

// `exports` makes these services usable by any module that imports DatabaseModule.
@Module({
  providers: [MasterDatabaseService, TenantDatabaseService],
  exports: [MasterDatabaseService, TenantDatabaseService],
})
export class DatabaseModule {}
