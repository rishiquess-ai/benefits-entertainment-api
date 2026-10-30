import {
  BadGatewayException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../common/services/crypto.service.js';
import { TenantDetails } from '../tenant/interfaces/tenant-details.interface.js';
import { EmployeeProfile } from './interfaces/employee-profile.interface.js';

const REQUEST_TIMEOUT_MS = 10_000;

interface ProfileApiResponse {
  error?: boolean;
  statusMessage?: string;
  data?: { response?: string };
}

// Client for a tenant's profile API. Request and response bodies are
// encrypted with the tenant's SSO cipher.
@Injectable()
export class ProfileApiService {
  private readonly logger = new Logger(ProfileApiService.name);
  private readonly baseUrl: URL;

  constructor(
    configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {
    this.baseUrl = new URL(
      configService.getOrThrow<string>('PROFILE_API_BASE_URL'),
    );
  }

  async getProfile(
    details: TenantDetails,
    uniqueIdentifier: string,
  ): Promise<EmployeeProfile> {
    // profile_api_url is a path on PROFILE_API_BASE_URL, or a full URL.
    const url = new URL(details.profileApiUrl, this.baseUrl);
    const data = this.cryptoService.encrypt(
      JSON.stringify({ unique_identifier: uniqueIdentifier }),
      details.ssoCipher,
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${details.profileApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // The profile API answers 404 for an unknown unique_identifier.
      if (response.status === HttpStatus.NOT_FOUND) {
        throw new NotFoundException('Employee not found');
      }
      const body = (await response.json()) as ProfileApiResponse;
      const encrypted = body.data?.response;
      if (!response.ok || body.error || typeof encrypted !== 'string') {
        throw new Error(
          `HTTP ${response.status} ${body.statusMessage ?? 'without profile data'}`,
        );
      }
      return JSON.parse(
        this.cryptoService.decrypt(encrypted, details.ssoCipher),
      ) as EmployeeProfile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Profile API ${url.href} failed for tenant ${details.tenantId}: ${(error as Error).message}`,
      );
      throw new BadGatewayException('Could not fetch employee profile');
    }
  }
}
