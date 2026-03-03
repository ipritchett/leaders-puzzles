import type { AxialCoord } from './types.js';
import { PlayerColor } from './types.js';
import { Board } from './Board.js';
import type { Piece, AbilityTargetsGenerator } from './Piece.js';
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
  Hermit,
  Cub,
];

export type ActionMode = 'move' | 'ability';

// TODO: Move this to its own class
export class UIState {
  selectedPiece: Piece | null = null;
  heldPiece: Piece | null = null;
  cursorPixelX: number = 0;
  cursorPixelY: number = 0;
  actionMode: ActionMode = 'move';

  clear(): void {
    this.selectedPiece = null;
    this.heldPiece = null;
    this.actionMode = 'move';
  }

  setSelectedPiece(piece: Piece): void {
    this.selectedPiece = piece;
  }

  setHeldPiece(piece: Piece): void {
    this.heldPiece = piece;
  }

  setActionMode(mode: ActionMode): void {
    this.actionMode = mode;
  }

  getActionMode(): ActionMode {
    return this.actionMode;
  }
  
  setCursorPosition(pixelX: number, pixelY: number): void {
    this.cursorPixelX = pixelX;
    this.cursorPixelY = pixelY;
  }

}
 

export class Game {
  public readonly board: Board;
  public currentTurn: PlayerColor;
  private movedPieces: Set<string>; // SUGGESTION: Revert this (track pieces with an action). Will make implementing Nemesis and H+C easier.
  private uiState: UIState;
  public readonly pieces: Piece[];
  public gameOver: boolean;
  public winner: PlayerColor | null;
  private abilityGenerator: AbilityTargetsGenerator | null = null;
  private currentAbilityTargets: AxialCoord[] = [];
  private abilityTargetsChosenSoFar: AxialCoord[] = [];

  constructor(notation?: string) {
    this.board = new Board();
    this.currentTurn = PlayerColor.Black; // Start with Black's turn
    this.movedPieces = new Set();
    this.uiState = new UIState();
    this.pieces = [];
    this.gameOver = false;
    this.winner = null;

    if (notation) {
      this.loadFromNotation(notation);
    } else {
      this.initializePieces();
    }
    // Instantiate the board with correct effects.
    this.pieces.forEach(piece => piece.affectPieces(this.board));
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
      this.clearAbilityFlow();
      this.uiState.clear();
      return false;
    }

    // Check if piece belongs to current player
    if (piece.color !== this.currentTurn) {
      this.clearAbilityFlow();
      this.uiState.clear();
      return false;
    }

    // Check if piece has already moved this turn
    if (this.movedPieces.has(piece.id)) {
      this.clearAbilityFlow();
      this.uiState.clear();
      return false;
    }

    this.clearAbilityFlow();
    this.uiState.setSelectedPiece(piece);
    this.uiState.setActionMode('move');
    return true;
  }

  getSelectedPiece(): Piece | null {
    return this.uiState.selectedPiece;
  }

  getUIState(): UIState {
    return this.uiState;
  }

  setActionMode(mode: ActionMode): void {
    if (mode === 'move') {
      this.clearAbilityFlow();
    }
    this.uiState.setActionMode(mode);
  }

  getActionMode(): ActionMode {
    return this.uiState.getActionMode();
  }

  /** Start dragging the selected piece at cursor position. Called by input. */
  startDrag(piece: Piece, pixelX: number, pixelY: number): void {
    if (this.uiState.selectedPiece?.id !== piece.id) {
      return;
    }
    this.uiState.setHeldPiece(piece);
    this.uiState.setCursorPosition(pixelX, pixelY);
  }

  /** Update cursor position during drag. */
  updateDragPosition(pixelX: number, pixelY: number): void {
    this.uiState.setCursorPosition(pixelX, pixelY);
  }

  /** End drag (drop or cancel). */
  clearDrag(): void {
    this.clearAbilityFlow();
    this.uiState.clear();
  }

  getValidMovesForSelected(): AxialCoord[] {
    if (!this.uiState.selectedPiece) {
      return [];
    }
    return this.uiState.selectedPiece.getValidMoves(this.board);
  }

  getValidAbilityTargetsForSelected(): AxialCoord[] {
    if (!this.uiState.selectedPiece || this.uiState.getActionMode() !== 'ability') {
      return [];
    }
    if (this.abilityGenerator !== null) {
      return this.currentAbilityTargets;
    }
    this.startAbilityFlow();
    return this.currentAbilityTargets;
  }

  private startAbilityFlow(): void {
    const piece = this.uiState.selectedPiece;
    if (!piece) return;
    this.abilityTargetsChosenSoFar = [];
    const gen = piece.getValidAbilityTargets(this.board);
    const result = gen.next();
    this.abilityGenerator = gen;
    this.currentAbilityTargets = result.value ?? [];
  }

  getAbilityTargetsChosenSoFar(): AxialCoord[] {
    return this.abilityTargetsChosenSoFar;
  }

  /** Submit a chosen ability target; advances the generator or executes ability when done. Returns true if the click was consumed. */
  submitAbilityTarget(coord: AxialCoord): boolean {
    if (this.abilityGenerator === null || !this.uiState.selectedPiece) {
      return false;
    }
    const isValid = this.currentAbilityTargets.some(
      (c) => c.q === coord.q && c.r === coord.r
    );
    if (!isValid) {
      return false;
    }
    const result = this.abilityGenerator.next(coord);
    if (result.done) {
      const targets = result.value ?? [];
      this.clearAbilityFlow();
      if (targets.length > 0) {
        this.executeAbility(targets);
      }
      return true;
    }
    this.abilityTargetsChosenSoFar.push(coord);
    this.currentAbilityTargets = result.value ?? [];
    return true;
  }

  private clearAbilityFlow(): void {
    this.abilityGenerator = null;
    this.currentAbilityTargets = [];
    this.abilityTargetsChosenSoFar = [];
  }

  private executeAbility(targets: AxialCoord[]): boolean {
    const piece = this.uiState.selectedPiece;
    if (!piece || this.movedPieces.has(piece.id)) return false;
    const ok = piece.useAbility(this.board, targets);
    if (ok) {
      this.movedPieces.add(piece.id);
      this.uiState.clear();
      try {
        this.checkVictoryConditions();
      } catch (error) {
        console.error('Error checking victory conditions:', error);
      }
    }
    return ok;
  }

  movePiece(target: AxialCoord): boolean {
    if (!this.uiState.selectedPiece) {
      return false;
    }

    const validMoves = this.getValidMovesForSelected();
    const isValidMove = validMoves.some(
      move => move.q === target.q && move.r === target.r
    );

    if (!isValidMove) {
      return false;
    }

    const from = this.uiState.selectedPiece.position;
    this.board.movePiece(from, target);
    this.uiState.selectedPiece.position = target;
    if (this.uiState.selectedPiece.numberOfMoves > 1) {
      this.uiState.selectedPiece.numberOfMoves--;
    } else {
      this.movedPieces.add(this.uiState.selectedPiece.id);
    }
    this.clearAbilityFlow();
    this.uiState.clear();

    // Check for victory conditions after move (don't let errors break the move)
    try {
      this.checkVictoryConditions();
    } catch (error) {
      console.error('Error checking victory conditions:', error);
    }

    return true;
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
    // First reset all status effects, THEN affect all pieces.
    this.pieces.forEach(piece => piece.resetPiece());
    this.pieces.forEach(piece => piece.affectPieces(this.board));
    this.currentTurn = this.currentTurn === PlayerColor.White 
      ? PlayerColor.Black 
      : PlayerColor.White;
    this.movedPieces.clear();
    this.uiState.clear();
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
    this.uiState.clear();
    this.gameOver = false;
    this.winner = null;

    // Clear and reinitialize pieces
    this.pieces.length = 0;
    
    if (notation) {
      this.loadFromNotation(notation);
    } else {
      this.initializePieces();
    }
    // Reset the board with correct effects.
    this.pieces.forEach(piece => piece.resetPiece());
    this.pieces.forEach(piece => piece.affectPieces(this.board));
  }
}
