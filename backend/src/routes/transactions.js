const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Global transaction endpoints
router.get('/', transactionController.getGlobalTransactions);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
