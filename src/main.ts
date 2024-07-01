import { I, J, L, O, S, T, TetrisPiece, Z } from './TetrisPieces.js'
import { uncolorCoors, colorPlayingArea, resetLandingCoors } from './utility/colors.js';

export const tetrisPieces = [I, O, J, T, L, S, Z]
export const DEFAULT_COLOR = "white"

export const ROWS = 22;
export const COLUMNS = 8;
export const HIDDEN_ROWS = 4;
export const HIGHEST_ALLOWED_DISPLAY_ROW = ROWS - HIDDEN_ROWS - 1;
export const playingArea = document.getElementsByTagName('main').item(0)!;

// Game state
export let currPiece: TetrisPiece
let currPieceID: number
export let landingCoors: [number, number][] = []

export function setLandingCoors(_landingCoors: [number, number][]) {
  landingCoors = _landingCoors
}

// Utility Functions
const newPiece = (id: number) => new tetrisPieces[Math.floor(Math.random() * tetrisPieces.length)](id)

const shouldStartGame = (e: { keyCode: number; key: string }) => e.keyCode === 32 || e.key === " "

function getCompletedRows() {

  const completeRows = []
  for (let row = 0; row < ROWS - HIDDEN_ROWS; row++) {
    if (Array.from(playingArea.children[row].children).every(box => (box as HTMLElement).style.backgroundColor !== DEFAULT_COLOR)) {
      completeRows.push(row);
    }
  }
  return completeRows
}

function inGameListener(listener: KeyboardEvent) {
  const oldCoors = currPiece.coor;

  const actions: { [key: string]: () => void } = {
    Space: () => currPiece.upAllTheWay(),
    ArrowLeft: () => currPiece.canMoveLeft() && currPiece.moveLeft(),
    ArrowRight: () => currPiece.canMoveRight() && currPiece.moveRight(),
    ArrowDown: () => currPiece.rotate(),
    ArrowUp: () => currPiece.canMoveUp() && currPiece.moveUp(),
  };

  actions[listener.code]?.();

  uncolorCoors(oldCoors);

  colorPlayingArea(currPiece, currPiece.color);
}

export function getLandingCoors(pieceId: number, currPieceCoors: [number, number][]): [number, number][] {
  let updatedCoors = currPieceCoors;
  while (true) {
    if (updatedCoors.some(([row, col]) => row === 0 || (playingArea.children[row - 1].children[col] as HTMLElement).style.backgroundColor !== DEFAULT_COLOR && parseInt((playingArea.children[row - 1].children[col] as HTMLElement).id) !== pieceId)) {
      return updatedCoors;
    }
    updatedCoors = updatedCoors.map(([row, col]) => [row - 1, col]);
  }
}

function movePieceIntoPlayingArea() {
  while (currPiece.coor.every(coor => coor[0] > HIGHEST_ALLOWED_DISPLAY_ROW)) {
    currPiece.moveUp()
  }
}

// check for completed rows, clear them and move up
/*
get completedRows list
loop through the list using variable x1, x2, say list= [0, 2, 4, 5]
 
let x1 = list[idx], x2 = list[idx+1], then idx++
1 is between 0 and 2, so row 1 move up 1 row cuz theres only 0 behind 1 in list
3 is between 2 and 4, so row 3 move up 2 rows cuz 0, 2 are behind 3 in list
... everything after 5 move up 4 rows cuz 0, 2, 4, 5 are behind 6 in list
 
therefore, 1->0, 3->1, 6->2, correct
*/

function clearRows(completedRows: number[]) {
  completedRows.forEach((upperBoundRow, idx) => {
    const lowerBoundRow = idx === completedRows.length - 1 ? ROWS - 1 : completedRows[idx + 1] - 1;
    for (let rowNum = upperBoundRow + 1; rowNum <= lowerBoundRow; rowNum++) {
      const currRow = playingArea.children[rowNum] as HTMLElement;
      const targetRow = playingArea.children[rowNum - (idx + 1)] as HTMLElement;
      for (let colNum = 0; colNum < COLUMNS; colNum++) {
        const currBox = currRow.children[colNum] as HTMLElement;
        const targetBox = targetRow.children[colNum] as HTMLElement;
        targetBox.style.backgroundColor = currBox.style.backgroundColor;
        currBox.style.backgroundColor = DEFAULT_COLOR;
      }
    }
  });
}

function startNextRound() {

  currPieceID += 1
  currPiece = newPiece(currPieceID)

  movePieceIntoPlayingArea()

  resetLandingCoors()

  const moveInterval = setInterval(() => {
    if (currPiece.hitTop()) {
      clearRows(getCompletedRows());

      if (currPiece.coor.some(coor => coor[0] > HIGHEST_ALLOWED_DISPLAY_ROW) && currPiece.hitTop()) {

        window.removeEventListener('keydown', inGameListener)
        alert("Game Over");
        window.location.reload();
      }

      clearInterval(moveInterval)

      startNextRound();
    }

    uncolorCoors(currPiece.coor)

    currPiece.moveUp()

    colorPlayingArea(currPiece, currPiece.color)

  }, 500 - (20 * (Math.floor(currPieceID / 5)))) // make each round faster as nth round increases
}

window.onload = () => {

  function setupPlayingArea() {
    for (let row = 0; row < 22; row++) {
      const rowOfBoxes = document.createElement('div');
      rowOfBoxes.style.display = "flex"
      rowOfBoxes.style.justifyContent = "center"
      if (row > HIGHEST_ALLOWED_DISPLAY_ROW) rowOfBoxes.style.display = "none"

      for (let col = 0; col < COLUMNS; col++) {
        const newBox = document.createElement('div');
        newBox.style.cssText = `
                width: 2rem; height: 2rem; border: 1px solid black;
                background-color: white;
            `
        rowOfBoxes.appendChild(newBox);
      }
      playingArea!.appendChild(rowOfBoxes);
    }

    playingArea.style.display = "none"

    window.addEventListener('keydown', inGameListener)

  }

  currPieceID = 0

  const startGameListener = (event: KeyboardEvent) => {
    if (shouldStartGame(event)) startGame();
  };

  const startGame = () => {
    const displayElement = document.getElementById('welcomeDisplay')!
    displayElement.style.display = "none"
    playingArea.style.display = "block"
    window.removeEventListener('keydown', startGameListener);
    startNextRound();
  };

  setupPlayingArea()
  window.addEventListener('keydown', startGameListener)
}