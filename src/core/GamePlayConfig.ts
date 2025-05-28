import { Tetris } from './Tetris.ts'
import { COLORS, DEFAULT_COLOR, ROWS_DISPLAYABLE } from '../consts.js'
import { UIService } from '../Services/UiService.ts'

export type GameModeType = "Friend" | "Solo"

export class Game extends Tetris {
    private continueButton: HTMLElement
    private keyPressInterval: number | NodeJS.Timeout
    private currMusic!: HTMLAudioElement
    private bgMusic1!: HTMLAudioElement
    private bgMusic2!: HTMLAudioElement

    public inGameListenerBound: (event: KeyboardEvent) => void
    public GameMode: GameModeType
    public textStatus: HTMLElement
    public sideArea: HTMLElement | null = null
    public pauseScreen: HTMLElement

    constructor(mainArea: HTMLElement, pauseScreen: HTMLElement, continueButton: HTMLElement, textStatus: HTMLElement) {
        super(mainArea, 500, Math.floor(ROWS_DISPLAYABLE * 0.8))

        this.pauseScreen = pauseScreen
        this.continueButton = continueButton
        this.textStatus = textStatus
        this.keyPressInterval = NaN
        this.inGameListenerBound = this.inGameListener.bind(this);

        this.initializeMusic()
        this.GameMode = this.getGameMode()

        const urlParams = new URLSearchParams(window.location.search)
        const gameId = urlParams.get('id')

        this.GameMode = gameId === null ? "Solo" : "Friend"

        if (this.GameMode === "Solo") this.setupSoloMode()
        else this.setupFriendMode(gameId as string)

        window.addEventListener('blur', this.handleBlur)
    }

    private initializeMusic() {
        this.bgMusic1 = document.getElementById('backgroundMusic1') as HTMLAudioElement
        this.bgMusic2 = document.getElementById('backgroundMusic2') as HTMLAudioElement
        this.loopMusic()
        this.currMusic = this.bgMusic1
    }

    private loopMusic() {
        this.bgMusic1.addEventListener('ended', () => this.bgMusic2.play())
        this.bgMusic2.addEventListener('ended', () => this.bgMusic1.play())
    }

    private getGameMode(): GameModeType {
        const gameId = new URLSearchParams(window.location.search).get('id');
        return gameId ? "Friend" : "Solo"
    }

    private setupSoloMode() {
        this.mainArea.style.justifyContent = "center";
        this.mainArea.style.gap = "5vw";
        this.setupPlayingArea();
        this.playingArea.style.display = "block";
        this.StartNextRound();
    }

    private async setupFriendMode(gameId: string) {
        this.mainArea.style.justifyContent = "space-evenly"

        this.textStatus.style.display = "block";

        const { startWebSocketConnection, joinRoom, setupWebSocketSetupListeners, shouldGameStart, setupWebSocketGameListeners } = await this.importSignalRServices()

        await startWebSocketConnection()
        setupWebSocketSetupListeners(this)

        joinRoom(gameId)

        shouldGameStart(this).then(() => {
            setupWebSocketGameListeners(this)
            this.setupPlayingArea()

            this.textStatus.style.display = "none"
            this.playingArea.style.display = "block"

            this.StartNextRound()
        })
    }

    public handleBlur = async () => {
        if (this.GameMode === "Solo") return

        this.togglePause()

        const { notifyPause } = await import("../Services/ws/wsSenders.ts")

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

        this.bgMusic1.addEventListener('ended', () => (this.currMusic = this.bgMusic2).play())
        this.bgMusic2.addEventListener('ended', () => (this.currMusic = this.bgMusic1).play())

        this.currMusic.play()

        for (let i = 0; i < 2; i++) {
            const isPlayingArea = i === 0

            if (this.GameMode === "Friend") {
                const tetrisPanel = this.createPlayingPanel()
                const containerPanel = document.createElement('div')
                const heading = document.createElement('h2')
                heading.style.textAlign = 'center'
                heading.innerText = isPlayingArea ? "Your area" : "Friend's area"

                if (isPlayingArea) this.playingArea = tetrisPanel
                else this.sideArea = tetrisPanel

                containerPanel.append(heading, tetrisPanel)
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
            clearInterval(this.keyPressInterval)
            this.keyPressInterval = NaN
        })

        if (this.GameMode === "Friend") {
            this.continueButton.addEventListener('click', this.handleContinueButtonClick)
        }
    }

    private handleContinueButtonClick = async () => {
        this.textStatus.innerText = "Waiting for friend";
        this.textStatus.style.display = "block";
        this.pauseScreen.style.display = "none";
        this.mainArea.style.display = "none";

        const { requestContinue } = await import("../Services/ws/wsSenders.ts");
        requestContinue();
    };

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
            this.currTetromino.UpAllTheWay();
            this.ClearRound();
            this.StartNextRound();

            return
        }

        const actions: { [key: string]: () => void } = {
            ArrowLeft: () => this.currTetromino.CanMoveLeft() && this.currTetromino.MoveLeft(),
            ArrowRight: () => this.currTetromino.CanMoveRight() && this.currTetromino.MoveRight(),
            ArrowDown: () => this.currTetromino.Rotate(),
            ArrowUp: () => this.currTetromino.CanMoveUp() && this.currTetromino.MoveUp(),
        }

        actions[listener.code]?.()

        if (!isNaN(this.keyPressInterval as number) || !["ArrowLeft", "ArrowRight", "ArrowUp"].includes(listener.code)) return

        const intervalTime = listener.code === "ArrowUp" ? 600 : 75

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

    private async importSignalRServices() {
        return Promise.all([
            import('../Services/ws/websocket.ts'),
            import('../Services/ws/wsSenders.ts'),
            import('../Services/ws/wsGameSetupListener.ts'),
            import('../Services/ws/wsGameListener.ts')
        ]).then(([signalR, signalRSenders, signalRPreGame, signalRGame]) => ({
            ...signalR,
            ...signalRSenders,
            ...signalRPreGame,
            ...signalRGame
        }))
    }

}
