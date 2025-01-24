const QRCode = require('qrcode');
const fs = require('fs');

// Create the qr_codes directory if it doesn't exist
const qrCodesDir = './qr_codes';
if (!fs.existsSync(qrCodesDir)) {
  fs.mkdirSync(qrCodesDir);
}

// Read the game_data.json file using an absolute path
const gameData = JSON.parse(fs.readFileSync('./game_data.json', 'utf8'));

// Generate QR codes for each Pokémon
gameData.pokemons.forEach(pokemon => {
  const qrCodePath = `${qrCodesDir}/${pokemon.name}.png`;
  // Encode the QR code path itself into the QR code
  QRCode.toFile(qrCodePath, `qr_codes/${pokemon.name}.png`, { 
    color: {
      dark: '#000',  // Black dots
      light: '#FFF' // White background
    }
  }, function (err) {
    if (err) throw err;
    console.log(`QR code generated for ${pokemon.name} at ${qrCodePath}`);
  });
});
