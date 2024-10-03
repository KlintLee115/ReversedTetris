import { darken, lighten } from "polished"
import { BORDER_DEFAULT_COLOR, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS } from "../consts"

export class UIService {
    public static AddRowsForSetup(rowsDisplayable: number, panel: HTMLElement) {
        for (let row = 0; row <= rowsDisplayable + HIDDEN_ROWS; row++) {
            const rowOfBoxes = document.createElement('div')
            rowOfBoxes.style.display = "flex"
            rowOfBoxes.style.justifyContent = "center"
            if (row > rowsDisplayable) rowOfBoxes.style.display = "none"

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
    }

    public static UpdateCompletedRowsColors(areaToClear: HTMLElement, completedRows: number[], rowsDisplayable: number) {
        completedRows.forEach((upperBoundRow, idx) => {
            const lowerBoundRow = idx === completedRows.length - 1 ? rowsDisplayable - 1 : completedRows[idx + 1] - 1
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

    public static ToggleGameContinueUI(textStatus: HTMLElement, mainArea: HTMLElement, pauseScreen: HTMLElement) {
        textStatus.style.display = "none"
        mainArea.style.filter = "none"
        mainArea.style.display = "flex"
        pauseScreen.style.display = "none"
    }

    public static ToggleGamePauseUI(textStatus: HTMLElement, mainArea: HTMLElement, pauseScreen: HTMLElement) {
        pauseScreen.style.display = "block"
        textStatus.style.display = "none"
        mainArea.style.filter = "blur(10px)"
    }

    public static ToggleWaitingForFriendUI(textStatus: HTMLElement, mainArea: HTMLElement, pauseScreen: HTMLElement) {
        textStatus.innerText = "Waiting for friend"
        textStatus.style.display = "block"
        pauseScreen.style.display = "none"
        mainArea.style.display = "none"
    }

    public static DecorateGamePlayingPanel(panel: HTMLElement) {
        panel.style.border = "3px solid white"
        panel.style.padding = "4px"
    }

    public static ColorBlock(rowNumber: number, colNumber: number, color: string, playingArea: HTMLElement) {

        const row = playingArea.children.item(rowNumber) as HTMLElement
        const box = row.children.item(colNumber) as HTMLElement;
        box.style.backgroundColor = color === DEFAULT_COLOR ? DEFAULT_COLOR : darken(0.05, color)
    
        box.style.borderColor = color === DEFAULT_COLOR ? BORDER_DEFAULT_COLOR : lighten(0.1, color)
    }

    public static ColorArea(coor: [number, number][], coorId: number, color: string, area: HTMLElement) {
        coor.forEach(element => {
    
            let rowCoor = element[0]
            let colCoor = element[1]
    
            UIService.ColorBlock(rowCoor, colCoor, color, area);
            (area.children[rowCoor].children[colCoor] as HTMLElement).id = coorId.toString()
        })
    }

    public static RemoveLandingCoors(landingCoors: [number, number][], playingArea: HTMLElement) {
        landingCoors.forEach(coor => {
            const box = playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement;
            box.style.borderColor = BORDER_DEFAULT_COLOR
        }
        )
    }

    public static ColorLandingCoors(landingCoors: [number, number][], color: string, playingArea: HTMLElement) {

        landingCoors.forEach(coor => {
            const box = playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement
            box.style.borderColor = lighten(0.25, color)
        })
    }

    public static UncolorCoors(coors: [number, number][], playingArea: HTMLElement) {
        coors.forEach(coor => UIService.ColorBlock(coor[0], coor[1], DEFAULT_COLOR, playingArea))
    }
}