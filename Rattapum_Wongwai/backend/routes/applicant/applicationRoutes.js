const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const applicationController = require('../../controllers/applicant/applicationController');
const applicationTrackingController = require('../../controllers/applicant/applicationTrackingController');

// Mapping ชื่อประเภทเอกสารให้อ่านง่ายและเป็นระเบียบ
const docTypeMap = {
    '1': 'photo',
    '2': 'degree',
    '3': 'name_change',
    '4': 'other_doc',
    '5': 'house_registration',
    '6': 'id_card',
    '7': 'military',
    '8': 'medical_cert',
    '9': 'reference'
};

const getDocTypeSlug = (fieldname) => {
    if (!fieldname) return 'doc';
    const match = fieldname.match(/\d+/);
    if (match && docTypeMap[match[0]]) {
        return docTypeMap[match[0]];
    }
    const legacyMap = {
        'profileImage': 'photo',
        'degree': 'degree',
        'nameChange': 'name_change',
        'houseReg': 'house_registration',
        'idCard': 'id_card',
        'military': 'military',
        'medical': 'medical_cert',
        'recommendation': 'reference'
    };
    return legacyMap[fieldname] || fieldname.replace(/[^a-zA-Z0-9_-]/g, '_');
};

// Ensure uploads/applicants directory exists
const applicantsUploadDir = path.join(__dirname, '../../uploads/applicants');
if (!fs.existsSync(applicantsUploadDir)) {
    fs.mkdirSync(applicantsUploadDir, { recursive: true });
}

// ตั้งค่า Multer สำหรับอัปโหลดไฟล์แยกตามเลขบัตรประชาชนและตำแหน่ง: uploads/applicants/{citizenId}/job_{recruitmentId}/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const citizenId = (req.body && req.body.citizenId) ? req.body.citizenId.trim() : 'temp';
        const recruitmentId = (req.params && req.params.recruitmentId) ? req.params.recruitmentId.trim() : 'general';
        const targetDir = path.join(__dirname, '../../uploads/applicants', citizenId, `job_${recruitmentId}`);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        const ext = (path.extname(file.originalname) || '.pdf').toLowerCase();
        const docSlug = getDocTypeSlug(file.fieldname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
        cb(null, `upload_${docSlug}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

const examAnnouncementsUploadDir = path.join(__dirname, '../../uploads/exam_announcements');
if (!fs.existsSync(examAnnouncementsUploadDir)) {
    fs.mkdirSync(examAnnouncementsUploadDir, { recursive: true });
}

const announcementStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, examAnnouncementsUploadDir);
    },
    filename: function (req, file, cb) {
        const type = (req.body && req.body.type) ? req.body.type.trim() : 'announce';
        const recId = (req.body && req.body.recruitmentId) ? req.body.recruitmentId.trim() : 'general';
        const ext = (path.extname(file.originalname) || '.pdf').toLowerCase();
        cb(null, `signed_${type}_${recId}_${Date.now()}${ext}`);
    }
});

const uploadAnnouncement = multer({
    storage: announcementStorage,
    limits: { fileSize: 25 * 1024 * 1024 }
});

// GET /api/applications/my-applications
router.get('/my-applications', applicationController.getMyApplications);

// GET /api/applications/recruitment/:id
router.get('/recruitment/:id', applicationController.getApplicantsByRecruitment);

// POST /api/applications/batch-schedule-exams
router.post('/batch-schedule-exams', applicationTrackingController.batchScheduleExams);

// POST /api/applications/announcements/upload-signed-file
router.post('/announcements/upload-signed-file', uploadAnnouncement.single('file'), applicationTrackingController.uploadSignedAnnouncementFile);

// DELETE /api/applications/announcements/signed-file
router.delete('/announcements/signed-file', applicationTrackingController.deleteSignedAnnouncementFile);

// POST /api/applications/batch-send-results
router.post('/batch-send-results', applicationTrackingController.batchSendResults);

// POST /api/applications/batch-status
router.post('/batch-status', applicationController.batchUpdateApplicationStatus);

// PUT /api/applications/:id/status
router.put('/:id/status', applicationController.updateApplicationStatus);

// รับฟอร์มสมัครงามพร้อมไฟล์หลายประเภท
router.post('/:recruitmentId', upload.any(), applicationController.submitApplication);

// GET /api/applications/:id
router.get('/:id', applicationController.getApplicationDetailsById);

// POST /api/applications/:id/draft
router.post('/:id/draft', applicationController.saveDraft);

// GET /api/applications/:id/draft/:citizenId
router.get('/:id/draft/:citizenId', applicationController.loadDraft);

// GET /api/applications/:id/tracking
router.get('/:id/tracking', applicationTrackingController.getApplicationTracking);

// GET /api/applications/check-status/:recruitmentId/:citizenId
router.get('/check-status/:recruitmentId/:citizenId', applicationController.checkApplicationStatus);

// PUT /api/applications/:id/evaluation
router.put('/:id/evaluation', applicationTrackingController.updateEvaluation);

// GET /api/applications/search-by-citizen/:citizenId
router.get('/search-by-citizen/:citizenId', applicationController.searchApplicantByCitizenId);

module.exports = router;
