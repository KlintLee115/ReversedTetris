import { Tetris } from './Tetris.ts'
import { COLORS, DEFAULT_COLOR, ROWS_DISPLAYABLE } from '../utils/consts.js'
import { colorBlock } from '../utils/colors.ts'

export type GameModeType = "Friend" | "Solo"

const LOCAL_ROWS_DISPLAYABLE = Math.floor(ROWS_DISPLAYABLE * 0.9)

export class Game extends Tetris {
    private isPaused = false
    private GameMode: GameModeType
    private continueButton: HTMLElement
    private keyPressInterval: ReturnType<typeof setInterval>

    public waitingForFriendStatus: HTMLElement
    public waitingForFriendCountdown: HTMLElement
    public friendArea: HTMLElement | null = null
    public pauseScreen: HTMLElement
    public hasWon = false

    constructor(mainArea: HTMLElement, pauseScreen: HTMLElement, continueButton: HTMLElement, waitingForFriendStatus: HTMLElement, waitingForFriendCountdown: HTMLElement) {
        super(mainArea, 500, LOCAL_ROWS_DISPLAYABLE, true)

        this.pauseScreen = pauseScreen
        this.continueButton = continueButton
        this.waitingForFriendStatus = waitingForFriendStatus
        this.waitingForFriendCountdown = waitingForFriendCountdown
        this.keyPressInterval = NaN

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

                const { startSignalRConnection } = await import("../utils/signalR.ts")
                const { joinRoom } = await import('../utils/signalRSenders.ts')
                const { shouldMultiGameStart, setupSignalREventListeners } = await import('../utils/signalRListener.ts')

                await startSignalRConnection()
                joinRoom(gameId as string)

                shouldMultiGameStart().then(() => {
                    setupSignalREventListeners(this)
                    this.setupPlayingArea()

                    this.waitingForFriendStatus.style.display = "none"
                    this.playingArea.style.display = "block"

                    this.startNextRound(true)
                })
            })()
        }

        window.onblur = async () => {

            if (this.GameMode === "Solo") return

            this.togglePause()

            const { notifyPause } = await import("../utils/signalRSenders.ts")

            notifyPause()
        }
    }

    private createPlayingPanel() {
        const panel = document.createElement('div')
        panel.style.border = "3px solid white"
        panel.style.padding = "4px"
        this.addRowsForSetup(panel)
        this.mainArea.appendChild(panel)
        return panel
    }

    override setupPlayingArea() {

        for (let i = 0; i < (this.GameMode === "Friend" ? 2 : 1); i++) {

            const panel = this.createPlayingPanel()
            if (i === 0) this.playingArea = panel
            else this.friendArea = panel
        }

        window.addEventListener('keydown', event => this.inGameListener(event))
        window.addEventListener('keyup', () => {
            if (!isNaN(this.keyPressInterval)) {
                clearInterval(this.keyPressInterval)
                this.keyPressInterval = NaN
            }
        })

        if (this.GameMode === "Friend") {

            this.continueButton.addEventListener('click', async () => {
                this.waitingForFriendStatus.style.display = "block"
                this.pauseScreen.style.display = "none"
                this.mainArea.style.display = "none"

                const { requestContinue } = await import("../utils/signalRSenders.ts")

                requestContinue()
            })
        }
    }

    public togglePause() {

        clearInterval(this.currInterval)

        if (this.hasWon || this.hasLost) return

        this.pauseScreen.style.display = "block"
        this.waitingForFriendStatus.style.display = "none"
        this.mainArea.style.filter = "blur(10px)"

        this.isPaused = true

    }

    public toggleContinue() {

        this.isPaused = false
        this.waitingForFriendStatus.style.display = "none"
        this.mainArea.style.filter = "none"
        this.mainArea.style.display = "flex"
        this.pauseScreen.style.display = "none"

        this.startIntervals(this.GameMode === "Friend")

    }

    private inGameListener(listener: KeyboardEvent) {

        const shouldNotifyFriend = this.GameMode === "Friend"

        if (listener.code === 'Space') {
            this.currPiece.upAllTheWay(shouldNotifyFriend);
            this.clearRound(shouldNotifyFriend);
            this.startNextRound(shouldNotifyFriend);

            return
        }

        const actions: { [key: string]: () => void } = {
            ArrowLeft: () => this.currPiece.canMoveLeft() && this.currPiece.moveLeft(shouldNotifyFriend),
            ArrowRight: () => this.currPiece.canMoveRight() && this.currPiece.moveRight(shouldNotifyFriend),
            ArrowDown: () => this.currPiece.rotate(shouldNotifyFriend),
            ArrowUp: () => this.currPiece.canMoveUp() && this.currPiece.moveUp(shouldNotifyFriend)
        }

        actions[listener.code]?.()

        if (this.isPaused || !isNaN(this.keyPressInterval)) return

        let intervalTime: number;

        if (listener.code === 'ArrowLeft' || listener.code === 'ArrowRight') {
            intervalTime = 75
        } else if (listener.code === 'ArrowUp') {
            intervalTime = 600
        } else {
            return;  // If the key doesn't match, exit early
        }

        this.keyPressInterval = setTimeout(() => {
            this.keyPressInterval = setInterval(() => actions[listener.code]?.(), intervalTime)
        }, 100)

    }

    public moveFriend(prevCoor: [number, number][], newCoor: [number, number][], color: typeof COLORS[number]) {
        this.updateFriendArea(prevCoor, DEFAULT_COLOR)
        this.updateFriendArea(newCoor, color)
    }

    private updateFriendArea(coors: [number, number][], color: string) {
        coors.forEach(coor => colorBlock(coor[0], coor[1], color, this.friendArea as HTMLElement))
    }

}