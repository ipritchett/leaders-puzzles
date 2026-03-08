import type { Game } from '../engine/Game.js';
import type { BoardRenderer } from './BoardRenderer.js';

import type { ActionMode } from '../engine/Game.js';
import type { AxialCoord } from '../engine/types.js';

const DRAG_THRESHOLD_PX = 5;

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private game: Game;
  private renderer: BoardRenderer;
  private onStateChange: () => void;
  private isDragging = false;
  private pendingClick: { startX: number; startY: number; coord: AxialCoord } | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    game: Game,
    renderer: BoardRenderer,
    onStateChange: () => void
  ) {
    this.canvas = canvas;
    this.game = game;
    this.renderer = renderer;
    this.onStateChange = onStateChange;

    this.setupEventListeners();
  }

  setActionMode(mode: ActionMode): void {
    this.game.setActionMode(mode);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
  }

  private getCanvasCoords(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private handleMouseDown(event: MouseEvent): void {
    if (this.game.gameOver) {
      return;
    }

    const { x, y } = this.getCanvasCoords(event);
    const coord = this.renderer.pixelToAxialCoord(x, y);
    if (!coord || !this.game.board.isValidCell(coord)) {
      return;
    }

    if (this.game.getActionMode() === 'ability') {
      // Defer ability-mode click to mouseup (so we don't double-handle with a hypothetical click event)
      this.pendingClick = { startX: x, startY: y, coord };
      return;
    }

    // Move mode
    const uiState = this.game.getUIState();
    if (uiState.selectedPiece) {
      // Click on the already-selected piece: switch to ability mode if it has an ability
      const isClickOnSelectedPiece =
        coord.q === uiState.selectedPiece.position.q &&
        coord.r === uiState.selectedPiece.position.r;
      if (isClickOnSelectedPiece && uiState.selectedPiece.hasActiveAbility() && uiState.selectedPiece.canUseAbility(this.game.board)) {
        this.game.setActionMode('ability');
        this.onStateChange();
        return;
      }

      // Click-to-move: this cell is a valid move target
      const validMoves = this.game.getValidMovesForSelected();
      const isValidTarget = validMoves.some(
        (m) => m.q === coord.q && m.r === coord.r
      );
      if (isValidTarget) {
        const moved = this.game.movePiece(coord);
        if (moved) {
          this.onStateChange();
        }
        return;
      }
    }

    // Do not allow alternate piece selection if in forced mode
    if (this.game.getActionMode() === 'forced') {
      return
    }

    // Start selection, or clear selection if clicking empty / wrong piece
    const selected = this.game.selectPiece(coord);
    if (selected) {
      this.pendingClick = { startX: x, startY: y, coord };
      this.onStateChange();
      event.preventDefault();
    } else {
      // Clicked empty cell (or enemy / already-moved): selection was cleared
      this.onStateChange();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(event);

    // Not yet dragging: check if we've moved past threshold
    if (this.pendingClick) {
      const dx = x - this.pendingClick.startX;
      const dy = y - this.pendingClick.startY;
      if (dx * dx + dy * dy <= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        return;
      }
      const piece = this.game.getUIState().selectedPiece;
      if (!piece) {
        this.pendingClick = null;
        return;
      }
      this.isDragging = true;
      this.pendingClick = null;
      this.game.startDrag(piece, x, y);
      this.onStateChange();
      return;
    }

    if (!this.isDragging) {
      return;
    }

    const piece = this.game.getSelectedPiece();
    if (!piece) {
      return;
    }

    this.game.updateDragPosition(x, y);
    this.onStateChange();
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      const { x, y } = this.getCanvasCoords(event);
      const coord = this.renderer.pixelToAxialCoord(x, y);

      if (coord && this.game.board.isValidCell(coord)) {
        this.game.movePiece(coord);
      }

      this.isDragging = false;
      this.game.clearDrag();
      this.onStateChange();
      event.preventDefault();
    } else if (
      this.pendingClick &&
      this.game.getActionMode() === 'ability'
    ) {
      // Click completed in ability mode (no drag): use ability or select piece
      this.handleAbilityModeClick(this.pendingClick.coord);
      this.onStateChange();
    }

    this.pendingClick = null;
  }

  private handleMouseLeave(): void {
    if (this.isDragging || this.pendingClick) {
      this.isDragging = false;
      this.pendingClick = null;
      this.game.clearDrag();
      this.onStateChange();
    }
  }

  private handleAbilityModeClick(coord: AxialCoord): void {
    const selectedPiece = this.game.getSelectedPiece();

    if (selectedPiece) {
      const isClickOnSelectedPiece =
        coord.q === selectedPiece.position.q && coord.r === selectedPiece.position.r;
      if (isClickOnSelectedPiece) {
        this.game.setActionMode('move');
        return;
      }

      const consumed = this.game.submitAbilityTarget(coord);
      if (!consumed) {
        this.game.selectPiece(coord);
      }
    } else {
      this.game.selectPiece(coord);
    }
  }

  setupEndTurnButton(button: HTMLButtonElement): void {
    button.addEventListener('click', () => {
      if (!this.game.gameOver) {
        this.game.endTurn();
        this.onStateChange();
      }
    });
  }
}
