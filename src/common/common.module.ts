import { Module } from '@nestjs/common';
import { CryptoService } from './services/crypto.service.js';

@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CommonModule {}
