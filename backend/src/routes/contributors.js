const express = require('express');
const router = express.Router();
const contributorController = require('../controllers/contributorController');

// /api/contributors
router.get('/', contributorController.getContributors);
router.post('/', contributorController.createContributor);
router.get('/:id', contributorController.getContributorById);
router.delete('/:id', contributorController.deleteContributor);

// /api/contributors/:id/contributions
router.get('/:id/contributions', contributorController.getContributorPayments);
router.post('/:id/contributions/toggle', contributorController.toggleContribution);

module.exports = router;
