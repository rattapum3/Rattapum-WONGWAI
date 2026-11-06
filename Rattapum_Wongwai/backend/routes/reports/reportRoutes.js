const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/reports/reportController');

// GET /api/reports/list
router.get('/list', reportController.getReportList);

// GET /api/reports/summary/:id
router.get('/summary/:id', reportController.getReportSummary);

module.exports = router;
