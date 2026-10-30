import { Injectable } from '@nestjs/common';
import type { Player } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type NewPlayer = Pick<
  Player,
  | 'customerId'
  | 'playerId'
  | 'playerReferenceId'
  | 'firstName'
  | 'lastName'
  | 'displayName'
  | 'contactNo'
  | 'emailId'
>;

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  // Returns the customer's player with this player_reference_id, creating it
  // first if there is none. active_flag uses the column default.
  async findOrCreate(data: NewPlayer): Promise<Player> {
    const where = {
      customerId_playerReferenceId: {
        customerId: data.customerId,
        playerReferenceId: data.playerReferenceId,
      },
    };
    const existing = await this.prisma.player.findUnique({ where });
    if (existing) {
      return existing;
    }
    // skipDuplicates: if a concurrent request created it first, use theirs.
    await this.prisma.player.createMany({ data, skipDuplicates: true });
    return this.prisma.player.findUniqueOrThrow({ where });
  }
}
