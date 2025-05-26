
export enum Player {
  RED = 'RED',
  BLACK = 'BLACK',
}

export enum PieceType {
  MAN = 'MAN',
  KING = 'KING',
}

export interface Piece {
  player: Player;
  type: PieceType;
}

export type SquareState = Piece | null;

export type BoardState = SquareState[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  jumped: Position | null; // Position of the piece that was jumped
}
    