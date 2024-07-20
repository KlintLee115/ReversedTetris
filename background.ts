const bgColors = ['rgb(255,255,255)', 'rgb(255,255,255)', 'rgb(255,255,255)']

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
    data: number[][]
    colors: string[]
    x: number
    y: number
}

interface BoardCell {
    data: number
    colors: string[]
}

class Tetris {

    posX: number
    posY: number
    width: number
    height: number
    bgCanvas: HTMLCanvasElement
    fgCanvas: HTMLCanvasElement
    bgCtx: CanvasRenderingContext2D
    fgCtx: CanvasRenderingContext2D
    curPiece: curPieceI
    board: BoardCell[][]
    lastMove: number
    curSpeed: number
    unitSize: number
    boardWidth: number
    boardHeight: number

    constructor(x = 0, y = 0, width = window.innerWidth, height = window.innerHeight) {
        this.posX = x
        this.posY = y
        this.width = width
        this.height = height
        this.bgCanvas = this.createCanvas()
        this.fgCanvas = this.createCanvas()
        this.bgCtx = this.bgCanvas.getContext('2d')!
        this.fgCtx = this.fgCanvas.getContext('2d')!
        this.curPiece = { data: [], colors: bgColors, x: 0, y: 0 }
        this.init()
    }

    createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas')
        canvas.width = this.width
        canvas.height = this.height
        canvas.style.left = `${this.posX}px`
        canvas.style.top = `${this.posY}px`
        document.body.appendChild(canvas)
        return canvas
    }

    init() {
        this.lastMove = Date.now()
        this.curSpeed = 50 + Math.random() * 50
        this.unitSize = 20

        this.boardWidth = Math.floor(this.width / this.unitSize)
        this.boardHeight = Math.floor(this.height / this.unitSize)

        this.board = this.createBoard()
        this.collapseBoard()

        this.checkLines()
        this.renderBoard()

        this.newTetromino()
        this.update()
    }

    createBoard(): BoardCell[][] {
        const board: BoardCell[][] = []
        for (let x = 0; x <= this.boardWidth; x++) {
            board[x] = []
            for (let y = 0; y <= this.boardHeight; y++) {
                board[x][y] = { data: 0, colors: bgColors }
                if (Math.random() > 0.15) {
                    board[x][y] = {
                        data: 1,
                        colors: tetrominos[Math.floor(Math.random() * tetrominos.length)].colors
                    }
                }
            }
        }
        return board
    }

    collapseBoard() {
        for (let x = 0; x <= this.boardWidth; x++) {
            for (let y = this.boardHeight; y >= 0; y--) {
                if (this.board[x][y].data === 0) {
                    for (let yy = y; yy > 0; yy--) {
                        if (this.board[x][yy - 1].data) {
                            this.board[x][yy].data = 1
                            this.board[x][yy].colors = this.board[x][yy - 1].colors
                            this.board[x][yy - 1].data = 0
                            this.board[x][yy - 1].colors = bgColors
                        }
                    }
                }
            }
        }
    }

    update() {
        if (!this.checkCanMoveUp(this.curPiece)) {
            if (this.curPiece.y === 0) return
            this.fillBoard(this.curPiece)
            this.newTetromino()
        } else {
            if (Date.now() > this.lastMove) {
                this.lastMove = Date.now() + this.curSpeed
                this.curPiece.y++
            }
        }

        this.render()
        requestAnimationFrame(this.update.bind(this))
    }

    renderBoard() {
        const { bgCtx, unitSize, board } = this
        for (let x = 0; x < this.boardWidth; x++) {
            for (let y = 0; y <= this.boardHeight; y++) {
                if (board[x][y].data !== 0) {
                    const bX = x * unitSize
                    const bY = window.innerHeight - (y * unitSize)
                    bgCtx.fillStyle = board[x][y].colors[0]
                    bgCtx.fillRect(bX, bY, unitSize, unitSize)
                    bgCtx.fillStyle = board[x][y].colors[1]
                    bgCtx.fillRect(bX + 2, bY + 2, unitSize - 4, unitSize - 4)
                    bgCtx.fillStyle = board[x][y].colors[2]
                    bgCtx.fillRect(bX + 4, bY + 4, unitSize - 8, unitSize - 8)
                }
            }
        }
    }

    // Render the current active piece
    render() {
        const { fgCtx, unitSize, curPiece } = this
        fgCtx.clearRect(0, 0, this.width, this.height)
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (curPiece.data![x][y] === 1) {
                    const xPos = (curPiece.x + x) * unitSize
                    const yPos = window.innerHeight - ((curPiece.y + y) * unitSize)
                    if (yPos > -1) {
                        this.renderCell(fgCtx, xPos, yPos, curPiece.colors, unitSize);
                    }
                }
            }
        }
    }

    renderCell(ctx: CanvasRenderingContext2D, x: number, y: number, colors: string[], size: number) {
        ctx.fillStyle = colors[0]
        ctx.fillRect(x, y, size, size)
        ctx.fillStyle = colors[1]
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4)
        ctx.fillStyle = colors[2]
        ctx.fillRect(x + 4, y + 4, size - 8, size - 8)
    }

    // Make sure we can move.
    checkCanMoveUp(curPiece: curPieceI) {
        const piece = curPiece.data
        const posX = curPiece.x
        const posY = curPiece.y
        const board = this.board

        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (piece![x][y] === 1) {

                    if (!board[posX + x]) {
                        board[posX + x] = []
                    }

                    if (!board[posX + x][y + posY + 1]) {
                        board[posX + x][y + posY + 1] = {
                            data: 0,
                            colors: bgColors,
                        }
                    }

                    if (board[posX + x][y + posY + 1].data == 1) return false
                }
            }
        }
        return true
    }

    // checks for completed lines and clears them
    checkLines() {
        const { board, boardWidth } = this

        // Iterate through each row from bottom to top
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            // Check if the current row is filled
            if (board.every(col => col[y].data === 1)) {
                // Shift all rows above the cleared row down
                for (let yy = y; yy > 0; yy--) {
                    for (let x = 0; x < boardWidth; x++) {
                        board[x][yy].data = board[x][yy - 1].data
                        board[x][yy].colors = board[x][yy - 1].colors
                    }
                }
                // Clear the top row after shifting
                for (let x = 0; x < boardWidth; x++) {
                    board[x][0].data = 0
                    board[x][0].colors = bgColors
                }
                // Increment y to recheck the same row after shifting
                y++
            }
        }
    }

    // adds the piece as part of the board
    fillBoard(curPiece: curPieceI) {
        const piece = curPiece.data
        const posX = curPiece.x
        const posY = curPiece.y
        const board = this.board

        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (piece![x][y] === 1) {
                    board[x + posX][y + posY].data = 1
                    board[x + posX][y + posY].colors = curPiece.colors
                }
            }
        }

        this.checkLines()
        this.renderBoard()
    }

    // Tetris class with optimized newTetromino method
    newTetromino() {
        const randomTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)]
        this.curPiece = {
            data: randomTetromino.data,
            colors: randomTetromino.colors,
            x: Math.floor(this.boardWidth / 2) - 2,
            y: 0
        }
    }
}

// Initialize multiple Tetris instances
const boardWidth = 20 * Math.round(window.innerWidth / 20)
const boards = 8
const bWidth = boardWidth / boards
const tetrisInstances = Array.from({ length: boards }, (_, w) => new Tetris(20 * Math.round((w * bWidth) / 20), 0, bWidth))