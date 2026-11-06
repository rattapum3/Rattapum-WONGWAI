const express = require('express');
const router = express.Router();
const jobRequestController = require('../../controllers/hr/jobRequestController');

router.get('/faculty-jobs', jobRequestController.getApprovedJobsByFaculty);
router.get('/', jobRequestController.getAllRequests);
router.delete('/:id', jobRequestController.deleteRequest);

module.exports = router;