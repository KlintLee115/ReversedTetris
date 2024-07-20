import { landingCoors, getLandingCoors, currPiece, setLandingCoors, playingArea } from "../game";
import { TetrisPiece } from "../TetrisPieces";
import { BORDER_DEFAULT_COLOR, DEFAULT_COLOR } from "./consts";

export function colorBlock(row: number, col: number, color: string) {

    const box = playingArea.children!.item(row)!.children.item(col) as HTMLElement;
    box.style.backgroundColor = color;
    box.style.borderColor = BORDER_DEFAULT_COLOR
}

export function colorPlayingArea(pieceForCoor: TetrisPiece, color: string) {
    pieceForCoor.coor.forEach(element => {

        let rowCoor = element[0]
        let colCoor = element[1]

        colorBlock(rowCoor, colCoor, color);
        (playingArea.children[rowCoor].children[colCoor] as HTMLElement).id = pieceForCoor.getId().toString()
    })
}

export function removeLandingCoors() {
    landingCoors.forEach(coor => {
        const box = playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement;
        box.style.borderColor = BORDER_DEFAULT_COLOR
    }
    )
}

export function resetLandingCoors() {

    removeLandingCoors()

    setLandingCoors(getLandingCoors(currPiece.getId(), currPiece.coor))
    const color = currPiece.color

    landingCoors.forEach(coor => {
        const box = playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement
        box.style.borderColor = color
    })
}

export function uncolorCoors(coors: [number, number][]) {
    coors.forEach(coor => colorBlock(coor[0], coor[1], DEFAULT_COLOR))
}