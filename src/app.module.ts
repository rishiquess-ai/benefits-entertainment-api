import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmployeeModule } from './employee/employee.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EmployeeModule],
})
export class AppModule {}
