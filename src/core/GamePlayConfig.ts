import { Tetris } from './Tetris.ts'
import { COLORS, DEFAULT_COLOR, ROWS_DISPLAYABLE } from '../utils/consts.js'
import { colorBlock } from '../utils/colors.ts'

export type GameModeType = "Friend" | "Solo"

const LOCAL_ROWS_DISPLAYABLE = Math.floor(ROWS_DISPLAYABLE * 0.9)

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
            this.startNextRound(false)
        }

        else {

            this.waitingForFriendStatus.style.display = "block";

            (async () => {

                const { startSignalRConnection, joinRoom } = await import("../utils/signalR.ts")

                await startSignalRConnection()
                joinRoom(gameId as string)

                shouldMultiGameStart().then(() => {
                    this.setupSignalREventListeners()
                    this.setupPlayingArea()

                    this.waitingForFriendStatus.style.display = "none"
                    this.playingArea.style.display = "block"

                    this.startNextRound(true)
                })
            })()
        }

        // window.onblur = () => this.onWindowBlur()

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

            this.addRowsForSetup(panel)

            this.mainArea.appendChild(panel)
        }

        window.addEventListener('keydown', event => this.inGameListener(event))

        if (this.GameMode === "Friend") {
            // window.onblur = async () => {

            //     // neither won or lost then trigger pause
            //     if (!(this.hasWon || this.hasLost)) {

            //         const { notifyPause } = await import("../utils/signalR.ts")

            //         notifyPause()
            //         this.togglePause(true)
            //     }
            // }

            this.continueButton.addEventListener('click', async () => {
                this.waitingForFriendStatus.style.display = "block"
                this.pauseScreen.style.display = "none"
                this.mainArea.style.display = "none"

                const { requestContinue } = await import("../utils/signalR.ts")

                requestContinue()
            })
        }
    }

    private togglePause(isThisInitiatizePause = false) {

        clearInterval(this.currInterval)

        if (this.hasWon || this.hasLost) return

        this.pauseScreen.style.display = isThisInitiatizePause ? "block" : "none"
        this.waitingForFriendStatus.style.display = isThisInitiatizePause ? "none" : "block"
        this.mainArea.style.filter = isThisInitiatizePause ? "blur(10px)" : ""

        this.isPaused = true

    }

    private toggleContinue() {

        this.isPaused = false
        this.waitingForFriendStatus.style.display = "none"
        this.mainArea.style.filter = "none"
        this.mainArea.style.display = "flex"
        this.pauseScreen.style.display = "none"

        this.startIntervals(this.isPaused, this.GameMode === "Friend")

    }

    private inGameListener(listener: KeyboardEvent) {
        if (this.isPaused) return

        const shouldNotifyFriend = this.GameMode === "Friend"

        const actions: { [key: string]: () => void } = {
            Space: () => this.currPiece.upAllTheWay(shouldNotifyFriend),
            ArrowLeft: () => this.currPiece.canMoveLeft() && this.currPiece.moveLeft(shouldNotifyFriend),
            ArrowRight: () => this.currPiece.canMoveRight() && this.currPiece.moveRight(shouldNotifyFriend),
            ArrowDown: () => this.currPiece.rotate(shouldNotifyFriend),
            ArrowUp: () => this.currPiece.canMoveUp() && this.currPiece.moveUp(shouldNotifyFriend)
        }

        actions[listener.code]?.()

        if (listener.code === "Space") {
            this.clearRound(shouldNotifyFriend)
            this.startNextRound(shouldNotifyFriend)
        }
    }

    private onWindowBlur = () => this.GameMode === "Friend" && this.togglePause()

    private moveFriend(prevCoor: [number, number][], newCoor: [number, number][], color: typeof COLORS[number]) {
        this.updateFriendArea(prevCoor, DEFAULT_COLOR)
        this.updateFriendArea(newCoor, color)
    }

    private updateFriendArea(coors: [number, number][], color: string) {
        coors.forEach(coor => colorBlock(coor[0], coor[1], color, this.friendArea as HTMLElement))
    }

    // SignalR

    private async setupSignalREventListeners() {

        type MovementType = {
            prevCoor: [number, number][],
            newCoor: [number, number][],
            color: typeof COLORS[number],
        }

        const { connection } = await import("../utils/signalR.ts")

        connection.on("ReceiveMovement", (data: MovementType) => {

            const { prevCoor, newCoor, color } = data

            this.moveFriend(prevCoor, newCoor, color)
        })

        connection.on("LeaveGame", () => {
            alert('Your friend has left the game. Continue to go to home screen')
            window.location.href = "/"
        })

        connection.on("ClearRows", () => {
            this.clearRows(this.friendArea as HTMLElement, false)
        })

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
}

// Utility Functions

function shouldMultiGameStart(): Promise<void> {
    return new Promise(async (resolve, _) => {
        const { connection } = await import("../utils/signalR.ts")

        connection.on('UpdateGroupCount', (cnt: number) => cnt === 2 && resolve())
    })
}