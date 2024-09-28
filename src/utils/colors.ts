import { darken, lighten } from "polished";
import { TetrisPiece } from "../TetrisPieces";
import { BORDER_DEFAULT_COLOR, DEFAULT_COLOR } from "./consts"
import { Tetris } from "../core/Tetris";

export function colorBlock(rowNumber: number, colNumber: number, color: string, playingArea: HTMLElement) {


    const row = playingArea.children.item(rowNumber) as HTMLElement
    const box = row.children.item(colNumber) as HTMLElement;
    box.style.backgroundColor = color === DEFAULT_COLOR ? DEFAULT_COLOR : darken(0.05, color)

    box.style.borderColor = color === DEFAULT_COLOR ? BORDER_DEFAULT_COLOR : lighten(0.1, color)
}

export function colorArea(pieceForCoor: TetrisPiece, color: string, area: HTMLElement) {
    pieceForCoor.coor.forEach(element => {

        let rowCoor = element[0]
        let colCoor = element[1]

        colorBlock(rowCoor, colCoor, color, area);
        (area.children[rowCoor].children[colCoor] as HTMLElement).id = pieceForCoor.getId().toString()
    })
}

export function removeLandingCoors(game: Tetris) {
    game.landingCoors.forEach(coor => {
        const box = game.playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement;
        box.style.borderColor = BORDER_DEFAULT_COLOR
    }
    )
}

export function makeLandingCoors(game: Tetris) {

    game.setLandingCoors(game.getLandingCoors(game.currPiece.getId(), game.currPiece.coor))
    const color = game.currPiece.color

    game.landingCoors.forEach(coor => {
        const box = game.playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement
        box.style.borderColor = lighten(0.25, color)
    })
}

export function uncolorCoors(coors: [number, number][], playingArea: HTMLElement) {
    coors.forEach(coor => colorBlock(coor[0], coor[1], DEFAULT_COLOR, playingArea))
}