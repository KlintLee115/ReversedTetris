import { Tetris } from "../lib/Tetris.js"
import { I, O, J, T, L, S, Z } from "../TetrisPieces.js"
import { colorPlayingArea } from "../utility/colors.js"
import { ROWS_DISPLAYABLE, HIDDEN_ROWS, COLUMNS, DEFAULT_COLOR, BORDER_DEFAULT_COLOR } from "../utility/consts.js"

export type GameModeType = "Friend" | "Solo"

export const TETRIS_PIECES = [I, O, J, T, L, S, Z]

export class BackgroundGame extends Tetris {

    private customSetup() {
        this.setupPlayingArea()

        this.playingArea.style.display = "block"
        this.startNextRound()
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

        for (let row = 0; row < ROWS_DISPLAYABLE + HIDDEN_ROWS; row++) {
            const rowOfBoxes = document.createElement('div')
            rowOfBoxes.style.display = "flex"
            rowOfBoxes.style.justifyContent = "center"
            if (row > ROWS_DISPLAYABLE) {
                rowOfBoxes.style.display = "none"
            }

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

    override movePieceIntoPlayingArea() {
        while (this.currPiece.coor.some(coor => coor[0] > ROWS_DISPLAYABLE)) {
            if (this.currPiece.hitTop()) {
                this.hasLost = true
                clearInterval(this.currInterval)

                break
            }
            else this.currPiece.moveUp()
        }
        colorPlayingArea(this.currPiece, this.currPiece.color, this.playingArea)
    }

    override newPiece() {
        return new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](this, this.currPieceID, this.playingArea, "Solo")
    }
}