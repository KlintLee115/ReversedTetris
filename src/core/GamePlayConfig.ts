import { Tetris } from './Tetris.ts'
import { COLORS, DEFAULT_COLOR, ROWS_DISPLAYABLE } from '../consts.js'
import { UIService } from '../Services/UiService.ts'

export type GameModeType = "Friend" | "Solo"

export class Game extends Tetris {
    private continueButton: HTMLElement
    private keyPressInterval: ReturnType<typeof setInterval>
    private currMusic: HTMLAudioElement
    private bgMusic1: HTMLAudioElement
    private bgMusic2: HTMLAudioElement

    public inGameListenerBound: (event: KeyboardEvent) => void;
    public GameMode: GameModeType
    public textStatus: HTMLElement
    public sideArea: HTMLElement | null = null
    public pauseScreen: HTMLElement

    constructor(mainArea: HTMLElement, pauseScreen: HTMLElement, continueButton: HTMLElement, textStatus: HTMLElement) {
        super(mainArea, 500, Math.floor(ROWS_DISPLAYABLE * 0.7))

        this.pauseScreen = pauseScreen
        this.continueButton = continueButton
        this.textStatus = textStatus
        this.keyPressInterval = NaN
        this.inGameListenerBound = this.inGameListener.bind(this);

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
            this.StartNextRound()
        }

        else {
            this.mainArea.style.justifyContent = "space-evenly"

            this.textStatus.style.display = "block";

            (async () => {

                const { startSignalRConnection } = await import('../Services/signalR/signalR.ts')
                const { joinRoom } = await import('../Services/signalR/signalRSenders.ts')

                const { shouldGameStart, setupSignalRSetupListeners } = await import('../Services/signalR/signalRPreGameListener.ts')
                const { setupSignalRGameListeners } = await import('../Services/signalR/signalRGameListener.ts')

                await startSignalRConnection()
                await setupSignalRSetupListeners(this)

                joinRoom(gameId as string)

                shouldGameStart(this).then(() => {
                    setupSignalRGameListeners(this)
                    this.setupPlayingArea()

                    this.textStatus.style.display = "none"
                    this.playingArea.style.display = "block"

                    this.StartNextRound()

                })
            })()
        }

        window.addEventListener('blur', this.handleBlur)
    }

    public handleBlur = async () => {
        if (this.GameMode === "Solo") return

        this.togglePause()

        const { notifyPause } = await import("../Services/signalR/signalRSenders.ts")

        notifyPause()
    }

    private createPlayingPanel() {
        const panel = document.createElement('div')
        panel.style.border = "3px solid white"
        panel.style.padding = "4px"
        UIService.AddRowsForSetup(this.rowsDisplayable, panel)
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
            const isPlayingArea = i === 0

            if (this.GameMode === "Friend") {
                const tetrisPanel = this.createPlayingPanel()
                const containerPanel = document.createElement('div')
                const heading = document.createElement('h2')
                heading.style.textAlign = 'center'

                if (isPlayingArea) {
                    heading.innerText = "Your area"
                    this.playingArea = tetrisPanel
                }
                else {
                    heading.innerText = "Friend's area"
                    this.sideArea = tetrisPanel
                }

                containerPanel.appendChild(heading)
                containerPanel.appendChild(tetrisPanel)

                this.mainArea.appendChild(containerPanel)
            }

            else if (isPlayingArea) {
                this.playingArea = this.createPlayingPanel()
                this.mainArea.appendChild(this.playingArea)
            }
            else {
                const { createLeaderboardPanel } = await import('../Services/LeaderboardService.ts')
                this.sideArea = createLeaderboardPanel()
                this.mainArea.appendChild(this.sideArea)
            }
        }

        window.addEventListener('keydown', this.inGameListenerBound)
        window.addEventListener('keyup', () => {
            if (!isNaN(this.keyPressInterval)) {
                clearInterval(this.keyPressInterval)
                this.keyPressInterval = NaN
            }
        })

        if (this.GameMode === "Friend") {

            this.continueButton.addEventListener('click', async () => {
                this.textStatus.innerText = "Waiting for friend"
                this.textStatus.style.display = "block"
                this.pauseScreen.style.display = "none"
                this.mainArea.style.display = "none"

                const { requestContinue } = await import("../Services/signalR/signalRSenders.ts")

                requestContinue()
            })
        }
    }

    public togglePause() {

        clearInterval(this.currInterval)
        window.removeEventListener('keydown', this.inGameListenerBound)

        this.currMusic.pause()

        this.pauseScreen.style.display = "block"
        this.textStatus.style.display = "none"
        this.mainArea.style.filter = "blur(10px)"

    }

    public toggleContinue() {

        window.addEventListener('keydown', this.inGameListenerBound)
        this.currMusic.play()
        this.textStatus.style.display = "none"
        this.mainArea.style.filter = "none"
        this.mainArea.style.display = "flex"
        this.pauseScreen.style.display = "none"

        this.StartIntervals()

    }

    private async inGameListener(listener: KeyboardEvent) {

        if (listener.code === 'Space') {
            this.currPiece.UpAllTheWay();
            this.ClearRound();
            this.StartNextRound();

            return
        }

        const actions: { [key: string]: () => void } = {
            ArrowLeft: () => this.currPiece.CanMoveLeft() && this.currPiece.MoveLeft(),
            ArrowRight: () => this.currPiece.CanMoveRight() && this.currPiece.MoveRight(),
            ArrowDown: () => this.currPiece.Rotate(),
            ArrowUp: () => this.currPiece.CanMoveUp() && this.currPiece.MoveUp(),
        }

        actions[listener.code]?.()

        if (!isNaN(this.keyPressInterval)) return

        let intervalTime

        if (["ArrowLeft", "ArrowRight"].includes(listener.code)) intervalTime = 75
        else if (listener.code === "ArrowUp") intervalTime = 600
        else return

        this.keyPressInterval = setTimeout(() => {
            this.keyPressInterval = setInterval(() => actions[listener.code]?.(), intervalTime)
        }, 100)

    }

    public moveFriend(prevCoor: [number, number][], newCoor: [number, number][], color: typeof COLORS[number]) {
        this.updateFriendArea(prevCoor, DEFAULT_COLOR)
        this.updateFriendArea(newCoor, color)
    }

    private updateFriendArea(coors: [number, number][], color: string) {
        coors.forEach(coor => UIService.ColorBlock(coor[0], coor[1], color, this.sideArea as HTMLElement))
    }

}