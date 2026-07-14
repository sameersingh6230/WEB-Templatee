let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameActive = true;

const statusDisplay = document.getElementById("status");
const cells = document.querySelectorAll(".cell");
const resetBtn = document.getElementById("reset-btn");

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute("data-index"));

    if (boardState[clickedCellIndex] !== "" || !isGameActive) return;

    updateCell(clickedCell, clickedCellIndex);
    checkForResults();
}

function updateCell(cell, index) {
    boardState[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer);
}

function handlePlayerChange() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
}

function checkForResults() {
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (boardState[a] === "" || boardState[b] === "" || boardState[c] === "") continue;
        
        if (boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.textContent = `Player ${currentPlayer} Wins! 🎉`;
        isGameActive = false;
        return;
    }

    if (!boardState.includes("")) {
        statusDisplay.textContent = "It's a Tie! 🤝";
        isGameActive = false;
        return;
    }

    handlePlayerChange();
}

function resetGame() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    isGameActive = true;
    statusDisplay.textContent = "Player X's turn";
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("X", "O");
    });
}

cells.forEach(cell => cell.addEventListener("click", handleCellClick));
resetBtn.addEventListener("click", resetGame);