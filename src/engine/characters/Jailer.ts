import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece } from '../Piece.js';

export class Jailer extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'J';
  }

  useAbility(target?: AxialCoord): boolean {
    // Not implemented yet
    return false;
  }
}
