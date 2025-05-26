
import React from 'react';
import { Player, Piece } from '../types'; // Added Piece
import PieceDisplay from './PieceDisplay'; // To display captured pieces

interface GameInfoProps {
  currentPlayer: Player;
  scores: { [Player.RED]: number; [Player.BLACK]: number };
  winner: Player | null;
  mustJump: boolean;
  isContinuingJump: boolean;
  onReset: () => void;
  isAiTurn: boolean;
  isAiThinking: boolean;
  aiPlayer: Player;
  capturedPiecesByPlayer: { [Player.RED]: Piece[]; [Player.BLACK]: Piece[] }; // New prop
}

const GameInfo: React.FC<GameInfoProps> = ({ 
    currentPlayer, 
    scores, 
    winner, 
    mustJump, 
    isContinuingJump, 
    onReset, 
    isAiTurn, 
    isAiThinking,
    aiPlayer,
    capturedPiecesByPlayer // Destructure new prop
}) => {
  let statusMessage = '';
  const aiPlayerName = aiPlayer === Player.RED ? 'Red' : 'White'; // Represents the AI's piece color name
  const currentPlayerDisplayName = currentPlayer === Player.RED ? 'Red (You)' : `${aiPlayerName} (Computer)`;

  if (winner) {
    const winnerDisplayName = winner === Player.RED ? 'Red' : aiPlayerName; // Simplified winner name
    statusMessage = `${winnerDisplayName} Wins!`;
  } else if (isAiThinking && isAiTurn) {
    statusMessage = `Computer (${aiPlayerName}) is thinking...`;
  }
  else {
    statusMessage = `${currentPlayerDisplayName}'s Turn`;
    if (isContinuingJump) {
      statusMessage += ' - Must continue jump!';
    } else if (mustJump) {
      statusMessage += ' - Must jump!';
    }
  }

  return (
    <div className="p-4 bg-stone-800 text-white rounded-lg shadow-xl mb-6 text-center w-full max-w-lg sm:max-w-xl md:max-w-2xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 min-h-[2.5em] sm:min-h-[1.5em] flex items-center justify-center">{statusMessage}</h2>
      
      <div className="flex flex-col sm:flex-row justify-around items-center mb-2 text-base sm:text-lg">
        <p className="mb-2 sm:mb-0">
          <span className="text-red-400 font-semibold">Red (You) Score:</span> {scores[Player.RED]}
        </p>
        <p>
          <span className="text-neutral-300 font-semibold">{aiPlayerName} (Comp) Score:</span> {scores[Player.BLACK]}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-left px-2">
        <div>
          <h3 className="text-sm font-semibold text-red-400 mb-1">Red's Captured Pieces:</h3>
          <div className="flex flex-wrap gap-1 p-1 bg-stone-700 rounded min-h-[2.25rem] items-center">
            {capturedPiecesByPlayer[Player.RED].map((piece, index) => (
              <div key={`captured-red-${index}`} className="w-5 h-5 sm:w-6 sm:h-6" title={`${piece.player} ${piece.type}`}>
                <PieceDisplay piece={piece} />
              </div>
            ))}
            {capturedPiecesByPlayer[Player.RED].length === 0 && <span className="text-xs text-stone-400 italic pl-1">None</span>}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-1">{aiPlayerName}'s Captured Pieces:</h3>
          <div className="flex flex-wrap gap-1 p-1 bg-stone-700 rounded min-h-[2.25rem] items-center">
            {capturedPiecesByPlayer[Player.BLACK].map((piece, index) => (
              <div key={`captured-black-${index}`} className="w-5 h-5 sm:w-6 sm:h-6" title={`${piece.player} ${piece.type}`}>
                <PieceDisplay piece={piece} />
              </div>
            ))}
            {capturedPiecesByPlayer[Player.BLACK].length === 0 && <span className="text-xs text-stone-400 italic pl-1">None</span>}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={onReset}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-150 text-sm sm:text-base"
          aria-label="Reset the game to the starting state"
        >
          Reset Game
        </button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to restart the game? This will reset all progress.")) {
              onReset();
            }
          }}
          className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md shadow-md transition duration-150 text-sm sm:text-base"
          aria-label="Restart the game, resetting all progress"
        >
          Restart Game
        </button>
      </div>
    </div>
  );
};

export default GameInfo;
