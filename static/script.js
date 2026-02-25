document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const statusElement = document.getElementById('status');
    const resetBtn = document.getElementById('reset-btn');
    const difficultyBtns = document.querySelectorAll('#difficulty .mode-btn');
    const playerModeBtns = document.querySelectorAll('#player-mode .mode-btn');
    const difficultyGroup = document.getElementById('difficulty-group');

    let board = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let difficulty = 'impossible';
    let pmode = 'ai'; // 'ai' or 'pvp'
    let currentPlayer = 'O'; // Human/P1 starts

    const HUMAN = 'O';
    const AI = 'X';

    const winsElement = document.getElementById('wins');
    const lossesElement = document.getElementById('losses');
    const drawsElement = document.getElementById('draws');

    // Fetch initial scores
    fetchScores();

    async function fetchScores() {
        try {
            const response = await fetch('/scores');
            const data = await response.json();
            winsElement.textContent = data.wins;
            lossesElement.textContent = data.losses;
            drawsElement.textContent = data.draws;
        } catch (error) {
            console.error("Error fetching scores:", error);
        }
    }

    async function recordResult(winner) {
        if (pmode !== 'ai') return; // Only record stats in AI mode
        try {
            await fetch('/record-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ winner: winner })
            });
            fetchScores();
        } catch (error) {
            console.error("Error recording result:", error);
        }
    }


    // Handle difficulty selection
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (board.every(cell => cell === '')) {
                difficultyBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                difficulty = btn.getAttribute('data-mode');
            }
        });
    });

    // Handle player mode selection
    playerModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (board.every(cell => cell === '')) {
                playerModeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                pmode = btn.getAttribute('data-pmode');

                if (pmode === 'pvp') {
                    difficultyGroup.style.display = 'none';
                    statusElement.textContent = "Player 1's Turn (O)";
                } else {
                    difficultyGroup.style.display = 'flex';
                    statusElement.textContent = "Your Turn (O)";
                }
            }
        });
    });

    // Handle cell clicks
    cells.forEach(cell => {
        cell.addEventListener('click', () => handleCellClick(cell));
    });

    resetBtn.addEventListener('click', resetGame);

    async function handleCellClick(cell) {
        const index = cell.getAttribute('data-index');

        if (board[index] !== '' || !gameActive) return;

        if (pmode === 'pvp') {
            // PvP Logic
            makeMove(index, currentPlayer);
            const winner = checkLocalWinner(board);
            if (winner) {
                endGame(winner);
            } else {
                currentPlayer = currentPlayer === 'O' ? 'X' : 'O';
                statusElement.textContent = `Player ${currentPlayer === 'O' ? '1' : '2'}'s Turn (${currentPlayer})`;
            }
        } else {
            // Player move
            makeMove(index, HUMAN);

            // Check winner locally before asking AI
            const localWinner = checkLocalWinner(board);
            if (localWinner) {
                endGame(localWinner);
                return;
            }

            // AI's turn
            statusElement.textContent = "AI is thinking...";
            statusElement.style.color = "var(--secondary)";

            try {
                const response = await fetch('/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ board: board, difficulty: difficulty })
                });

                const data = await response.json();

                if (data.move !== null) {
                    makeMove(data.move, AI);
                }

                if (data.winner) {
                    endGame(data.winner);
                } else {
                    statusElement.textContent = "Your Turn (O)";
                    statusElement.style.color = "var(--primary)";
                }
            } catch (error) {
                console.error("Error fetching AI move:", error);
                statusElement.textContent = "Error: Backend not reachable";
                statusElement.style.color = "var(--accent)";
            }
        }
    }

    function makeMove(index, player) {
        board[index] = player;
        const cell = cells[index];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
        cell.classList.add('taken');
    }

    function endGame(winner) {
        gameActive = false;
        recordResult(winner);

        if (winner === 'Draw') {

            statusElement.textContent = "It's a Draw!";
            statusElement.style.color = "var(--text-muted)";
        } else {
            if (pmode === 'pvp') {
                statusElement.textContent = `Player ${winner === 'O' ? '1' : '2'} Wins! (${winner})`;
            } else {
                statusElement.textContent = winner === AI ? "AI Wins! (X)" : "You Win! (O)";
            }
            statusElement.style.color = winner === AI ? "var(--accent)" : "var(--primary)";
        }
    }

    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'O';
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        if (pmode === 'pvp') {
            statusElement.textContent = "Player 1's Turn (O)";
        } else {
            statusElement.textContent = "Your Turn (O)";
        }
        statusElement.style.color = "var(--primary)";
    }

    // Basic local check to avoid unnecessary API calls if human wins
    function checkLocalWinner(b) {
        const win_combinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let combo of win_combinations) {
            if (b[combo[0]] && b[combo[0]] === b[combo[1]] && b[combo[0]] === b[combo[2]]) {
                return b[combo[0]];
            }
        }
        if (!b.includes('')) return 'Draw';
        return null;
    }
});
