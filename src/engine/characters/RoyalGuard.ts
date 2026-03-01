import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece } from '../Piece.js';

export class RoyalGuard extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }

  getAcronym(): string {
    return 'RG';
  }

  useAbility(target?: AxialCoord): boolean {
    // Not implemented yet
    return false;
  }
}
