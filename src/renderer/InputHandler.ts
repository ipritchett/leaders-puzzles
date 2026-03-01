import type { Game } from '../engine/Game.js';
import type { BoardRenderer } from './BoardRenderer.js';

type ActionMode = 'move' | 'ability';

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private game: Game;
  private renderer: BoardRenderer;
  private onStateChange: () => void;
  private actionMode: ActionMode = 'move';

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
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  private handleCanvasClick(event: MouseEvent): void {
    // Don't allow moves if game is over
    if (this.game.gameOver) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const coord = this.renderer.pixelToAxialCoord(x, y);
    if (!coord) {
      return;
    }

    // Check if clicking on a valid cell
    if (!this.game.board.isValidCell(coord)) {
      return;
    }

    const selectedPiece = this.game.getSelectedPiece();

    if (selectedPiece) {
      if (this.actionMode === 'move') {
        // Try to move the selected piece
        const moved = this.game.movePiece(coord);
        if (moved) {
          this.onStateChange();
        } else {
          // If move failed, try selecting a new piece
          const selected = this.game.selectPiece(coord);
          if (selected) {
            this.onStateChange();
          }
        }
      } else if (this.actionMode === 'ability') {
        // Try to use ability
        const abilityUsed = this.game.useAbility(coord);
        if (abilityUsed) {
          this.onStateChange();
        } else {
          // If ability failed, try selecting a new piece
          const selected = this.game.selectPiece(coord);
          if (selected) {
            this.onStateChange();
          }
        }
      }
    } else {
      // Try to select a piece
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
