import type { Game } from '../engine/Game.js';
import type { BoardRenderer } from './BoardRenderer.js';

type ActionMode = 'move' | 'ability';

const DRAG_THRESHOLD_PX = 5;

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private game: Game;
  private renderer: BoardRenderer;
  private onStateChange: () => void;
  private actionMode: ActionMode = 'move';
  private isDragging = false;
  private pendingDrag: { startX: number; startY: number } | null = null;

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
    this.actionMode = mode;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
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

    if (this.actionMode !== 'move') {
      return;
    }

    const { x, y } = this.getCanvasCoords(event);
    const coord = this.renderer.pixelToAxialCoord(x, y);
    if (!coord || !this.game.board.isValidCell(coord)) {
      return;
    }

    // Click-to-move: we already have a piece selected and this cell is a valid move target
    const uiState = this.game.getUIState();
    if (uiState.selectedPiece) {
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

    // Start selection and maybe drag: select piece and record mousedown for threshold
    const selected = this.game.selectPiece(coord);
    if (selected) {
      this.pendingDrag = { startX: x, startY: y };
      this.onStateChange();
      event.preventDefault();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(event);

    // Not yet dragging: check if we've moved past threshold
    if (this.pendingDrag) {
      const dx = x - this.pendingDrag.startX;
      const dy = y - this.pendingDrag.startY;
      if (dx * dx + dy * dy <= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        return;
      }
      const piece = this.game.getUIState().selectedPiece;
      if (!piece) {
        this.pendingDrag = null;
        return;
      }
      this.isDragging = true;
      this.pendingDrag = null;
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
    }

    this.pendingDrag = null;
  }

  private handleMouseLeave(): void {
    if (this.isDragging || this.pendingDrag) {
      this.isDragging = false;
      this.pendingDrag = null;
      this.game.clearDrag();
      this.onStateChange();
    }
  }

  private handleCanvasClick(event: MouseEvent): void {
    if (this.game.gameOver || this.actionMode !== 'ability') {
      return;
    }

    const { x, y } = this.getCanvasCoords(event);
    const coord = this.renderer.pixelToAxialCoord(x, y);
    if (!coord || !this.game.board.isValidCell(coord)) {
      return;
    }

    const selectedPiece = this.game.getSelectedPiece();

    if (selectedPiece) {
      const abilityUsed = this.game.useAbility(coord);
      if (abilityUsed) {
        this.onStateChange();
      } else {
        const selected = this.game.selectPiece(coord);
        if (selected) {
          this.onStateChange();
        }
      }
    } else {
      const selected = this.game.selectPiece(coord);
      if (selected) {
        this.onStateChange();
      }
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
