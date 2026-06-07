const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public', 'Brainrot')));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'Brainrot', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Brainrot Games Player running on port ${PORT}`);
});
