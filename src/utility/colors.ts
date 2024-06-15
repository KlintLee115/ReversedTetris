import { landingCoors, getLandingCoors, currPiece, setLandingCoors, playingArea, LANDING_COLOR, DEFAULT_COLOR } from "../main";
import { TetrisPiece } from "../TetrisPieces";

export const COLORS = ["indigo", "green", "red", "blue", "purple"]

export function colorBlock(row: number, col: number, color: string): void {
    (playingArea.children!.item(row)!.children.item(col) as HTMLElement).style.backgroundColor = color
}

export function colorPlayingArea(pieceForCoor: TetrisPiece, color: string) {
    pieceForCoor.coor.forEach(element => {

        let rowCoor = element[0]
        let colCoor = element[1]

        colorBlock(rowCoor, colCoor, color);
        (playingArea.children[rowCoor].children[colCoor] as HTMLElement).id = pieceForCoor.getId().toString()
    })
}

export function colorLandingCoors() {
    setLandingCoors(getLandingCoors(currPiece.getId(), currPiece.coor))

    landingCoors.forEach(coor => {
        const [row, col] = coor;

        (playingArea.children!.item(row)!.children.item(col) as HTMLElement).style.backgroundColor = LANDING_COLOR
    })
}

export function uncolorCoors(coors: [number, number][]) {
    coors.forEach(coor => colorBlock(coor[0], coor[1], DEFAULT_COLOR))
}