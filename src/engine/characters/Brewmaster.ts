import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Brewmaster extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'Bm';
  }

  getEmoji(): string {
    return '🍺';
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const adjacentAllyPositions = board.getNeighbors(this.position)
      .filter(coord => board.isOccupied(coord))
      .map(coord => board.getPieceAt(coord))
      .filter(piece => piece !== null)
      .filter(piece => piece.color === this.color)
      .map(ally => ally.position);
    const validTargets = adjacentAllyPositions || [];
    const chosenAllyPosition = yield validTargets;
    if (chosenAllyPosition === undefined) {
      return [];
    }
    const validAllyDestinations = board.getNeighbors(chosenAllyPosition)
      .filter(coord => board.isValidDestination(coord));
    const chosenDestination = yield validAllyDestinations;
    return chosenDestination !== undefined
      ? [chosenAllyPosition, chosenDestination]
      : [chosenAllyPosition];
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets === undefined || targets.length !== 2) {
      return false;
    }
    const [from, to] = targets;
    const ally = board.getPieceAt(from);
    if (!ally) return false;
    board.movePiece(from, to);
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
