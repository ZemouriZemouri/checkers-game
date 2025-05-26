
import React from 'react';
import { BoardState, Move, Position } from '../types';
import Square from './Square';
import { BOARD_SIZE } from '../constants';

interface BoardProps {
  boardState: BoardState;
  selectedPiecePos: Position | null;
  possibleMoves: Move[];
  onSquareClick: (pos: Position) => void;
  interactionDisabled?: boolean;
}

const Board: React.FC<BoardProps> = ({ boardState, selectedPiecePos, possibleMoves, onSquareClick, interactionDisabled }) => {
  return (
    <div className={`grid grid-cols-8 gap-0 shadow-2xl border-4 border-stone-800 rounded overflow-hidden aspect-square max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto w-full ${interactionDisabled ? 'opacity-75' : ''}`}>
      {boardState.map((row, rowIndex) =>
        row.map((squareState, colIndex) => {
          const position = { row: rowIndex, col: colIndex };
          const isDark = (rowIndex + colIndex) % 2 !== 0;
          const isSelected = selectedPiecePos?.row === rowIndex && selectedPiecePos?.col === colIndex;
          
          // Highlight possible destination squares only.
          // If a piece is selected, possibleMoves are for that piece.
          // If no piece is selected but player must jump, possibleMoves are all jumps for the player.
          // We only want to highlight the 'to' squares.
          const isPossibleMoveTarget = possibleMoves.some(
            (move) => move.to.row === rowIndex && move.to.col === colIndex
          );

          return (
            <Square
              key={`${rowIndex}-${colIndex}`}
              squareState={squareState}
              position={position}
              isDark={isDark}
              isSelected={isSelected}
              isPossibleMove={isPossibleMoveTarget} // Pass this for visual cue
              onClick={onSquareClick}
              interactionDisabled={interactionDisabled}
            />
          );
        })
      )}
    </div>
  );
};

export default Board;
