import type { AxialCoord } from './types.js';
import { PlayerColor } from './types.js';
import { Board } from './Board.js';
import type { Piece } from './Piece.js';
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
import { HermitAndCub } from './characters/HermitAndCub.js';
import { NotationParser } from './NotationParser.js';
import { CoordinateMapper } from './CoordinateMapper.js';

// All character classes except Leader
const nonLeaderClasses = [
  Acrobat,
  ClawLauncher,
  Rider,
  Bruiser,
  Manipulator,
  RoyalGuard,
  Wanderer,
  Illusionist,
  Brewmaster,
  Archer,
  Jailer,
  Assassin,
  Protector,
  Vizier,
  Nemesis,
  HermitAndCub,
];

export class Game {
  public readonly board: Board;
  public currentTurn: PlayerColor;
  private movedPieces: Set<string>;
  private selectedPiece: Piece | null;
  public readonly pieces: Piece[];
  public gameOver: boolean;
  public winner: PlayerColor | null;

  constructor(notation?: string) {
    this.board = new Board();
    this.currentTurn = PlayerColor.Black; // Start with Black's turn
    this.movedPieces = new Set();
    this.selectedPiece = null;
    this.pieces = [];
    this.gameOver = false;
    this.winner = null;

    if (notation) {
      this.loadFromNotation(notation);
    } else {
      this.initializePieces();
    }
  }

  private initializePieces(): void {
    // White pieces (top rows)
    const whitePositions: AxialCoord[] = [
      { q: 0, r: -3 },
      { q: 1, r: -3 },
      { q: 2, r: -3 },
      { q: -1, r: -2 },
      { q: 1, r: -2 }
    ];

    // Black pieces (bottom rows)
    const blackPositions: AxialCoord[] = [
      { q: 0, r: 3 },
      { q: -1, r: 3 },
      { q: -2, r: 3 },
      { q: 1, r: 2 },
      { q: -1, r: 2 }
    ];

    // Randomly select 4 non-Leader character classes for each team
    const whiteClasses = this.getRandomCharacterClasses();
    const blackClasses = this.getRandomCharacterClasses();

    // Create and place white pieces
    // First piece (index 0) is always the Leader
    whitePositions.forEach((pos, index) => {
      try {
        let piece: Piece;
        if (index === 0) {
          piece = new Leader(`white-${index}`, PlayerColor.White, pos);
        } else {
          const PieceClass = whiteClasses[index - 1];
          piece = new PieceClass(`white-${index}`, PlayerColor.White, pos);
        }
        this.board.placePiece(piece, pos);
        this.pieces.push(piece);
      } catch (error) {
        console.error(`Error creating white piece at index ${index}:`, error);
      }
    });

    // Create and place black pieces
    // First piece (index 0) is always the Leader
    blackPositions.forEach((pos, index) => {
      try {
        let piece: Piece;
        if (index === 0) {
          piece = new Leader(`black-${index}`, PlayerColor.Black, pos);
        } else {
          const PieceClass = blackClasses[index - 1];
          piece = new PieceClass(`black-${index}`, PlayerColor.Black, pos);
        }
        this.board.placePiece(piece, pos);
        this.pieces.push(piece);
      } catch (error) {
        console.error(`Error creating black piece at index ${index}:`, error);
      }
    });
  }

  private getRandomCharacterClasses(): (new (id: string, color: PlayerColor, position: AxialCoord) => Piece)[] {
    // Shuffle and take 4 random classes
    const shuffled = [...nonLeaderClasses].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }

  selectPiece(coord: AxialCoord): boolean {
    const piece = this.board.getPieceAt(coord);
    
    if (!piece) {
      this.selectedPiece = null;
      return false;
    }

    // Check if piece belongs to current player
    if (piece.color !== this.currentTurn) {
      this.selectedPiece = null;
      return false;
    }

    // Check if piece has already moved this turn
    if (this.movedPieces.has(piece.id)) {
      this.selectedPiece = null;
      return false;
    }

    this.selectedPiece = piece;
    return true;
  }

  getSelectedPiece(): Piece | null {
    return this.selectedPiece;
  }

  getValidMovesForSelected(): AxialCoord[] {
    if (!this.selectedPiece) {
      return [];
    }
    return this.selectedPiece.getValidMoves(this.board);
  }

  movePiece(target: AxialCoord): boolean {
    if (!this.selectedPiece) {
      return false;
    }

    const validMoves = this.getValidMovesForSelected();
    const isValidMove = validMoves.some(
      move => move.q === target.q && move.r === target.r
    );

    if (!isValidMove) {
      return false;
    }

    const from = this.selectedPiece.position;
    this.board.movePiece(from, target);
    this.selectedPiece.position = target;
    this.movedPieces.add(this.selectedPiece.id);
    this.selectedPiece = null;

    // Check for victory conditions after move (don't let errors break the move)
    try {
      this.checkVictoryConditions();
    } catch (error) {
      console.error('Error checking victory conditions:', error);
    }

    return true;
  }

  useAbility(target?: AxialCoord): boolean {
    if (!this.selectedPiece) {
      return false;
    }

    // Check if piece has already moved this turn
    if (this.movedPieces.has(this.selectedPiece.id)) {
      return false;
    }

    // Use the piece's ability
    const abilityUsed = this.selectedPiece.useAbility(target);
    if (abilityUsed) {
      this.movedPieces.add(this.selectedPiece.id);
      this.selectedPiece = null;
      // Check for victory conditions after ability use (don't let errors break the ability)
      try {
        this.checkVictoryConditions();
      } catch (error) {
        console.error('Error checking victory conditions:', error);
      }
    }

    return abilityUsed;
  }

  private checkVictoryConditions(): void {
    // Check all leaders for victory conditions
    const leaders = this.pieces.filter(p => p.isLeader);

    if (leaders.length === 0) {
      console.warn('No leaders found on the board');
      return;
    }

    console.log(`Checking victory conditions for ${leaders.length} leader(s)`);

    for (const leader of leaders) {
      // Check if this piece has the checkVictoryCondition method (more reliable than instanceof)
      const hasMethod = typeof (leader as any).checkVictoryCondition === 'function';
      const isLeaderInstance = leader instanceof Leader;
      
      if (hasMethod || isLeaderInstance) {
        try {
          const winner = (leader as Leader).checkVictoryCondition(this.board);
          if (winner) {
            this.gameOver = true;
            this.winner = winner;
            console.log(`Victory condition triggered! ${winner} wins. Leader ${leader.id} (${leader.color}) is captured or surrounded.`);
            return;
          }
        } catch (error) {
          console.error(`Error checking victory condition for leader ${leader.id}:`, error);
        }
      } else {
        // If piece has isLeader but isn't a Leader instance, log a warning
        console.warn(`Piece ${leader.id} is marked as leader but has no checkVictoryCondition method. Type: ${leader.constructor.name}, instanceof Leader: ${isLeaderInstance}`);
      }
    }
  }

  endTurn(): void {
    this.currentTurn = this.currentTurn === PlayerColor.White 
      ? PlayerColor.Black 
      : PlayerColor.White;
    this.movedPieces.clear();
    this.selectedPiece = null;
  }

  hasMovedThisTurn(pieceId: string): boolean {
    return this.movedPieces.has(pieceId);
  }

  getPiecesByColor(color: PlayerColor): Piece[] {
    return this.pieces.filter(p => p.color === color);
  }

  getLeader(color: PlayerColor): Piece | undefined {
    return this.pieces.find(p => p.color === color && p.isLeader);
  }

  loadFromNotation(notation: string): void {
    // Clear existing pieces
    const allCells = this.board.getAllValidCells();
    for (const cell of allCells) {
      if (this.board.isOccupied(cell)) {
        this.board.removePiece(cell);
      }
    }
    this.pieces.length = 0;

    // Parse notation
    const parseResult = NotationParser.parse(notation);

    // Create white pieces
    parseResult.white.forEach((placement, index) => {
      try {
        const piece = NotationParser.createPiece(
          placement.acronym,
          PlayerColor.White,
          placement.position,
          `white-${index}`
        );
        if (piece) {
          this.board.placePiece(piece, piece.position);
          this.pieces.push(piece);
        } else {
          console.error(`Failed to create white piece: ${placement.acronym} at ${placement.position}`);
        }
      } catch (error) {
        console.error(`Error creating white piece ${placement.acronym} at ${placement.position}:`, error);
      }
    });

    // Create black pieces
    parseResult.black.forEach((placement, index) => {
      try {
        const piece = NotationParser.createPiece(
          placement.acronym,
          PlayerColor.Black,
          placement.position,
          `black-${index}`
        );
        if (piece) {
          this.board.placePiece(piece, piece.position);
          this.pieces.push(piece);
        } else {
          console.error(`Failed to create black piece: ${placement.acronym} at ${placement.position}`);
        }
      } catch (error) {
        console.error(`Error creating black piece ${placement.acronym} at ${placement.position}:`, error);
      }
    });
  }

  /**
   * Generate notation string from current board state
   */
  generateNotation(): string {
    const whitePieces: string[] = [];
    const blackPieces: string[] = [];

    for (const piece of this.pieces) {
      const acronym = piece.getAcronym();
      const alphanumeric = CoordinateMapper.toAlphanumeric(piece.position);
      
      if (alphanumeric) {
        const pieceStr = `${acronym}:${alphanumeric}`;
        if (piece.color === PlayerColor.White) {
          whitePieces.push(pieceStr);
        } else {
          blackPieces.push(pieceStr);
        }
      } else {
        console.warn(`Piece ${piece.id} at position q:${piece.position.q}, r:${piece.position.r} has no alphanumeric mapping`);
      }
    }

    const parts: string[] = [];
    if (whitePieces.length > 0) {
      parts.push(`White: {${whitePieces.join(', ')}}`);
    }
    if (blackPieces.length > 0) {
      parts.push(`Black: {${blackPieces.join(', ')}}`);
    }

    return parts.join('; ');
  }

  reset(notation?: string): void {
    // Clear board by removing all pieces
    const allCells = this.board.getAllValidCells();
    for (const cell of allCells) {
      if (this.board.isOccupied(cell)) {
        this.board.removePiece(cell);
      }
    }

    // Reset game state
    this.currentTurn = PlayerColor.Black; // Start with Black's turn
    this.movedPieces.clear();
    this.selectedPiece = null;
    this.gameOver = false;
    this.winner = null;

    // Clear and reinitialize pieces
    this.pieces.length = 0;
    
    if (notation) {
      this.loadFromNotation(notation);
    } else {
      this.initializePieces();
    }
  }
}
