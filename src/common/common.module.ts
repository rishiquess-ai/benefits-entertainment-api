import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service.js';
import { SsoService } from './services/sso.service.js';

/**
 * Services shared across the whole application.
 *
 * @Global() means any module can inject these services without importing
 * CommonModule. It only needs to be imported once, in AppModule.
 */
@Global()
@Module({
  providers: [EncryptionService, SsoService],
  exports: [EncryptionService, SsoService],
})
export class CommonModule {}
