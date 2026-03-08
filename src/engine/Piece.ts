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
    const availableSpaces = neighbors.filter(coord => !board.isOccupied(coord));

    if (this.isLeader) {
      return availableSpaces;
    }
    // Only check for surrounding the leader if we're not already adjacent to them
    const isAdjacentToOwnLeader = neighbors
      .map(n => board.getPieceAt(n))
      .some(p => p !== null && p.isLeader && p.color === this.color);
    if (isAdjacentToOwnLeader) {
      return availableSpaces;
    }
    // Filter out moves that would surround the piece's leader
    return availableSpaces.filter(
      coord => !board.getNeighbors(coord)
        .map(n => board.getPieceAt(n))
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .some(p => p.isLeader && p.color === this.color && p.getValidMoves(board).length === 1)
    );
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

  canUseAbility(board: Board): boolean {
    return !board.getNeighbors(this.position).some((coord) => {
      const neighbor = board.getPieceAt(coord)
      return neighbor !== null && neighbor.getAcronym() === 'J' && neighbor.color !== this.color
    })  
  }

  isMoveable(board: Board): boolean {
    return !board.getNeighbors(this.position).some((coord) => {
      const neighbor = board.getPieceAt(coord)
      return neighbor !== null && neighbor.color === this.color && neighbor.getAcronym() === 'P'
    })
  }

}
