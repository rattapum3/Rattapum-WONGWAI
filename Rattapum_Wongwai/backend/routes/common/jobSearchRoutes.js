const express = require('express');
const router = express.Router();
const jobSearchController = require('../../controllers/common/jobSearchController');

// ดึงรายการประกาศรับสมัครงานที่เปิดเผยแพร่ทั้งหมด
router.get('/', jobSearchController.getPublishedJobs);

// ดึงข้อมูลประกาศเดี่ยว
router.get('/:id', jobSearchController.getJobById);

// ดึงรายการเอกสารประกอบการสมัคร
router.get('/:id/documents', jobSearchController.getJobDocuments);

module.exports = router;
