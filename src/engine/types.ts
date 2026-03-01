export type AxialCoord = {
  q: number;
  r: number;
};

export enum PlayerColor {
  White = 'white',
  Black = 'black'
}

export type CellState = {
  occupied: boolean;
  pieceId: string | null;
};
