import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Archer extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'Ar';
  }

  getEmoji(): string {
    return '🏹';
  }

  threatTo(target: AxialCoord): number {
    const qDifference = Math.abs(target.q - this.position.q);
    const rDifference = Math.abs(target.r - this.position.r);
    if (qDifference === 2 && (rDifference === 0 || rDifference === 2)) {
      return 1;
    }
    if (rDifference === 2 && (qDifference === 0 || qDifference === 2)) {
      return 1;
    }
    return 0;
  }

  *getValidAbilityTargets(_board: Board): AbilityTargetsGenerator {
    yield [];
    return [];
  }

  useAbility(_board: Board, _targets?: AxialCoord[]): boolean {
    // Not implemented yet
    return false;
  }
}
