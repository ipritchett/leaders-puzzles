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
    const alliedPieces = board.getPiecesByColor(this.color);
    const alliedLeader = alliedPieces.filter(p => p.isLeader)[0];
    const validTeleportTargets = board.getNeighbors(alliedLeader.position).filter(coord => !board.isOccupied(coord));
    const teleportSpace = yield validTeleportTargets;
    if (teleportSpace === undefined) {
      return [];
    }
    const moveSpace = yield board.getNeighbors(teleportSpace).filter(coord => !board.isOccupied(coord));
    if (moveSpace === undefined) {
      return [teleportSpace];
    }
    return [moveSpace];
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets.length !== 1) {
      return false;
    }
    board.movePiece(this.position, targets[0]);
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
