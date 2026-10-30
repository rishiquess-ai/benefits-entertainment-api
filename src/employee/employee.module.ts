import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { PlayerModule } from '../player/player.module.js';
import { TenantModule } from '../tenant/tenant.module.js';
import { EmployeeController } from './employee.controller.js';
import { EmployeeService } from './employee.service.js';
import { ProfileApiService } from './profile-api.service.js';

@Module({
  imports: [CommonModule, TenantModule, CustomerModule, PlayerModule],
  controllers: [EmployeeController],
  providers: [EmployeeService, ProfileApiService],
})
export class EmployeeModule {}
