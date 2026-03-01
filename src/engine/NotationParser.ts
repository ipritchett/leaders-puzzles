import { PlayerColor } from './types.js';
import { CoordinateMapper } from './CoordinateMapper.js';
import type { Piece } from './Piece.js';

// Import all character classes
import { Leader } from './characters/Leader.js';
import { Acrobat } from './characters/Acrobat.js';
import { ClawLauncher } from './characters/ClawLauncher.js';
import { Rider } from './characters/Rider.js';
import { Bruiser } from './characters/Bruiser.js';
import { Manipulator } from './characters/Manipulator.js';
import { RoyalGuard } from './characters/RoyalGuard.js';
import { Wanderer } from './characters/Wanderer.js';
import { Illusionist } from './characters/Illusionist.js';
import { Brewmaster } from './characters/Brewmaster.js';
import { Archer } from './characters/Archer.js';
import { Jailer } from './characters/Jailer.js';
import { Assassin } from './characters/Assassin.js';
import { Protector } from './characters/Protector.js';
import { Vizier } from './characters/Vizier.js';
import { Nemesis } from './characters/Nemesis.js';
import { Hermit } from './characters/Hermit.js';
import { Cub } from './characters/Cub.js';

export type PiecePlacement = {
  acronym: string;
  position: string; // Alphanumeric coordinate
};

export type TeamPlacement = {
  color: PlayerColor;
  pieces: PiecePlacement[];
};

export type NotationParseResult = {
  white: PiecePlacement[];
  black: PiecePlacement[];
};

/**
 * Maps acronyms to character class constructors
 */
const acronymToClass: Map<string, new (id: string, color: PlayerColor, position: any) => Piece> = new Map([
  ['L', Leader],
  ['Ac', Acrobat],
  ['Ar', Archer],
  ['CL', ClawLauncher],
  ['R', Rider],
  ['B', Bruiser],
  ['M', Manipulator],
  ['RG', RoyalGuard],
  ['W', Wanderer],
  ['I', Illusionist],
  ['Bm', Brewmaster],
  ['J', Jailer],
  ['As', Assassin],
  ['P', Protector],
  ['V', Vizier],
  ['N', Nemesis],
  ['H', Hermit],
  ['C', Cub],
]);

export class NotationParser {
  /**
   * Parse a notation string and return piece placements
   * Format: "White: {L:1A, B:1B}; Black: {L:7A, B:7B}"
   * or "White: L:1A, B:1B; Black: L:7A, B:7B"
   */
  static parse(notation: string): NotationParseResult {
    const result: NotationParseResult = {
      white: [],
      black: [],
    };

    // Split by semicolon to get teams
    const teams = notation.split(';').map(t => t.trim()).filter(t => t.length > 0);

    for (const teamStr of teams) {
      // Parse team (e.g., "White: {L:1A, B:1B}" or "White: L:1A, B:1B")
      const colonIndex = teamStr.indexOf(':');
      if (colonIndex === -1) {
        throw new Error(`Invalid team format: ${teamStr}`);
      }

      const teamPrefix = teamStr.substring(0, colonIndex).trim();
      let piecesStr = teamStr.substring(colonIndex + 1).trim();

      // Remove brackets if present
      if (piecesStr.startsWith('{') && piecesStr.endsWith('}')) {
        piecesStr = piecesStr.slice(1, -1).trim();
      }

      // Determine color
      const color = teamPrefix.toLowerCase() === 'white' ? PlayerColor.White : PlayerColor.Black;

      // Parse pieces (e.g., "L:A1, B:A2")
      const pieceStrings = piecesStr.split(',').map(p => p.trim()).filter(p => p.length > 0);

      for (const pieceStr of pieceStrings) {
        const pieceColonIndex = pieceStr.indexOf(':');
        if (pieceColonIndex === -1) {
          throw new Error(`Invalid piece format: ${pieceStr}`);
        }

        const acronym = pieceStr.substring(0, pieceColonIndex).trim();
        const position = pieceStr.substring(pieceColonIndex + 1).trim();

        if (color === PlayerColor.White) {
          result.white.push({ acronym, position });
        } else {
          result.black.push({ acronym, position });
        }
      }
    }

    return result;
  }

  /**
   * Validate notation format
   */
  static validate(notation: string): boolean {
    try {
      const result = NotationParser.parse(notation);

      // Validate all pieces have valid acronyms
      for (const piece of [...result.white, ...result.black]) {
        if (!acronymToClass.has(piece.acronym)) {
          return false;
        }
        if (!CoordinateMapper.isValidAlphanumeric(piece.position)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a Piece instance from acronym and position
   */
  static createPiece(acronym: string, color: PlayerColor, position: string, id: string): Piece | null {
    const PieceClass = acronymToClass.get(acronym);
    if (!PieceClass) {
      return null;
    }

    const axialCoord = CoordinateMapper.toAxial(position);
    if (!axialCoord) {
      return null;
    }

    return new PieceClass(id, color, axialCoord);
  }
}
