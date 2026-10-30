import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CustomerService } from './customer.service.js';

@Module({
  imports: [PrismaModule],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
