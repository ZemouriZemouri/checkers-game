
import React from 'react';
import { Piece, PieceType, Player } from '../types';

interface PieceDisplayProps {
  piece: Piece;
}

const PieceDisplay: React.FC<PieceDisplayProps> = ({ piece }) => {
  const pieceColor = piece.player === Player.RED ? 'bg-red-600 border-red-800' : 'bg-white border-neutral-400';
  const kingMarkColor = piece.player === Player.RED ? 'text-yellow-400' : 'text-neutral-700'; // King mark color for white pieces

  const kingMark = piece.type === PieceType.KING ? (
    <span className={`absolute ${kingMarkColor} text-xs sm:text-sm font-bold select-none`}>K</span>
  ) : null;

  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center shadow-md border-2 ${pieceColor} transform transition-transform duration-150 ease-in-out relative`}
    >
      {kingMark}
    </div>
  );
};

export default PieceDisplay;
