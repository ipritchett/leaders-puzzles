import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class RoyalGuard extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'RG';
  }

  getEmoji(): string {
    return '🛡️'
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const alliedLeader = board.getAlliedLeader(this.color);
    if (!alliedLeader) {
      return [];
    }
    const validTeleportTargets = board.getNeighbors(alliedLeader.position).filter(coord => !board.isOccupied(coord));
    const teleportSpace = yield validTeleportTargets;
    if (teleportSpace === undefined) {
      return [];
    }
    const moveSpace = yield board.getNeighbors(teleportSpace).filter(coord => !board.isOccupied(coord));
    if (moveSpace === undefined) {
      return [teleportSpace];
    }
    return [moveSpace];
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
