import { Tetris } from "../core/Tetris.js"
import { ROWS_DISPLAYABLE } from "../consts.js"
import { UIService } from "../Services/UiService.js"

export class HomeBackgroundConfig extends Tetris {

    private customSetup() {
        this.setupPlayingArea()

        this.playingArea.style.display = "block"
        this.StartNextRound()
    }

    constructor(mainArea: HTMLElement) {
        super(mainArea, 50, ROWS_DISPLAYABLE)

        this.customSetup()
    }

    override setupPlayingArea() {

        const panel = document.createElement('div')
        panel.style.border = "1px solid white"
        panel.style.padding = "4px"

        this.playingArea = panel

        UIService.AddRowsForSetup(ROWS_DISPLAYABLE, panel)

        this.mainArea.appendChild(panel)
    }
}