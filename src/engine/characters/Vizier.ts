import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Vizier extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'V';
  }

  getEmoji(): string {
    return '📜'
  }

  // Called at the start of every turn.
  affectPieces(board: Board): void {
    const alliedLeader = board.getAlliedLeader(this.color);
    if (alliedLeader) {
      alliedLeader.numberOfMoves = 2;
    }
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
