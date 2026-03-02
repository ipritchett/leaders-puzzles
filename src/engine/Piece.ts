import type { AxialCoord, PlayerColor } from './types.js';
import type { Board } from './Board.js';

/** Generator: each yield = valid targets for current step; next(chosen) = pass chosen target; return = full targets when done. */
export type AbilityTargetsGenerator = Generator<AxialCoord[], AxialCoord[], AxialCoord | undefined>;

export abstract class Piece {
  public readonly id: string;
  public readonly color: PlayerColor;
  public position: AxialCoord;
  public readonly isLeader: boolean;

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

  getCapturePower(): number {
    return 1;
  }

  /** Yields valid targets for each step; receive chosen target via next(chosen). Returns full targets array when done. */
  abstract getValidAbilityTargets(board: Board): AbilityTargetsGenerator;

  abstract getAcronym(): string;

  abstract getEmoji(): string;

  abstract useAbility(board: Board, targets?: AxialCoord[]): boolean;

  hasAbilityImplemented(): boolean {
    return false; // Override in subclasses when ability is implemented
  }
}
