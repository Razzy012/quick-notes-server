const express = require('express');
const connectToDatabase = require('./database');
const logger = require('./logger');
const routes = require('./routes');
const app = express();
const port = process.env.PORT || 3000;

async function startServer() {
    await connectToDatabase();

    app.use(express.json());

    app.use('/api', routes);

    app.use((err, req, res, next) => {
        logger.error(err.stack);
        res.status(err.statusCode || 500)
            .send({ error: err.message });
    });

    app.listen(port, () => {
        logger.info(`Server listening at http://localhost:${port}`);
    });
};

module.exports = startServer;