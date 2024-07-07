import { landingCoors, getLandingCoors, currPiece, setLandingCoors, playingArea, DEFAULT_COLOR } from "../game";
import { TetrisPiece } from "../TetrisPieces";

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

export function removeLandingCoors() {
    landingCoors.forEach(coor => {
        const box = playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement;

        while (box.firstChild) {
            box.removeChild(box.firstChild);
        }
    }
    )
}

export function resetLandingCoors() {

    removeLandingCoors()

    setLandingCoors(getLandingCoors(currPiece.getId(), currPiece.coor))

    landingCoors.forEach(coor => {
        const box = playingArea.children.item(coor[0])!.children.item(coor[1]) as HTMLElement

        const line1 = document.createElement('div');
        line1.style.position = 'absolute';
        line1.style.width = '2px'; // Line thickness
        line1.style.height = '100%';
        line1.style.backgroundColor = 'black'; // Line color
        line1.style.transform = 'rotate(45deg)';
        line1.style.top = '0';
        line1.style.left = '50%';

        // Create the second diagonal line
        const line2 = document.createElement('div');
        line2.style.position = 'absolute';
        line2.style.width = '2px'; // Line thickness
        line2.style.height = '100%';
        line2.style.backgroundColor = 'black'; // Line color
        line2.style.transform = 'rotate(-45deg)';
        line2.style.top = '0';
        line2.style.left = '50%';

        // Append lines to the box
        box.style.position = 'relative';
        box.appendChild(line1);
        box.appendChild(line2);
    })
}

export function uncolorCoors(coors: [number, number][]) {
    coors.forEach(coor => colorBlock(coor[0], coor[1], DEFAULT_COLOR))
}