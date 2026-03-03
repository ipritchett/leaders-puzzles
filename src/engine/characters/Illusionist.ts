import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Illusionist extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'I';
  }

  getEmoji(): string {
    return '🪄';
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const myNeighbors = board.getNeighbors(this.position);
    const validTargets = board.getVisiblePieces(this.position)
     .map(piece => piece.position)
     .filter(position => !myNeighbors.some(n => n.q === position.q && n.r === position.r));

    const chosenTarget = yield validTargets;
    if (chosenTarget === undefined) {
      return [];
    }
    console.log(`Illusionist chosen target: ${chosenTarget.q}, ${chosenTarget.r}`);
    // From, to. swap places.
    return [chosenTarget, this.position];
    
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets.length !== 2) {
      return false;
    }
    const [from, to] = targets;
    console.log(`Illusionist useAbility: ${from.q}, ${from.r} -> ${to.q}, ${to.r}`);
    const piece = board.getPieceAt(from);
    if (!piece) return false;
    board.removePiece(from);
    board.movePiece(to, from);
    piece.position = to;
    board.placePiece(piece, to);
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
