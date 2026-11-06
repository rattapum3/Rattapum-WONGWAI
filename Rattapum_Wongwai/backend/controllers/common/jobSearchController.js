const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

const getExamAnnouncementFileUrl = (fileName) => {
    if (!fileName || !String(fileName).trim()) return null;
    if (fileName.startsWith('http')) return fileName;
    const cleanName = fileName.replace(/^\/?uploads\/(exam_announcements|announcements)\//, '');
    const examPath = path.join(__dirname, '../../uploads/exam_announcements', cleanName);
    if (fs.existsSync(examPath)) {
        return `http://localhost:3000/uploads/exam_announcements/${cleanName}`;
    }
    const legacyPath = path.join(__dirname, '../../uploads/announcements', cleanName);
    if (fs.existsSync(legacyPath)) {
        return `http://localhost:3000/uploads/announcements/${cleanName}`;
    }
    return null;
};

const formatDateYMD = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
        return dateVal.split('T')[0].split(' ')[0].trim();
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ดึงข้อมูลประกาศรับสมัครงานทั้งหมด (ที่เผยแพร่แล้ว)
const getPublishedJobs = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.Recruitment_id as id,
                r.Announcement_name as title,
                r.Announcement_file as announcementFile,
                r.Round_no as round,
                r.Total_position as amount,
                r.Open_date as openDate,
                r.Close_date as closeDate,
                r.Request_date as requestDate,
                p.Position_name,
                p.Position_type as type,
                d.Department_name,
                f.Faculty_name
            FROM Recruitment r
            LEFT JOIN Position p ON r.Position_id = p.Position_id
            LEFT JOIN Department d ON r.Department_id = d.Department_id
            LEFT JOIN Faculty f ON d.Faculty_id = f.Faculty_id
            WHERE r.Request_status = 'Processed'
            ORDER BY r.Open_date DESC, r.Recruitment_id DESC
        `;
        
        const [rows] = await db.query(query);

        // ตกแต่งข้อมูลก่อนส่งกลับ
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const formattedJobs = rows.map(job => {
            let displayTitle = job.title;
            if (!displayTitle) {
                displayTitle = `${job.Position_name || 'ไม่ระบุตำแหน่ง'} สังกัด${job.Faculty_name || 'ไม่ระบุคณะ'} ${job.Department_name ? 'ภาควิชา' + job.Department_name : ''}`.trim();
            }

            // จัดการวันที่เปิดและปิดรับสมัครให้มีค่าเสมอ
            let openDate = formatDateYMD(job.openDate || job.requestDate) || formatDateYMD(new Date());
            let closeDate = formatDateYMD(job.closeDate);
            if (!closeDate && openDate) {
                const parts = openDate.split('-');
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                d.setDate(d.getDate() + 15);
                closeDate = formatDateYMD(d);
            }

            let status = 'open';
            let daysLeft = null;
            let daysClosed = null;

            if (closeDate) {
                const closeDateObj = new Date(closeDate);
                closeDateObj.setHours(0, 0, 0, 0);

                const diffTime = closeDateObj.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    status = 'closed';
                    daysClosed = Math.abs(diffDays);
                } else {
                    status = 'open';
                    daysLeft = diffDays;
                }
            }

            const cleanFileName = job.announcementFile ? job.announcementFile.replace(/^\/?uploads\/announcements\//, '') : null;
            const fileUrl = cleanFileName
                ? (cleanFileName.startsWith('http')
                    ? cleanFileName
                    : `http://localhost:3000/uploads/announcements/${cleanFileName}`)
                : `http://localhost:3000/api/export/job-announcement/${job.id}/pdf`;

            return {
                id: job.id,
                title: displayTitle,
                position: job.Position_name || '-',
                faculty: job.Faculty_name || '-',
                department: job.Department_name || '-',
                type: job.type || 'ไม่ระบุประเภท',
                amount: job.amount || 1,
                round: job.round || 1,
                openDate,
                closeDate,
                status,
                daysLeft,
                daysClosed,
                announcementFile: cleanFileName,
                fileUrl: fileUrl
            };
        });

        // ส่งรายการตำแหน่งงานทั้งหมด (ทั้งที่เปิดรับสมัคร และที่ปิดรับสมัครแล้ว เพื่อให้หน้า jobs สามารถเลือกดูและจัดเรียงได้)
        // เรียงลำดับเริ่มต้น: ประกาศที่ยังเปิดรับสมัครขึ้นก่อน และในกลุ่มที่ปิดรับสมัครให้เรียงตามวันที่ปิดรับล่าสุด (Close Date DESC)
        formattedJobs.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'open' ? -1 : 1;
            }
            if (a.status === 'open') {
                const timeA = a.closeDate ? new Date(a.closeDate).getTime() : Infinity;
                const timeB = b.closeDate ? new Date(b.closeDate).getTime() : Infinity;
                return timeA - timeB;
            } else {
                const timeA = a.closeDate ? new Date(a.closeDate).getTime() : 0;
                const timeB = b.closeDate ? new Date(b.closeDate).getTime() : 0;
                return timeB - timeA;
            }
        });

        res.status(200).json({ success: true, data: formattedJobs });
    } catch (error) {
        console.error('Error fetching published jobs:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message });
    }
};

// ดึงรายการเอกสารที่ต้องการสำหรับตำแหน่งนี้
const getJobDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                d.Document_id as id,
                d.Document_name as name,
                COALESCE(ad.Document_detail, d.Default_detail) as detail
            FROM application_document ad
            JOIN document d ON ad.Document_id = d.Document_id
            WHERE ad.Recruitment_id = ?
            ORDER BY d.Document_id ASC
        `;
        const [docs] = await db.query(query, [id]);
        
        if (docs.length === 0) {
            // Fallback: If no specific docs assigned to this recruitment, return all default documents
            const fallbackQuery = `
                SELECT 
                    Document_id as id,
                    Document_name as name,
                    Default_detail as detail
                FROM document
                ORDER BY Document_id ASC
            `;
            const [fallbackDocs] = await db.query(fallbackQuery);
            return res.json({ success: true, documents: fallbackDocs });
        }

        res.json({ success: true, documents: docs });
    } catch (error) {
        console.error('Error fetching job documents:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                r.Recruitment_id as id,
                r.Announcement_name as title,
                r.Announcement_detail as announcementDetail,
                r.Announcement_file as announcementFile,
                r.Round_no as round,
                r.Total_position as amount,
                r.Open_date as openDate,
                r.Close_date as closeDate,
                r.Salary_min as salaryMin,
                r.Salary_max as salaryMax,
                r.Min_education as minEducation,
                r.Applicant_detail as applicantDetail,
                r.Application_condition as appConditions,
                r.Fee_detail as feeDetails,
                r.Request_status as status,
                r.Is_initial_announced as isInitialAnnounced,
                r.Is_final_announced as isFinalAnnounced,
                r.Initial_announcement_file as initialAnnouncementFile,
                r.Final_announcement_file as finalAnnouncementFile,
                p.Position_name as position,
                p.Position_type as type,
                f.Faculty_name as faculty,
                d.Department_name as department
            FROM recruitment r
            LEFT JOIN Position p ON r.Position_id = p.Position_id
            LEFT JOIN Department d ON r.Department_id = d.Department_id
            LEFT JOIN Faculty f ON d.Faculty_id = f.Faculty_id
            WHERE r.Recruitment_id = ?
        `;
        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบตำแหน่งงานนี้' });
        }
        
        const job = rows[0];
        let displayTitle = job.title;
        if (!displayTitle) {
            displayTitle = `${job.position || 'ไม่ระบุตำแหน่ง'} สังกัด${job.faculty || 'ไม่ระบุคณะ'} ${job.department && job.department !== '-' ? 'ภาควิชา' + job.department : ''}`.trim();
        }

        const [majors] = await db.query(`SELECT Major_name FROM recruitment_major WHERE Recruitment_id = ?`, [id]);
        const [responsibilities] = await db.query(`SELECT Job_description FROM job_description WHERE Recruitment_id = ?`, [id]);
        const [prohibitedTraits] = await db.query(`SELECT Prohibited_characteristic FROM prohibited_characteristic WHERE Recruitment_id = ?`, [id]);
        const [generalQuals] = await db.query(`SELECT General_qualification FROM general_qualification WHERE Recruitment_id = ?`, [id]);
        const [otherAbilities] = await db.query(`SELECT Additional_skill FROM additional_skill WHERE Recruitment_id = ?`, [id]);
        const [appSteps] = await db.query(`SELECT Application_step FROM application_step WHERE Recruitment_id = ?`, [id]);
        
        const [engTests] = await db.query(`
            SELECT e.Eng_exam_type_name AS testName, h.Min_score AS minScore 
            FROM has_eng_score h
            JOIN eng_exam_type e ON h.Eng_exam_type_id = e.Eng_exam_type_id
            WHERE h.Recruitment_id = ?
        `, [id]);

        const [exams] = await db.query(`
            SELECT ep.Exam_position_type_id AS id, t.Exam_type_name AS type, ep.Exam_detail AS details, ep.Is_announced AS isAnnounced, ep.Announcement_file AS announcementFile
            FROM exam_position_type ep
            JOIN exam_type t ON ep.Exam_type_id = t.Exam_type_id
            WHERE ep.Recruitment_id = ?
        `, [id]);

        const [documents] = await db.query(`
            SELECT d.Document_id AS id, d.Document_name AS name, COALESCE(ad.Document_detail, d.Default_detail) AS detail
            FROM application_document ad
            JOIN document d ON ad.Document_id = d.Document_id
            WHERE ad.Recruitment_id = ?
            ORDER BY d.Document_id ASC
        `, [id]);

        let openDate = formatDateYMD(job.openDate) || formatDateYMD(new Date());
        let closeDate = formatDateYMD(job.closeDate);
        if (!closeDate && openDate) {
            const parts = openDate.split('-');
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            d.setDate(d.getDate() + 15);
            closeDate = formatDateYMD(d);
        }

        const cleanFileName = job.announcementFile ? job.announcementFile.replace(/^\/?uploads\/announcements\//, '') : null;
        const fileUrl = cleanFileName
            ? (cleanFileName.startsWith('http')
                ? cleanFileName
                : `http://localhost:3000/uploads/announcements/${cleanFileName}`)
            : null;

        const toBool = (v) => v === true || v === 1 || String(v).toLowerCase() === 'true';

        res.json({ 
            success: true, 
            data: { 
                id: job.id,
                title: displayTitle,
                announcementDetail: job.announcementDetail,
                announcementFile: cleanFileName,
                fileUrl: fileUrl,
                position: job.position || '-',
                faculty: job.faculty || '-',
                department: job.department || '-',
                type: job.type || '-',
                amount: job.amount || 1,
                round: job.round || 1,
                openDate: openDate,
                closeDate: closeDate,
                isInitialAnnounced: toBool(job.isInitialAnnounced),
                isFinalAnnounced: toBool(job.isFinalAnnounced),
                initialAnnouncementFile: job.initialAnnouncementFile || null,
                finalAnnouncementFile: job.finalAnnouncementFile || null,
                initialFileUrl: getExamAnnouncementFileUrl(job.initialAnnouncementFile),
                finalFileUrl: getExamAnnouncementFileUrl(job.finalAnnouncementFile),
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                minEducation: job.minEducation || '-',
                applicantDetail: job.applicantDetail || '-',
                feeDetails: job.feeDetails || 'ค่าธรรมเนียมการสมัครสอบ 500 บาท',
                appConditions: job.appConditions || 'ผู้สมัครต้องรับผิดชอบในการตรวจสอบและรับรองตนเองว่าเป็นผู้มีคุณสมบัติตรงตามประกาศ',
                majors: majors.map(m => m.Major_name),
                requiredMajor: majors.map(m => m.Major_name).join(', ') || '-',
                jobResponsibilities: responsibilities.map(r => r.Job_description),
                prohibitedTraits: prohibitedTraits.map(p => p.Prohibited_characteristic),
                generalQuals: generalQuals.map(g => g.General_qualification),
                otherAbilities: otherAbilities.map(o => o.Additional_skill),
                appSteps: appSteps.map(s => s.Application_step),
                engTests: engTests.map(e => ({ testName: e.testName, minScore: String(e.minScore) })),
                exams: exams.map(e => ({
                    id: e.id,
                    type: e.type,
                    details: e.details,
                    isAnnounced: toBool(e.isAnnounced),
                    announcementFile: e.announcementFile || null,
                    fileUrl: getExamAnnouncementFileUrl(e.announcementFile)
                })),
                documents: documents
            } 
        });
    } catch (error) {
        console.error('Error in getJobById:', error);
        res.status(500).json({ success: false, message: 'ดึงข้อมูลตำแหน่งงานล้มเหลว' });
    }
};

module.exports = {
    getPublishedJobs,
    getJobDocuments,
    getJobById
};
