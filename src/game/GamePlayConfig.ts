import { Tetris } from '../lib/Tetris.ts'
import { I, J, L, O, S, T, Z } from '../TetrisPieces.js'
import { uncolorCoors, colorPlayingArea } from '../utility/colors.js'
import { BORDER_DEFAULT_COLOR, COLORS, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS, ROWS_DISPLAYABLE } from '../utility/consts.js'

export type GameModeType = "Friend" | "Solo"

const LOCAL_ROWS_DISPLAYABLE = Math.floor(ROWS_DISPLAYABLE * 0.9)
export const TETRIS_PIECES = [I, O, J, T, L, S, Z]

export class Game extends Tetris {
    private friendArea: HTMLElement | null = null
    private isPaused = false
    private hasWon = false

    private GameMode: GameModeType
    private pauseScreen: HTMLElement
    private continueButton: HTMLElement
    private waitingForFriendStatus: HTMLElement
    private waitingForFriendCountdown: HTMLElement

    constructor(mainArea: HTMLElement, pauseScreen: HTMLElement, continueButton: HTMLElement, waitingForFriendStatus: HTMLElement, waitingForFriendCountdown: HTMLElement) {
        super(mainArea, 500, LOCAL_ROWS_DISPLAYABLE, true)

        this.pauseScreen = pauseScreen
        this.continueButton = continueButton
        this.waitingForFriendStatus = waitingForFriendStatus
        this.waitingForFriendCountdown = waitingForFriendCountdown

        const urlParams = new URLSearchParams(window.location.search)
        const gameId = urlParams.get('id')

        this.GameMode = gameId === null ? "Solo" : "Friend"


        if (this.GameMode === "Solo") {
            this.setupPlayingArea()

            this.playingArea.style.display = "block"
            this.startNextRound()
        }

        else {

            this.waitingForFriendStatus.style.display = "block";

            (async () => {

                const { startSignalRConnection, joinRoom } = await import("../utility/signalR.ts")

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

    override setupPlayingArea() {

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

                const { notifyPause } = await import("../utility/signalR.ts")

                notifyPause()
                this.togglePause(true)
            }
        }

        this.continueButton.addEventListener('click', this.GameMode === "Solo" ? this.toggleContinue : async () => {
            this.waitingForFriendStatus.style.display = "block"
            this.pauseScreen.style.display = "none"
            this.mainArea.style.display = "none"

            const { requestContinue } = await import("../utility/signalR.ts")

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

        this.startInterval(this.isPaused)

    }

    override async movePieceIntoPlayingArea() {

        while (this.currPiece.coor.some(coor => coor[0] > LOCAL_ROWS_DISPLAYABLE)) {

            if (this.currPiece.hitTop()) {

                this.hasLost = true

                const { notifyGameOver } = await import("../utility/signalR.ts")

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
            this.clearRows(this.playingArea, this.GameMode === "Friend")
            this.startNextRound()
        }
    }

    private onWindowBlur = () => this.togglePause()

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

        const { connection } = await import("../utility/signalR.ts")

        connection.on("ReceiveMovement", (data: MovementType) => {

            const { prevCoor, newCoor, color } = data

            this.moveFriend(prevCoor, newCoor, color)
        })

        connection.on("LeaveGame", () => {
            alert('Your friend has left the game. Continue to go to home screen')
            window.location.href = "/"
        })

        connection.on("ClearRows", () => this.clearRows(this.playingArea, false))

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

    override newPiece() {
        return new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](this, this.currPieceID, this.playingArea, this.GameMode)
    }
}

// Utility Functions

function shouldMultiGameStart(): Promise<void> {
    return new Promise(async (resolve, _) => {
        const { connection } = await import("../utility/signalR.ts")

        connection.on('UpdateGroupCount', (cnt: number) => cnt === 2 && resolve())
    })
}