'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GAMER = 'GAMER'
const GLUE = 'GLUE'
const GAMER_IMG = '<img src="img/gamer.png">'
const BALL_IMG = '<img src="img/ball.png">'
const GLUE_IMG = '<img src="img/mud.png">'
var gBallsCollected
var gBallsRemaining
var gBallTimer
var gGlueTimer
var gGlueTimeout
var isTimerStarted
var popSound
// Model:
var gBoard
var gGamerPos

function onInitGame() {
    gGamerPos = { i: 2, j: 9 }
    gBoard = buildBoard()
    gBallsRemaining = 2
    gBallsCollected = 0
    startTimers()
    renderBoard(gBoard)
}

function buildBoard() {
    // DONE: Create the Matrix 10 * 12 
    // DONE: Put FLOOR everywhere and WALL at edges

    const board = []
    const rowsCount = 10
    const colsCount = 12
    for (var i = 0; i < rowsCount; i++) {
        board.push([])
        for (var j = 0; j < colsCount; j++) {
            board[i][j] = { type: FLOOR, gameElement: null }
            if (i === 0 || i === rowsCount - 1 ||
                j === 0 || j === colsCount - 1) {
                board[i][j].type = WALL
            }
        }
    }

    // DONE: Place the gamer and two balls
    console.log(board)
    board[gGamerPos.i][gGamerPos.j].gameElement = GAMER
    board[5][5].gameElement = BALL
    board[7][2].gameElement = BALL
    board[0][5].type = board[5][0].type = board[9][5].type = board[5][11].type = FLOOR
    board[0][5].gameElement = board[5][0].gameElement = board[9][5].gameElement = board[5][11].gameElement = null
    return board
}

// Render the board to an HTML table
function renderBoard(board) {

    const elBoard = document.querySelector('.board')
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n'
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            var cellClass = getClassName({ i, j })
            // console.log('cellClass:', cellClass)

            if (currCell.type === FLOOR) cellClass += ' floor'
            else if (currCell.type === WALL) cellClass += ' wall'

            strHTML += `\t<td class="cell ${cellClass}" onclick="moveTo(${i},${j})" >\n`

            if (currCell.gameElement === GAMER) {
                strHTML += GAMER_IMG
            } else if (currCell.gameElement === BALL) {
                strHTML += BALL_IMG
            }

            strHTML += '\t</td>\n'
        }
        strHTML += '</tr>\n'
    }
    // console.log(strHTML)
    elBoard.innerHTML = strHTML
}

// Move the player to a specific location
function moveTo(i, j) {
    if (gGlueTimeout) return
    if (inSecretPassage(i, j)) return

    const targetCell = gBoard[i][j]
    if (targetCell.type === WALL || gBallsRemaining <= 0) return

    // Calculate distance to make sure we are moving to a neighbor cell
    const iAbsDiff = Math.abs(i - gGamerPos.i)
    const jAbsDiff = Math.abs(j - gGamerPos.j)
    var elBallCountSpan = document.querySelector('.ball-count span')
    // If the clicked Cell is one of the four allowed (up, right, down, left)
    // if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0)) {
    if (iAbsDiff + jAbsDiff === 1) {
        if (targetCell.gameElement === BALL) {
            console.log('Collecting!')
            gBallsCollected++
            elBallCountSpan.innerText = gBallsCollected
            gBallsRemaining--
            onTouchBallAudio()
        }
        else if (targetCell.gameElement === GLUE) {
            console.log('Stuck!')
            gGlueTimeout = setTimeout(() => {
                gGlueTimeout = false
            }, 3000)
            onTouchGlue()
        }

        // DONE: Move the gamer
        // REMOVE FROM
        // MODEL
        gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
        // DOM
        renderCell(gGamerPos, '')

        // ADD TO
        // MODEL

        gGamerPos.i = i
        gGamerPos.j = j
        gBoard[i][j].gameElement = GAMER
        // DOM
        renderCell(gGamerPos, GAMER_IMG)
        countNeighbouringBalls()
        if (gBallsRemaining === 0) {
            stopTimers()
            alert('Victory!')
            onShowRestart()
            console.log('Good job one eyed green dude')
        }
    } else {
        console.log('TOO FAR', iAbsDiff, jAbsDiff)
    }

}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
    const cellSelector = '.' + getClassName(location)
    const elCell = document.querySelector(cellSelector)
    elCell.innerHTML = value

}

// Move the player by keyboard arrows
function onHandleKey(event) {
    const i = gGamerPos.i
    const j = gGamerPos.j

    switch (event.key) {
        case 'ArrowLeft':
            moveTo(i, j - 1)
            break
        case 'ArrowRight':
            moveTo(i, j + 1)
            break
        case 'ArrowUp':
            moveTo(i - 1, j)
            break
        case 'ArrowDown':
            moveTo(i + 1, j)
            break
    }
}

// Returns the class name for a specific cell
function getClassName(location) {
    return `cell-${location.i}-${location.j}`
}

function onTouchBallAudio() {
    playSound('ball')
}

function playSound(filename) {
    if (popSound) {
        popSound.pause()
        popSound.currentTime = 0
    }
    popSound = new Audio(`mp3/${filename}.mp3`);
    popSound.play()
}

function placeRandomBall() {
    var cell = getRandomEmptyCell()
    gBoard[cell.i][cell.j].gameElement = BALL
    gBallsRemaining++
    renderCell(cell, BALL_IMG)
    countNeighbouringBalls()
}

function countNeighbouringBalls() {
    // function countNeighbors(cellI, cellJ, mat) {
    var neighborsCount = 0
    const cellI = gGamerPos.i
    const cellJ = gGamerPos.j
    var elNeighborSpan = document.querySelector('.neighbor-balls span')

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue
            if (gBoard[i][j].gameElement === 'BALL') neighborsCount++
            elNeighborSpan.innerText = neighborsCount
        }
    }
    return neighborsCount
}

function getRandomEmptyCell() {
    var emptyCells = findEmptyCells()

    const randEmptyCellIdx = getRandomInt(0, emptyCells.length)
    const cell = emptyCells[randEmptyCellIdx]
    return cell
}

function findEmptyCells() {
    var emptyCells = []
    for (var i = 1; i < gBoard.length - 1; i++) {
        for (var j = 1; j < gBoard[0].length - 1; j++) {
            if (gBoard[i][j].type === 'FLOOR' &&
                gBoard[i][j].gameElement === null) {

                const cell = { i: i, j: j }
                emptyCells.push(cell)
            }
        }
    }
    return emptyCells
}

// function sumOfBallsOnStart() {
//     gBallsRemaining = Number(0)
//     for (var i = 0; i < gBoard.length; i++) {
//         for (var j = 0; j < gBoard[0].length; j++) {
//             if (gBoard[i][j].gameElement === 'BALL') {
//                 gBallsRemaining++
//             }
//         }
//     }   
//     console.log(gBallsRemaining) 
// }

function placeRandomGlue() {
    var cell = getRandomEmptyCell()
    const currCell = gBoard[cell.i][cell.j]
    currCell.gameElement = GLUE
    renderCell(cell, GLUE_IMG)
    console.log('glue added')
    setTimeout(() => {
        currCell.gameElement = GAMER
    }, 3000)

}

function startTimers() {
    startRndBallTimer()
    startRndGlueTimer()
    // startRndGlueTimer()
}

function startRndBallTimer() {
    // if (isTimerStarted) return
    // var startTime = Date.now()
    gBallTimer = setInterval(() => {
        placeRandomBall()
    }, 3000);
}

function startRndGlueTimer() {
    // if (isTimerStarted) return
    // var startTime = Date.now()
    gGlueTimer = setInterval(() => {
        placeRandomGlue()
    }, 5000);
}

function stopTimers() {
    stopRndBallTimer()
    stopRndGlueTimer()
    // stopRndGlueTimer() 
}

function stopRndBallTimer() {
    clearInterval(gBallTimer)
    // isTimerStarted = false
}

function stopRndGlueTimer() {
    clearInterval(gGlueTimer)
    // isTimerStarted = false
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function inSecretPassage(targeti, targetj) {
    var teleporti = targeti
    var teleportj = targetj
    if (targeti === -1 && targetj === 5) {
        teleporti = 9;
    } else if (targeti === 10 && targetj === 5) {
        teleporti = 0;
    } else if (targeti === 5 && targetj === -1) {
        teleportj = 11;
    } else if (targeti === 5 && targetj === 12) {
        teleportj = 0;
    }

    if (teleporti === targeti && teleportj === targetj) return false
    else {
        gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
        // DOM
        renderCell(gGamerPos, '')

        // ADD TO
        // MODEL

        gGamerPos.i = teleporti
        gGamerPos.j = teleportj
        gBoard[i][j].gameElement = GAMER
        // DOM
        renderCell(gGamerPos, GAMER_IMG)
        countNeighbouringBalls()
        return true
    }
}

function onTouchGlue() {
    playSound('glue')
}

function onShowRestart() {
    var elRestartBtn = document.querySelector('.restart')
    elRestartBtn.style.display = 'inline'
}

function onHideRestart() {
    var elRestartBtn = document.querySelector('.restart')
    elRestartBtn.style.display = 'none'
}

function onRestart() {
    onHideRestart()
    onInitGame()

}
