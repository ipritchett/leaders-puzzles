import type { AxialCoord, PlayerColor } from './types.js';
import type { Board } from './Board.js';

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

  abstract getAcronym(): string;

  abstract getEmoji(): string;

  abstract useAbility(target?: AxialCoord): boolean;

  hasAbilityImplemented(): boolean {
    return false; // Override in subclasses when ability is implemented
  }
}
