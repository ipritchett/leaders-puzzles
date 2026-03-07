import type { AxialCoord } from '../engine/types.js';
import { PlayerColor } from '../engine/types.js';
import type { Game } from '../engine/Game.js';
import type { Piece } from '../engine/Piece.js';
import { CoordinateMapper } from '../engine/CoordinateMapper.js';

const CELL_RADIUS_FACTOR = 0.42;
const PIECE_RADIUS_FACTOR = 0.85;
const HIGHLIGHT_RING_OUTER_FACTOR = 1.1;

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexSize!: number;
  private cellRadius!: number;
  private centerX!: number;
  private centerY!: number;
  private dimensionsInitialized: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
  }

  updateDimensions(game?: Game): void {
    // For flat-top hexagon, board is wider than tall
    // Calculate based on available window space
    const maxWidth = Math.min(window.innerWidth * 0.9, 1000);
    const maxHeight = Math.min(window.innerHeight * 0.85, 800);
    
    // If we have game data, calculate actual bounds for precise sizing
    if (game) {
      // First, calculate hex size based on available space
      // Board spans roughly 6-7 hexes vertically in flat-top orientation
      const hexSizeFromHeight = (maxHeight * 0.7) / 7;
      
      // Board spans roughly 7-8 hexes horizontally in flat-top orientation
      const hexSizeFromWidth = (maxWidth * 0.7) / 8;
      
      // Use the smaller to ensure everything fits
      this.hexSize = Math.min(hexSizeFromHeight, hexSizeFromWidth);
      this.cellRadius = this.hexSize * CELL_RADIUS_FACTOR;
      
      // Calculate actual bounds of all cells using temporary center
      // We'll calculate relative to (0,0) first, then adjust
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      const allCells = game.board.getAllValidCells();
      for (const cell of allCells) {
        // Calculate position using flat-top hex conversion
        const x = this.hexSize * (3 / 2) * cell.q;
        const y = this.hexSize * Math.sqrt(3) * (cell.r + cell.q / 2);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      
      // Calculate board dimensions (including cell radius for accurate bounds)
      const boardWidth = (maxX - minX) + this.cellRadius * 2;
      const boardHeight = (maxY - minY) + this.cellRadius * 2;
      
      // Add padding for border and extra space (more generous padding)
      const padding = Math.max(this.cellRadius * 1.5, this.hexSize * 2);
      
      // Calculate required canvas size
      const requiredWidth = boardWidth + padding * 2;
      const requiredHeight = boardHeight + padding * 2;
      
      // Set canvas size (use required size or max, whichever is smaller)
      this.canvas.width = Math.min(requiredWidth, maxWidth);
      this.canvas.height = Math.min(requiredHeight, maxHeight);
      
      // Calculate center offset to center the board
      // The board's center should be at (centerX, centerY)
      // We need to offset by the board's actual center relative to (0,0)
      const boardCenterX = (minX + maxX) / 2;
      const boardCenterY = (minY + maxY) / 2;
      
      // Set canvas centers to center the board
      this.centerX = this.canvas.width / 2 - boardCenterX;
      this.centerY = this.canvas.height / 2 - boardCenterY;
      
      // If the calculated size is too large, scale down hex size and recalculate
      if (this.canvas.width >= maxWidth * 0.95 || this.canvas.height >= maxHeight * 0.95) {
        // Scale down hex size proportionally
        const scaleX = (maxWidth * 0.9) / requiredWidth;
        const scaleY = (maxHeight * 0.9) / requiredHeight;
        const scale = Math.min(scaleX, scaleY);
        this.hexSize *= scale;
        
        // Recalculate with new hex size
        minX = Infinity; maxX = -Infinity;
        minY = Infinity; maxY = -Infinity;
        
        for (const cell of allCells) {
          const x = this.hexSize * (3 / 2) * cell.q;
          const y = this.hexSize * Math.sqrt(3) * (cell.r + cell.q / 2);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        
        const newCellRadius = this.hexSize * 0.42;
        const newBoardWidth = (maxX - minX) + newCellRadius * 2;
        const newBoardHeight = (maxY - minY) + newCellRadius * 2;
        const newPadding = Math.max(newCellRadius * 1.5, this.hexSize * 2);
        
        this.canvas.width = Math.min(newBoardWidth + newPadding * 2, maxWidth);
        this.canvas.height = Math.min(newBoardHeight + newPadding * 2, maxHeight);
        
        const newBoardCenterX = (minX + maxX) / 2;
        const newBoardCenterY = (minY + maxY) / 2;
        
        this.centerX = this.canvas.width / 2 - newBoardCenterX;
        this.centerY = this.canvas.height / 2 - newBoardCenterY;
      }
    } else {
      // Fallback: use square canvas with calculated hex size
      const size = Math.min(maxWidth, maxHeight);
      this.canvas.width = size;
      this.canvas.height = size;
      this.hexSize = (size * 0.7) / 7;
      this.centerX = size / 2;
      this.centerY = size / 2;
    }
  }

  private axialToPixel(coord: AxialCoord): { x: number; y: number } {
    // Flat-top hexagon layout (rotated 90 degrees from pointy-top)
    const x = this.centerX + this.hexSize * (3 / 2) * coord.q;
    const y = this.centerY + this.hexSize * Math.sqrt(3) * (coord.r + coord.q / 2);
    return { x, y };
  }

  private pixelToAxial(x: number, y: number): AxialCoord | null {
    // Convert pixel to approximate axial coordinates (flat-top hexagon)
    const q = ((2 / 3) * (x - this.centerX)) / this.hexSize;
    const r = ((-1 / 3) * (x - this.centerX) + (Math.sqrt(3) / 3) * (y - this.centerY)) / this.hexSize;

    // Round to nearest hex
    const roundedQ = Math.round(q);
    const roundedR = Math.round(r);
    const roundedS = Math.round(-q - r);

    // Check which hex is closest
    const qDiff = Math.abs(q - roundedQ);
    const rDiff = Math.abs(r - roundedR);
    const sDiff = Math.abs(-q - r - roundedS);

    let finalQ = roundedQ;
    let finalR = roundedR;

    if (qDiff > rDiff && qDiff > sDiff) {
      finalQ = -roundedR - roundedS;
    } else if (rDiff > sDiff) {
      finalR = -roundedQ - roundedS;
    }

    return { q: finalQ, r: finalR };
  }

  private drawHexagon(x: number, y: number, size: number, fillColor: string, strokeColor?: string, strokeWidth?: number): void {
    this.ctx.beginPath();
    // Rotate by 30 degrees (PI/6) to get flat-top hexagon instead of pointy-top
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();

    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }

    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth || 1;
      this.ctx.stroke();
    }
  }

  private calculateBoardBounds(game: Game): number {
    // Calculate the maximum distance from center to any cell
    // This ensures the border encompasses all valid cells
    let maxDistance = 0;
    const allCells = game.board.getAllValidCells();
    
    for (const cell of allCells) {
      const { x, y } = this.axialToPixel(cell);
      const dx = x - this.centerX;
      const dy = y - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      maxDistance = Math.max(maxDistance, distance);
    }
    
    // Add padding for the border and cell radius
    return maxDistance + this.hexSize * 0.6;
  }

  private drawBoardOutline(borderSize: number): void {
    // Draw golden hex border with gradient
    // Outer border (darker gold)
    this.drawHexagon(
      this.centerX,
      this.centerY,
      borderSize,
      'transparent',
      '#b8941f',
      4
    );
    
    // Inner border (lighter gold)
    this.drawHexagon(
      this.centerX,
      this.centerY,
      borderSize - 2,
      'transparent',
      '#d4af37',
      2
    );
  }

  private drawCell(coord: AxialCoord, highlight: 'move' | 'ability' | 'ability-chosen' | 'none'): void {
    const { x, y } = this.axialToPixel(coord);

    // Draw cell with gradient for depth
    const gradient = this.ctx.createRadialGradient(x, y - 3, 0, x, y, this.cellRadius);
    if (highlight === 'move') {
      gradient.addColorStop(0, '#b8e5b8');
      gradient.addColorStop(1, '#90c890');
    } else if (highlight === 'ability') {
      gradient.addColorStop(0, '#e8c8a8');
      gradient.addColorStop(1, '#d4a070');
    } else if (highlight === 'ability-chosen') {
      gradient.addColorStop(0, '#f0e8a0');
      gradient.addColorStop(1, '#e0d070');
    } else {
      gradient.addColorStop(0, '#faf5e8');
      gradient.addColorStop(0.7, '#f5e6d3');
      gradient.addColorStop(1, '#e8d9c4');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.cellRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw subtle border
    const strokeColor =
      highlight === 'move' ? '#6ba86b'
      : highlight === 'ability' ? '#c87840'
      : highlight === 'ability-chosen' ? '#c4a830'
      : '#d4af37';
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // For highlighted cells, draw an outer ring so the highlight stays visible when a piece occupies the cell
    if (highlight !== 'none') {
      const pieceRadius = this.cellRadius * PIECE_RADIUS_FACTOR;
      const ringInner = pieceRadius + 2;
      const ringOuter = this.cellRadius * HIGHLIGHT_RING_OUTER_FACTOR;
      const ringGradient = this.ctx.createRadialGradient(x, y - 3, ringInner, x, y, ringOuter);
      if (highlight === 'move') {
        ringGradient.addColorStop(0, '#90c890');
        ringGradient.addColorStop(1, '#6ba86b');
      } else if (highlight === 'ability') {
        ringGradient.addColorStop(0, '#d4a070');
        ringGradient.addColorStop(1, '#c87840');
      } else {
        ringGradient.addColorStop(0, '#e0d070');
        ringGradient.addColorStop(1, '#c4a830');
      }
      this.ctx.fillStyle = ringGradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, ringOuter, 0, Math.PI * 2);
      this.ctx.arc(x, y, ringInner, Math.PI * 2, 0);
      this.ctx.fill('evenodd');
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, ringOuter, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Add subtle inner shadow for inset effect
    this.ctx.save();
    this.ctx.globalAlpha = 0.15;
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 2, this.cellRadius * 0.85, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawDebugLabels(coords: AxialCoord[]): void {
    this.ctx.save();
    this.ctx.font = `bold 10px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const strokeWidth = 2.5;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeStyle = '#000';
    this.ctx.fillStyle = '#fff';
    for (const coord of coords) {
      const { x, y } = this.axialToPixel(coord);
      const notation = CoordinateMapper.toAlphanumeric(coord) ?? '—';
      const axialStr = `(${coord.q},${coord.r})`;
      for (const [text, py] of [[notation, y - 6], [axialStr, y + 6]] as const) {
        this.ctx.strokeText(text, x, py);
        this.ctx.fillText(text, x, py);
      }
    }
    this.ctx.restore();
  }

  private drawPiece(
    piece: Piece,
    isSelected: boolean,
    hasMoved: boolean,
    isCurrentPlayer: boolean,
    pixelOverride?: { x: number; y: number }
  ): void {
    const { x, y } = pixelOverride ?? this.axialToPixel(piece.position);
    const pieceRadius = this.cellRadius * PIECE_RADIUS_FACTOR;

    // Determine opacity and visual state based on move status
    let opacity = 1.0;
    let glowColor: string | null = null;
    
    if (isCurrentPlayer) {
      if (hasMoved) {
        // Moved pieces: dimmed with reduced opacity
        opacity = 0.5;
      } else {
        // Unmoved pieces: add subtle glow to indicate they can be moved
        glowColor = piece.color === PlayerColor.White ? '#90c8ff' : '#ffaa44';
      }
    }

    // Draw glow for unmoved pieces (current player only)
    if (glowColor && !isSelected) {
      this.ctx.save();
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = 'transparent';
      this.ctx.beginPath();
      this.ctx.arc(x, y, pieceRadius + 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    // Draw piece with gradient for 3D effect
    const gradient = this.ctx.createRadialGradient(x, y - 3, 0, x, y, pieceRadius);
    if (piece.color === PlayerColor.White) {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.7, '#f5f5f5');
      gradient.addColorStop(1, '#e0e0e0');
    } else {
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(0.7, '#2a2a2a');
      gradient.addColorStop(1, '#1a1a1a');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw piece border
    this.ctx.strokeStyle = piece.color === PlayerColor.White ? '#cccccc' : '#000000';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    this.ctx.restore();

    // Draw selection ring with glow effect
    if (isSelected) {
      this.ctx.save();
      // Outer glow
      this.ctx.shadowColor = '#d4af37';
      this.ctx.shadowBlur = 8;
      this.ctx.strokeStyle = '#d4af37';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, pieceRadius + 6, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw "moved" indicator (small checkmark or X) for moved pieces
    if (hasMoved && isCurrentPlayer) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.7;
      this.ctx.strokeStyle = '#666666';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      // Draw a small diagonal line to indicate "used"
      const indicatorSize = pieceRadius * 0.3;
      this.ctx.moveTo(x - indicatorSize, y - indicatorSize);
      this.ctx.lineTo(x + indicatorSize, y + indicatorSize);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw emoji on piece
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    const emoji = piece.getEmoji();
    const fontSize = pieceRadius;
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // White pieces get black text, black pieces get white text
    this.ctx.fillStyle = piece.color === PlayerColor.White ? '#000000' : '#ffffff';
    
    // Add subtle text shadow for readability
    this.ctx.shadowColor = piece.color === PlayerColor.White ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 2;
    
    this.ctx.fillText(emoji, x, y);
    this.ctx.restore();
  }

  pixelToAxialCoord(x: number, y: number): AxialCoord | null {
    return this.pixelToAxial(x, y);
  }

  render(game: Game, options?: { debug?: boolean }): void {
    const uiState = game.getUIState();
    const debug = options?.debug ?? false;

    // Update dimensions on first render or when window resizes
    // This ensures we have game data to calculate proper bounds
    if (!this.dimensionsInitialized) {
      this.updateDimensions(game);
      this.dimensionsInitialized = true;
    }

    // Clear canvas with dark background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate board bounds to ensure all cells are within the border
    const borderSize = this.calculateBoardBounds(game);
    const boardBgSize = borderSize + this.hexSize * 0.5; // Slightly smaller than border

    // Draw board background (cream/parchment area) with subtle gradient
    const bgGradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, boardBgSize
    );
    bgGradient.addColorStop(0, '#faf5e8');
    bgGradient.addColorStop(1, '#f5e6d3');
    
    // Draw hexagon path and fill with gradient (flat-top)
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6; // Rotate for flat-top
      const hx = this.centerX + boardBgSize * Math.cos(angle);
      const hy = this.centerY + boardBgSize * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = bgGradient;
    this.ctx.fill();

    // Draw board outline
    this.drawBoardOutline(boardBgSize+this.hexSize*0.2);

    // Get selected piece and valid targets based on action mode
    const actionMode = game.getActionMode();
    const selectedPiece = game.getSelectedPiece();
    const validMoveCoords = (actionMode === 'move' || actionMode === 'forced') && selectedPiece ? game.getValidMovesForSelected() : [];
    const validAbilityCoords = actionMode === 'ability' && selectedPiece ? game.getValidAbilityTargetsForSelected() : [];
    const abilityChosenSoFar = actionMode === 'ability' ? game.getAbilityTargetsChosenSoFar() : [];

    // Draw all cells
    const allCells = game.board.getAllValidCells();
    for (const cell of allCells) {
      const isMoveTarget = validMoveCoords.some(m => m.q === cell.q && m.r === cell.r);
      const isAbilityTarget = validAbilityCoords.some(m => m.q === cell.q && m.r === cell.r);
      const isAbilityChosen = abilityChosenSoFar.some(m => m.q === cell.q && m.r === cell.r);
      const highlight: 'move' | 'ability' | 'ability-chosen' | 'none' =
        isAbilityChosen ? 'ability-chosen' : isAbilityTarget ? 'ability' : isMoveTarget ? 'move' : 'none';
      this.drawCell(cell, highlight);
    }

    // Draw pieces (skip the piece being dragged at its cell; it's drawn at cursor below)
    const draggedPieceId = uiState.heldPiece?.id ?? null;
    for (const piece of game.pieces) {
      if (piece.id === draggedPieceId) {
        continue;
      }
      const isSelected = selectedPiece?.id === piece.id;
      const hasMoved = game.hasMovedThisTurn(piece.id);
      const isCurrentPlayer = piece.color === game.currentTurn;
      this.drawPiece(piece, isSelected, hasMoved, isCurrentPlayer);
    }

    // Draw dragged piece centered at cursor
    if (uiState.heldPiece) {
      const hasMoved = game.hasMovedThisTurn(uiState.heldPiece.id);
      const isCurrentPlayer = uiState.heldPiece.color === game.currentTurn;
      this.drawPiece(
        uiState.heldPiece,
        false,
        hasMoved,
        isCurrentPlayer,
        { x: uiState.cursorPixelX, y: uiState.cursorPixelY }
      );
    }

    // Debug labels on top so they're visible even when a piece occupies the space
    if (debug) {
      this.drawDebugLabels(allCells);
    }
  }

  updateTurnIndicator(element: HTMLElement, currentTurn: PlayerColor): void {
    const turnText = currentTurn === PlayerColor.White ? 'White' : 'Black';
    element.textContent = `${turnText}'s Turn`;
  }
}
