
import React, { useState, useEffect, useCallback } from 'react';
import { BoardState, Move, Player, Position, Piece } from './types'; // Added Piece
import Board from './components/Board';
import GameInfo from './components/GameInfo';
import {
  initializeBoard,
  calculateAllMovesForPlayer,
  calculateMovesForSpecificPiece,
  performMove,
  kingPieceIfNeeded,
  checkWinCondition,
  getOpponent,
} from './utils/gameLogic';

const AI_PLAYER = Player.BLACK;
const AI_MOVE_DELAY = 750; // ms for AI "thinking" and move animation

interface CapturedPiecesDict {
  [Player.RED]: Piece[];
  [Player.BLACK]: Piece[];
}

const App: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.RED);
  const [selectedPiecePos, setSelectedPiecePos] = useState<Position | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
  const [mustJump, setMustJump] = useState<boolean>(false);
  const [pieceForcedToContinueJump, setPieceForcedToContinueJump] = useState<Position | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [scores, setScores] = useState<{ [Player.RED]: number; [Player.BLACK]: number }>({
    [Player.RED]: 0,
    [Player.BLACK]: 0,
  });
  const [capturedPiecesByPlayer, setCapturedPiecesByPlayer] = useState<CapturedPiecesDict>({
    [Player.RED]: [],
    [Player.BLACK]: [],
  });
  const [isAiThinking, setIsAiThinking] = useState(false);

  const resetGame = useCallback(() => {
    const initialBoard = initializeBoard();
    setBoard(initialBoard);
    const startingPlayer = Player.RED; // Human always starts
    setCurrentPlayer(startingPlayer);
    setSelectedPiecePos(null);
    setPieceForcedToContinueJump(null);
    setWinner(null);
    setScores({ [Player.RED]: 0, [Player.BLACK]: 0 });
    setCapturedPiecesByPlayer({ [Player.RED]: [], [Player.BLACK]: [] });
    setIsAiThinking(false);
    
    const { allMoves: initialMoves, mustJump: initialMustJump } = calculateAllMovesForPlayer(initialBoard, startingPlayer);
    setPossibleMoves(initialMoves);
    setMustJump(initialMustJump);
  }, []);

  useEffect(() => {
    resetGame();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const switchPlayerAndPrepareNextTurn = useCallback((currentBoard: BoardState) => {
    const nextPlayer = getOpponent(currentPlayer);
    setCurrentPlayer(nextPlayer);
    setSelectedPiecePos(null);
    setPieceForcedToContinueJump(null); // Reset for the new player

    const { allMoves: nextPlayerMoves, mustJump: nextPlayerMustJump } = calculateAllMovesForPlayer(currentBoard, nextPlayer);
    setPossibleMoves(nextPlayerMoves); // These are for the *new* current player
    setMustJump(nextPlayerMustJump);

    const gameWinner = checkWinCondition(currentBoard, nextPlayer, nextPlayerMoves);
    if (gameWinner) {
      setWinner(gameWinner);
      setIsAiThinking(false); // Ensure AI stops if game ends
    }
  }, [currentPlayer]);


  const executeAiMove = useCallback(async (boardStateForAiTurn: BoardState, aiPlayer: Player, forcedPieceForAi: Position | null) => {
    setIsAiThinking(true);
    
    await new Promise(resolve => setTimeout(resolve, forcedPieceForAi ? AI_MOVE_DELAY / 2 : AI_MOVE_DELAY));

    let currentBoardForThisAiAction = boardStateForAiTurn.map(row => [...row]);
    let availableMovesForAi: Move[];

    if (forcedPieceForAi) {
        availableMovesForAi = calculateMovesForSpecificPiece(currentBoardForThisAiAction, forcedPieceForAi, true);
        setSelectedPiecePos(forcedPieceForAi); 
        setPossibleMoves(availableMovesForAi); 
        setMustJump(true); 
    } else {
        const { allMoves, mustJump: currentTurnMustJump } = calculateAllMovesForPlayer(currentBoardForThisAiAction, aiPlayer);
        availableMovesForAi = allMoves;
        setMustJump(currentTurnMustJump); 
        setSelectedPiecePos(null); 
        setPossibleMoves(availableMovesForAi); 
    }

    if (availableMovesForAi.length === 0) {
        switchPlayerAndPrepareNextTurn(currentBoardForThisAiAction);
        setIsAiThinking(false);
        return;
    }

    const chosenMove = availableMovesForAi[Math.floor(Math.random() * availableMovesForAi.length)];

    if (!forcedPieceForAi) {
        setSelectedPiecePos(chosenMove.from);
        const movesForChosenPiece = calculateMovesForSpecificPiece(currentBoardForThisAiAction, chosenMove.from, mustJump);
        setPossibleMoves(movesForChosenPiece.filter(m => m.to.row === chosenMove.to.row && m.to.col === chosenMove.to.col));
        await new Promise(resolve => setTimeout(resolve, AI_MOVE_DELAY / 2));
    }

    const { newBoard: boardAfterAiMove, capturedPiece } = performMove(currentBoardForThisAiAction, chosenMove);
    if (capturedPiece) {
        setScores(prevScores => ({
            ...prevScores,
            [aiPlayer]: prevScores[aiPlayer] + 1
        }));
        setCapturedPiecesByPlayer(prevCaptured => ({
            ...prevCaptured,
            [aiPlayer]: [...prevCaptured[aiPlayer], capturedPiece]
        }));
    }

    let boardAfterAiKinging = kingPieceIfNeeded(boardAfterAiMove, chosenMove.to);
    setBoard(boardAfterAiKinging); 

    if (chosenMove.jumped) {
        const furtherJumpsForAi = calculateMovesForSpecificPiece(boardAfterAiKinging, chosenMove.to, true);
        if (furtherJumpsForAi.length > 0) {
            setPieceForcedToContinueJump(chosenMove.to); 
            executeAiMove(boardAfterAiKinging, aiPlayer, chosenMove.to); 
            return; 
        }
    }

    setPieceForcedToContinueJump(null); 
    switchPlayerAndPrepareNextTurn(boardAfterAiKinging);
    setIsAiThinking(false);

}, [switchPlayerAndPrepareNextTurn, scores, capturedPiecesByPlayer, mustJump]); // Added scores, capturedPiecesByPlayer, mustJump to deps


useEffect(() => {
    if (currentPlayer === AI_PLAYER && !winner && !isAiThinking) {
        const boardSnapshot = board.map(r => [...r]);
        executeAiMove(boardSnapshot, AI_PLAYER, null); 
    }
}, [currentPlayer, winner, isAiThinking, board, executeAiMove]);


  const handleSquareClick = useCallback((clickedPos: Position) => {
    if (winner || currentPlayer === AI_PLAYER || isAiThinking) { 
        return;
    }

    const pieceAtClickedPos = board[clickedPos.row][clickedPos.col];

    if (selectedPiecePos) {
      const move = possibleMoves.find(
        (m) => m.to.row === clickedPos.row && m.to.col === clickedPos.col && m.from.row === selectedPiecePos.row && m.from.col === selectedPiecePos.col
      );

      if (move) {
        const { newBoard: boardAfterMove, capturedPiece } = performMove(board, move);
        if (capturedPiece) {
          setScores(prevScores => ({
            ...prevScores,
            [currentPlayer]: prevScores[currentPlayer] + 1
          }));
          setCapturedPiecesByPlayer(prevCaptured => ({
            ...prevCaptured,
            [currentPlayer]: [...prevCaptured[currentPlayer], capturedPiece]
          }));
        }
        
        let boardAfterKinging = kingPieceIfNeeded(boardAfterMove, move.to);
        setBoard(boardAfterKinging); 

        if (move.jumped) {
          const furtherJumps = calculateMovesForSpecificPiece(boardAfterKinging, move.to, true);
          if (furtherJumps.length > 0) {
            setSelectedPiecePos(move.to);
            setPossibleMoves(furtherJumps);
            setMustJump(true); 
            setPieceForcedToContinueJump(move.to);
            return; 
          }
        }
        setPieceForcedToContinueJump(null); 
        switchPlayerAndPrepareNextTurn(boardAfterKinging);
        return;
      }
    }

    if (pieceAtClickedPos && pieceAtClickedPos.player === currentPlayer) { 
      if (pieceForcedToContinueJump && (pieceForcedToContinueJump.row !== clickedPos.row || pieceForcedToContinueJump.col !== clickedPos.col)) {
        return; 
      }
      
      setSelectedPiecePos(clickedPos);
      const isContinuingSpecificJump = pieceForcedToContinueJump !== null && pieceForcedToContinueJump.row === clickedPos.row && pieceForcedToContinueJump.col === clickedPos.col;
      const movesForSelected = calculateMovesForSpecificPiece(board, clickedPos, mustJump || isContinuingSpecificJump);
      setPossibleMoves(movesForSelected);

    } else if (!pieceForcedToContinueJump) { 
      setSelectedPiecePos(null);
      if (mustJump) {
        const { allMoves: allPlayerJumpsForHuman } = calculateAllMovesForPlayer(board, currentPlayer);
        setPossibleMoves(allPlayerJumpsForHuman.filter(m => m.jumped !== null)); 
      } else {
        setPossibleMoves([]);
      }
    }
  }, [
    board, currentPlayer, selectedPiecePos, possibleMoves, winner, mustJump, 
    pieceForcedToContinueJump, switchPlayerAndPrepareNextTurn, isAiThinking, 
    scores, capturedPiecesByPlayer // Added scores, capturedPiecesByPlayer to deps
]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-stone-200 to-stone-400">
      <GameInfo
        currentPlayer={currentPlayer}
        scores={scores}
        winner={winner}
        mustJump={mustJump && !pieceForcedToContinueJump}
        isContinuingJump={pieceForcedToContinueJump !== null}
        onReset={resetGame}
        isAiTurn={currentPlayer === AI_PLAYER}
        isAiThinking={isAiThinking}
        aiPlayer={AI_PLAYER}
        capturedPiecesByPlayer={capturedPiecesByPlayer}
      />
      <Board
        boardState={board}
        selectedPiecePos={selectedPiecePos}
        possibleMoves={possibleMoves}
        onSquareClick={handleSquareClick}
        interactionDisabled={currentPlayer === AI_PLAYER || isAiThinking || !!winner}
      />
      <footer className="mt-8 text-center text-sm text-stone-600">
        <p>Checkers Game by AI</p>
        <p>React, TypeScript, Tailwind CSS</p>
      </footer>
    </div>
  );
};

export default App;
