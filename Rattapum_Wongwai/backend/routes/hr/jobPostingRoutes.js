const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jobPostingController = require('../../controllers/hr/jobPostingController');

const announcementsDir = path.join(__dirname, '../../uploads/announcements');
if (!fs.existsSync(announcementsDir)) {
    fs.mkdirSync(announcementsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, announcementsDir);
    },
    filename: function (req, file, cb) {
        const recruitmentId = req.params.id || 'new';
        const ext = (path.extname(file.originalname) || '.pdf').toLowerCase();
        cb(null, `announcement_job_${recruitmentId}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }
});

// เผยแพร่หรือบันทึกประกาศรับสมัคร
router.get('/all', jobPostingController.getAllPostings);
router.put('/:id/deadline', jobPostingController.updateDeadline);
router.put('/:id/close', jobPostingController.closeRecruitment);
router.put('/:id', upload.single('announcementFile'), jobPostingController.publishJobPosting);
router.post('/:id', upload.single('announcementFile'), jobPostingController.publishJobPosting);
router.post('/new', upload.single('announcementFile'), jobPostingController.publishJobPosting);

module.exports = router;
