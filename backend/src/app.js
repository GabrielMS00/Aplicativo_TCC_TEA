const express = require('express');
const cors = require('cors'); 
const app = express();

app.use(cors()); // Permite que o telemóvel consiga aceder à API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiRoutes = require('./api/routes/index');
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('API do App TEA está a funcionar na nuvem!');
});

module.exports = app;