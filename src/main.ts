import { I, O, J, T, L, S, Z, TetrisPiece } from './TetrisPieces.js'

let currPiece: TetrisPiece
const tetrisPieces = [I, O, J, T, L, S, Z]
const playingArea = document.getElementsByTagName('main').item(0)!;

let currPieceID: number
let gameEnded = false

for (let row = 0; row < 22; row++) {
  const rowOfBoxes = document.createElement('div');
  rowOfBoxes.style.display = "flex"
  rowOfBoxes.style.justifyContent = "center"
  if (row > 17) rowOfBoxes.style.display = "none"

  for (let col = 0; col < 8; col++) {
    const newBox = document.createElement('div');
    newBox.style.cssText = `
            width: 2rem; height: 2rem; border: 1px solid black;
            background-color: white;
        `
    rowOfBoxes.appendChild(newBox);
  }
  playingArea!.appendChild(rowOfBoxes);
}


const newPiece = (id: number) => new tetrisPieces[Math.floor(Math.random() * tetrisPieces.length)](id)

function uncolorCoors(coors: any[]) {
  coors.forEach((coor: any[]) => colorBlock(coor[0], coor[1], "white"))
}

function getCompletedRows() {

  let listCompleteRows = []
  for (let row = 0; row < 18; row++) {
    let isRowComplete = true
    for (let col = 0; col < 8; col++) {
      let box = playingArea!.children[row].children.item(col) as HTMLElement
      if (box && box.style.backgroundColor === "white") {
        isRowComplete = false
        break
      }
    }
    isRowComplete && listCompleteRows.push(row)
  }
  return listCompleteRows
}

function inGameListener(listener: KeyboardEvent) {
  const oldCoors = currPiece.getCoor();

  const actions: {[key:string] : () => void} = {
    Space: () => currPiece.upAllTheWay(playingArea),
    ArrowLeft: () => currPiece.canMoveLeft(playingArea) && currPiece.moveLeft(),
    ArrowRight: () => currPiece.canMoveRight(playingArea) && currPiece.moveRight(),
    ArrowDown: () => currPiece.rotate(playingArea),
    ArrowUp: () => currPiece.canMoveUp(playingArea) && currPiece.moveUp(),
  };

  actions[listener.code]?.();

  uncolorCoors(oldCoors);
  colorPlayingArea(currPiece, currPiece.getColor());
}


function startNextRound(playingArea: HTMLElement) {

  let localPlayingArea = playingArea

  currPieceID += 1
  currPiece = newPiece(currPieceID)

  window.addEventListener('keydown', inGameListener)

  if (!gameEnded) {
    let roundInterval = setInterval(() => {

      if (!currPiece.hitTop(localPlayingArea)) {
        uncolorCoors(currPiece.getCoor())

        currPiece.moveUp()

        localPlayingArea = colorPlayingArea(currPiece, currPiece.getColor())
      }
      else {

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
        const completedRows = getCompletedRows()

        if (completedRows.length >= 2) {
          completedRows.forEach((upperBoundRow, idx) => {
            let lowerBoundRow = idx == completedRows.length - 1 ? 18 : completedRows[idx + 1]
            for (let rowNum = upperBoundRow + 1; rowNum < lowerBoundRow; rowNum++) {

              const currRow = playingArea!.children[rowNum]
              const targetRow = playingArea!.children[rowNum - (idx + 1)]
              let isRowEmpty = true
              for (let colNum = 0; colNum < 8; colNum++) {

                const currBox = currRow.children.item(colNum) as HTMLElement
                const currBoxColor = currBox.style.backgroundColor
                currBox.style.backgroundColor = "white"

                if (currBoxColor !== "white") {
                  isRowEmpty = false
                }
                (targetRow.children[colNum] as HTMLElement).style.backgroundColor = currBoxColor
              }
              if (isRowEmpty) break
            }
          })
        } else if (completedRows.length == 1) {
          const upperRow = completedRows[0]

          for (let rowNum = upperRow + 1; rowNum < 18; rowNum++) {
            for (let colNum = 0; colNum < 8; colNum++) {

              const currRowBoxes: HTMLCollection = playingArea!.children[rowNum].children!
              const upperRowBoxes: HTMLCollection = playingArea!.children[rowNum - 1].children!
              const currBoxColor: string = (currRowBoxes.item(colNum) as HTMLElement).style.backgroundColor;

              (upperRowBoxes.item(colNum) as HTMLElement).style.backgroundColor = currBoxColor
            }
          }
        }

        gameEnded = currPiece.getCoor().some((elementCoors: number[]) => elementCoors[0] > 17)

        window.removeEventListener('keydown', inGameListener)
        clearInterval(roundInterval)

        startNextRound(localPlayingArea)
      }

    }, 500 - (20 * (Math.floor(currPieceID / 5)))) // make each round faster as nth round increases
  } else {
    alert("Game Over")
    window.location.reload()
  }
}

window.onload = () => {
  playingArea.style.display = "none"
  currPieceID = 0

  const startGame = (e: { keyCode: number; key: string }) => {
    if (e.keyCode === 32 || e.key === " ") {
      const displayElement = document.getElementById('welcomeDisplay')!
      displayElement.style.display = "none"
      playingArea.style.display = "block"
      startNextRound(playingArea!);
      window.removeEventListener('keydown', startGame);
    };
  }

  window.addEventListener('keydown', startGame)
}

function colorBlock(row: number, col: number, color: string): void {
  (playingArea.children!.item(row)!.children.item(col) as HTMLElement).style.backgroundColor = color
}

function colorPlayingArea(pieceForCoor: TetrisPiece, color: string) {
  pieceForCoor.getCoor().forEach(element => {

    let rowCoor = element[0]
    let colCoor = element[1]

    colorBlock(rowCoor, colCoor, color);
    (playingArea.children[rowCoor].children[colCoor] as HTMLElement).id = pieceForCoor.getId().toString()
  })
  return playingArea
}