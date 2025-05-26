
import React from 'react';
import { SquareState, Position } from '../types';
import PieceDisplay from './PieceDisplay';

interface SquareProps {
  squareState: SquareState;
  position: Position;
  isDark: boolean;
  isSelected: boolean;
  isPossibleMove: boolean; // This refers to a possible "to" square
  onClick: (pos: Position) => void;
  interactionDisabled?: boolean;
}

const Square: React.FC<SquareProps> = ({ squareState, position, isDark, isSelected, isPossibleMove, onClick, interactionDisabled }) => {
  const bgColor = isDark ? 'bg-stone-700' : 'bg-stone-300';
  let ringColor = '';
  
  if (isSelected) {
    ringColor = 'ring-4 ring-blue-500 ring-inset';
  } else if (isPossibleMove) {
    // For possible move targets, use a green ring.
    // If it's an empty square that's a possible move, it's a destination.
    // If it's an opponent's piece that's part of a jump path (highlighted by some game logic),
    // this simple flag might not be enough, but for now, it's for empty destinations.
    ringColor = 'ring-4 ring-green-500 ring-inset opacity-70';
  }
  
  const cursorStyle = interactionDisabled ? 'cursor-not-allowed' : 'cursor-pointer';

  return (
    <div
      className={`w-full h-full flex items-center justify-center ${cursorStyle} ${bgColor} ${ringColor} transition-all duration-150`}
      onClick={() => !interactionDisabled && onClick(position)}
      style={{ aspectRatio: '1 / 1' }}
      aria-label={`Square ${position.row}-${position.col} ${squareState ? `contains ${squareState.player} ${squareState.type}` : 'empty'}`}
      role="button"
      tabIndex={interactionDisabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!interactionDisabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick(position);
        }
      }}
    >
      <div className="w-4/5 h-4/5">
        {squareState && <PieceDisplay piece={squareState} />}
      </div>
    </div>
  );
};

export default Square;
