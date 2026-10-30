import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CipherConfig } from '../common/interfaces/cipher-config.interface.js';
import { CryptoService } from '../common/services/crypto.service.js';
import { CustomerService } from '../customer/customer.service.js';
import type { Player } from '../generated/prisma/client.js';
import { PlayerService } from '../player/player.service.js';
import { TenantService } from '../tenant/tenant.service.js';
import { GetEmployeeDetailsDto } from './dto/get-employee-details.dto.js';
import { EmployeeProfile } from './interfaces/employee-profile.interface.js';
import { SsoUser } from './interfaces/sso-user.interface.js';
import { ProfileApiService } from './profile-api.service.js';

// Soft-deleted rows count as inactive too.
function isActive(row: { activeFlag: boolean; deletedAt: Date | null }) {
  return row.activeFlag && row.deletedAt === null;
}

@Injectable()
export class EmployeeService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly tenantService: TenantService,
    private readonly profileApiService: ProfileApiService,
    private readonly customerService: CustomerService,
    private readonly playerService: PlayerService,
  ) {}

  async getEmployeeDetails(dto: GetEmployeeDetailsDto): Promise<Player> {
    const tenant = await this.tenantService.getDatabaseDetails(dto.subDomain);
    await this.tenantService.getConnection(tenant);
    const details = await this.tenantService.getTenantDetails(tenant);
    const ssoUser = this.decryptSsoToken(dto.ssoToken, details.ssoCipher);

    const profile = await this.profileApiService.getProfile(
      details,
      ssoUser.unique_identifier,
    );
    return this.savePlayer(profile);
  }

  // Creates the profile's customer and player if they don't exist yet, and
  // rejects the request if either is inactive.
  private async savePlayer(profile: EmployeeProfile): Promise<Player> {
    const customer = await this.customerService.findOrCreate({
      domain: profile.identifier,
      customerRefId: profile.customer_ref_id,
      customerName: profile.customer_name,
    });
    if (!isActive(customer)) {
      throw new ForbiddenException('Customer is inactive');
    }

    const player = await this.playerService.findOrCreate({
      customerId: customer.id,
      playerId: profile.emp_id,
      playerReferenceId: profile.employee_unique_id,
      firstName: profile.first_name,
      lastName: profile.last_name || null,
      displayName: [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' '),
      contactNo: profile.contact_no || null,
      emailId: profile.email_id || null,
    });
    if (!isActive(player)) {
      throw new ForbiddenException('Player is inactive');
    }
    return player;
  }

  private decryptSsoToken(ssoToken: string, cipher: CipherConfig): SsoUser {
    let ssoUser: Partial<SsoUser> | null = null;
    try {
      ssoUser = JSON.parse(this.cryptoService.decrypt(ssoToken, cipher));
    } catch {
      // Handled below: same response for every failure, so callers can't
      // probe the cipher.
    }
    if (typeof ssoUser?.unique_identifier !== 'string') {
      throw new UnauthorizedException('Invalid SSO token');
    }
    return ssoUser as SsoUser;
  }
}
