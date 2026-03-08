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

export type ActionMode = 'move' | 'ability' | 'forced';

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
  private turnHistory: string[] = [];
  private hermitCubHistory: {hermit: boolean, cub: boolean} = {hermit: false, cub: false}

  constructor(notation?: string) {
    this.board = new Board();
    this.currentTurn = PlayerColor.Black; // Start with Black's turn
    this.movedPieces = new Set();
    this.uiState = new UIState();
    this.pieces = [];
    this.gameOver = false;
    this.winner = null;

    if (notation) {
      this.loadFromNotation(notation, true);
    } else {
      this.initializePieces();
    }
  }

  private initializePieces(): void {

    this.turnHistory = []
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

    this.recordTurnHistory()
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

  /**
   * Simulates applying the ability with the given targets and returns true if the move is legal.
   */
  private isLegalMove(piece: Piece, targets: AxialCoord[]): boolean {
    const savedPositions = new Map(this.pieces.map(p => [p.id, { ...p.position }]));
    const boardClone = this.board.clone();
    try {
      const ok = piece.useAbility(boardClone, targets);
      if (!ok) return false; // ability wouldn't apply, so no loss from it
      const ourLeader = this.getLeader(piece.color);
      if (!ourLeader || typeof (ourLeader as Leader).checkVictoryCondition !== 'function') {
        return false;
      }
      const winner = (ourLeader as Leader).checkVictoryCondition(boardClone);
      // Move is legal when our leader is not captured/surrounded (no loss)
      return winner === null;
    } finally {
      for (const p of this.pieces) {
        const pos = savedPositions.get(p.id);
        if (pos) p.position = pos;
      }
    }
  }

  private executeAbility(targets: AxialCoord[]): boolean {
    const piece = this.uiState.selectedPiece;
    if (!piece || this.movedPieces.has(piece.id)) return false;
    if (!this.isLegalMove(piece, targets)) {
      return false; // refuse to execute: would capture/surround our own leader
    }
    this.board.turnMoves.push({ piece, source: 'ability', movedPieces: []})
    const ok = piece.useAbility(this.board, targets);
    if (ok) {
      this.movedPieces.add(piece.id);
      this.uiState.clear();
      this.recordTurnHistory()
      this.checkForForced()
      try {
        this.checkVictoryConditions();
      } catch (error) {
        console.error('Error checking victory conditions:', error);
      }
    } else {
      // Unsuccessful abilities won't show in turn move list.
      this.board.turnMoves.pop()
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

    const selectedPiece = this.uiState.selectedPiece
    const from = selectedPiece.position;
    this.board.turnMoves.push({ piece: selectedPiece, source: 'move', movedPieces: []})
    // If the piece is staying in place (e.g. Hermit/Cub), skip the board move
    if (from.q !== target.q || from.r !== target.r) {
      this.board.movePiece(from, target);
      selectedPiece.position = target;
    }
    this.movedPieces.add(selectedPiece.id);
    this.clearAbilityFlow();
    this.uiState.clear();
    this.recordTurnHistory();
    this.checkForForced();
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
    this.uiState.clear();
    this.board.turnMoves = [];
    this.turnHistory = [];

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

  loadFromNotation(notation: string, reset: boolean = false): void {

    if (reset) {
      this.turnHistory = []
    }
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

    this.recordTurnHistory()
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
    this.board.turnMoves = [];
    this.turnHistory = [];
    this.uiState.clear();
    this.gameOver = false;
    this.winner = null;

    // Clear and reinitialize pieces
    this.pieces.length = 0;
    
    if (notation) {
      this.loadFromNotation(notation, true);
    } else {
      this.initializePieces();
    }
  }

  getTurnHistory(): string {
    return this.turnHistory.toString()
  }

  getTurnMoves(): string {
    let fullMoveList =  ""
    this.board.turnMoves.forEach((move, index) => {
      fullMoveList += `${index + 1}) ${move.piece.getAcronym()} (${move.source}): ${move.movedPieces.map((movedPiece) => `${movedPiece.piece.getAcronym()} to ${CoordinateMapper.toAlphanumeric(movedPiece.target)}`).join(', ')}\n`
    })
    return fullMoveList
  }
  
  recordTurnHistory(): void { 
    this.turnHistory.push(this.generateNotation())
  }

  undoLastAction(): void {
    if (this.turnHistory.length <= 1 || this.board.turnMoves.length <= 0) return;
    const returnState = this.turnHistory[this.turnHistory.length - 2];
    const lastActingPiece = this.board.turnMoves.pop()?.piece
    if (lastActingPiece) {
      this.movedPieces.delete(lastActingPiece.id)
    }
    // For some reason pop() wasn't working here.
    this.turnHistory = this.turnHistory.slice(0, this.turnHistory.length - 2)
    this.loadFromNotation(returnState)
  }


  // Hermit / Cub and Nemesis carve-out. Checck last move to see if H/C or leader moved, then select the correct piece and put the game in "forced" mode.
  checkForForced() {
    const lastMove = this.board.turnMoves[this.board.turnMoves.length - 1]
    const leaderMoved = lastMove.movedPieces.some((movedPiece) => movedPiece.piece.getAcronym() === 'L')
    const cubMoved = lastMove.piece.getAcronym() === 'C'
    const hermitMoved = lastMove.piece.getAcronym() === 'H'
    if (!leaderMoved && !cubMoved && !hermitMoved) {
      return;
    }

    if ((this.hermitCubHistory.hermit && cubMoved) || (this.hermitCubHistory.cub && hermitMoved)) {
      return;
    }
    
    this.uiState.setActionMode('forced')
    let targetPiece: Piece | undefined = undefined
    if (leaderMoved) {
      targetPiece = this.board.getEnemyPieces(this.currentTurn).find((piece) => piece.getAcronym() === 'N')
    } else if (hermitMoved) {
      this.hermitCubHistory.hermit = true
      targetPiece = this.board.getPiecesByColor(this.currentTurn).find((piece) => piece.getAcronym() === 'C')
    } else if (cubMoved) {
      this.hermitCubHistory.cub = true
      targetPiece = this.board.getPiecesByColor(this.currentTurn).find((piece) => piece.getAcronym() === 'H')
    }

    if (!targetPiece) {
      console.error('No target piece found after forced move.')
      this.uiState.setActionMode('move')
      return
    }
    this.uiState.setSelectedPiece(targetPiece)
  }
}
