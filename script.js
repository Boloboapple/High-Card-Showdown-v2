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
const deckPile = document.getElementById('deck-pile');

// Game Variables
let deck = [];
let playerScore = 0;
let robotScore = 0;
const TOTAL_CARDS = 24;
let isDrawing = false;

// --- Screen Management ---
function showScreen(screenToShow) {
    if (startScreen) startScreen.classList.remove('active');
    if (gameScreen) gameScreen.classList.remove('active');
    if (screenToShow) screenToShow.classList.add('active');
}

// --- Game Initialization ---
function createDeck() {
    deck = [];
    for (let i = -11; i <= 11; i++) {
        deck.push(i);
    }
    deck.push(100);

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
    showScreen(gameScreen);

    // Ensure buttons are in correct state for a new game
    if (drawButton) drawButton.style.display = 'block';
    if (drawButton) drawButton.disabled = false; // Make sure it's enabled at start
    if (resetButton) resetButton.style.display = 'none';

    if (roundMessage) roundMessage.textContent = ''; // Clear previous messages

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
    if (isDrawing) {
        return;
    }

    isDrawing = true;
    if (drawButton) drawButton.disabled = true; // Disable draw button while cards are being drawn

    if (deck.length <= 1) {
        endGame(); // Call endGame when deck is depleted
        // Removed: isDrawing = false; and if (drawButton) drawButton.disabled = false;
        // These are handled by endGame and the reset button
        return; // Exit drawCards, as game is over
    }

    const playerCardValue = deck.pop();
    const robotCardValue = deck.pop();

    // Hide the final card divs temporarily by setting them empty
    if (playerCardDiv) playerCardDiv.classList.add('empty');
    if (robotCardDiv) robotCardDiv.classList.add('empty');
    if (playerCardDiv) playerCardDiv.textContent = '?';
    if (robotCardDiv) robotCardDiv.textContent = '?';

    // Get absolute positions for animation start and end points
    const deckRect = deckPile.getBoundingClientRect();
    const playerRect = playerCardDiv.getBoundingClientRect();
    const robotRect = robotCardDiv.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();

    // Create animating cards and set their initial position relative to the body
    const animatedPlayerCard = createAnimatedCard(deckRect, bodyRect);
    const animatedRobotCard = createAnimatedCard(deckRect, bodyRect);

    // Append to body so they can move freely across the entire viewport
    document.body.appendChild(animatedPlayerCard);
    document.body.appendChild(animatedRobotCard);

    // Force reflow before adding animation classes to ensure animation triggers from start
    void animatedPlayerCard.offsetWidth;
    void animatedRobotCard.offsetWidth;

    const playerDx = playerRect.left - deckRect.left;
    const playerDy = playerRect.top - deckRect.top;
    const robotDx = robotRect.left - deckRect.left;
    const robotDy = robotRect.top - deckRect.top;

    animatedPlayerCard.style.setProperty('--end-x', `${playerDx}px`);
    animatedPlayerCard.style.setProperty('--end-y', `${playerDy}px`);
    animatedPlayerCard.classList.add('animate-player-card');

    animatedRobotCard.style.setProperty('--end-x', `${robotDx}px`);
    animatedRobotCard.style.setProperty('--end-y', `${robotDy}px`);
    animatedRobotCard.classList.add('animate-robot-card');

    const animationDuration = 1000;

    // Reveal player card value halfway through animation
    setTimeout(() => {
        if (animatedPlayerCard) {
            animatedPlayerCard.textContent = playerCardValue;
            displayCardContentClasses(animatedPlayerCard, playerCardValue);
        }
    }, animationDuration / 2);

    // Reveal robot card value halfway through animation
    setTimeout(() => {
        if (animatedRobotCard) {
            animatedRobotCard.textContent = robotCardValue;
            displayCardContentClasses(animatedRobotCard, robotCardValue);
        }
    }, animationDuration / 2);

    // Wait for animations to finish
    Promise.all([
        new Promise(resolve => {
            if (animatedPlayerCard) animatedPlayerCard.addEventListener('animationend', resolve, {once: true});
            else resolve();
        }),
        new Promise(resolve => {
            if (animatedRobotCard) animatedRobotCard.addEventListener('animationend', resolve, {once: true});
            else resolve();
        })
    ]).then(() => {
        // Cleanup after animations
        if (animatedPlayerCard) animatedPlayerCard.remove();
        if (animatedRobotCard) animatedRobotCard.remove();

        // Update and display the actual player/robot card divs
        displayCard(playerCardDiv, playerCardValue);
        displayCard(robotCardDiv, robotCardValue);

        let message = '';
        let winner = null;

        if (playerCardValue > robotCardValue) {
            playerScore++;
            message = "You win this round!";
            winner = 'player';
        } else if (robotCardValue > playerCardValue) {
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

        setTimeout(() => {
            isDrawing = false;
            // Only re-enable draw button if game is NOT over
            if (deck.length > 1 && drawButton) {
                drawButton.disabled = false;
            }
        }, 1000);
    });
}

// Helper function to create an animated card - sets initial position
function createAnimatedCard(deckRect, bodyRect) {
    const card = document.createElement('div');
    card.classList.add('animated-card');
    card.textContent = '?'; // Start with a question mark

    // Position the card absolutely on the screen where the deck is, relative to the body's scroll position
    card.style.left = `${deckRect.left - bodyRect.left}px`;
    card.style.top = `${deckRect.top - bodyRect.top}px`;

    return card;
}

// Helper function to apply color/mega classes to a card element
function displayCardContentClasses(cardElement, value) {
    if (!cardElement) return;
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

// Modified displayCard function - only updates static card content/classes
function displayCard(cardElement, value) {
    if (!cardElement) return;
    cardElement.textContent = value;
    displayCardContentClasses(cardElement, value);
    cardElement.classList.remove('empty');
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
        if (roundMessage) roundMessage.classList.remove('loser', 'tie'); // Clear previous round's classes
        if (roundMessage) roundMessage.classList.add('winner');
    } else if (robotScore > playerScore) {
        finalMessage += "The Robot is the CHAMPION!";
        if (roundMessage) roundMessage.classList.remove('winner', 'tie'); // Clear previous round's classes
        if (roundMessage) roundMessage.classList.add('loser');
    } else {
        finalMessage += "It's a DRAW!";
        if (roundMessage) roundMessage.classList.remove('winner', 'loser'); // Clear previous round's classes
        if (roundMessage) roundMessage.classList.add('tie');
    }
    if (roundMessage) roundMessage.textContent = finalMessage; // Update message text
    
    // Also clear the cards themselves when the game ends
    if (playerCardDiv) {
        playerCardDiv.textContent = '?';
        playerCardDiv.className = 'card empty';
    }
    if (robotCardDiv) {
        robotCardDiv.textContent = '?';
        robotCardDiv.className = 'card empty';
    }
}

// --- Event Listeners ---
if (playOfflineBtn) playOfflineBtn.addEventListener('click', startGame);
if (drawButton) drawButton.addEventListener('click', drawCards);
if (resetButton) resetButton.addEventListener('click', startGame);

// Initial setup: Show the start screen
if (startScreen) showScreen(startScreen);
