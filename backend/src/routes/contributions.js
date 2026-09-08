const express = require('express');
const router = express.Router();
const contributorController = require('../controllers/contributorController');

// /api/contributions/week
router.get('/week', contributorController.getWeeklyContributions);

// /api/contributions/stats
router.get('/stats', contributorController.getContributionStats);

module.exports = router;
