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
let isDrawing = false; // Prevents spamming draw action

// --- Screen Management ---
function showScreen(screenToShow) {
    // Hide all screens first
    if (startScreen) startScreen.classList.remove('active');
    if (gameScreen) gameScreen.classList.remove('active');

    // Then show the desired screen
    if (screenToShow) screenToShow.classList.add('active');
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
    
    if (drawButton) drawButton.style.display = 'block'; // Make draw button visible
    if (resetButton) resetButton.style.display = 'none'; // Keep reset button hidden until game ends

    if (roundMessage) roundMessage.textContent = '';
    
    // Ensure initial card state is empty to allow first animation
    if (playerCardDiv) {
        playerCardDiv.textContent = '?';
        playerCardDiv.className = 'card empty';
    }
    if (robotCardDiv) {
        robotCardDiv.textContent = '?';
        robotCardDiv.className = 'card empty';
    }
}

// --- Game Logic ---
function drawCards() {
    // If a draw is already in progress, exit the function immediately
    if (isDrawing) {
        return;
    }

    // Set flag to true and disable the button to start cooldown
    isDrawing = true;
    if (drawButton) drawButton.disabled = true;

    // Check if deck has enough cards for two draws
    if (deck.length <= 1) {
        endGame();
        // Reset isDrawing and enable button if game ends immediately
        isDrawing = false;
        if (drawButton) drawButton.disabled = false;
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

    if (roundMessage) {
        roundMessage.textContent = message;
        roundMessage.classList.remove('winner', 'loser', 'tie');
        if (winner === 'player') {
            roundMessage.classList.add('winner');
        } else if (winner === 'robot') {
            roundMessage.classList.add('loser');
        } else {
            roundMessage.classList.add('tie');
        }
    }

    updateUI();

    // After 1 second, enable the button again and reset the flag
    setTimeout(() => {
        isDrawing = false;
        // Only enable if the game hasn't ended already
        if (deck.length > 1 && drawButton) {
            drawButton.disabled = false;
        }
    }, 1000); // 1000 milliseconds = 1 second
}

function displayCard(cardElement, value) {
    if (!cardElement) return; // Add a check here as well

    // Temporarily remove content and classes to ensure animation re-triggers
    cardElement.textContent = '';
    cardElement.className = 'card empty'; // Reset to empty state

    // Force a reflow/re-render to apply the reset
    // This is a common trick to make CSS animations play from the start every time
    void cardElement.offsetWidth;

    // Now set the new value and classes
    cardElement.textContent = value;
    
    // Add classes based on value (same as before)
    if (value === 100) {
        cardElement.classList.add('mega');
    } else if (value < 0) {
        cardElement.classList.add('negative');
    } else if (value > 0) {
        cardElement.classList.add('positive');
    } else if (value === 0) {
        cardElement.classList.add('zero');
    } else {
        // For any other value, remove 'empty' to trigger animation
        cardElement.classList.remove('empty');
    }
}

function updateUI() {
    if (playerScoreSpan) playerScoreSpan.textContent = playerScore;
    if (robotScoreSpan) robotScoreSpan.textContent = robotScore;
    if (cardsLeftSpan) cardsLeftSpan.textContent = deck.length;
}

function endGame() {
    if (drawButton) drawButton.style.display = 'none'; // Hide draw button
    if (resetButton) resetButton.style.display = 'block'; // Show reset button

    let finalMessage = "Game Over! ";
    if (playerScore > robotScore) {
        finalMessage += "You are the CHAMPION!";
        if (roundMessage) roundMessage.classList.add('winner');
    } else if (robotScore > playerScore) {
        finalMessage += "The Robot is the CHAMPION!";
        if (roundMessage) roundMessage.classList.add('loser');
    } else {
        finalMessage += "It's a DRAW!";
        if (roundMessage) roundMessage.classList.add('tie');
    }
    if (roundMessage) roundMessage.textContent = finalMessage;
}

// --- Event Listeners ---
// These are added after all functions are defined
if (playOfflineBtn) playOfflineBtn.addEventListener('click', startGame);
if (drawButton) drawButton.addEventListener('click', drawCards);
if (resetButton) resetButton.addEventListener('click', startGame); // Reset button also starts a new game

// Initial setup: Show the start screen
if (startScreen) showScreen(startScreen);
