import { Injectable } from '@nestjs/common';
import type { Customer } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type NewCustomer = Pick<
  Customer,
  'domain' | 'customerRefId' | 'customerName'
>;

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  // Returns the customer with this domain and customer_ref_id, creating it
  // first if there is none. Flags use the column defaults.
  async findOrCreate(data: NewCustomer): Promise<Customer> {
    const where = {
      domain_customerRefId: {
        domain: data.domain,
        customerRefId: data.customerRefId,
      },
    };
    const existing = await this.prisma.customer.findUnique({ where });
    if (existing) {
      return existing;
    }
    // skipDuplicates: if a concurrent request created it first, use theirs.
    await this.prisma.customer.createMany({ data, skipDuplicates: true });
    return this.prisma.customer.findUniqueOrThrow({ where });
  }
}
