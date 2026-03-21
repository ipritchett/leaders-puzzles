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
    // Only empty spaces 2 away where the intermediate space (1 away) is also clear
    const twoSpacesAway = board.getSpacesAway(this.position, 2).filter(space => {
      const midpoint = { q: (this.position.q + space.q) / 2, r: (this.position.r + space.r) / 2 };
      return !board.isOccupied(midpoint) && board.isValidDestination(space);
    });
    const target = yield twoSpacesAway;
    return target !== undefined ? [target] : [];
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
