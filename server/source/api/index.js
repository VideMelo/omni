const express = require('express');

const Logger = require('../utils/logger');

const port = process.env.PORT || 8080;
const app = express();

app.get('/api', (req, res) => {
   res.send({ data: 'Hello World' });
});

app.listen(port, () => {
   Logger.info(`Server listening on port ${port}`);
});

module.exports = app;