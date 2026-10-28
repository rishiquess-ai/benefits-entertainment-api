import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EmployeeDetailsController } from './employee-details.controller.js';
import { EmployeeDetailsService } from './employee-details.service.js';

// SsoService comes from CommonModule, which is global (see common.module.ts).
@Module({
  imports: [DatabaseModule],
  controllers: [EmployeeDetailsController],
  providers: [EmployeeDetailsService],
})
export class EmployeeDetailsModule {}
