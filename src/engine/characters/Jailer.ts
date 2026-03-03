import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Jailer extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'J';
  }

  getEmoji(): string {
    return '🔗';
  }

  *getValidAbilityTargets(_board: Board): AbilityTargetsGenerator {
    yield [];
    return [];
  }

  useAbility(_board: Board, _targets?: AxialCoord[]): boolean {
    // Not implemented yet
    return false;
  }

  affectPieces(board: Board): void {
    const neighbors = board.getNeighbors(this.position);
    neighbors.forEach(coord => {
      const piece = board.getPieceAt(coord);
      if (piece && piece.color !== this.color) {
        piece.canUseAbility = false;
      }
    });
  }
}
