import { Tetris } from './Tetris.ts'
import { COLORS, DEFAULT_COLOR, ROWS_DISPLAYABLE } from '../utils/consts.js'
import { colorBlock } from '../utils/colors.ts'
import { notifyPause } from '../utils/signalRSenders.ts'

export type GameModeType = "Friend" | "Solo"

const LOCAL_ROWS_DISPLAYABLE = Math.floor(ROWS_DISPLAYABLE * 0.9)

export class Game extends Tetris {

    private isPaused = false
    private continueButton: HTMLElement
    private keyPressInterval: ReturnType<typeof setInterval>
    private currMusic: HTMLAudioElement
    private bgMusic1: HTMLAudioElement
    private bgMusic2: HTMLAudioElement

    public GameMode: GameModeType
    public waitingForFriendStatus: HTMLElement
    public waitingForFriendCountdown: HTMLElement
    public sideArea: HTMLElement | null = null
    public pauseScreen: HTMLElement
    public hasWon = false

    constructor(mainArea: HTMLElement, pauseScreen: HTMLElement, continueButton: HTMLElement, waitingForFriendStatus: HTMLElement, waitingForFriendCountdown: HTMLElement) {
        super(mainArea, 500, LOCAL_ROWS_DISPLAYABLE)

        this.pauseScreen = pauseScreen
        this.continueButton = continueButton
        this.waitingForFriendStatus = waitingForFriendStatus
        this.waitingForFriendCountdown = waitingForFriendCountdown
        this.keyPressInterval = NaN

        this.bgMusic1 = document.getElementById('backgroundMusic1') as HTMLAudioElement
        this.bgMusic2 = document.getElementById('backgroundMusic2') as HTMLAudioElement
        this.bgMusic1.addEventListener('ended', () => this.bgMusic2.play())
        this.bgMusic2.addEventListener('ended', () => this.bgMusic1.play())

        this.currMusic = this.bgMusic1

        const urlParams = new URLSearchParams(window.location.search)
        const gameId = urlParams.get('id')

        this.GameMode = gameId === null ? "Solo" : "Friend"

        if (this.GameMode === "Solo") {
            this.mainArea.style.justifyContent = "center"
            this.mainArea.style.gap = "5vw"
            this.setupPlayingArea()

            this.playingArea.style.display = "block"
            this.startNextRound()
        }

        else {
            this.mainArea.style.justifyContent = "space-evenly"

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

                    this.startNextRound()
                })
            })()
        }

        // window.onblur = async () => {

        //     if (this.GameMode === "Solo") return

        //     this.togglePause()

        //     const { notifyPause } = await import("../utils/signalRSenders.ts")

        //     notifyPause()
        // }
    }

    private createPlayingPanel() {
        const panel = document.createElement('div')
        panel.style.border = "3px solid white"
        panel.style.padding = "4px"
        this.addRowsForSetup(panel)
        return panel
    }

    override async setupPlayingArea() {

        this.bgMusic1.addEventListener('ended', () => {
            this.currMusic = this.bgMusic2
            this.bgMusic2.play()
        })
        this.bgMusic2.addEventListener('ended', () => {
            this.currMusic = this.bgMusic1
            this.bgMusic1.play()
        })

        this.currMusic.play()

        for (let i = 0; i < 2; i++) {

            if (this.GameMode === "Friend") {
                const panel = this.createPlayingPanel()
                this.mainArea.appendChild(panel)
                if (i === 0) this.playingArea = panel
                else this.sideArea = panel
            }

            else {
                if (i === 0) {
                    this.playingArea = this.createPlayingPanel()
                    this.mainArea.appendChild(this.playingArea)
                }
                else {

                    const {createLeaderboardPanel} = await import('../utils/leaderboard.ts')

                    this.sideArea = createLeaderboardPanel()
                    this.mainArea.appendChild(this.sideArea)
                }
            }
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
        this.currMusic.pause()

        if (this.hasWon || this.hasLost) return

        this.pauseScreen.style.display = "block"
        this.waitingForFriendStatus.style.display = "none"
        this.mainArea.style.filter = "blur(10px)"

        this.isPaused = true

    }

    public toggleContinue() {

        this.currMusic.play()
        this.isPaused = false
        this.waitingForFriendStatus.style.display = "none"
        this.mainArea.style.filter = "none"
        this.mainArea.style.display = "flex"
        this.pauseScreen.style.display = "none"

        this.startIntervals()

    }

    private async inGameListener(listener: KeyboardEvent) {

        if (this.hasLost || this.hasWon) return

        if (listener.code === 'Space') {
            this.currPiece.upAllTheWay();
            this.clearRound();
            this.startNextRound();

            return
        }

        const actions: { [key: string]: () => void } = {
            ArrowLeft: () => this.currPiece.canMoveLeft() && this.currPiece.moveLeft(),
            ArrowRight: () => this.currPiece.canMoveRight() && this.currPiece.moveRight(),
            ArrowDown: () => this.currPiece.rotate(),
            ArrowUp: () => this.currPiece.canMoveUp() && this.currPiece.moveUp(),
            Enter: () => {
                notifyPause()
                this.togglePause()
            }
        }

        actions[listener.code]?.()

        if (this.isPaused || !isNaN(this.keyPressInterval)) return

        const intervalTime = (listener.code === 'ArrowLeft' || listener.code === 'ArrowRight') ? 75 : listener.code === 'ArrowUp' ? 600 : undefined
        if (!intervalTime) return

        this.keyPressInterval = setTimeout(() => {
            this.keyPressInterval = setInterval(() => actions[listener.code]?.(), intervalTime)
        }, 100)

    }

    public moveFriend(prevCoor: [number, number][], newCoor: [number, number][], color: typeof COLORS[number]) {
        this.updateFriendArea(prevCoor, DEFAULT_COLOR)
        this.updateFriendArea(newCoor, color)
    }

    private updateFriendArea(coors: [number, number][], color: string) {
        coors.forEach(coor => colorBlock(coor[0], coor[1], color, this.sideArea as HTMLElement))
    }

}