import type { AxialCoord } from '../engine/types.js';
import { PlayerColor } from '../engine/types.js';
import type { Game } from '../engine/Game.js';
import type { Piece } from '../engine/Piece.js';

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexSize!: number;
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
      const cellRadius = this.hexSize * 0.42;
      const boardWidth = (maxX - minX) + cellRadius * 2;
      const boardHeight = (maxY - minY) + cellRadius * 2;
      
      // Add padding for border and extra space (more generous padding)
      const padding = Math.max(cellRadius * 1.5, this.hexSize * 2);
      
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

  private drawCell(coord: AxialCoord, isHighlighted: boolean): void {
    const { x, y } = this.axialToPixel(coord);
    const cellRadius = this.hexSize * 0.42;

    // Draw cell with gradient for depth
    const gradient = this.ctx.createRadialGradient(x, y - 3, 0, x, y, cellRadius);
    if (isHighlighted) {
      gradient.addColorStop(0, '#b8e5b8');
      gradient.addColorStop(1, '#90c890');
    } else {
      gradient.addColorStop(0, '#faf5e8');
      gradient.addColorStop(0.7, '#f5e6d3');
      gradient.addColorStop(1, '#e8d9c4');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, cellRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw subtle border
    this.ctx.strokeStyle = isHighlighted ? '#6ba86b' : '#d4af37';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Add subtle inner shadow for inset effect
    this.ctx.save();
    this.ctx.globalAlpha = 0.15;
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 2, cellRadius * 0.85, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawPiece(piece: Piece, isSelected: boolean, hasMoved: boolean, isCurrentPlayer: boolean): void {
    const { x, y } = this.axialToPixel(piece.position);
    const pieceRadius = this.hexSize * 0.32;

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

    // Add shadow below piece
    this.ctx.save();
    this.ctx.globalAlpha = 0.3 * opacity;
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 2, pieceRadius * 0.8, pieceRadius * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fill();
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

    // Draw crown for leader
    if (piece.isLeader) {
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = '#d4af37';
      this.ctx.strokeStyle = '#b8941f';
      this.ctx.lineWidth = 1.5;
      
      const crownY = y - pieceRadius * 0.6;
      const crownWidth = pieceRadius * 0.6;
      const crownHeight = pieceRadius * 0.4;
      
      // Draw simple crown shape (3 peaks)
      this.ctx.beginPath();
      this.ctx.moveTo(x - crownWidth / 2, crownY);
      this.ctx.lineTo(x - crownWidth / 3, crownY - crownHeight);
      this.ctx.lineTo(x, crownY - crownHeight * 0.7);
      this.ctx.lineTo(x + crownWidth / 3, crownY - crownHeight);
      this.ctx.lineTo(x + crownWidth / 2, crownY);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw acronym letter on piece
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    const acronym = piece.getAcronym();
    const fontSize = pieceRadius * 0.8;
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // White pieces get black text, black pieces get white text
    this.ctx.fillStyle = piece.color === PlayerColor.White ? '#000000' : '#ffffff';
    
    // Add subtle text shadow for readability
    this.ctx.shadowColor = piece.color === PlayerColor.White ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 2;
    
    this.ctx.fillText(acronym, x, y);
    this.ctx.restore();
  }

  pixelToAxialCoord(x: number, y: number): AxialCoord | null {
    return this.pixelToAxial(x, y);
  }

  render(game: Game): void {
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
    const boardBgSize = borderSize - this.hexSize * 0.2; // Slightly smaller than border

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
    this.drawBoardOutline(borderSize);

    // Get selected piece and valid moves
    const selectedPiece = game.getSelectedPiece();
    const validMoves = selectedPiece ? game.getValidMovesForSelected() : [];

    // Draw all cells
    const allCells = game.board.getAllValidCells();
    for (const cell of allCells) {
      const isHighlighted = validMoves.some(
        move => move.q === cell.q && move.r === cell.r
      );
      this.drawCell(cell, isHighlighted);
    }

    // Draw pieces
    for (const piece of game.pieces) {
      const isSelected = selectedPiece?.id === piece.id;
      const hasMoved = game.hasMovedThisTurn(piece.id);
      const isCurrentPlayer = piece.color === game.currentTurn;
      this.drawPiece(piece, isSelected, hasMoved, isCurrentPlayer);
    }
  }

  updateTurnIndicator(element: HTMLElement, currentTurn: PlayerColor): void {
    const turnText = currentTurn === PlayerColor.White ? 'White' : 'Black';
    element.textContent = `${turnText}'s Turn`;
  }
}
