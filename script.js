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
const deckPile = document.getElementById('deck-pile'); // NEW ELEMENT REFERENCE

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

    const playerCardValue = deck.pop();
    const robotCardValue = deck.pop();

    // Hide the final card divs temporarily by setting them empty
    if (playerCardDiv) playerCardDiv.classList.add('empty');
    if (robotCardDiv) robotCardDiv.classList.add('empty');
    if (playerCardDiv) playerCardDiv.textContent = '?';
    if (robotCardDiv) robotCardDiv.textContent = '?';
    
    // Get positions for animation
    // getBoundingClientRect() gives absolute position relative to viewport.
    // We need to calculate translation relative to the parent (gameScreen) for animated cards.
    const deckRect = deckPile.getBoundingClientRect();
    const playerRect = playerCardDiv.getBoundingClientRect();
    const robotRect = robotCardDiv.getBoundingClientRect();
    const gameScreenRect = gameScreen.getBoundingClientRect(); // Parent for animated cards

    // Create animating cards
    const animatedPlayerCard = createAnimatedCard(deckRect, gameScreenRect);
    const animatedRobotCard = createAnimatedCard(deckRect, gameScreenRect);

    // Append to gameScreen to keep within game bounds and ensure relative positioning works
    gameScreen.appendChild(animatedPlayerCard);
    gameScreen.appendChild(animatedRobotCard);

    // Force reflow before adding animation classes to ensure animation triggers from start
    // This is a common trick to make CSS animations play from the start every time
    void animatedPlayerCard.offsetWidth;
    void animatedRobotCard.offsetWidth;

    // Calculate translation distances relative to the animated card's starting point (which is over deck-pile)
    const playerDx = playerRect.left - animatedPlayerCard.getBoundingClientRect().left;
    const playerDy = playerRect.top - animatedPlayerCard.getBoundingClientRect().top;
    const robotDx = robotRect.left - animatedRobotCard.getBoundingClientRect().left;
    const robotDy = robotRect.top - animatedRobotCard.getBoundingClientRect().top;
    
    // Apply animation classes with CSS variables for target positions
    animatedPlayerCard.style.setProperty('--end-x', `${playerDx}px`);
    animatedPlayerCard.style.setProperty('--end-y', `${playerDy}px`);
    animatedPlayerCard.classList.add('animate-player-card');

    animatedRobotCard.style.setProperty('--end-x', `${robotDx}px`);
    animatedRobotCard.style.setProperty('--end-y', `${robotDy}px`);
    animatedRobotCard.classList.add('animate-robot-card');

    // Function to handle card content reveal and cleanup after animation
    const animationDuration = 1000; // Match CSS animation duration (1s)

    // Reveal player card value halfway through animation
    setTimeout(() => {
        if (animatedPlayerCard) { // Check if element still exists
            animatedPlayerCard.textContent = playerCardValue;
            displayCardContentClasses(animatedPlayerCard, playerCardValue); // Apply colors/mega
        }
    }, animationDuration / 2);

    // Reveal robot card value halfway through animation
    setTimeout(() => {
        if (animatedRobotCard) { // Check if element still exists
            animatedRobotCard.textContent = robotCardValue;
            displayCardContentClasses(animatedRobotCard, robotCardValue); // Apply colors/mega
        }
    }, animationDuration / 2);

    // Wait for animations to finish before updating actual cards and cleaning up
    Promise.all([
        new Promise(resolve => {
            if (animatedPlayerCard) animatedPlayerCard.addEventListener('animationend', resolve, {once: true});
            else resolve(); // Resolve immediately if card not found (error state)
        }),
        new Promise(resolve => {
            if (animatedRobotCard) animatedRobotCard.addEventListener('animationend', resolve, {once: true});
            else resolve(); // Resolve immediately if card not found (error state)
        })
    ]).then(() => {
        // After animations complete:
        // 1. Remove animated cards from DOM
        if (animatedPlayerCard) animatedPlayerCard.remove();
        if (animatedRobotCard) animatedRobotCard.remove();

        // 2. Update and display the actual player/robot card divs
        displayCard(playerCardDiv, playerCardValue); // This function now just updates content and classes
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

        // Re-enable draw button after cooldown
        setTimeout(() => {
            isDrawing = false;
            if (deck.length > 1 && drawButton) {
                drawButton.disabled = false;
            }
        }, 1000); // 1000 milliseconds = 1 second cooldown
    });
}

// Helper function to create an animated card
function createAnimatedCard(deckRect, gameScreenRect) {
    const card = document.createElement('div');
    card.classList.add('animated-card');
    card.textContent = '?'; // Start with a question mark

    // Position relative to the game-screen
    // The animated card starts exactly where the deckPile is, relative to the gameScreen's top-left corner
    card.style.left = `${deckRect.left - gameScreenRect.left}px`;
    card.style.top = `${deckRect.top - gameScreenRect.top}px`;
    
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


// Modified displayCard function - now only updates the content and classes of a *static* card
function displayCard(cardElement, value) {
    if (!cardElement) return;

    cardElement.textContent = value; // Set the actual value
    displayCardContentClasses(cardElement, value); // Apply color/mega classes
    cardElement.classList.remove('empty'); // Remove empty class if it was there
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
