import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Bruiser extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'B';
  }

  getEmoji(): string {
    return '💪';
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const adjacentEnemyPositions = board.getNeighbors(this.position)
      .filter(coord => board.isOccupied(coord))
      .map(coord => board.getPieceAt(coord))
      .filter(piece => piece !== null)
      .filter(piece => { return piece.color !== this.color && piece.isMoveable(board)})
      .map(enemy => enemy.position);
    const validTargets = adjacentEnemyPositions || [];
    const chosenEnemyPosition = yield validTargets;
    if (chosenEnemyPosition === undefined) {
      return [];
    }
    const validEnemyDestinations = board.getNeighbors(chosenEnemyPosition)
      .filter(coord => board.isValidDestination(coord))
      // Bruiser must push to opposite side (cannot push to cells adjacent to its starting position)
      .filter(coord => !board.getNeighbors(this.position).some(n => n.q === coord.q && n.r === coord.r))
      // Bruiser cannot push to its starting position
      .filter(coord => coord.q !== this.position.q || coord.r !== this.position.r);
    const chosenDestination = yield validEnemyDestinations;
    return chosenDestination !== undefined
      ? [chosenEnemyPosition, chosenDestination]
      : [chosenEnemyPosition];
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets === undefined || targets.length !== 2) {
      return false;
    }
    const [from, to] = targets;
    const enemy = board.getPieceAt(from);
    if (!enemy) return false;
    board.movePiece(from, to);
    board.movePiece(this.position, from);
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
