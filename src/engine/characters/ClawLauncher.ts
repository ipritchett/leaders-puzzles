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
     .filter(piece => piece.isMoveable()) // Ignore pieces that are not moveable.
     .map(piece => piece.position)
     // Ignore adjacent pieces
     .filter(position => !myNeighbors.some(n => n.q === position.q && n.r === position.r));
    console.log(`Visible non-adjacent pieces: ${visibleCharacterPositions.map(p => `(${p.q}, ${p.r})`).join(', ')}`);
    const chosenTarget = yield visibleCharacterPositions;
    if (chosenTarget === undefined) {
      return [];
    }
    // Choose to pull target to me or me to target
    const direction = board.getDirection(this.position, chosenTarget);
    const myNewPosition  = { q: chosenTarget.q - direction.q, r: chosenTarget.r - direction.r };
    const targetNewPosition = { q: this.position.q + direction.q, r: this.position.r + direction.r };
    const chosenDestination = yield [myNewPosition, targetNewPosition];
    if (chosenDestination === undefined) {
      return [];
    }
    if (chosenDestination.q === myNewPosition.q && chosenDestination.r === myNewPosition.r) {
      return [this.position, myNewPosition];
    }
    return [chosenTarget, chosenDestination];
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
