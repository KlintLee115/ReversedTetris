import { Tetris } from "../core/Tetris";

const scoreList = document.createElement('ul');
let currLowestHighScore: number

export function createLeaderboardPanel() {
    const panel = document.createElement('div')
    panel.style.display = "flex"
    panel.style.flexDirection = "column"
    panel.style.justifyContent = "start"

    const panelContent = document.createElement('div')
    panelContent.style.border = "3px solid white"
    panelContent.style.paddingInline = "20px"

    const title = document.createElement('h2')
    title.innerHTML = "High scores"

    panelContent.appendChild(title);
    panelContent.appendChild(scoreList); // Append the score list
    panel.appendChild(panelContent);

    if (localStorage.getItem('topScores') === null) localStorage.setItem('topScores', JSON.stringify([0,0,0,0,0]))

    displayScores(scoreList); // Call the function to display the scores initially

    currLowestHighScore = Math.min(...getScores())
    return panel;
}

export function getScores(): number[] {
    return JSON.parse(localStorage.getItem('topScores')!)
}

function displayScores(scoreList: HTMLUListElement) {

    scoreList.innerHTML = ''; // Clear current list
    const scores = getScores();

    for (let i = 0; i < 5; i++) {
        let score
        if (i >= scores.length) score = 0
        else score = scores[i]

        const scoreItem = document.createElement('div');
        scoreItem.innerHTML = `${i + 1}. ${score}`;
        scoreList.appendChild(scoreItem);
    }
}

export function updateScoreIfHigher(game: Tetris) {

    if (game.currScore > currLowestHighScore) {

        const scores = getScores()

        const lowestIndex = getScores().indexOf(currLowestHighScore);

        // Replace the lowest score with the new score
        if (lowestIndex !== -1) {
            scores[lowestIndex] = game.currScore;
        } 
        
        // Sort the scores in descending order and keep top 5
        scores.sort((a, b) => b - a);

        // Store updated scores back to localStorage
        localStorage.setItem('topScores', JSON.stringify(scores));

        currLowestHighScore = game.currScore

        displayScores(scoreList);

    }
}
