const COLORS = ["blue", "red", "purple", "green", "indigo"];

const COOR = {
    Row: 0,
    Col: 1
};

export abstract class TetrisPiece {

    protected color: string;
    protected id: number;
    protected centerCoor: [number, number];
    protected orientationIDX: number;
    protected coor: [number, number][];

    constructor(newId: number) {
        this.color = COLORS[Math.floor(Math.random() * 5)];
        this.id = newId;
        this.centerCoor = [21, Math.floor(Math.random() * 7)];
        this.orientationIDX = Math.floor(Math.random() * this.getOrientations().length);
        this.coor = this.getOrientations()[this.orientationIDX];
        this.adjustPiecePositionToBoundary();
    }

    protected abstract getOrientations(): [number, number][][];

    setId = (newId: number) => this.id = newId;

    getId = () => this.id;

    getCoor = () => this.coor;

    getColor = () => this.color;

    rotate(playingArea: any) {

        const newOrientationIdx = this.orientationIDX === this.getOrientations().length - 1 ? 0 : this.orientationIDX + 1;

        const newCoor = this.getOrientations()[newOrientationIdx];

        let canRotate = true;

        for (const pieceCoor of newCoor) {
            const boardRow = playingArea.children.item(pieceCoor[0]);

            if (!boardRow) {
                canRotate = false;
                break;
            }

            const boardCoor = boardRow.children.item(pieceCoor[1]);

            if (!boardCoor || (boardCoor.style.backgroundColor !== "white" && parseInt(boardCoor.id) !== this.id)) {
                canRotate = false;
                break;
            }
        }

        if (canRotate) {
            this.orientationIDX = newOrientationIdx;
            this.coor = newCoor;
        }
    }

    hitTop(playingArea: any) {
        const coors = this.getCoor();

        for (let i = 0; i < coors.length; i++) {
            const [row, col] = coors[i];
            const rowAbove = playingArea.children.item(row - 1);

            if (!rowAbove) return true;

            if (rowAbove.children.item(col).style.backgroundColor !== 'white' && parseInt(rowAbove.children.item(col).id) !== this.getId()) {
                return true;
            }
        }
        return false;
    }

    canMoveRight(playingArea: any) {

        return this.getCoor().every((item) => {
            const pieceRight = playingArea.children.item(item[0]).children.item(item[1] + 1);

            return pieceRight && ((parseInt(pieceRight.id) === this.id) || pieceRight.style.backgroundColor === 'white');
        });
    }

    canMoveLeft(playingArea: any) {
        return this.getCoor().every((item) => {
            const pieceLeft = playingArea.children.item(item[0]).children.item(item[1] - 1);

            return pieceLeft && ((parseInt(pieceLeft.id) === this.id) || pieceLeft.style.backgroundColor === 'white');
        });
    }

    canMoveUp(playingArea: any) {
        return this.getCoor().every((item) => {
            const rowAbove = playingArea.children.item(item[0] - 1);

            if (!rowAbove) return false;
            const pieceAbove = rowAbove.children.item(item[1]);

            return rowAbove && ((parseInt(pieceAbove.id) === this.id) || pieceAbove.style.backgroundColor === 'white');
        });
    }

    shiftCoor(rowOrCol: number, magnitude: number) {
        this.centerCoor[rowOrCol === COOR.Row ? COOR.Row : COOR.Col] += magnitude;
        this.coor = this.getOrientations()[this.orientationIDX];
    }

    moveRight = () => this.shiftCoor(1, 1);

    moveLeft = () => this.shiftCoor(1, -1);

    moveUp = () => this.shiftCoor(0, -1);

    upAllTheWay(playingArea: any) {
        while (!this.hitTop(playingArea)) this.moveUp();
        this.coor = this.getOrientations()[this.orientationIDX];
    }

    adjustPiecePositionToBoundary() {
        this.getCoor().forEach((elementCoor) => {

            if (elementCoor[1] > 7) this.centerCoor[1] -= elementCoor[1] - 7;

            if (elementCoor[1] < 0) this.centerCoor[1] -= elementCoor[1];
            if (elementCoor[0] > 21) this.centerCoor[0] -= elementCoor[0] - 21;
        });
        this.coor = this.getOrientations()[this.orientationIDX];
    }
}

class I extends TetrisPiece {

    protected getOrientations(): [number, number][][] {

        // vertical
        const zeroDegCoor: [number, number][] = [[this.centerCoor[0] + 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0] - 2, this.centerCoor[1]]]

        //horizontal
        const ninetyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0], this.centerCoor[1] + 2]]

        return [zeroDegCoor, ninetyDegCoor]
    }
}

class J extends TetrisPiece {

    protected getOrientations(): [number, number][][] {
        const zeroDegCoor: [number, number][] = [[this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 2]]
        const ninetyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0] + 2, this.centerCoor[1]], [this.centerCoor[0] + 1, this.centerCoor[1]]]
        const oneEightyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0] + 1, this.centerCoor[1] + 1]]
        const twoSeventyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0] - 2, this.centerCoor[1]]]
        return [zeroDegCoor, ninetyDegCoor, oneEightyDegCoor, twoSeventyDegCoor]
    }
}
class O extends TetrisPiece {
    protected getOrientations(): [number, number][][] {
        return [[[this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0] - 1, this.centerCoor[1] + 1]]]
    }

}
class Z extends TetrisPiece {

    protected getOrientations(): [number, number][][] {
        const zeroDegCoor: [number, number][] = [[this.centerCoor[0] - 1, this.centerCoor[1] - 1], [this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1]]
        const ninetyDegCoor: [number, number][] = [[this.centerCoor[0] + 1, this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]]]
        return [zeroDegCoor, ninetyDegCoor]
    }
}
class L extends TetrisPiece {

    protected getOrientations() {
        const zeroDegCoor: [number, number][] = [[this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1] - 2]]
        const ninetyDegCoor: [number, number][] = [[this.centerCoor[0] - 2, this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1]]
        const oneEightyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] + 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0], this.centerCoor[1] + 2]]
        const twoSeventyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] + 1, this.centerCoor[1]], [this.centerCoor[0] + 2, this.centerCoor[1]]]

        return [zeroDegCoor, ninetyDegCoor, oneEightyDegCoor, twoSeventyDegCoor]
    }
}
class S extends TetrisPiece {

    protected getOrientations() {
        const zeroDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0] + 1, this.centerCoor[1]], [this.centerCoor[0] + 1, this.centerCoor[1] - 1]]
        const ninetyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0] + 1, this.centerCoor[1] + 1]]

        return [zeroDegCoor, ninetyDegCoor]
    }
}

class T extends TetrisPiece {

    protected getOrientations() {
        const zeroDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]]]
        const ninetyDegCoor: [number, number][] = [[this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0] + 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] + 1]]
        const oneEightyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1] + 1], [this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] - 1], [this.centerCoor[0] + 1, this.centerCoor[1]]]
        const twoSeventyDegCoor: [number, number][] = [[this.centerCoor[0], this.centerCoor[1]], [this.centerCoor[0] - 1, this.centerCoor[1]], [this.centerCoor[0] + 1, this.centerCoor[1]], [this.centerCoor[0], this.centerCoor[1] - 1]]

        return [zeroDegCoor, ninetyDegCoor, oneEightyDegCoor, twoSeventyDegCoor]
    }
}

export { I, O, J, Z, L, S, T }
