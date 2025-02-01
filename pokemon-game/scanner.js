// Initialize game variables
let lives = 3;
let currentPokemon = null;
let correctGuesses = 0;
let incorrectGuesses = 0;
let startTime = null;
let fastestCorrectTime = Infinity;
let fastestIncorrectTime = Infinity;
let guessedPokemons = []; // Array to track guessed Pokemon

// Get DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const output = document.getElementById('output');
const guessInput = document.getElementById('guess');
const submitButton = document.getElementById('submitGuess');
const restartButton = document.getElementById('restartGame');
const messageDisplay = document.getElementById('message');
const livesDisplay = document.getElementById('livesValue');
const correctScoreDisplay = document.getElementById('correctScore');
const incorrectScoreDisplay = document.getElementById('incorrectScore');
const context = canvas.getContext('2d');

// Initialize QR scanner
let scannerInitialized = false;
let lastScannedCode = null; // Variable to store the last scanned QR code

// Function to handle successful QR code scan
function handleQRCodeScan(code) {
    if (lastScannedCode !== code.data) {
        console.log('QR Code detected:', code.data);
        lastScannedCode = code.data; // Update last scanned code
        messageDisplay.textContent = ''; // Clear the message display
        startTime = Date.now(); // Start the timer when a QR code is scanned
        fetchPokemonData(code.data);
    }
}

// Function to fetch Pokémon data from game_data.json
function fetchPokemonData(qrCodeData) {
    console.log('Fetching Pokemon data for QR code:', qrCodeData);
    fetch('game_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(gameData => {
            // Directly use the qrCodeData to find the matching Pokemon
            currentPokemon = gameData.pokemons.find(p => qrCodeData.toLowerCase() === `qr_codes/${p.name}.png`.toLowerCase());

            if (currentPokemon) {
                console.log('Pokemon found:', currentPokemon.name);
                displayPokemonImage(currentPokemon);
            } else {
                console.log('Pokemon not found for QR code:', qrCodeData);
                output.textContent = 'Pokémon not found.';
            }
        })
        .catch(error => {
            console.error('Error fetching or parsing game data:', error);
            output.textContent = 'Error fetching Pokémon data: ' + error.message;
        });
}

// Function to display the scanned Pokémon image (QR code)
function displayPokemonImage(pokemon) {
    output.innerHTML = `<img src="${pokemon.image}" alt="${pokemon.name} QR Code" width="200" />`;
}

// Event listeners for buttons
submitButton.addEventListener('click', checkGuess);
restartButton.addEventListener('click', resetGame);

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(function(stream) {
        video.srcObject = stream;
        video.setAttribute('playsinline', true);
        video.play();
        scannerInitialized = true;
        requestAnimationFrame(tick);
    })
    .catch(function(err) {
        console.error('Error accessing the camera.', err);
        output.textContent = 'Error accessing the camera.';
    });

// Function to update the video frame and scan for QR codes
function tick() {
    console.log('tick function called');
    if (!scannerInitialized) {
        console.log('Scanner not initialized');
        return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        console.log('Video stream ready');
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code) {
            console.log('QR Code detected in tick:', code.data);
            handleQRCodeScan(code);
        } else {
            console.log('No QR Code detected');
        }
    } else {
        console.log('Video stream not ready');
    }
    requestAnimationFrame(tick);
}

// Function to update the score display
function updateScoreDisplay() {
    correctScoreDisplay.textContent = correctGuesses;
    incorrectScoreDisplay.textContent = incorrectGuesses;
}

// Function to check the player's guess
function checkGuess() {
  console.log('checkGuess() called');
  console.log('Guess:', guessInput.value);
  console.log('Current Pokemon:', currentPokemon ? currentPokemon.name : null);
  if (!currentPokemon) {
    messageDisplay.textContent = 'Scan a Pokémon first!';
    return;
  }

  const guess = guessInput.value.toLowerCase();

  // Check if the Pokemon has already been guessed
  if (guessedPokemons.includes(guess)) {
    messageDisplay.textContent = "You've already guessed this Pokemon!";
    return;
  }

  const endTime = Date.now();
  const timeTaken = (endTime - startTime) / 1000; // Time in seconds

  // Disable the submit button initially
  submitButton.disabled = true;

  // Check if the guess matches the current Pokemon's name (case-insensitive)
  if (guess.toLowerCase() === currentPokemon.name.toLowerCase()) {
    messageDisplay.textContent = 'Correct!';
    guessInput.value = '';
    correctGuesses++;
    if (timeTaken < fastestCorrectTime) {
      fastestCorrectTime = timeTaken;
    }
    guessedPokemons.push(guess); // Add to guessed Pokemon
  } else {
    messageDisplay.textContent = 'Incorrect!';
    lives--;
    livesDisplay.textContent = lives;
    incorrectGuesses++;
    if (timeTaken < fastestIncorrectTime) {
      fastestIncorrectTime = timeTaken;
    }
    guessedPokemons.push(guess); // Add to guessed Pokemon
    if (lives <= 0) {
      console.log('Game over condition met: lives <= 0');
      gameOver();
      return; // Stop further execution after game over
    }
  }
  updateScoreDisplay();

  // Check if all Pokémon have been guessed correctly
  if (correctGuesses === 5) {
    displayCongratulations();
    return;
  }

  // Clear the image and prompt for another scan
  output.innerHTML = '';
  messageDisplay.textContent = (guess === currentPokemon.name.toLowerCase() ? 'Correct! ' : 'Incorrect! ') + 'Scan another QR code.';

  // Check if all Pokémon have been scanned
  if (correctGuesses + incorrectGuesses >= 5) {
    console.log('Game over condition met: 5 guesses made');
    gameOver();
    return;
  }

  // Re-enable the submit button for the next guess
  submitButton.disabled = false;
}

// Function to display congratulatory message
function displayCongratulations() {
  console.log('displayCongratulations() called');
  messageDisplay.textContent = 'Congratulations! You guessed all the Pokemon correctly!';
  submitButton.disabled = true;

  // Store game results in local storage
  localStorage.setItem('correctGuesses', correctGuesses);
  localStorage.setItem('incorrectGuesses', incorrectGuesses);
  localStorage.setItem('fastestCorrectTime', fastestCorrectTime);
  localStorage.setItem('fastestIncorrectTime', fastestIncorrectTime);

  // Redirect to the dashboard page
  window.location.href = 'dashboard.html';
}

// Function to handle game over
function gameOver() {
    console.log('gameOver() called');
    messageDisplay.textContent = 'Game Over!';
    submitButton.disabled = true;

    // Store game results in local storage
    localStorage.setItem('correctGuesses', correctGuesses);
    localStorage.setItem('incorrectGuesses', incorrectGuesses);
    localStorage.setItem('fastestCorrectTime', fastestCorrectTime);
    localStorage.setItem('fastestIncorrectTime', fastestIncorrectTime);

    // Redirect to the dashboard page
    window.location.href = 'dashboard.html';
}

// Function to reset the game
function resetGame() {
  lives = 3;
  currentPokemon = null;
  guessInput.value = '';
  submitButton.disabled = false; // Enable the button on game reset
  messageDisplay.textContent = '';
  livesDisplay.textContent = lives;
  output.innerHTML = '';
  lastScannedCode = null;
  correctGuesses = 0;
  incorrectGuesses = 0;
  fastestCorrectTime = Infinity;
  fastestIncorrectTime = Infinity;
  updateScoreDisplay();
  guessedPokemons = []; // Clear guessed Pokemon
}
