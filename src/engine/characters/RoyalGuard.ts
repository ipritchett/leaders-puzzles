import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class RoyalGuard extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'RG';
  }

  getEmoji(): string {
    return '🛡️'
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const alliedLeader = board.getAlliedLeader(this.color);
    if (!alliedLeader) {
      return [];
    }
    const validTeleportTargets = board.getNeighbors(alliedLeader.position).filter(coord => !board.isOccupied(coord));
    const teleportSpace = yield validTeleportTargets;
    if (teleportSpace === undefined) {
      return [];
    }
    const validSecondMoves = board.getNeighbors(teleportSpace).filter(coord => !board.isOccupied(coord));
    // Allow clicking teleport space again to just teleport (no second move)
    validSecondMoves.push(teleportSpace);
    const moveSpace = yield validSecondMoves;
    if (moveSpace === undefined) {
      return [teleportSpace];
    }
    if (moveSpace.q === teleportSpace.q && moveSpace.r === teleportSpace.r) {
      return [teleportSpace];
    }
    return [teleportSpace, moveSpace];
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets.length < 1 || targets.length > 2) {
      return false;
    }
    board.movePiece(this.position, targets[0]);
    if (targets.length === 2) {
      board.movePiece(targets[0], targets[1]);
    }
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
