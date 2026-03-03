import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Rider extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'R';
  }

  getEmoji(): string {
    return '🐴';
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    // Filter out any destination 2 spaces away if the intermediate space (1 away in the same direction) is occupied
    const twoSpacesAway = board.getSpacesAway(this.position, 2).filter(space => {
      const midpoint = { q: (this.position.q + space.q) / 2, r: (this.position.r + space.r) / 2 };
      return !board.isOccupied(midpoint);
    });
    const target = yield twoSpacesAway;
    return target !== undefined ? [target] : [];
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
