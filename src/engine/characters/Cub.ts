import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Cub extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getCapturePower(): number {
    return 0;
  }

  getAcronym(): string {
    return 'C';
  }

  getEmoji(): string {
    return '🐻';
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
