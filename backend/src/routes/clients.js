const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const transactionController = require('../controllers/transactionController');

// Client management endpoints
router.post('/', clientController.createClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);

// Per-client transaction endpoints
router.post('/:id/transactions', transactionController.addTransaction);
router.get('/:id/transactions', transactionController.getClientTransactions);

module.exports = router;
