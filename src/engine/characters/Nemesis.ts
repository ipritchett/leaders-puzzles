import type { AxialCoord, PlayerColor } from '../types.js';
import { Piece, type AbilityTargetsGenerator } from '../Piece.js';
import type { Board } from '../Board.js';

export class Nemesis extends Piece {
  constructor(id: string, color: PlayerColor, position: AxialCoord) {
    super(id, color, position, false);
  }


  getValidMoves(board: Board): AxialCoord[] {
    const validSecondMoves = new Set<AxialCoord>();
    const validFirstMoves = board.getNeighbors(this.position).filter(coord => !board.isOccupied(coord));
    validFirstMoves.forEach((coord) => { 
      board.getNeighbors(coord).flat().filter(coord => !board.isOccupied(coord)).forEach((coord) => {
        validSecondMoves.add(coord);
      });
    });

    validSecondMoves.delete(this.position);
    console.log(validSecondMoves);
    return [...validSecondMoves.values()];
  }

  getAcronym(): string {
    return 'N';
  }

  getEmoji(): string {
    return '👹';
  }

  *getValidAbilityTargets(_board: Board): AbilityTargetsGenerator {
    yield [];
    return [];
  }

  useAbility(_board: Board, _targets?: AxialCoord[]): boolean {
    // Not implemented yet
    return false;
  }
}
