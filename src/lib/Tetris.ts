import { TetrisPiece } from "../TetrisPieces.ts";
import { colorPlayingArea, makeLandingCoors, uncolorCoors } from "../utility/colors.ts";
import { BORDER_DEFAULT_COLOR, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS } from "../utility/consts.ts";

export abstract class Tetris {

    public playingArea: HTMLElement
    public currPiece: TetrisPiece
    protected currPieceID: number
    protected currInterval: ReturnType<typeof setInterval>
    protected hasLost = false
    public landingCoors: [number, number][] = []
    protected mainArea: HTMLElement
    private intervalBaseTime: number
    private rowsDisplayable: number
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

    public setLandingCoors(_landingCoors: [number, number][]) {
        this.landingCoors = _landingCoors
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

    protected startNextRound() {

        clearInterval(this.currInterval)
        this.currPieceID += 1
        this.currPiece = this.newPiece()

        this.movePieceIntoPlayingArea()

        if (!this.hasLost) {
            this.startInterval(false)
            makeLandingCoors(this)
        }
    }

    protected getCompletedRows() {

        const completeRows = []
        for (let row = 0; row < this.rowsDisplayable - HIDDEN_ROWS; row++) {
            if (Array.from(this.playingArea.children[row].children).every(box => (box as HTMLElement).style.backgroundColor !== DEFAULT_COLOR)) {
                completeRows.push(row)
            }
        }
        return completeRows
    }

    protected startInterval(isPaused: boolean = false, shouldNotifyFriend: boolean = false) {

        this.currInterval = setInterval(async () => {

            if (isPaused) return

            if (this.currPiece.hitTop()) {

                this.clearRows(this.playingArea, shouldNotifyFriend)
                this.startNextRound()
            }

            else {
                uncolorCoors(this.currPiece.coor, this.playingArea)
                this.currPiece.moveUp()

                colorPlayingArea(this.currPiece, this.currPiece.color, this.playingArea)
            }

        }, this.intervalBaseTime - (20 * (Math.floor(this.currPieceID / 5))))
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

    protected async clearRows(areaToClear: HTMLElement, notifyFriend: boolean) {

        const completedRows = this.getCompletedRows()

        console.log(areaToClear)

        if (notifyFriend) {
            const { notifyClearRows } = await import("../utility/signalR.ts")
            notifyClearRows(completedRows)
        }

        // const areaToClear = isFriendArea ? this.friendArea as HTMLElement : this.playingArea

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
    }

    abstract newPiece(): TetrisPiece

    abstract setupPlayingArea(): void

    abstract movePieceIntoPlayingArea() : void
}