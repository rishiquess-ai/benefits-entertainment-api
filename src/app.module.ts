import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CommonModule } from './common/common.module.js';
import { EmployeeDetailsModule } from './employee-details/employee-details.module.js';

@Module({
  imports: [
    // Loads .env so services can read it through ConfigService.
    // isGlobal: every module can use ConfigService without importing ConfigModule.
    ConfigModule.forRoot({ isGlobal: true }),
    // Shared services (encryption, SSO) for the whole app.
    CommonModule,
    EmployeeDetailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
