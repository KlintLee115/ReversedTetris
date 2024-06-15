import { DEFAULT_COLOR, LANDING_COLOR, playingArea, resetLandingCoors } from "./main";
import { COLORS } from "./utility/colors";

const COOR = {
    Row: 0,
    Col: 1
};

export abstract class TetrisPiece {

    private id: number;
    private static CURR_COLOR_IDX = 0;

    protected centerCoor: [number, number];
    protected orientationIDX: number;

    public color: string;
    public coor: [number, number][];

    constructor(newId: number) {
        this.color = COLORS[TetrisPiece.CURR_COLOR_IDX];
        this.id = newId;
        this.centerCoor = [21, Math.floor(Math.random() * 7)];
        this.orientationIDX = Math.floor(Math.random() * this.getOrientations().length);
        this.coor = this.getOrientations()[this.orientationIDX];
        this.adjustPiecePositionToBoundary();

        if (TetrisPiece.CURR_COLOR_IDX === COLORS.length - 1) TetrisPiece.CURR_COLOR_IDX = 0
        else TetrisPiece.CURR_COLOR_IDX++
    }

    protected abstract getOrientations(): [number, number][][]

    setId = (newId: number) => this.id = newId

    getId = () => this.id

    private canMove(newCoor: [number, number][]): boolean {
        return newCoor.every(([row, col]) => {
            const rowElement = playingArea.children.item(row) as HTMLElement
            const colElement = rowElement?.children.item(col) as HTMLElement
            return colElement && (colElement.style.backgroundColor === DEFAULT_COLOR || parseInt(colElement.id) === this.id)
        });
    }

    rotate() {

        const newOrientationIdx = this.orientationIDX === this.getOrientations().length - 1 ? 0 : this.orientationIDX + 1;

        const newCoor = this.getOrientations()[newOrientationIdx];

        if (this.canMove(newCoor)) {
            this.orientationIDX = newOrientationIdx;
            this.coor = newCoor;
            resetLandingCoors();
        }
    }

    hitTop() {
        return this.coor.some(([row, col]) => {
            const rowAbove = playingArea.children.item(row - 1) as HTMLElement;
            const boxAbove = rowAbove?.children.item(col) as HTMLElement;
            return row === 0 || (boxAbove && ![DEFAULT_COLOR, LANDING_COLOR].includes(boxAbove.style.backgroundColor) && parseInt(boxAbove.id) !== this.id);
        });
    }

    canMoveRight = () => this.canMove(this.coor.map(([row, col]) => [row, col + 1] as [number, number]))

    canMoveLeft = () => this.canMove(this.coor.map(([row, col]) => [row, col - 1] as [number, number]))

    canMoveUp = () => this.canMove(this.coor.map(([row, col]) => [row - 1, col] as [number, number]));

    shiftCoor(rowOrCol: number, magnitude: number) {
        this.centerCoor[rowOrCol === COOR.Row ? COOR.Row : COOR.Col] += magnitude;
        this.coor = this.getOrientations()[this.orientationIDX];

        // reset landing coors only if action is not move up
        if (!(rowOrCol == 0 && magnitude == -1)) resetLandingCoors()
    }

    moveRight = () => this.shiftCoor(1, 1)

    moveLeft = () => this.shiftCoor(1, -1)

    moveUp = () => this.shiftCoor(0, -1);

    upAllTheWay() {
        while (!this.hitTop()) this.moveUp();
        this.coor = this.getOrientations()[this.orientationIDX];
    }

    adjustPiecePositionToBoundary() {
        this.coor.forEach((elementCoor) => {

            if (elementCoor[1] > 7) this.centerCoor[1] -= elementCoor[1] - 7;

            if (elementCoor[1] < 0) this.centerCoor[1] -= elementCoor[1];
            if (elementCoor[0] > 21) this.centerCoor[0] -= elementCoor[0] - 21;
        });
        this.coor = this.getOrientations()[this.orientationIDX];
    }
}

class I extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [
            [[1, 0], [0, 0], [-1, 0], [-2, 0]],
            [[0, -1], [0, 0], [0, 1], [0, 2]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class J extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [
            [[-1, 0], [0, 1], [0, 0], [0, 2]],
            [[0, 0], [0, 1], [2, 0], [1, 0]],
            [[0, -1], [0, 0], [0, 1], [1, 1]],
            [[0, -1], [0, 0], [-1, 0], [-2, 0]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class O extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [
            [[0, 0], [-1, 0], [0, 1], [-1, 1]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class Z extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [
            [[-1, -1], [-1, 0], [0, 0], [0, 1]],
            [[1, -1], [0, -1], [0, 0], [-1, 0]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class L extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [
            [[-1, 0], [0, 0], [0, -1], [0, -2]],
            [[-2, 0], [-1, 0], [0, 0], [0, 1]],
            [[0, 0], [1, 0], [0, 1], [0, 2]],
            [[0, -1], [0, 0], [1, 0], [2, 0]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class S extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [
            [[0, 0], [0, 1], [1, 0], [1, -1]],
            [[0, 1], [0, 0], [-1, 0], [1, 1]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class T extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [
            [[0, -1], [0, 1], [0, 0], [-1, 0]],
            [[-1, 0], [1, 0], [0, 0], [0, 1]],
            [[0, 1], [0, 0], [0, -1], [1, 0]],
            [[0, 0], [-1, 0], [1, 0], [0, -1]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

export { I, O, J, Z, L, S, T }
