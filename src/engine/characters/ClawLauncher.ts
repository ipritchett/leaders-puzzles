import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class ClawLauncher extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'CL';
  }

  getEmoji(): string {
    return '🪝';
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
