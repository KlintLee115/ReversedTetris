import { UIService } from "../Services/UiService.ts";
import { I, J, L, O, S, T, Tetrimino, Z } from "./Tetrimino.ts";
import { BORDER_DEFAULT_COLOR, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS } from "../consts.ts";
import { updateScoreIfHigher } from "../Services/LeaderboardService.ts";

const TETRIS_PIECES = [I, O, J, T, L, S, Z]

export abstract class Tetris {

    public playingArea: HTMLElement
    public currTetrimino: Tetrimino
    public landingCoors: [number, number][] = []
    public rowsDisplayable: number
    public currInterval: ReturnType<typeof setInterval>
    public mainArea: HTMLElement
    public currScore = 0

    protected currTetriminoID: number

    private intervalBaseTime: number

    constructor(mainArea: HTMLElement, intervalBaseTime: number, rowsDisplayable: number) {
        this.mainArea = mainArea
        this.playingArea = document.createElement('div')
        this.currTetriminoID = 0

        this.currTetrimino = this.newPiece()
        this.currInterval = 0
        this.intervalBaseTime = intervalBaseTime
        this.rowsDisplayable = rowsDisplayable
    }

    public GetLandingCoors(tetriminoId: number, currTetriminoCoors: [number, number][]): [number, number][] {
        let updatedCoors = currTetriminoCoors
        while (true) {
            if (updatedCoors.some(([row, col]) => row === 0 || (this.playingArea.children[row - 1].children[col] as HTMLElement).style.backgroundColor !== DEFAULT_COLOR && parseInt((this.playingArea.children[row - 1].children[col] as HTMLElement).id) !== tetriminoId)) {
                return updatedCoors
            }
            updatedCoors = updatedCoors.map(([row, col]) => [row - 1, col])
        }
    }

    protected async StartNextRound() {

        this.currTetriminoID += 1
        this.currTetrimino = this.newPiece()

        const isSuccess = await this.MovePieceIntoPlayingArea()

        if (!isSuccess) return

        this.StartIntervals()
        this.updateLandingCoors()

        UIService.ColorLandingCoors(this.landingCoors, this.currTetrimino.color, this.playingArea)
    }

    protected GetCompletedRows(areaToCheck: HTMLElement) {

        const completeRows = []
        for (let row = 0; row < this.rowsDisplayable - HIDDEN_ROWS; row++) {
            if (Array.from(areaToCheck.children[row].children).every(box => (box as HTMLElement).style.backgroundColor !== DEFAULT_COLOR)) {
                completeRows.push(row)
            }
        }
        return completeRows
    }

    protected StartIntervals() {

        this.currInterval = setInterval(async () => {

            if (this.currTetrimino.HasHitTop()) {

                clearInterval(this.currInterval)
                this.ClearRows(this.playingArea)
                this.StartNextRound()
                return
            }

            this.currTetrimino.MoveUp()

        }, this.intervalBaseTime - (20 * (Math.floor(this.currTetriminoID / 5))))
    }

    protected ClearRound() {
        clearInterval(this.currInterval)
        this.ClearRows(this.playingArea)
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

    public async ClearRows(areaToClear: HTMLElement) {

        const completedRows = this.GetCompletedRows(areaToClear)

        if (completedRows.length === 0) return

        this.currScore += (25 * completedRows.length)
        updateScoreIfHigher(this)

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

        const { Game } = await import('./GamePlayConfig.ts')

        if (this instanceof Game && this.GameMode === "Friend") {
            const { notifyClearRows } = await import("../Services/signalR/signalRSenders.ts")
            notifyClearRows(completedRows)
        }
    }


    private async MovePieceIntoPlayingArea(): Promise<boolean> {

        while (this.currTetrimino.coor.some(coor => coor[0] > this.rowsDisplayable)) {

            if (this.currTetrimino.HasHitTop()) {

                clearInterval(this.currInterval)

                const { Game } = await import('./GamePlayConfig.ts')

                if (this instanceof Game) {

                    window.removeEventListener('blur', this.handleBlur)

                    if (this.GameMode === "Friend") {

                        window.removeEventListener('keydown', this.inGameListenerBound)

                        const { notifyGameOver } = await import("../Services/signalR/signalRSenders.ts")

                        await notifyGameOver()
                    }

                alert("Game Over")

                }


                return false
            }
            this.currTetrimino.MoveUp()
        }

        UIService.ColorArea(this.currTetrimino.coor, this.currTetriminoID, this.currTetrimino.color, this.playingArea)
        return true
    }

    public updateLandingCoors() {
        this.landingCoors = this.GetLandingCoors(this.currTetrimino.GetId(), this.currTetrimino.coor)
    }

    protected newPiece = () => new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](this, this.currTetriminoID, this.playingArea)

    abstract setupPlayingArea(): void

}