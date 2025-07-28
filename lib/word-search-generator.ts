interface WordSearchResult {
  grid: string[][]
  solution: boolean[][]
  placedWords: Array<{
    word: string
    start: [number, number]
    end: [number, number]
    direction: string
  }>
}

const GRID_SIZE = 20 // Updated to 20 to match PDF generator
const DIRECTIONS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
  [0, -1], // horizontal backwards
  [-1, 0], // vertical backwards
  [-1, -1], // diagonal up-left
  [-1, 1], // diagonal up-right
]

const DIRECTION_NAMES = [
  "horizontal",
  "vertical",
  "diagonal-down-right",
  "diagonal-down-left",
  "horizontal-backwards",
  "vertical-backwards",
  "diagonal-up-left",
  "diagonal-up-right",
]

function createEmptyGrid(): string[][] {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(""))
}

function createSolutionGrid(): boolean[][] {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(false))
}

function canPlaceWord(grid: string[][], word: string, row: number, col: number, direction: [number, number]): boolean {
  const [dRow, dCol] = direction

  for (let i = 0; i < word.length; i++) {
    const newRow = row + i * dRow
    const newCol = col + i * dCol

    // Check bounds
    if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) {
      return false
    }

    // Check if cell is empty or contains the same letter
    const currentCell = grid[newRow][newCol]
    if (currentCell !== "" && currentCell !== word[i].toUpperCase()) {
      return false
    }
  }

  return true
}

function placeWord(
  grid: string[][],
  solution: boolean[][],
  word: string,
  row: number,
  col: number,
  direction: [number, number],
): void {
  const [dRow, dCol] = direction

  for (let i = 0; i < word.length; i++) {
    const newRow = row + i * dRow
    const newCol = col + i * dCol
    grid[newRow][newCol] = word[i].toUpperCase()
    solution[newRow][newCol] = true
  }
}

function fillEmptyCells(grid: string[][]): void {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === "") {
        grid[row][col] = letters[Math.floor(Math.random() * letters.length)]
      }
    }
  }
}

export function generateWordSearch(words: string[]): WordSearchResult {
  const grid = createEmptyGrid()
  const solution = createSolutionGrid()
  const placedWords: WordSearchResult["placedWords"] = []

  // Sort words by length (longest first) for better placement
  const sortedWords = [...words].sort((a, b) => b.length - a.length)

  for (const word of sortedWords) {
    const upperWord = word.toUpperCase()
    let placed = false
    let attempts = 0
    const maxAttempts = 100

    while (!placed && attempts < maxAttempts) {
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
      const directionIndex = DIRECTIONS.indexOf(direction)
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)

      if (canPlaceWord(grid, upperWord, row, col, direction)) {
        placeWord(grid, solution, upperWord, row, col, direction)

        const [dRow, dCol] = direction
        const endRow = row + (upperWord.length - 1) * dRow
        const endCol = col + (upperWord.length - 1) * dCol

        placedWords.push({
          word: upperWord,
          start: [row, col],
          end: [endRow, endCol],
          direction: DIRECTION_NAMES[directionIndex],
        })

        placed = true
      }

      attempts++
    }

    // If word couldn't be placed after max attempts, try to place it horizontally in any available space
    if (!placed) {
      for (let row = 0; row < GRID_SIZE && !placed; row++) {
        for (let col = 0; col <= GRID_SIZE - upperWord.length && !placed; col++) {
          if (canPlaceWord(grid, upperWord, row, col, [0, 1])) {
            placeWord(grid, solution, upperWord, row, col, [0, 1])
            placedWords.push({
              word: upperWord,
              start: [row, col],
              end: [row, col + upperWord.length - 1],
              direction: "horizontal",
            })
            placed = true
          }
        }
      }
    }
  }

  // Fill empty cells with random letters
  fillEmptyCells(grid)

  return {
    grid,
    solution,
    placedWords,
  }
}
