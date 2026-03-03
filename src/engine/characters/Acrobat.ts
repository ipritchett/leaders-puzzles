import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import { Board } from '../Board.js';

function getLandingSpots(board: Board, from: AxialCoord): AxialCoord[] {
  return board.getNeighbors(from)
    .filter(coord => board.isOccupied(coord))
    .map(coord => {
      const direction = board.getDirection(from, coord);
      const nextSpace = { q: coord.q + direction.q, r: coord.r + direction.r };
      if (!board.isValidCell(nextSpace) || board.isOccupied(nextSpace)) return null;
      return nextSpace;
    })
    .filter((c): c is AxialCoord => c !== null);
}

export class Acrobat extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'Ac';
  }

  getEmoji(): string {
    return '🤸';
  }

  *getValidAbilityTargets(board: Board): AbilityTargetsGenerator {
    const validFirstJumps = getLandingSpots(board, this.position);
    const chosenFirstJump = yield validFirstJumps;
    // User may jump again
    if (chosenFirstJump === undefined) {
      return [];
    }
    const validSecondJumps = getLandingSpots(board, chosenFirstJump);
    // Because board state hasn't updated yet, acrobat still occupies its current position
    //  and it won't be included as a valid target (which we would not want)
    // Add position after first jump as a valid target to allow user to skip second jump
    validSecondJumps.push(chosenFirstJump);
    const chosenSecondJump = yield validSecondJumps;
    // Return both jumps so useAbility can perform them in order; skip = same cell so one or two elements
    if (chosenSecondJump === undefined) {
      return [chosenFirstJump];
    }
    return [chosenFirstJump, chosenSecondJump];
  }

  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets.length === 0 || targets.length > 2) {
      return false;
    }
    // TODO: Validate targets?
    board.movePiece(this.position, targets[targets.length - 1]);
    return true;
  }

  hasActiveAbility(): boolean {
    return true;
  }
}
