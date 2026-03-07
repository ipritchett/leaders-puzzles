import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Manipulator extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'M';
  }

  getEmoji(): string {
    return '🦮';
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const myNeighbors = board.getNeighbors(this.position);
    const visibleEnemyPositions = board.getVisiblePieces(this.position)
     .filter(piece => { return piece.color !== this.color && piece.isMoveable(board)})
     .map(piece => piece.position)
     .filter(position => !myNeighbors.some(n => n.q === position.q && n.r === position.r));
    const chosenEnemyPosition = yield visibleEnemyPositions;
    if (chosenEnemyPosition === undefined) {
      return [];
    }
    const validEnemyDestinations = board.getNeighbors(chosenEnemyPosition)
      .filter(coord => board.isValidDestination(coord))

    const chosenEnemyDestination = yield validEnemyDestinations;
    if (chosenEnemyDestination === undefined) {
      return [chosenEnemyPosition];
    }
    return [chosenEnemyPosition, chosenEnemyDestination];
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets === undefined || targets.length !== 2) {
      return false;
    }
    const [from, to] = targets;
    const enemy = board.getPieceAt(from);
    if (!enemy) return false;
    board.movePiece(from, to);
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
