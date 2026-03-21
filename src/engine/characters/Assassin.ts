import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Assassin extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'As';
  }

  threatTo(target: AxialCoord): number {
    const qDifference = Math.abs(this.position.q - target.q);
    const rDifference = Math.abs(this.position.r - target.r);
    if (qDifference === 1 && rDifference === 0) {
      return 2;
    }
    if (qDifference === 0 && rDifference === 1) {
      return 2;
    }
    if (qDifference === 1 && rDifference === 1) {
      return 2;
    }
    return 0;
  }

  getEmoji(): string {
    return '🔪';
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
