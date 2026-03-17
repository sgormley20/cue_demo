const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Serve static files
app.use(express.static(__dirname));

// Default to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Experiment running at http://localhost:${port}`);
});
