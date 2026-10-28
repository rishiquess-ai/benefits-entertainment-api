import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Knex } from 'knex';
import { MasterDatabaseService } from '../database/master-database.service.js';
import { TenantDatabaseService } from '../database/tenant-database.service.js';
import { SsoService, type SsoUser } from '../common/services/sso.service.js';

/** What we send back to the frontend. */
export interface Employee {
  id: number;
  unique_identifier_ref: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
}

@Injectable()
export class EmployeeDetailsService {
  // Nest creates these services and passes them in for us (dependency injection).
  constructor(
    private readonly ssoService: SsoService,
    private readonly masterDatabase: MasterDatabaseService,
    private readonly tenantDatabase: TenantDatabaseService,
  ) {}

  async getEmployeeDetails(
    subdomain: string,
    token: string,
  ): Promise<Employee> {
    // 1. Read the user from the SSO token. This needs no database,
    //    so a bad token is rejected before we connect to anything.
    const ssoUser = this.ssoService.getUserFromToken(token);

    // 2. Ask the master database which database this tenant uses.
    const dbConfig = await this.masterDatabase.findTenantDbConfig(subdomain);
    if (!dbConfig) {
      throw new NotFoundException('Tenant not found');
    }

    // 3. Connect to the tenant's database (reused if already connected).
    const tenantDb = this.tenantDatabase.getConnection(subdomain, dbConfig);

    // 4. If the user already exists, return them.
    const existingEmployee = await this.findEmployee(
      tenantDb,
      ssoUser.uniqueIdentifier,
    );
    if (existingEmployee) {
      return existingEmployee;
    }

    // 5. First login: create the user from the token details.
    return this.createEmployee(tenantDb, ssoUser);
  }

  private async findEmployee(
    tenantDb: Knex,
    uniqueIdentifier: string,
  ): Promise<Employee | undefined> {
    // Only these columns are returned. Never add password, role or other
    // internal columns here.
    // TODO: change the column names to match the real "user" table.
    return tenantDb<Employee>('user')
      .select(
        'id',
        'unique_identifier_ref',
        'first_name',
        'last_name',
        'email',
        'mobile',
      )
      .where('unique_identifier_ref', uniqueIdentifier)
      .first();
  }

  private async createEmployee(
    tenantDb: Knex,
    ssoUser: SsoUser,
  ): Promise<Employee> {
    // TODO: adjust once we know which columns the real "user" table requires.
    if (!ssoUser.firstName || !ssoUser.email) {
      throw new UnprocessableEntityException(
        'SSO token is missing the details needed to create the user',
      );
    }

    // If two requests for the same new user arrive at the same moment, the
    // unique index on unique_identifier_ref lets only one INSERT through.
    // onConflict().ignore() makes the other one skip quietly instead of failing.
    await tenantDb('user')
      .insert({
        unique_identifier_ref: ssoUser.uniqueIdentifier,
        first_name: ssoUser.firstName,
        last_name: ssoUser.lastName,
        email: ssoUser.email,
        mobile: ssoUser.mobile,
      })
      .onConflict('unique_identifier_ref')
      .ignore();

    // Read the row back (it's the same row for both requests in the case above).
    const employee = await this.findEmployee(
      tenantDb,
      ssoUser.uniqueIdentifier,
    );
    if (!employee) {
      throw new InternalServerErrorException('Could not create the user');
    }
    return employee;
  }
}
