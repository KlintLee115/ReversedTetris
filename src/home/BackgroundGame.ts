import { I, O, J, T, L, S, Z, TetrisPiece } from "../TetrisPieces.js"
import { makeLandingCoors, uncolorCoors, colorPlayingArea } from "../utility/colors.js"
import { ROWS_DISPLAYABLE, HIDDEN_ROWS, COLUMNS, DEFAULT_COLOR, BORDER_DEFAULT_COLOR } from "../utility/consts.js"

export type GameModeType = "Friend" | "Solo"

export const TETRIS_PIECES = [I, O, J, T, L, S, Z]

export class BackgroundGame {
    public playingArea: HTMLElement
    public currPiece: TetrisPiece
    private currPieceID: number
    private currInterval: ReturnType<typeof setInterval>
    private hasLost = false
    public landingCoors: [number, number][] = []
    private mainArea: HTMLElement

    constructor(mainArea: HTMLElement) {
        this.mainArea = mainArea
        this.playingArea = document.createElement('div')
        this.currPieceID = 0

        this.currPiece = this.newPiece(this.currPieceID)
        this.currInterval = 0

        this.setupPlayingArea()

        this.playingArea.style.display = "block"
        this.startNextRound()

    }

    public setLandingCoors(_landingCoors: [number, number][]) {
        this.landingCoors = _landingCoors
    }

    private setupPlayingArea() {


        const panel = document.createElement('div')
        panel.style.border = "1px solid white"
        panel.style.padding = "4px"

        this.playingArea = panel

        for (let row = 0; row < ROWS_DISPLAYABLE + HIDDEN_ROWS; row++) {
            const rowOfBoxes = document.createElement('div')
            rowOfBoxes.style.display = "flex"
            rowOfBoxes.style.justifyContent = "center"
            if (row > ROWS_DISPLAYABLE) {
                rowOfBoxes.style.display = "none"
            }

            for (let col = 0; col < COLUMNS; col++) {
                const newBox = document.createElement('div')
                newBox.style.width = "2rem"
                newBox.style.height = "2rem"
                newBox.style.backgroundColor = DEFAULT_COLOR
                newBox.style.border = "1px solid"
                newBox.style.borderRadius = "1px"
                newBox.style.margin = "1px"
                newBox.style.borderColor = BORDER_DEFAULT_COLOR
                rowOfBoxes.appendChild(newBox)
            }
            panel.appendChild(rowOfBoxes)
        }

        this.mainArea.appendChild(panel)
    }

    private movePieceIntoPlayingArea() {
        while (this.currPiece.coor.some(coor => coor[0] > ROWS_DISPLAYABLE)) {
            if (this.currPiece.hitTop()) {
                this.hasLost = true
                return
            }
            this.currPiece.moveUp()
        }
        makeLandingCoors(this)
    }


    private startInterval() {

        this.currInterval = setInterval(async () => {

            if (this.hasLost) return

            if (this.currPiece.hitTop()) {

                const completedRows = this.getCompletedRows()

                this.clearRows(completedRows)

                this.startNextRound()
            }

            uncolorCoors(this.currPiece.coor, this.playingArea)

            this.currPiece.moveUp()

            colorPlayingArea(this.currPiece, this.currPiece.color, this.playingArea)

        }, 50 - (this.currPieceID * 0.5))
    }

    private getCompletedRows() {

        const completeRows = []
        for (let row = 0; row < ROWS_DISPLAYABLE - HIDDEN_ROWS; row++) {
            if (Array.from(this.playingArea.children[row].children).every(box => (box as HTMLElement).style.backgroundColor !== DEFAULT_COLOR)) {
                completeRows.push(row)
            }
        }
        return completeRows
    }

    private startNextRound() {

        clearInterval(this.currInterval)
        this.currPieceID += 1
        this.currPiece = this.newPiece(this.currPieceID)

        this.movePieceIntoPlayingArea()

        this.startInterval()
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

    private clearRows(completedRows: number[]) {

        const areaToClear = this.playingArea

        completedRows.forEach((upperBoundRow, idx) => {
            const lowerBoundRow = idx === completedRows.length - 1 ? ROWS_DISPLAYABLE - 1 : completedRows[idx + 1] - 1
            for (let rowNum = upperBoundRow + 1; rowNum <= lowerBoundRow; rowNum++) {
                const currRow = areaToClear.children[rowNum] as HTMLElement
                const targetRow = areaToClear.children[rowNum - (idx + 1)] as HTMLElement
                for (let colNum = 0; colNum < COLUMNS; colNum++) {
                    const currBox = currRow.children[colNum] as HTMLElement
                    const targetBox = targetRow.children[colNum] as HTMLElement
                    targetBox.style.borderColor = currBox.style.borderColor
                    currBox.style.borderColor = BORDER_DEFAULT_COLOR
                    targetBox.style.backgroundColor = currBox.style.backgroundColor
                    currBox.style.backgroundColor = DEFAULT_COLOR
                }
            }
        })
    }

    getLandingCoors(pieceId: number, currPieceCoors: [number, number][]): [number, number][] {
        let updatedCoors = currPieceCoors
        while (true) {
            if (updatedCoors.some(([row, col]) => row === 0 || (this.playingArea.children[row - 1].children[col] as HTMLElement).style.backgroundColor !== DEFAULT_COLOR && parseInt((this.playingArea.children[row - 1].children[col] as HTMLElement).id) !== pieceId)) {
                return updatedCoors
            }
            updatedCoors = updatedCoors.map(([row, col]) => [row - 1, col])
        }
    }

    newPiece(id: number) {
        const newPiece = new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](this, id, this.playingArea, "Solo")
        return newPiece
    }
}