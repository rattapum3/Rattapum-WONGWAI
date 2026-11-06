const express = require('express');
const router = express.Router();
const exportController = require('../../controllers/reports/exportController');

// 1. ประกาศรับสมัครงาน (Job Announcement)
// Word (.docx)
router.get('/job-announcement/:id/word', exportController.exportJobAnnouncementDocx);
router.post('/job-announcement/preview-word', exportController.previewJobAnnouncementDocx);

// PDF Direct Binary Download
router.get('/job-announcement/:id/pdf', exportController.exportJobAnnouncementPDF);
router.post('/job-announcement/preview-pdf', exportController.previewJobAnnouncementPDF);

// 2. ใบสมัครงานของผู้สมัคร (Job Application)
// Word (.docx)
router.get('/application/:id/word', exportController.exportApplicationDocx);

// PDF Direct Binary Download
router.get('/application/:id/pdf', exportController.exportApplicationPDF);

// 3. ประกาศรายชื่อผู้มีสิทธิสอบ / ผลการคัดเลือก (Candidate Announcement)
router.post('/candidate-announcement/word', exportController.exportCandidateAnnouncementDocx);
router.post('/candidate-announcement/pdf', exportController.exportCandidateAnnouncementPDF);

// 4. ดาวน์โหลดไฟล์แม่แบบเปล่า (Raw Templates) เพื่อนำไปเปิดจัดตกแต่งใน Word
router.get('/templates/job-announcement', exportController.downloadJobAnnouncementTemplate);
router.get('/templates/job-application', exportController.downloadJobApplicationTemplate);
router.get('/templates/candidate-announcement', exportController.downloadCandidateAnnouncementTemplate);
router.get('/templates/final-candidate-announcement', exportController.downloadFinalCandidateAnnouncementTemplate);

module.exports = router;
