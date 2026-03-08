import type { AxialCoord } from '../types.js';
import { PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Leader extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, true); // Leader is always a leader
  }

  getAcronym(): string {
    return 'L';
  }

  getEmoji(): string {
    return '👑';
  }

  getValidMoves(board: Board): AxialCoord[] {
    // If there is a vizier on the team, a leader may move 2 times in a single action.
    if (board.getPiecesByColor(this.color).some((piece) => piece.getAcronym() === 'V')) {
      const onePieceAway = board.getNeighbors(this.position)
      const twoPiecesAway = onePieceAway.map(coord => board.getNeighbors(coord)).flat()
      return [...onePieceAway, ...twoPiecesAway].filter(coord => !board.isOccupied(coord));
    }
    const neighbors = board.getNeighbors(this.position);
    return neighbors.filter(coord => !board.isOccupied(coord));
  }

  *getValidAbilityTargets(_board: Board): AbilityTargetsGenerator {
    yield [];
    return [];
  }

  useAbility(_board: Board, _targets?: AxialCoord[]): boolean {
    // Not implemented yet
    return false;
  }

  /**
   * Check if this leader is captured (adjacent to 2+ enemy pieces)
   */
  isCaptured(board: Board): boolean {
    const enemies = board.getEnemyPieces(this.color);
    let enemyCapturePower = 0;
    for (const enemy of enemies) {
      enemyCapturePower += enemy.threatTo(this.position);
    }
    return enemyCapturePower >= 2;
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
      return winner;
    }
    return null;
  }
}
