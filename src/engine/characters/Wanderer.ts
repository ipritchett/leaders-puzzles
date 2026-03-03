import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Wanderer extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'W';
  }

  getEmoji(): string {
    return '🪽'
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const enemyPieces = board.getEnemyPieces(this.color);
    const adjacentToEnemy = new Set<string>();
    enemyPieces.forEach(piece => {
      const neighbors = board.getNeighbors(piece.position);
      neighbors.forEach(neighbor => {
          adjacentToEnemy.add(`${neighbor.q},${neighbor.r}`);
      })
    })
    const validTargets = board.getAllValidCells().filter(cell => cell !== this.position && !board.isOccupied(cell) && !adjacentToEnemy.has(`${cell.q},${cell.r}`));
    const chosenTarget = yield validTargets;
    return chosenTarget !== undefined ? [chosenTarget] : [];
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
