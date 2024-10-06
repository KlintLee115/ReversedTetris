import { Tetris } from "./Tetris";
import { UIService } from "../Services/UiService";
import { HIDDEN_ROWS, ROWS_DISPLAYABLE, COLORS, DEFAULT_COLOR, COLUMNS } from "../consts";

const COOR = {
    Row: 0,
    Col: 1
};

export abstract class Tetromino {

    private id: number;
    private static CURR_COLOR_IDX = 0;
    private playingArea: HTMLElement
    private _Tetris: Tetris

    protected centerCoor: [number, number];
    protected orientationIDX: number;

    public color: string;
    public coor: [number, number][];

    constructor(tetris: Tetris, newId: number, playingArea: HTMLElement) {

        this._Tetris = tetris
        this.color = COLORS[Tetromino.CURR_COLOR_IDX];
        this.id = newId;
        this.playingArea = playingArea

        this.centerCoor = [ROWS_DISPLAYABLE + HIDDEN_ROWS - 1, Math.floor(Math.random() * 7)];
        this.orientationIDX = Math.floor(Math.random() * this.GetOrientations().length);
        this.coor = this.GetOrientations()[this.orientationIDX]

        this.AdjustPiecePositionToBoundary();

        if (Tetromino.CURR_COLOR_IDX === COLORS.length - 1) Tetromino.CURR_COLOR_IDX = 0
        else Tetromino.CURR_COLOR_IDX++
    }

    public IsMoveIntoPlayingAreaSuccess(tetris: Tetris): boolean {
        while (this.coor.some(([row, _]) => row > tetris.rowsDisplayable)) {
            if (this.HasHitTop()) return false
            this.centerCoor[0]--
            this.coor = this.GetOrientations()[this.orientationIDX]
        }
        return true
    }

    protected abstract GetOrientations(): [number, number][][]

    SetId = (newId: number) => this.id = newId

    GetId = () => this.id

    private CanMove(newCoor: [number, number][]): boolean {
        return newCoor.every(([row, col]) => {
            const rowElement = this.playingArea.children.item(row) as HTMLElement
            const colElement = rowElement?.children.item(col) as HTMLElement
            return colElement && (col < COLUMNS) && (colElement.style.backgroundColor === DEFAULT_COLOR || parseInt(colElement.id) === this.id)
        });
    }

    async Rotate() {

        const newOrientationIdx = this.orientationIDX === this.GetOrientations().length - 1 ? 0 : this.orientationIDX + 1;

        const newCoor = this.GetOrientations()[newOrientationIdx];

        for (let moveUnit = 0; moveUnit < 4; moveUnit++) {
            const leftMove = newCoor.map(([row, col]) => [row, col - moveUnit] as [number, number]);
            const rightMove = newCoor.map(([row, col]) => [row, col + moveUnit] as [number, number]);

            if (this.CanMove(leftMove)) return this.ApplyRotation(-moveUnit, leftMove, newOrientationIdx);
            if (this.CanMove(rightMove)) return this.ApplyRotation(moveUnit, rightMove, newOrientationIdx);
        }
    }

    private async ApplyRotation(moveUnit: number, newCoor: [number, number][], newOrientationIdx: number) {

        for (let i = 0; i < Math.abs(moveUnit); i++) {
            if (moveUnit < 0) this.MoveLeft()
            else this.MoveRight()
        }

        const oldCoor = this.coor

        UIService.UncolorCoors(this.coor, this.playingArea)

        this.orientationIDX = newOrientationIdx;
        this.coor = newCoor;
        UIService.ColorArea(this.coor, this.GetId(), this.color, this.playingArea);

        const { Game } = await import('./GamePlayConfig')

        if (this._Tetris instanceof Game && this._Tetris.GameMode === "Friend") {
            const { notifyMovement } = await import('../Services/signalR/signalRSenders');
            notifyMovement(oldCoor, this.coor, this.color);
        }

        UIService.RemoveLandingCoors(this._Tetris.landingCoors, this._Tetris.playingArea);

        this._Tetris.updateLandingCoors()

        UIService.ColorLandingCoors(this._Tetris.landingCoors, this.color, this._Tetris.playingArea)
    }

    HasHitTop() {

        return this.coor.some(([row, col]) => {
            const rowAbove = this.playingArea.children.item(row - 1) as HTMLElement;
            const boxAbove = rowAbove?.children.item(col) as HTMLElement;
            return row === 0 || (boxAbove && ![DEFAULT_COLOR].includes(boxAbove.style.backgroundColor) && parseInt(boxAbove.id) !== this.id);
        })
    }

    CanMoveRight = () => this.CanMove(this.coor.map(([row, col]) => [row, col + 1] as [number, number]))

    CanMoveLeft = () => this.CanMove(this.coor.map(([row, col]) => [row, col - 1] as [number, number]))

    CanMoveUp = () => this.CanMove(this.coor.map(([row, col]) => [row - 1, col] as [number, number]));

    async ShiftCoor(rowOrCol: number, magnitude: number) {

        UIService.UncolorCoors(this.coor, this.playingArea)

        const oldCoor = this.coor

        this.centerCoor[rowOrCol === COOR.Row ? COOR.Row : COOR.Col] += magnitude;
        this.coor = this.GetOrientations()[this.orientationIDX]

        UIService.ColorArea(this.coor, this.GetId(), this.color, this.playingArea)

        const { Game } = await import('./GamePlayConfig')

        if (this._Tetris instanceof Game && this._Tetris.GameMode === "Friend") {
            const { notifyMovement } = await import('../Services/signalR/signalRSenders')

            notifyMovement(oldCoor, this.coor, this.color)
        }

        // reset landing coors only if action is not move up
        if (!(rowOrCol === 0 && magnitude === -1)) {
            UIService.RemoveLandingCoors(this._Tetris.landingCoors, this._Tetris.playingArea);
            this._Tetris.updateLandingCoors()
            UIService.ColorLandingCoors(this._Tetris.landingCoors, this.color, this._Tetris.playingArea)
        }
    }

    MoveRight = () => this.ShiftCoor(1, 1)

    MoveLeft = () => this.ShiftCoor(1, -1)

    MoveUp = () => this.ShiftCoor(0, -1)

    UpAllTheWay() {

        while (!this.HasHitTop()) this.MoveUp()
        this.coor = this.GetOrientations()[this.orientationIDX];
    }

    AdjustPiecePositionToBoundary() {

        this.coor.forEach(elementCoor => {

            if (elementCoor[1] > 7) this.centerCoor[1] -= elementCoor[1] - 7;

            if (elementCoor[1] < 0) this.centerCoor[1] -= elementCoor[1];
        })
        this.coor = this.GetOrientations()[this.orientationIDX];
    }
}

class I extends Tetromino {
    protected GetOrientations(): [number, number][][] {
        return [
            [[1, 0], [0, 0], [-1, 0], [-2, 0]],
            [[0, -1], [0, 0], [0, 1], [0, 2]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class J extends Tetromino {
    protected GetOrientations(): [number, number][][] {
        return [
            [[-1, 0], [0, 1], [0, 0], [0, 2]],
            [[0, 0], [0, 1], [2, 0], [1, 0]],
            [[0, -1], [0, 0], [0, 1], [1, 1]],
            [[0, -1], [0, 0], [-1, 0], [-2, 0]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class O extends Tetromino {
    protected GetOrientations(): [number, number][][] {
        return [
            [[0, 0], [-1, 0], [0, 1], [-1, 1]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class Z extends Tetromino {
    protected GetOrientations(): [number, number][][] {
        return [
            [[-1, -1], [-1, 0], [0, 0], [0, 1]],
            [[1, -1], [0, -1], [0, 0], [-1, 0]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class L extends Tetromino {
    protected GetOrientations(): [number, number][][] {
        return [
            [[-1, 0], [0, 0], [0, -1], [0, -2]],
            [[-2, 0], [-1, 0], [0, 0], [0, 1]],
            [[0, 0], [1, 0], [0, 1], [0, 2]],
            [[0, -1], [0, 0], [1, 0], [2, 0]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class S extends Tetromino {
    protected GetOrientations(): [number, number][][] {
        return [
            [[0, 0], [0, 1], [1, 0], [1, -1]],
            [[0, 1], [0, 0], [-1, 0], [1, 1]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

class T extends Tetromino {
    protected GetOrientations(): [number, number][][] {
        return [
            [[0, -1], [0, 1], [0, 0], [-1, 0]],
            [[-1, 0], [1, 0], [0, 0], [0, 1]],
            [[0, 1], [0, 0], [0, -1], [1, 0]],
            [[0, 0], [-1, 0], [1, 0], [0, -1]]
        ].map(orient => orient.map(([r, c]) => [this.centerCoor[0] + r, this.centerCoor[1] + c] as [number, number]));
    }
}

export { I, O, J, Z, L, S, T }