import { I, J, L, O, S, T, TetrisPiece, Z } from "../TetrisPiece.ts";
import { colorArea, makeLandingCoors } from "../utils/colors.ts";
import { BORDER_DEFAULT_COLOR, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS } from "../utils/consts.ts";

const TETRIS_PIECES = [I, O, J, T, L, S, Z]

export abstract class Tetris {

    public playingArea: HTMLElement
    public currPiece: TetrisPiece
    public landingCoors: [number, number][] = []
    public rowsDisplayable: number
    public currInterval: ReturnType<typeof setInterval>
    public mainArea: HTMLElement

    protected currPieceID: number
    protected hasLost = false

    private intervalBaseTime: number
    private IsGame: boolean

    constructor(mainArea: HTMLElement, intervalBaseTime: number, rowsDisplayable: number, isGame: boolean) {
        this.mainArea = mainArea
        this.playingArea = document.createElement('div')
        this.currPieceID = 0
        this.IsGame = isGame

        this.currPiece = this.newPiece()
        this.currInterval = 0
        this.intervalBaseTime = intervalBaseTime
        this.rowsDisplayable = rowsDisplayable
    }

    public getLandingCoors(pieceId: number, currPieceCoors: [number, number][]): [number, number][] {
        let updatedCoors = currPieceCoors
        while (true) {
            if (updatedCoors.some(([row, col]) => row === 0 || (this.playingArea.children[row - 1].children[col] as HTMLElement).style.backgroundColor !== DEFAULT_COLOR && parseInt((this.playingArea.children[row - 1].children[col] as HTMLElement).id) !== pieceId)) {
                return updatedCoors
            }
            updatedCoors = updatedCoors.map(([row, col]) => [row - 1, col])
        }
    }

    protected async startNextRound(shouldNotifyFriend: boolean) {

        this.currPieceID += 1
        this.currPiece = this.newPiece()

        const isSuccess = await this.movePieceIntoPlayingArea(shouldNotifyFriend)

        if (!isSuccess) return

        this.startIntervals(shouldNotifyFriend)
        makeLandingCoors(this)
    }

    protected getCompletedRows(areaToCheck: HTMLElement) {

        const completeRows = []
        for (let row = 0; row < this.rowsDisplayable - HIDDEN_ROWS; row++) {
            if (Array.from(areaToCheck.children[row].children).every(box => (box as HTMLElement).style.backgroundColor !== DEFAULT_COLOR)) {
                completeRows.push(row)
            }
        }
        return completeRows
    }

    protected startIntervals(shouldNotifyFriend: boolean) {

        this.currInterval = setInterval(async () => {

            if (this.currPiece.hasHitTop()) {

                clearInterval(this.currInterval)
                this.clearRows(this.playingArea, shouldNotifyFriend)
                this.startNextRound(shouldNotifyFriend)
                return
            }

            this.currPiece.moveUp(shouldNotifyFriend)

        }, this.intervalBaseTime - (20 * (Math.floor(this.currPieceID / 5))))
    }

    protected clearRound(shouldNotifyFriend: boolean) {
        clearInterval(this.currInterval)
        this.clearRows(this.playingArea, shouldNotifyFriend)
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

    public async clearRows(areaToClear: HTMLElement, shouldNotifyFriend: boolean) {

        const completedRows = this.getCompletedRows(areaToClear)

        if (completedRows.length === 0) return

        completedRows.forEach((upperBoundRow, idx) => {
            const lowerBoundRow = idx === completedRows.length - 1 ? this.rowsDisplayable - 1 : completedRows[idx + 1] - 1
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

        if (shouldNotifyFriend) {

            const { notifyClearRows } = await import("../utils/signalRSenders.ts")
            notifyClearRows(completedRows)
        }
    }


    private async movePieceIntoPlayingArea(shouldNotifyFriend: boolean) : Promise<boolean> {

        while (this.currPiece.coor.some(coor => coor[0] > this.rowsDisplayable)) {

            if (this.currPiece.hasHitTop()) {
                this.hasLost = true
                clearInterval(this.currInterval)

                if (shouldNotifyFriend) {
                    const { notifyGameOver } = await import("../utils/signalRSenders.ts")

                    await notifyGameOver()
                }

                if (this.IsGame) alert("Game Over")

                return false
            }
            else this.currPiece.moveUp(shouldNotifyFriend)
        }

        colorArea(this.currPiece, this.currPiece.color, this.playingArea)
        return true
    }

    protected addRowsForSetup(panel: HTMLElement) {

        for (let row = 0; row <= this.rowsDisplayable + HIDDEN_ROWS; row++) {
            const rowOfBoxes = document.createElement('div')
            rowOfBoxes.style.display = "flex"
            rowOfBoxes.style.justifyContent = "center"
            if (row > this.rowsDisplayable) rowOfBoxes.style.display = "none"

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
    }

    protected newPiece = () => new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](this, this.currPieceID, this.playingArea)

    abstract setupPlayingArea(): void

}