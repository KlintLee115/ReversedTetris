import { Tetris } from "../core/Tetris.js"
import { ROWS_DISPLAYABLE } from "../utils/consts.js"

export class HomeBackgroundConfig extends Tetris {

    private customSetup() {
        this.setupPlayingArea()

        this.playingArea.style.display = "block"
        this.startNextRound(false)
    }

    constructor(mainArea: HTMLElement) {
        super(mainArea, 50, ROWS_DISPLAYABLE, false)

        this.customSetup()
    }

    override setupPlayingArea() {

        const panel = document.createElement('div')
        panel.style.border = "1px solid white"
        panel.style.padding = "4px"

        this.playingArea = panel

        this.addRowsForSetup(panel)

        this.mainArea.appendChild(panel)
    }
}