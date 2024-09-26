import { I, J, L, O, S, T, TetrisPiece, Z } from '../TetrisPieces.js'
import { uncolorCoors, colorPlayingArea, makeLandingCoors } from '../utility/colors.js'
import { BORDER_DEFAULT_COLOR, COLORS, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS, ROWS_DISPLAYABLE } from '../utility/consts.js'

export type GameModeType = "Friend" | "Solo"

const LOCAL_ROWS_DISPLAYABLE = Math.floor(ROWS_DISPLAYABLE * 0.9)
export const TETRIS_PIECES = [I, O, J, T, L, S, Z]

export class Game {
    private friendArea: HTMLElement | null = null
    public playingArea: HTMLElement
    public currPiece: TetrisPiece
    private currPieceID: number
    private currInterval: ReturnType<typeof setInterval>
    private isPaused = false
    private hasWon = false
    public hasLost = false

    private GameMode: GameModeType
    public landingCoors: [number, number][] = []
    private mainArea: HTMLElement
    private pauseScreen: HTMLElement
    private continueButton: HTMLElement
    private waitingForFriendStatus: HTMLElement
    private waitingForFriendCountdown: HTMLElement

    constructor(mainArea: HTMLElement, pauseScreen: HTMLElement, continueButton: HTMLElement, waitingForFriendStatus: HTMLElement, waitingForFriendCountdown: HTMLElement) {
        this.mainArea = mainArea
        this.pauseScreen = pauseScreen
        this.continueButton = continueButton
        this.waitingForFriendStatus = waitingForFriendStatus
        this.waitingForFriendCountdown = waitingForFriendCountdown
        this.playingArea = document.createElement('div')
        this.currPieceID = 0

        const urlParams = new URLSearchParams(window.location.search)
        const gameId = urlParams.get('id')

        this.GameMode = gameId === null ? "Solo" : "Friend"

        this.currPiece = this.newPiece(this.currPieceID)
        this.currInterval = 0

        if (this.GameMode === "Solo") {
            this.setupPlayingArea()

            this.playingArea.style.display = "block"
            this.startNextRound()
        }

        else {

            this.waitingForFriendStatus.style.display = "block";

            (async () => {

                const { startSignalRConnection, joinRoom } = await import("../utility/signalR.js")

                await startSignalRConnection()
                joinRoom(gameId as string)

                shouldMultiGameStart().then(() => {
                    this.setupSignalREventListeners()
                    this.setupPlayingArea()

                    this.waitingForFriendStatus.style.display = "none"
                    this.playingArea.style.display = "block"

                    this.startNextRound()
                })
            })()
        }

        window.onblur = () => this.onWindowBlur()

        this.continueButton.addEventListener('click', () => {
            this.toggleContinue()
        })
    }

    public setLandingCoors(_landingCoors: [number, number][]) {
        this.landingCoors = _landingCoors
    }

    private setupPlayingArea() {

        for (let i = 0; i < (this.GameMode === "Friend" ? 2 : 1); i++) {

            const panel = document.createElement('div')
            panel.style.border = "3px solid white"
            panel.style.padding = "4px"

            if (i === 0) this.playingArea = panel
            else this.friendArea = panel

            for (let row = 0; row < LOCAL_ROWS_DISPLAYABLE + HIDDEN_ROWS; row++) {
                const rowOfBoxes = document.createElement('div')
                rowOfBoxes.style.display = "flex"
                rowOfBoxes.style.justifyContent = "center"
                if (row > LOCAL_ROWS_DISPLAYABLE) rowOfBoxes.style.display = "none"

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

        window.addEventListener('keydown', event => this.inGameListener(event))
        window.onblur = async () => {

            if (this.GameMode === "Solo") {
                this.togglePause(true)
                return
            }

            if (!(this.hasWon || this.hasLost)) {

                const { notifyPause } = await import("../utility/signalR.js")

                notifyPause()
                this.togglePause(true)
            }
        }

        this.continueButton.addEventListener('click', this.GameMode === "Solo" ? this.toggleContinue : async () => {
            this.waitingForFriendStatus.style.display = "block"
            this.pauseScreen.style.display = "none"
            this.mainArea.style.display = "none"

            const { requestContinue } = await import("../utility/signalR.js")

            requestContinue()
        })
    }

    private togglePause(isThisInitiatizePause = false) {

        clearInterval(this.currInterval)

        if (this.hasWon || this.hasLost) return

        if (!this.isPaused) {
            this.pauseScreen.style.display = "none"
            this.waitingForFriendStatus.style.display = "block"
            this.mainArea.style.display = "none"
        }


        if (isThisInitiatizePause) {
            this.pauseScreen.style.display = "block"
            this.waitingForFriendStatus.style.display = "none"
            this.mainArea.style.filter = "blur(10px)"
        }

        this.isPaused = true

    }

    private toggleContinue() {

        this.isPaused = false
        this.waitingForFriendStatus.style.display = "none"
        this.mainArea.style.filter = "none"
        this.mainArea.style.display = "flex"
        this.pauseScreen.style.display = "none"

        this.startInterval()

    }

    private async movePieceIntoPlayingArea() {

        while (this.currPiece.coor.some(coor => coor[0] > LOCAL_ROWS_DISPLAYABLE)) {

            if (this.currPiece.hitTop()) {

                this.hasLost = true

                const { notifyGameOver } = await import("../utility/signalR.js")

                if (this.GameMode === "Friend") await notifyGameOver()
                window.removeEventListener('keydown', this.inGameListener)
                clearInterval(this.currInterval)
                alert("Game Over")

                break
            }

            else this.currPiece.moveUp()
        }

        colorPlayingArea(this.currPiece, this.currPiece.color, this.playingArea)
    }

    private inGameListener(listener: KeyboardEvent) {
        if (this.isPaused) return

        const oldCoors = this.currPiece.coor

        const actions: { [key: string]: () => void } = {
            Space: () => this.currPiece.upAllTheWay(),
            ArrowLeft: () => this.currPiece.canMoveLeft() && this.currPiece.moveLeft(),
            ArrowRight: () => this.currPiece.canMoveRight() && this.currPiece.moveRight(),
            ArrowDown: () => this.currPiece.rotate(),
            ArrowUp: () => this.currPiece.canMoveUp() && this.currPiece.moveUp()
        }

        actions[listener.code]?.()

        uncolorCoors(oldCoors, this.playingArea)
        colorPlayingArea(this.currPiece, this.currPiece.color, this.playingArea)

        if (listener.code === "Space") {
            this.clearCompletedRows()
            this.startNextRound()
        }
    }

    private onWindowBlur = () => this.togglePause()

    private startInterval() {

        this.currInterval = setInterval(async () => {

            if (this.isPaused) return

            if (this.currPiece.hitTop()) {

                this.clearCompletedRows()
                this.startNextRound()
            }

            else {
                uncolorCoors(this.currPiece.coor, this.playingArea)
                this.currPiece.moveUp()

                colorPlayingArea(this.currPiece, this.currPiece.color, this.playingArea)
            }

        }, 500 - (20 * (Math.floor(this.currPieceID / 5))))
    }

    private async clearCompletedRows() {
        const completedRows = this.getCompletedRows()

        if (this.GameMode === "Friend") {
            const { notifyClearRows } = await import("../utility/signalR.js")
            notifyClearRows(completedRows)
        }
        this.clearRows(completedRows)
    }

    private getCompletedRows() {

        const completeRows = []
        for (let row = 0; row < LOCAL_ROWS_DISPLAYABLE - HIDDEN_ROWS; row++) {
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

        this.movePieceIntoPlayingArea() // updates this.hasLost to true if fail to move piece into playing area

        if (!this.hasLost) {
            this.startInterval()
            makeLandingCoors(this)
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

    private clearRows(completedRows: number[], isFriendArea = false) {

        const areaToClear = isFriendArea ? this.friendArea as HTMLElement : this.playingArea

        completedRows.forEach((upperBoundRow, idx) => {
            const lowerBoundRow = idx === completedRows.length - 1 ? LOCAL_ROWS_DISPLAYABLE - 1 : completedRows[idx + 1] - 1
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

    private moveFriend(
        prevCoor: [number, number][],
        newCoor: [number, number][],
        color: typeof COLORS[number]) {


        prevCoor.forEach(coor => {
            ((this.friendArea as HTMLElement).children.item(coor[0])?.children.item(coor[1]) as HTMLElement).style.backgroundColor = DEFAULT_COLOR
        })
        newCoor.forEach(coor => {
            ((this.friendArea as HTMLElement).children.item(coor[0])?.children.item(coor[1]) as HTMLElement).style.backgroundColor = color
        })
    }

    // SignalR

    private async setupSignalREventListeners() {

        type MovementType = {
            prevCoor: [number, number][],
            newCoor: [number, number][],
            color: typeof COLORS[number],
        }

        const { connection } = await import("../utility/signalR.js")

        connection.on("ReceiveMovement", (data: MovementType) => {

            const { prevCoor, newCoor, color } = data

            this.moveFriend(prevCoor, newCoor, color)
        })

        connection.on("LeaveGame", () => {
            alert('Your friend has left the game. Continue to go to home screen')
            window.location.href = "/"
        })

        connection.on("ClearRows", (rows: number[]) => this.clearRows(rows, true))

        connection.on("You Won", () => {
            this.hasWon = true
            clearInterval(this.currInterval)
            alert("You Won!")
            this.pauseScreen.style.display = "none"
            this.mainArea.style.display = "flex"
        })
        connection.on("Pause", this.togglePause)
        connection.on("Continue", () => {

            this.waitingForFriendStatus.style.display = "none"
            this.waitingForFriendCountdown.style.display = "block"

            let remainingSeconds = 3

            let interval = setInterval(() => {

                if (remainingSeconds > 0) {
                    this.waitingForFriendCountdown.innerHTML = remainingSeconds.toString()
                    remainingSeconds--
                }
                else {
                    this.waitingForFriendCountdown.innerHTML = ""
                    this.waitingForFriendCountdown.style.display = "none"
                    clearInterval(interval)
                    this.toggleContinue()
                }
            }, 1000)
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

    newPiece = (id: number) => {
        return new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](this, id, this.playingArea, this.GameMode)
    }

    public static get LOCAL_ROWS_DISPLAYABLE() {
        return LOCAL_ROWS_DISPLAYABLE - HIDDEN_ROWS - 1
    }
}

// Utility Functions

function shouldMultiGameStart(): Promise<void> {
    return new Promise(async (resolve, _) => {
        const { connection } = await import("../utility/signalR.js")

        connection.on('UpdateGroupCount', (cnt: number) => cnt === 2 && resolve())
    })
}