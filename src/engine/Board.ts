import type { AxialCoord} from './types.js';
import type { Piece } from './Piece.js';
import type { PlayerColor } from './types.js';
import { PlayerColor as PlayerColorConst } from './types.js';
import { CoordinateMapper } from './CoordinateMapper.js';
import { ActionMode } from './Game.js';


type Move = { 
  piece: Piece;
  source: ActionMode;
  movedPieces: {
    piece: Piece,
    target: AxialCoord
  }[]
}


const DIRECTIONS: AxialCoord[] = [
  { q: 0, r: -1 },
  { q: 0, r: 1 },
  { q: 1, r: -1 },
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
];

export class Board {
  private validCells: Set<string>;
  private occupancy: Map<string, Piece>;
  public turnMoves: Move[] = []


  constructor() {
    this.validCells = new Set();
    this.occupancy = new Map();

    // Generate all valid cells: |q| <= 3, |r| <= 3, |q + r| <= 3
    for (let q = -3; q <= 3; q++) {
      for (let r = -3; r <= 3; r++) {
        if (Math.abs(q + r) <= 3) {
          this.validCells.add(this.coordToString({ q, r }));
        }
      }
    }
  }

  /** Returns a shallow copy of the board (same piece refs). Used for simulating ability outcomes. */
  clone(): Board {
    const c = new Board();
    for (const [k, v] of this.occupancy) {
      c.occupancy.set(k, v);
    }
    return c;
  }

  private coordToString(coord: AxialCoord): string {
    return `${coord.q},${coord.r}`;
  }

  private stringToCoord(str: string): AxialCoord {
    const [q, r] = str.split(',').map(Number);
    return { q, r };
  }

  isValidCell(coord: AxialCoord): boolean {
    return this.validCells.has(this.coordToString(coord));
  }

  isValidDestination(coord: AxialCoord): boolean { 
    return this.isValidCell(coord) && !this.isOccupied(coord);
  }

  getAllValidCells(): AxialCoord[] {
    return Array.from(this.validCells).map(str => this.stringToCoord(str));
  }

  getNeighbors(coord: AxialCoord): AxialCoord[] {
    return this.getSpacesAway(coord, 1)
  }


  getSpacesAway(coord: AxialCoord, spaces: number): AxialCoord[] {
    const potentialSpaces = [
      { q: coord.q + spaces, r: coord.r },
      { q: coord.q - spaces, r: coord.r },
      { q: coord.q, r: coord.r + spaces },
      { q: coord.q, r: coord.r - spaces },
      { q: coord.q + spaces, r: coord.r - spaces },
      { q: coord.q - spaces, r: coord.r + spaces }
    ];

    return potentialSpaces.filter(n => this.isValidCell(n));
  }

  getPiecesByColor(color: PlayerColor): Piece[] {
    return Array.from(this.occupancy.values()).filter(p => p.color === color);
  }

  // Another janky implementation since the engine don't currently enforce unique piece per team
  getCharacterWithColor(character: string, color: PlayerColor): Piece | null {
    return this.getPiecesByColor(color).filter((piece) => piece.getAcronym() === character)[0]
  }

  isOccupied(coord: AxialCoord): boolean {
    return this.occupancy.has(this.coordToString(coord));
  }

  getPieceAt(coord: AxialCoord): Piece | null {
    const key = this.coordToString(coord);
    return this.occupancy.get(key) || null;
  }

  getEnemyPieces(color: PlayerColor): Piece[] {
    if (color === PlayerColorConst.White) {
      return this.getPiecesByColor(PlayerColorConst.Black);
    }
    return this.getPiecesByColor(PlayerColorConst.White);
  }

  getDirection(from: AxialCoord, to: AxialCoord): AxialCoord {
    return { q: Math.sign(to.q - from.q), r: Math.sign(to.r - from.r) };
  }

  getVisiblePieces(origin: AxialCoord): Piece[] {
    const visiblePieces: Piece[] = [];
    for (const direction of DIRECTIONS) {
      let current = origin;
      while (true) {
        const target = { q: current.q + direction.q, r: current.r + direction.r };
        // Stop when we hit the edge of the board or at first piece
        if (!this.isValidCell(target)) {
          break;
        }
        const piece = this.getPieceAt(target);
        if (piece) {
          visiblePieces.push(piece);
          break;
        }
        current = target;
      }
    }
    return visiblePieces;
  }

  // Only supports one leader but them's the rules.
  getAlliedLeader(color: PlayerColor): Piece | undefined {
    const alliedPieces = this.getPiecesByColor(color);
    return alliedPieces.filter(p => p.isLeader)[0];
  }

  placePiece(piece: Piece, coord: AxialCoord): void {
    if (!this.isValidCell(coord)) {
      throw new Error(`Invalid cell: ${coord.q}, ${coord.r}`);
    }
    if (this.isOccupied(coord)) {
      throw new Error(`Cell already occupied: ${coord.q}, ${coord.r}`);
    }
    this.occupancy.set(this.coordToString(coord), piece);
  }

  movePiece(from: AxialCoord, to: AxialCoord): void {
    const piece = this.getPieceAt(from);
    if (!piece) {
      throw new Error(`No piece at source: ${from.q}, ${from.r}`);
    }
    if (this.isOccupied(to)) {
      throw new Error(`Target cell occupied: ${to.q}, ${to.r}`);
    }
    this.occupancy.delete(this.coordToString(from));
    this.occupancy.set(this.coordToString(to), piece);
    piece.position = to;
    this.turnMoves[this.turnMoves.length - 1].movedPieces.push({ piece, target: to})
  }

  removePiece(coord: AxialCoord): void {
    this.occupancy.delete(this.coordToString(coord));
  }
}
