import type { AxialCoord } from './types.js';

/**
 * Maps alphanumeric coordinates (D7, E6, etc.) to axial coordinates (q, r)
 * 
 * Coordinate system:
 * - Letters (A-G) represent columns (q-axis, horizontal, left to right)
 * - Numbers (1-7) represent rows (r-axis, vertical, BOTTOM to TOP - reversed)
 * 
 * Format: LETTERNUMBER (e.g., "D7" not "7D")
 * 
 * Column mapping (q-axis, left to right):
 * - q=-3: Column A (4 cells)
 * - q=-2: Column B (5 cells)
 * - q=-1: Column C (6 cells)
 * - q=0:  Column D (7 cells) - middle column
 * - q=1:  Column E (6 cells)
 * - q=2:  Column F (5 cells)
 * - q=3:  Column G (4 cells)
 * 
 * Row mapping (r-axis, REVERSED - bottom to top):
 * - r=3:  Row 1 (bottom)
 * - r=2:  Row 2
 * - r=1:  Row 3
 * - r=0:  Row 4 (middle)
 * - r=-1: Row 5
 * - r=-2: Row 6
 * - r=-3: Row 7 (top)
 */
export class CoordinateMapper {
  private static alphanumericToAxial: Map<string, AxialCoord> = new Map();
  private static axialToAlphanumeric: Map<string, string> = new Map();
  private static initialized: boolean = false;

  private static initialize(): void {
    if (CoordinateMapper.initialized) {
      return;
    }

    // Initialize mappings - Format: LETTERNUMBER (e.g., "D7" not "7D")
    
    // Column A (q=-3): 4 cells at rows 4, 5, 6, 7
    CoordinateMapper.alphanumericToAxial.set('A4', { q: -3, r: 0 });
    CoordinateMapper.alphanumericToAxial.set('A3', { q: -3, r: 1 });
    CoordinateMapper.alphanumericToAxial.set('A2', { q: -3, r: 2 });
    CoordinateMapper.alphanumericToAxial.set('A1', { q: -3, r: 3 });

    // Column B (q=-2): 5 cells at rows 1, 3, 4, 5, 6, 7
    CoordinateMapper.alphanumericToAxial.set('B1', { q: -2, r: 3 });
    CoordinateMapper.alphanumericToAxial.set('B2', { q: -2, r: 2 });
    CoordinateMapper.alphanumericToAxial.set('B3', { q: -2, r: 1 });
    CoordinateMapper.alphanumericToAxial.set('B4', { q: -2, r: 0 });
    CoordinateMapper.alphanumericToAxial.set('B5', { q: -2, r: -1 });

    // Column C (q=-1): 6 cells at rows 2, 3, 4, 5, 6, 7
    CoordinateMapper.alphanumericToAxial.set('C1', { q: -1, r: 3 });
    CoordinateMapper.alphanumericToAxial.set('C2', { q: -1, r: 2 });
    CoordinateMapper.alphanumericToAxial.set('C3', { q: -1, r: 1 });
    CoordinateMapper.alphanumericToAxial.set('C4', { q: -1, r: 0 });
    CoordinateMapper.alphanumericToAxial.set('C5', { q: -1, r: -1 });
    CoordinateMapper.alphanumericToAxial.set('C6', { q: -1, r: -2 });

    // Column D (q=0): 7 cells at rows 1, 2, 3, 4, 5, 6, 7
    CoordinateMapper.alphanumericToAxial.set('D1', { q: 0, r: 3 });
    CoordinateMapper.alphanumericToAxial.set('D2', { q: 0, r: 2 });
    CoordinateMapper.alphanumericToAxial.set('D3', { q: 0, r: 1 });
    CoordinateMapper.alphanumericToAxial.set('D4', { q: 0, r: 0 });
    CoordinateMapper.alphanumericToAxial.set('D5', { q: 0, r: -1 });
    CoordinateMapper.alphanumericToAxial.set('D6', { q: 0, r: -2 });
    CoordinateMapper.alphanumericToAxial.set('D7', { q: 0, r: -3 });

    // Column E (q=1): 6 cells at rows 1, 2, 3, 4, 5, 6
    CoordinateMapper.alphanumericToAxial.set('E1', { q: 1, r: 2 });
    CoordinateMapper.alphanumericToAxial.set('E2', { q: 1, r: 1 });
    CoordinateMapper.alphanumericToAxial.set('E3', { q: 1, r: 0 });
    CoordinateMapper.alphanumericToAxial.set('E4', { q: 1, r: -1 });
    CoordinateMapper.alphanumericToAxial.set('E5', { q: 1, r: -2 });
    CoordinateMapper.alphanumericToAxial.set('E6', { q: 1, r: -3 });

    // Column F (q=2): 5 cells at rows 1, 2, 3, 4, 5
    CoordinateMapper.alphanumericToAxial.set('F1', { q: 2, r: 1 });
    CoordinateMapper.alphanumericToAxial.set('F2', { q: 2, r: 0 });
    CoordinateMapper.alphanumericToAxial.set('F3', { q: 2, r: -1 });
    CoordinateMapper.alphanumericToAxial.set('F4', { q: 2, r: -2 });
    CoordinateMapper.alphanumericToAxial.set('F5', { q: 2, r: -3 });

    // Column G (q=3): 4 cells at rows 1, 2, 3, 4
    CoordinateMapper.alphanumericToAxial.set('G1', { q: 3, r: 0 });
    CoordinateMapper.alphanumericToAxial.set('G2', { q: 3, r: -1 });
    CoordinateMapper.alphanumericToAxial.set('G3', { q: 3, r: -2 });
    CoordinateMapper.alphanumericToAxial.set('G4', { q: 3, r: -3 });

    // Create reverse mapping
    for (const [alphanumeric, axial] of CoordinateMapper.alphanumericToAxial.entries()) {
      const key = `${axial.q},${axial.r}`;
      CoordinateMapper.axialToAlphanumeric.set(key, alphanumeric);
    }

    CoordinateMapper.initialized = true;
  }

  static toAxial(alphanumeric: string): AxialCoord | null {
    CoordinateMapper.initialize();
    const coord = CoordinateMapper.alphanumericToAxial.get(alphanumeric.toUpperCase());
    return coord || null;
  }

  static toAlphanumeric(axial: AxialCoord): string | null {
    CoordinateMapper.initialize();
    const key = `${axial.q},${axial.r}`;
    return CoordinateMapper.axialToAlphanumeric.get(key) || null;
  }

  static isValidAlphanumeric(alphanumeric: string): boolean {
    CoordinateMapper.initialize();
    return CoordinateMapper.alphanumericToAxial.has(alphanumeric.toUpperCase());
  }
}
