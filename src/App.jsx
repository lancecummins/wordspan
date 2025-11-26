import { useState, useEffect } from 'react'
import './App.css'
import { VALID_WORDS } from './wordlist'

const GRID_ROWS = 4;
const GRID_COLS = 5;
const BLANK_COUNT = 5;

// Generate a random letter weighted towards common letters
const generateLetter = () => {
  const letters = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ';
  return letters[Math.floor(Math.random() * letters.length)];
};

// Initialize a new grid
const createGrid = () => {
  return Array(GRID_ROWS).fill(null).map(() =>
    Array(GRID_COLS).fill(null).map(() => generateLetter())
  );
};

// Static helper to check if grid has words (used during initialization)
const checkGridHasWordsStatic = (gridToCheck) => {
  const letterCounts = {};
  for (let row of gridToCheck) {
    for (let letter of row) {
      if (letter) {
        const lowerLetter = letter.toLowerCase();
        letterCounts[lowerLetter] = (letterCounts[lowerLetter] || 0) + 1;
      }
    }
  }

  const canFormWord = (word) => {
    const wordLetters = {};
    for (let char of word) {
      wordLetters[char] = (wordLetters[char] || 0) + 1;
    }
    for (let char in wordLetters) {
      if (!letterCounts[char] || letterCounts[char] < wordLetters[char]) {
        return false;
      }
    }
    return true;
  };

  for (let word of VALID_WORDS) {
    if (canFormWord(word)) {
      return true;
    }
  }
  return false;
};

// Static helper to calculate possible words count (used during initialization)
const calculatePossibleWordsStatic = (gridToCheck, blanksToCheck) => {
  const letterCounts = {};
  for (let row of gridToCheck) {
    for (let letter of row) {
      if (letter) {
        const lowerLetter = letter.toLowerCase();
        letterCounts[lowerLetter] = (letterCounts[lowerLetter] || 0) + 1;
      }
    }
  }

  // Subtract letters already used in blanks
  for (let letter of blanksToCheck) {
    if (letter) {
      const lowerLetter = letter.toLowerCase();
      if (letterCounts[lowerLetter]) {
        letterCounts[lowerLetter]--;
        if (letterCounts[lowerLetter] === 0) {
          delete letterCounts[lowerLetter];
        }
      }
    }
  }

  const canFormWord = (word) => {
    // Check if word matches the pattern in blanks
    for (let i = 0; i < blanksToCheck.length; i++) {
      if (blanksToCheck[i] !== null) {
        if (word[i] !== blanksToCheck[i].toLowerCase()) {
          return false;
        }
      }
    }

    // Check if we have the remaining letters available
    const neededLetters = {};
    for (let i = 0; i < word.length; i++) {
      if (blanksToCheck[i] === null) {
        const char = word[i];
        neededLetters[char] = (neededLetters[char] || 0) + 1;
      }
    }

    for (let char in neededLetters) {
      if (!letterCounts[char] || letterCounts[char] < neededLetters[char]) {
        return false;
      }
    }
    return true;
  };

  let count = 0;
  for (let word of VALID_WORDS) {
    if (canFormWord(word)) {
      count++;
    }
  }
  return count;
};

// Drop a random letter from bottom row into a random blank position
// For initial drop, keep grid full by generating a new letter
const dropRandomLetter = (grid, blanks, keepGridFull = false) => {
  // Find columns in bottom row that have letters
  const bottomRow = grid[GRID_ROWS - 1];
  const availableColumns = [];
  for (let i = 0; i < bottomRow.length; i++) {
    if (bottomRow[i] !== null) {
      availableColumns.push(i);
    }
  }

  if (availableColumns.length === 0) {
    return { grid, blanks }; // No letters to drop
  }

  // Pick random column from available columns
  const colIndex = availableColumns[Math.floor(Math.random() * availableColumns.length)];

  // Pick random blank position
  const blankIndex = Math.floor(Math.random() * BLANK_COUNT);

  // Get the letter from bottom row
  const letter = grid[GRID_ROWS - 1][colIndex];

  // Update blanks
  const newBlanks = [...blanks];
  newBlanks[blankIndex] = letter;

  // Update grid
  const newGrid = grid.map(row => [...row]);

  if (keepGridFull) {
    // Replace the dropped letter with a new random letter (keep grid full)
    newGrid[GRID_ROWS - 1][colIndex] = generateLetter();
  } else {
    // Shift the column down
    for (let rowIndex = GRID_ROWS - 1; rowIndex > 0; rowIndex--) {
      newGrid[rowIndex][colIndex] = newGrid[rowIndex - 1][colIndex];
    }
    newGrid[0][colIndex] = null;
  }

  return { grid: newGrid, blanks: newBlanks };
};

// Initialize grid and blanks with one random letter dropped
const initializeGame = () => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Create a new grid
    let newGrid = createGrid();

    // Make sure grid has some possible words
    if (!checkGridHasWordsStatic(newGrid)) {
      attempts++;
      continue;
    }

    // Drop a random letter (keep grid full for initial setup)
    const startingBlanks = Array(BLANK_COUNT).fill(null);
    const { grid: gridAfterDrop, blanks: blanksAfterDrop } = dropRandomLetter(newGrid, startingBlanks, true);

    // Check if we have at least 3 possible words after the drop
    const possibleWordsCount = calculatePossibleWordsStatic(gridAfterDrop, blanksAfterDrop);

    if (possibleWordsCount >= 3) {
      return { grid: gridAfterDrop, blanks: blanksAfterDrop };
    }

    attempts++;
  }

  // Fallback: if we can't find a good setup, just return a basic grid
  const fallbackGrid = createGrid();
  return { grid: fallbackGrid, blanks: Array(BLANK_COUNT).fill(null) };
};

function App() {
  // Use lazy initialization to get both grid and blanks with one random letter dropped
  const [initialState] = useState(() => initializeGame());
  const [grid, setGrid] = useState(initialState.grid);
  const [blanks, setBlanks] = useState(initialState.blanks);
  const [rowDeleteCount, setRowDeleteCount] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [spinsRemaining, setSpinsRemaining] = useState(5);
  const [deletesRemaining, setDeletesRemaining] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [completedWord, setCompletedWord] = useState('');
  const [possibleWordsCount, setPossibleWordsCount] = useState(0);
  const [possibleWordsList, setPossibleWordsList] = useState([]);
  const [showPossibleWordsModal, setShowPossibleWordsModal] = useState(false);

  // Calculate how many valid words are possible
  const calculatePossibleWords = (currentGrid, currentBlanks) => {
    console.log('calculatePossibleWords called', {
      validWordsSize: VALID_WORDS?.size,
      currentBlanks
    });

    // Collect all letters from the grid
    const letterCounts = {};
    for (let row of currentGrid) {
      for (let letter of row) {
        if (letter) {
          const lowerLetter = letter.toLowerCase();
          letterCounts[lowerLetter] = (letterCounts[lowerLetter] || 0) + 1;
        }
      }
    }

    // Subtract letters already used in blanks
    for (let letter of currentBlanks) {
      if (letter) {
        const lowerLetter = letter.toLowerCase();
        if (letterCounts[lowerLetter]) {
          letterCounts[lowerLetter]--;
          if (letterCounts[lowerLetter] === 0) {
            delete letterCounts[lowerLetter];
          }
        }
      }
    }

    console.log('Available letters (after subtracting blanks):', letterCounts);

    // Helper function to check if a word can be formed with available letters
    const canFormWord = (word) => {
      // First, check if word matches the pattern in blanks
      for (let i = 0; i < currentBlanks.length; i++) {
        if (currentBlanks[i] !== null) {
          if (word[i] !== currentBlanks[i].toLowerCase()) {
            return false; // Word doesn't match the pattern
          }
        }
      }

      // Now check if we have the remaining letters available
      const neededLetters = {};
      for (let i = 0; i < word.length; i++) {
        // Only count letters we still need (not already in blanks)
        if (currentBlanks[i] === null) {
          const char = word[i];
          neededLetters[char] = (neededLetters[char] || 0) + 1;
        }
      }

      // Check if we have enough of each needed letter
      for (let char in neededLetters) {
        if (!letterCounts[char] || letterCounts[char] < neededLetters[char]) {
          return false;
        }
      }
      return true;
    };

    // Check all valid words to see which ones can be formed
    const validWordsList = [];
    for (let word of VALID_WORDS) {
      if (canFormWord(word)) {
        validWordsList.push(word);
      }
    }

    console.log('Total valid words found:', validWordsList.length);
    return { count: validWordsList.length, words: validWordsList };
  };

  // Update possible words count when grid or actions change
  useEffect(() => {
    if (!gameOver) {
      const result = calculatePossibleWords(grid, blanks);
      setPossibleWordsCount(result.count);
      setPossibleWordsList(result.words);

      // End game if no words possible
      if (result.count === 0) {
        setGameOver(true);
        setMessage('There are no words possible. Game over');
      }
    }
  }, [grid, blanks, spinsRemaining, deletesRemaining, gameOver]);


  // Handle letter drop from bottom row
  const handleLetterClick = (colIndex) => {
    // Find first empty blank
    const emptyBlankIndex = blanks.findIndex(b => b === null);
    if (emptyBlankIndex === -1) return; // All blanks filled

    // Get the letter from bottom row
    const letter = grid[GRID_ROWS - 1][colIndex];

    // If the column is already empty, don't do anything
    if (!letter) return;

    // Update blanks
    const newBlanks = [...blanks];
    newBlanks[colIndex] = letter;
    setBlanks(newBlanks);

    // Shift the entire column down, leaving null at top (finite letter pool)
    const newGrid = grid.map(row => [...row]);
    for (let rowIndex = GRID_ROWS - 1; rowIndex > 0; rowIndex--) {
      newGrid[rowIndex][colIndex] = newGrid[rowIndex - 1][colIndex];
    }
    // Leave the top cell empty (null) - no new letters added
    newGrid[0][colIndex] = null;
    setGrid(newGrid);

    // Check if all blanks are filled
    if (newBlanks.every(b => b !== null)) {
      checkWord(newBlanks);
    }
  };

  // Check if the word is valid
  const checkWord = async (word) => {
    const wordString = word.join('').toLowerCase();

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordString}`);
      const isValid = response.ok;

      if (isValid) {
        setCompletedWord(wordString.toUpperCase());
        setGameOver(true);
      } else {
        setMessage(`"${wordString.toUpperCase()}" is not a valid word. Try again!`);
        setBlanks(Array(BLANK_COUNT).fill(null));
      }
    } catch (error) {
      setMessage(`Error checking word. Try again!`);
      setBlanks(Array(BLANK_COUNT).fill(null));
    }
  };

  // Handle row deletion
  const handleRowDelete = (rowIndex) => {
    if (deletesRemaining <= 0) return;

    const newGrid = [...grid];
    newGrid.splice(rowIndex, 1);
    // Add empty row at top (finite letter pool - no new letters)
    newGrid.unshift(Array(GRID_COLS).fill(null));
    setGrid(newGrid);
    setRowDeleteCount(prev => prev + 1);
    setDeletesRemaining(prev => prev - 1);
  };

  // Handle row spin (rotate letters to the right)
  const handleRowSpin = (rowIndex) => {
    if (spinsRemaining <= 0) return;

    const newGrid = grid.map(row => [...row]);
    const row = newGrid[rowIndex];

    // Extract only non-null letters and their positions
    const lettersWithPositions = [];
    row.forEach((letter, index) => {
      if (letter !== null) {
        lettersWithPositions.push({ letter, index });
      }
    });

    // If no letters or only one letter, don't rotate
    if (lettersWithPositions.length <= 1) return;

    // Extract just the letters
    const letters = lettersWithPositions.map(item => item.letter);

    // Rotate letters array to the right
    const lastLetter = letters[letters.length - 1];
    for (let i = letters.length - 1; i > 0; i--) {
      letters[i] = letters[i - 1];
    }
    letters[0] = lastLetter;

    // Put rotated letters back into their original positions
    lettersWithPositions.forEach((item, i) => {
      row[item.index] = letters[i];
    });

    newGrid[rowIndex] = row;
    setGrid(newGrid);
    setSpinCount(prev => prev + 1);
    setSpinsRemaining(prev => prev - 1);
  };

  // Play again - restart the game
  const playAgain = () => {
    const newGameState = initializeGame();

    setGrid(newGameState.grid);
    setBlanks(newGameState.blanks);
    setRowDeleteCount(0);
    setSpinCount(0);
    setSpinsRemaining(5);
    setDeletesRemaining(3);
    setGameOver(false);
    setMessage('');
    setCompletedWord('');
  };

  return (
    <div className="app">
      <div className="game-container">
        <div className="header">
          <h1>WordDrop</h1>
          <div className="stats">
            <button className="back-btn" onClick={playAgain}>Play Again</button>
          </div>
        </div>

        {message && <div className="message">{message}</div>}

        <div className="grid">
          {grid.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid-row"
              style={{ opacity: (rowIndex + 1) / GRID_ROWS }}
            >
              {rowIndex > 0 && row.some(letter => letter !== null) ? (
                <div className="action-btn-container">
                  <button
                    className="delete-row-btn-simple"
                    onClick={() => handleRowDelete(rowIndex)}
                    disabled={gameOver || deletesRemaining <= 0}
                    title="Delete row"
                  >
                    −
                  </button>
                </div>
              ) : (
                <div className="action-btn-container"></div>
              )}
              {row.map((letter, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`letter-cell ${rowIndex === GRID_ROWS - 1 && letter ? 'bottom-row' : ''} ${!letter ? 'empty-cell' : ''}`}
                  onClick={() => rowIndex === GRID_ROWS - 1 && letter && handleLetterClick(colIndex)}
                  disabled={gameOver || rowIndex !== GRID_ROWS - 1 || !letter}
                >
                  {letter || ''}
                </button>
              ))}
              {rowIndex === GRID_ROWS - 1 ? (
                <div className="action-btn-container">
                  <button
                    className="spin-row-btn"
                    onClick={() => handleRowSpin(rowIndex)}
                    disabled={gameOver || spinsRemaining <= 0}
                    title="Rotate row"
                  >
                    ↻
                  </button>
                  <div className="action-count">{spinsRemaining}</div>
                </div>
              ) : (
                <div className="action-btn-container">
                  <div className="spin-row-btn" style={{ visibility: 'hidden' }}></div>
                  <div className="action-count" style={{ visibility: 'hidden' }}>0</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="blanks-container">
          {blanks.map((letter, index) => (
            <div key={index} className="blank-cell">
              {letter || ''}
            </div>
          ))}
        </div>

        {!gameOver && (
          <div className="possible-words-section">
            <button
              className="possible-words-count"
              onClick={() => setShowPossibleWordsModal(true)}
            >
              {possibleWordsCount} possible {possibleWordsCount === 1 ? 'word' : 'words'}
            </button>
          </div>
        )}

        {gameOver && (
          <div className="game-over">
            {completedWord ? (
              <>
                <h2 className="celebration">Congratulations!</h2>
                <div className="completed-word">{completedWord}</div>
                <div className="stats-summary">
                  <div className="stat-item">
                    <span className="stat-label">Row Deletes:</span>
                    <span className="stat-value">{rowDeleteCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Spins:</span>
                    <span className="stat-value">{spinCount}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2>Game Over</h2>
                <p>{message}</p>
              </>
            )}
            <button onClick={playAgain} className="play-again-btn">
              Play Again?
            </button>
          </div>
        )}
      </div>

      {showPossibleWordsModal && (
        <div className="modal-overlay" onClick={() => setShowPossibleWordsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Possible Words ({possibleWordsCount})</h2>
              <button className="modal-close" onClick={() => setShowPossibleWordsModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {possibleWordsList.length > 0 ? (
                <div className="modal-words-grid">
                  {possibleWordsList.map((word, index) => (
                    <div key={index} className="modal-word">
                      {word.toUpperCase()}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-words-message">No possible words available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
