
import { BOARD_SIZE, INITIAL_PIECE_ROWS } from '../constants';
import { BoardState, Move, Piece, PieceType, Player, Position, SquareState } from '../types';

export const initializeBoard = (): BoardState => {
  const board: BoardState = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  for (let row = 0; row < INITIAL_PIECE_ROWS; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 !== 0) { // Pieces on dark squares
        board[row][col] = { player: Player.BLACK, type: PieceType.MAN };
      }
    }
  }

  for (let row = BOARD_SIZE - INITIAL_PIECE_ROWS; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 !== 0) {
        board[row][col] = { player: Player.RED, type: PieceType.MAN };
      }
    }
  }
  return board;
};

export const getOpponent = (player: Player): Player => {
  return player === Player.RED ? Player.BLACK : Player.RED;
};

export const isWithinBoard = (row: number, col: number): boolean => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

const getMovesForMan = (board: BoardState, pos: Position, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const player = piece.player;
  const opponent = getOpponent(player);
  const forwardDir = player === Player.RED ? -1 : 1;

  // Simple moves
  for (const dCol of [-1, 1]) {
    const nextRow = pos.row + forwardDir;
    const nextCol = pos.col + dCol;
    if (isWithinBoard(nextRow, nextCol) && board[nextRow][nextCol] === null) {
      moves.push({ from: pos, to: { row: nextRow, col: nextCol }, jumped: null });
    }
  }

  // Jump moves
  for (const dCol of [-1, 1]) {
    const jumpOverRow = pos.row + forwardDir;
    const jumpOverCol = pos.col + dCol;
    const landRow = pos.row + forwardDir * 2;
    const landCol = pos.col + dCol * 2;

    if (
      isWithinBoard(landRow, landCol) &&
      board[landRow][landCol] === null &&
      isWithinBoard(jumpOverRow, jumpOverCol) &&
      board[jumpOverRow][jumpOverCol] !== null &&
      board[jumpOverRow][jumpOverCol]?.player === opponent
    ) {
      moves.push({ from: pos, to: { row: landRow, col: landCol }, jumped: { row: jumpOverRow, col: jumpOverCol } });
    }
  }
  return moves;
};

const getMovesForKing = (board: BoardState, pos: Position, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const player = piece.player;
  const opponent = getOpponent(player);

  // Simple and Jump moves for all 4 diagonal directions
  for (const dRow of [-1, 1]) {
    for (const dCol of [-1, 1]) {
      // Simple moves
      let nextRow = pos.row + dRow;
      let nextCol = pos.col + dCol;
      if (isWithinBoard(nextRow, nextCol) && board[nextRow][nextCol] === null) {
        moves.push({ from: pos, to: { row: nextRow, col: nextCol }, jumped: null });
      }

      // Jump moves
      const jumpOverRow = pos.row + dRow;
      const jumpOverCol = pos.col + dCol;
      const landRow = pos.row + dRow * 2;
      const landCol = pos.col + dCol * 2;

      if (
        isWithinBoard(landRow, landCol) &&
        board[landRow][landCol] === null &&
        isWithinBoard(jumpOverRow, jumpOverCol) &&
        board[jumpOverRow][jumpOverCol] !== null &&
        board[jumpOverRow][jumpOverCol]?.player === opponent
      ) {
        moves.push({ from: pos, to: { row: landRow, col: landCol }, jumped: { row: jumpOverRow, col: jumpOverCol } });
      }
    }
  }
  return moves;
};

// Calculates moves for a specific piece. If `isContinuingJump` is true, only returns jumps.
export const calculateMovesForSpecificPiece = (board: BoardState, pos: Position, isContinuingJump: boolean): Move[] => {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  let pieceMoves: Move[];
  if (piece.type === PieceType.KING) {
    pieceMoves = getMovesForKing(board, pos, piece);
  } else {
    pieceMoves = getMovesForMan(board, pos, piece);
  }

  const jumps = pieceMoves.filter(move => move.jumped !== null);
  if (jumps.length > 0) {
    return jumps; // If jumps are available for this piece, they are mandatory
  }
  
  if (isContinuingJump) return []; // If continuing jump and no jumps found, no moves

  return pieceMoves.filter(move => move.jumped === null); // Only simple moves if no jumps
};


// Calculates all possible moves for a player. Prioritizes jumps.
export const calculateAllMovesForPlayer = (board: BoardState, player: Player): { allMoves: Move[], mustJump: boolean } => {
  let allPlayerMoves: Move[] = [];
  let playerHasJumps = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.player === player) {
        const pos = { row: r, col: c };
        const pieceMoves = piece.type === PieceType.KING ? getMovesForKing(board, pos, piece) : getMovesForMan(board, pos, piece);
        
        const pieceJumps = pieceMoves.filter(m => m.jumped !== null);
        if (pieceJumps.length > 0) {
          playerHasJumps = true;
          allPlayerMoves.push(...pieceJumps);
        } else if (!playerHasJumps) { // Only add simple moves if no jumps found for ANY piece yet
          allPlayerMoves.push(...pieceMoves.filter(m => m.jumped === null));
        }
      }
    }
  }

  if (playerHasJumps) {
    // If there are jumps, only jumps are valid moves for the player
    return { allMoves: allPlayerMoves.filter(m => m.jumped !== null), mustJump: true };
  }
  
  // Fix: Changed undefined variable 'allMoves' to 'allPlayerMoves'
  return { allMoves: allPlayerMoves, mustJump: false };
};

export const performMove = (currentBoard: BoardState, move: Move): { newBoard: BoardState, capturedPiece: Piece | null } => {
  const newBoard = currentBoard.map(row => [...row]); // Deep copy
  const pieceToMove = newBoard[move.from.row][move.from.col];
  
  if (!pieceToMove) return { newBoard: currentBoard, capturedPiece: null }; // Should not happen

  newBoard[move.to.row][move.to.col] = pieceToMove;
  newBoard[move.from.row][move.from.col] = null;

  let capturedPiece: Piece | null = null;
  if (move.jumped) {
    capturedPiece = newBoard[move.jumped.row][move.jumped.col] as Piece; // We know it's a piece
    newBoard[move.jumped.row][move.jumped.col] = null;
  }
  return { newBoard, capturedPiece };
};

export const kingPieceIfNeeded = (currentBoard: BoardState, piecePos: Position): BoardState => {
  const piece = currentBoard[piecePos.row][piecePos.col];
  if (!piece || piece.type === PieceType.KING) return currentBoard;

  const newBoard = currentBoard.map(row => [...row]);

  if (piece.player === Player.RED && piecePos.row === 0) {
    newBoard[piecePos.row][piecePos.col] = { ...piece, type: PieceType.KING };
  } else if (piece.player === Player.BLACK && piecePos.row === BOARD_SIZE - 1) {
    newBoard[piecePos.row][piecePos.col] = { ...piece, type: PieceType.KING };
  }
  return newBoard;
};

export const checkWinCondition = (board: BoardState, currentPlayer: Player, currentPlayerMoves: Move[]): Player | null => {
  // Check if current player has any moves
  if (currentPlayerMoves.length === 0) {
    return getOpponent(currentPlayer); // Current player has no moves, opponent wins
  }

  // Check if opponent has any pieces left
  const opponent = getOpponent(currentPlayer);
  let opponentPiecesCount = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] && board[r][c]?.player === opponent) {
        opponentPiecesCount++;
      }
    }
  }
  if (opponentPiecesCount === 0) {
    return currentPlayer; // Opponent has no pieces, current player wins
  }

  return null; // No winner yet
};