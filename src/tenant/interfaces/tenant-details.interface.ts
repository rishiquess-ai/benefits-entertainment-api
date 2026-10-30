import { CipherConfig } from '../../common/interfaces/cipher-config.interface.js';

// tenant_details.app_branding. Every key is optional because the column
// accepts any JSON.
export interface AppBranding {
  name?: string;
  tagline?: string;
  subtitle?: string;
  logo?: string;
}

// A tenant's tenant_details row. ssoCipher is built from encryption_cipher,
// encryption_key and encryption_iv.
export interface TenantDetails {
  tenantId: string;
  ssoCipher: CipherConfig;
  profileApiUrl: string;
  profileApiToken: string;
  redirectBackUrl: string;
  isBackEnabled: boolean;
  defaultLeaderboardScope: string;
  appBranding: AppBranding;
}
