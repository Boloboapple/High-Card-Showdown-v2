window.onload = function() {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const playOfflineBtn = document.getElementById('play-offline');
    const playOnlineBtn = document.getElementById('play-online');
    const playerScoreSpan = document.getElementById('player-score');
    const robotScoreSpan = document.getElementById('robot-score');
    const cardsLeftSpan = document.getElementById('cards-left');
    const playerCardDiv = document.getElementById('player-card');
    const robotCardDiv = document.getElementById('robot-card');
    const drawButton = document.getElementById('draw-button');
    const resetButton = document.getElementById('reset-button');
    const roundMessage = document.getElementById('round-message');

    // Game Variables
    let deck = [];
    let playerScore = 0;
    let robotScore = 0;
    const TOTAL_CARDS = 24;
    let isDrawing = false;

    // --- Screen Management ---
    function showScreen(screenToShow) {
        // Hide all screens first
        startScreen.classList.remove('active');
        gameScreen.classList.remove('active');

        // Then show the desired screen
        screenToShow.classList.add('active');
    }

    // --- Game Initialization ---
    function createDeck() {
        deck = [];
        for (let i = -11; i <= 11; i++) {
            deck.push(i);
        }
        deck.push(100);

        // Shuffle the deck (Fisher-Yates algorithm)
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function startGame() {
        createDeck();
        playerScore = 0;
        robotScore = 0;
        updateUI();
        showScreen(gameScreen); // Use the new screen management function
        
        drawButton.style.display = 'block'; // Make draw button visible
        resetButton.style.display = 'none'; // Keep reset button hidden until game ends

        roundMessage.textContent = '';
        playerCardDiv.textContent = '?';
        robotCardDiv.textContent = '?';
        playerCardDiv.className = 'card empty';
        robotCardDiv.className = 'card empty';
    }

    // --- Game Logic ---
function drawCards() {
    // If a draw is already in progress, exit the function immediately
    if (isDrawing) {
        console.log("Draw in progress, button is on cooldown.");
        return;
    }

    // Set flag to true and disable the button to start cooldown
    isDrawing = true;
    drawButton.disabled = true;
    console.log("Draw initiated. Button disabled.");

    // Check if deck has enough cards for two draws
    if (deck.length <= 1) {
        endGame();
        // Reset isDrawing and enable button if game ends immediately
        isDrawing = false;
        drawButton.disabled = false;
        return;
    }

    const playerCard = deck.pop();
    const robotCard = deck.pop();

    displayCard(playerCardDiv, playerCard);
    displayCard(robotCardDiv, robotCard);

    let message = '';
    let winner = null;

    if (playerCard > robotCard) {
        playerScore++;
        message = "You win this round!";
        winner = 'player';
    } else if (robotCard > playerCard) {
        robotScore++;
        message = "Robot wins this round!";
        winner = 'robot';
    } else {
        message = "It's a tie! No points awarded this round.";
    }

    roundMessage.textContent = message;
    roundMessage.classList.remove('winner', 'loser', 'tie');
    if (winner === 'player') {
        roundMessage.classList.add('winner');
    } else if (winner === 'robot') {
        roundMessage.classList.add('loser');
    } else {
        roundMessage.classList.add('tie');
    }

    updateUI();

    // After 1 second, enable the button again and reset the flag
    setTimeout(() => {
        isDrawing = false;
        // Only enable if the game hasn't ended already
        if (deck.length > 1) {
            drawButton.disabled = false;
            console.log("Cooldown finished. Button enabled.");
        } else {
            console.log("Cooldown finished, but game ended.");
        }
    }, 1000); // 1000 milliseconds = 1 second
}
            return; // Exit function after ending game
        }

        const playerCard = deck.pop();
        const robotCard = deck.pop();

        displayCard(playerCardDiv, playerCard);
        displayCard(robotCardDiv, robotCard);

        let message = '';
        let winner = null;

        if (playerCard > robotCard) {
            playerScore++;
            message = "You win this round!";
            winner = 'player';
        } else if (robotCard > playerCard) {
            robotScore++;
            message = "Robot wins this round!";
            winner = 'robot';
        } else {
            message = "It's a tie! No points awarded this round.";
        }

        roundMessage.textContent = message;
        roundMessage.classList.remove('winner', 'loser', 'tie');
        if (winner === 'player') {
            roundMessage.classList.add('winner');
        } else if (winner === 'robot') {
            roundMessage.classList.add('loser');
        } else {
            roundMessage.classList.add('tie');
        }

        updateUI();
    }

    function displayCard(cardElement, value) {
        cardElement.textContent = value;
        cardElement.classList.remove('empty', 'negative', 'positive', 'zero', 'mega');

        if (value === 100) {
            cardElement.classList.add('mega');
        } else if (value < 0) {
            cardElement.classList.add('negative');
        } else if (value > 0) {
            cardElement.classList.add('positive');
        } else if (value === 0) {
            cardElement.classList.add('zero');
        }
    }

    function updateUI() {
        playerScoreSpan.textContent = playerScore;
        robotScoreSpan.textContent = robotScore;
        cardsLeftSpan.textContent = deck.length;
    }

    function endGame() {
        drawButton.style.display = 'none'; // Hide draw button
        resetButton.style.display = 'block'; // Show reset button

        let finalMessage = "Game Over! ";
        if (playerScore > robotScore) {
            finalMessage += "You are the CHAMPION!";
            roundMessage.classList.add('winner');
        } else if (robotScore > playerScore) {
            finalMessage += "The Robot is the CHAMPION!";
            roundMessage.classList.add('loser');
        } else {
            finalMessage += "It's a DRAW!";
            roundMessage.classList.add('tie');
        }
        roundMessage.textContent = finalMessage;
    }

    // --- Event Listeners ---
    playOfflineBtn.addEventListener('click', startGame);
    drawButton.addEventListener('click', drawCards);
    resetButton.addEventListener('click', startGame); // Reset button also starts a new game

    // Initial setup
    showScreen(startScreen); // Show the start screen first
};
