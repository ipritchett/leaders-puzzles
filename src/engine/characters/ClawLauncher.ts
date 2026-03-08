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

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const myNeighbors = board.getNeighbors(this.position);
    const visibleCharacterPositions = board.getVisiblePieces(this.position)
     .filter(piece => piece.isMoveable(board)) // Ignore pieces that are not moveable.
     .map(piece => piece.position)
     // Ignore adjacent pieces
     .filter(position => !myNeighbors.some(n => n.q === position.q && n.r === position.r));
    const chosenTarget = yield visibleCharacterPositions;
    if (chosenTarget === undefined) {
      return [];
    }
    const direction = board.getDirection(this.position, chosenTarget);
    const myNewPosition = { q: chosenTarget.q - direction.q, r: chosenTarget.r - direction.r };
    const targetNewPosition = { q: this.position.q + direction.q, r: this.position.r + direction.r };
    const chosenDestination = yield [myNewPosition, targetNewPosition];
    if (chosenDestination === undefined) {
      return [];
    }
    // When the two options are the same (one space between CL and target), always pull target toward CL
    const oneSpaceCase =
      myNewPosition.q === targetNewPosition.q && myNewPosition.r === targetNewPosition.r;
    if (oneSpaceCase) {
      return [chosenTarget, chosenDestination];
    }
    if (chosenDestination.q === myNewPosition.q && chosenDestination.r === myNewPosition.r) {
      return [this.position, myNewPosition];
    }
    return [chosenTarget, targetNewPosition];
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets === undefined || targets.length !== 2) {
      return false;
    }
    const [from, to] = targets;
    const piece = board.getPieceAt(from);
    if (!piece) return false;
    board.movePiece(from, to);
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
