import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PlayerService } from './player.service.js';

@Module({
  imports: [PrismaModule],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
