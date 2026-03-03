import type { AxialCoord, PlayerColor } from './types.js';
import type { Board } from './Board.js';

/** Generator: each yield = valid targets for current step; next(chosen) = pass chosen target; return = full targets when done. */
export type AbilityTargetsGenerator = Generator<AxialCoord[], AxialCoord[], AxialCoord | undefined>;

export abstract class Piece {
  public readonly id: string;
  public readonly color: PlayerColor;
  public position: AxialCoord;
  public readonly isLeader: boolean;
  public isMoveable: boolean = true;
  public canUseAbility: boolean = true;
  public numberOfMoves: number = 1;

  constructor(id: string, color: PlayerColor, position: AxialCoord, isLeader: boolean = false) {
    this.id = id;
    this.color = color;
    this.position = position;
    this.isLeader = isLeader;
  }

  getValidMoves(board: Board): AxialCoord[] {
    const neighbors = board.getNeighbors(this.position);
    return neighbors.filter(coord => !board.isOccupied(coord));
  }

  threatTo(target: AxialCoord): number {
    const qDifference = Math.abs(this.position.q - target.q);
    const rDifference = Math.abs(this.position.r - target.r);
    if (qDifference === 1 && rDifference === 0) {
      return 1;
    }
    if (qDifference === 0 && rDifference === 1) {
      return 1;
    }
    if (qDifference === 1 && rDifference === 1) {
      return 1;
    }
    return 0;
  }

  /** Yields valid targets for each step; receive chosen target via next(chosen). Returns full targets array when done. */
  abstract getValidAbilityTargets(board: Board): AbilityTargetsGenerator;

  abstract getAcronym(): string;

  abstract getEmoji(): string;

  // For pieces with innate abilities that affect other pieces. Called for all pieces before the start of a turn.
  affectPieces(_board: Board): void {
    return;
  }

  // Default implementation for a piece with a single-target space ability
  useAbility(board: Board, targets: AxialCoord[]): boolean {
    if (targets.length !== 1) {
      return false;
    }
    board.movePiece(this.position, targets[0]);
    return true;
  }

  hasActiveAbility(): boolean {
    return false;
  }

  resetPiece(): void {
    this.isMoveable = true;
    this.canUseAbility = true;
  }
}
