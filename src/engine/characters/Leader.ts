import type { AxialCoord } from '../types.js';
import { PlayerColor } from '../types.js';
import { Piece } from '../Piece.js';
import type { Board } from '../Board.js';

export class Leader extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, true); // Leader is always a leader
  }

  getAcronym(): string {
    return 'L';
  }

  useAbility(target?: AxialCoord): boolean {
    // Not implemented yet
    return false;
  }

  /**
   * Check if this leader is captured (adjacent to 2+ enemy pieces)
   */
  isCaptured(board: Board): boolean {
    const neighbors = board.getNeighbors(this.position);
    let enemyCount = 0;

    for (const neighbor of neighbors) {
      const piece = board.getPieceAt(neighbor);
      if (piece && piece.color !== this.color) {
        enemyCount++;
      }
    }

    return enemyCount >= 2;
  }

  /**
   * Check if this leader is surrounded (no valid moves available)
   */
  isSurrounded(board: Board): boolean {
    const validMoves = this.getValidMoves(board);
    return validMoves.length === 0;
  }

  /**
   * Check if this leader triggers a victory condition
   * Returns the winning color if this leader is captured or surrounded, null otherwise
   */
  checkVictoryCondition(board: Board): PlayerColor | null {
    const captured = this.isCaptured(board);
    const surrounded = this.isSurrounded(board);
    
    if (captured || surrounded) {
      // If this leader is captured/surrounded, the opposing team wins
      const winner = this.color === PlayerColor.White ? PlayerColor.Black : PlayerColor.White;
      console.log(`Leader ${this.id} (${this.color}) victory check: captured=${captured}, surrounded=${surrounded}, winner=${winner}`);
      return winner;
    }
    return null;
  }
}
