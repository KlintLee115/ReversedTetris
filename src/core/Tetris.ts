import { UIService } from "../Services/UiService.ts";
import { I, J, L, O, S, T, Tetromino, Z } from "./Tetromino.ts";
import { BORDER_DEFAULT_COLOR, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS } from "../consts.ts";
import { updateScoreIfHigher } from "../Services/LeaderboardService.ts";

const TETRIS_PIECES = [I, O, J, T, L, S, Z]

export abstract class Tetris {

    public playingArea: HTMLElement
    public currTetromino: Tetromino
    public landingCoors: [number, number][] = []
    public rowsDisplayable: number
    public currInterval: ReturnType<typeof setInterval>
    public mainArea: HTMLElement
    public currScore = 0

    private currTetrominoID: number
    private intervalBaseTime: number

    constructor(mainArea: HTMLElement, intervalBaseTime: number, rowsDisplayable: number) {
        this.mainArea = mainArea
        this.playingArea = document.createElement('div')
        this.currTetrominoID = 0

        this.currTetromino = this.newPiece()
        this.currInterval = 0
        this.intervalBaseTime = intervalBaseTime
        this.rowsDisplayable = rowsDisplayable
    }

    public GetLandingCoors(tetrominoId: number, currTetrominoCoors: [number, number][]): [number, number][] {
        let updatedCoors = currTetrominoCoors
        while (true) {
            if (updatedCoors.some(([row, col]) => row === 0 || (this.playingArea.children[row - 1].children[col] as HTMLElement).style.backgroundColor !== DEFAULT_COLOR && parseInt((this.playingArea.children[row - 1].children[col] as HTMLElement).id) !== tetrominoId)) {
                return updatedCoors
            }
            updatedCoors = updatedCoors.map(([row, col]) => [row - 1, col])
        }
    }

    protected async StartNextRound() {

        this.currTetrominoID += 1
        this.currTetromino = this.newPiece()

        const isSuccess = this.currTetromino.IsMoveIntoPlayingAreaSuccess(this)

        UIService.ColorArea(this.currTetromino.coor, this.currTetrominoID, this.currTetromino.color, this.playingArea)

        if (!isSuccess) return await this.handleGameOver(true, true)

        this.StartIntervals()
        this.updateLandingCoors()

        UIService.ColorLandingCoors(this.landingCoors, this.currTetromino.color, this.playingArea)
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

            if (this.currTetromino.HasHitTop()) {

                clearInterval(this.currInterval)
                this.ClearRows(this.playingArea)
                this.StartNextRound()
                return
            }

            this.currTetromino.MoveUp()

        }, this.intervalBaseTime - (20 * (Math.floor(this.currTetrominoID / 5))))
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


    // if shouldNotifyFriend, it also means that self has lost

    public async handleGameOver(shouldNotifyFriend: boolean, hasLost: boolean | undefined): Promise<void> {
        clearInterval(this.currInterval)

        const { Game } = await import('./GamePlayConfig.ts')

        if (!(this instanceof Game)) return

        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('keydown', this.inGameListenerBound);

        if (shouldNotifyFriend) {
            const { notifyGameOver } = await import("../Services/signalR/signalRSenders.ts");
            await notifyGameOver()
            alert("Game Over")
            return
        }

        if (hasLost === undefined) {
            alert("Your friend has left the game.")
            return
        }

        alert(hasLost ? "Game Over" : "You Won!")
    }

    public updateLandingCoors() {
        this.landingCoors = this.GetLandingCoors(this.currTetromino.GetId(), this.currTetromino.coor)
    }

    protected newPiece = () => new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](this, this.currTetrominoID, this.playingArea)

    abstract setupPlayingArea(): void

}