const tetrominos = [
    { colors: ['rgb(59,84,165)', 'rgb(118,137,196)', 'rgb(79,111,182)'], data: [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]] },
    { colors: ['rgb(214,30,60)', 'rgb(241,108,107)', 'rgb(236,42,75)'], data: [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]] },
    { colors: ['rgb(88,178,71)', 'rgb(150,204,110)', 'rgb(115,191,68)'], data: [[0, 0, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 0]] },
    { colors: ['rgb(62,170,212)', 'rgb(120,205,244)', 'rgb(54,192,240)'], data: [[0, 0, 0, 0], [0, 1, 1, 1], [0, 0, 1, 0], [0, 0, 0, 0]] },
    { colors: ['rgb(236,94,36)', 'rgb(234,154,84)', 'rgb(228,126,37)'], data: [[0, 0, 0, 0], [0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0]] },
    { colors: ['rgb(220,159,39)', 'rgb(246,197,100)', 'rgb(242,181,42)'], data: [[0, 0, 1, 0], [0, 0, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]] },
    { colors: ['rgb(158,35,126)', 'rgb(193,111,173)', 'rgb(179,63,151)'], data: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]] }
]

interface curPieceI {
    data: null | [number, number, number, number][],
    colors: number[],
    x: number,
    y: number,
}

function Tetris(x = 0, y = 0, width = window.innerWidth, height = window.innerHeight) {
    this.posX = x;
    this.posY = y;
    this.width = width;
    this.height = height;
    this.bgCanvas = document.createElement('canvas')
    this.fgCanvas = document.createElement('canvas')

    this.bgCanvas.width = this.fgCanvas.width = this.width
    this.bgCanvas.height = this.fgCanvas.height = this.height

    this.bgCanvas.style.left = this.posX + 'px';
    this.bgCanvas.style.top = this.posY + 'px';

    this.fgCanvas.style.left = this.posX + 'px';
    this.fgCanvas.style.top = this.posY + 'px';

    document.body.appendChild(this.bgCanvas);
    document.body.appendChild(this.fgCanvas);
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.fgCtx = this.fgCanvas.getContext('2d');
    this.curPiece = {
        data: null,
        colors: [0, 0, 0],
        x: 0,
        y: 0,
    };
    this.init()
}


Tetris.prototype.init = function () {

    this.lastMove = Date.now()
    this.curSpeed = 50 + Math.random() * 50
    this.unitSize = 20

    // init the board
    this.board = []
    this.boardWidth = Math.floor(this.width / this.unitSize)
    this.boardHeight = Math.floor(this.height / this.unitSize)

    const board = this.board
    const boardWidth = this.boardWidth
    const boardHeight = this.boardHeight

    // init board
    for (let x = 0; x <= boardWidth; x++) {
        board[x] = [];
        for (let y = 0; y <= boardHeight; y++) {

            board[x][y] = {
                data: 0,
                colors: ['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)']
            };

            if (Math.random() > 0.15) {

                board[x][y] = {
                    data: 1,
                    colors: tetrominos[Math.floor(Math.random() * tetrominos.length)].colors
                }
            }
        }
    }

    // collapse the board a bit
    for (let x = 0; x <= boardWidth; x++) {
        for (let y = boardHeight; y >= 0; y--) {

            if (board[x][y].data === 0) {
                for (let yy = y; yy > 0; yy--) {
                    if (board[x][yy - 1].data) {

                        board[x][yy].data = 1;
                        board[x][yy].colors = board[x][yy - 1].colors;

                        board[x][yy - 1].data = 0;
                        board[x][yy - 1].colors = ['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)'];
                    }
                }
            }
        }
    }


    // render the board
    this.checkLines();
    this.renderBoard();

    // assign the first tetri
    this.newTetromino();
    this.update();
};

Tetris.prototype.update = function () {
    if (!this.checkCanMoveUp(this.curPiece)) {
        if (this.curPiece.y === 0) return
        this.fillBoard(this.curPiece);
        this.newTetromino();
    } else {
        if (Date.now() > this.lastMove) {
            this.lastMove = Date.now() + this.curSpeed;
            this.curPiece.y++;
        }
    }

    this.render();
    requestAnimationFrame(this.update.bind(this));
}

Tetris.prototype.renderBoard = function () {
    const { bgCtx, unitSize, board, boardWidth, boardHeight } = this;
    for (let x = 0; x < boardWidth; x++) {
        for (let y = 0; y <= boardHeight; y++) {
            if (board[x][y].data !== 0) {
                const bX = x * unitSize;
                const bY = window.innerHeight - (y * unitSize);
                bgCtx.fillStyle = board[x][y].colors[0];
                bgCtx.fillRect(bX, bY, unitSize, unitSize);
                bgCtx.fillStyle = board[x][y].colors[1];
                bgCtx.fillRect(bX + 2, bY + 2, unitSize - 4, unitSize - 4);
                bgCtx.fillStyle = board[x][y].colors[2];
                bgCtx.fillRect(bX + 4, bY + 4, unitSize - 8, unitSize - 8);
            }
        }
    }
}

// Render the current active piece
Tetris.prototype.render = function () {
    const { fgCtx, unitSize, curPiece } = this;
    fgCtx.clearRect(0, 0, this.width, this.height);
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            if (curPiece.data[x][y] === 1) {
                const xPos = (curPiece.x + x) * unitSize;
                const yPos = window.innerHeight - ((curPiece.y + y) * unitSize)
                if (yPos > -1) {
                    fgCtx.fillStyle = curPiece.colors[0];
                    fgCtx.fillRect(xPos, yPos, unitSize, unitSize);
                    fgCtx.fillStyle = curPiece.colors[1];
                    fgCtx.fillRect(xPos + 2, yPos + 2, unitSize - 4, unitSize - 4);
                    fgCtx.fillStyle = curPiece.colors[2];
                    fgCtx.fillRect(xPos + 4, yPos + 4, unitSize - 8, unitSize - 8);
                }
            }
        }
    }
}

// Make sure we can move.
Tetris.prototype.checkCanMoveUp = function (curPiece: curPieceI) {
    const piece = curPiece.data
    const posX = curPiece.x
    const posY = curPiece.y
    const board = this.board

    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (piece![x][y] === 1) {

                if (!board[posX + x]) {
                    board[posX + x] = []
                }

                if (!board[posX + x][y + posY + 1]) {
                    board[posX + x][y + posY + 1] = {
                        data: 0
                    }
                }

                if (board[posX + x][y + posY + 1].data == 1) return false
            }
        }
    }
    return true
};

// checks for completed lines and clears them
Tetris.prototype.checkLines = function () {
    const { board, boardWidth, boardHeight } = this;

    // Iterate through each row from bottom to top
    for (let y = boardHeight - 1; y >= 0; y--) {
        // Check if the current row is filled
        if (board.every(col => col[y].data === 1)) {
            // Shift all rows above the cleared row down
            for (let yy = y; yy > 0; yy--) {
                for (let x = 0; x < boardWidth; x++) {
                    board[x][yy].data = board[x][yy - 1].data;
                    board[x][yy].colors = board[x][yy - 1].colors;
                }
            }
            // Clear the top row after shifting
            for (let x = 0; x < boardWidth; x++) {
                board[x][0].data = 0;
                board[x][0].colors = ['rgb(0,0,0)', 'rgb(0,0,0)', 'rgb(0,0,0)'];
            }
            // Increment y to recheck the same row after shifting
            y++;
        }
    }
}

// adds the piece as part of the board
Tetris.prototype.fillBoard = function (curPiece: curPieceI) {
    var piece = curPiece.data,
        posX = curPiece.x,
        posY = curPiece.y,
        board = this.board;

    for (var x = 0; x < 4; x++) {
        for (var y = 0; y < 4; y++) {
            if (piece![x][y] === 1) {
                board[x + posX][y + posY].data = 1;
                board[x + posX][y + posY].colors = curPiece.colors;
            }
        }
    }

    this.checkLines()
    this.renderBoard()
};

// Tetris class with optimized newTetromino method
Tetris.prototype.newTetromino = function () {
    const { data, colors } = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    const curPiece = this.curPiece;

    curPiece.data = data;
    curPiece.colors = colors;
    curPiece.x = Math.floor(Math.random() * (this.boardWidth - data.length + 1));
    curPiece.y = 0;
};

// Initialize multiple Tetris instances
const boardWidth = 20 * Math.round(window.innerWidth / 20);
const boards = 8;
const bWidth = boardWidth / boards;
const tetrisInstances = Array.from({ length: boards }, (_, w) => new Tetris(20 * Math.round((w * bWidth) / 20), 0, bWidth))