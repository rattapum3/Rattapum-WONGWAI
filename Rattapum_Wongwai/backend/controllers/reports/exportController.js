const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
const {
    generateJobAnnouncementDocx,
    generateApplicationDocx,
    generateJobAnnouncementPDF,
    generateApplicationPDF,
    generateCandidateAnnouncementDocx,
    generateCandidateAnnouncementPDF
} = require('../../services/docExportService');

// Helper: ดึงข้อมูลการเปิดรับสมัครงานฉบับเต็มจาก DB
const fetchRecruitmentFullData = async (recruitmentId) => {
    const query = `
        SELECT 
            r.Recruitment_id as id,
            r.Announcement_name as announcementName,
            r.Announcement_detail as announcementDetail,
            r.Applicant_detail as applicantDetail,
            r.Salary_min as salaryMin,
            r.Salary_max as salaryMax,
            r.Open_date as openDate,
            r.Close_date as closeDate,
            r.Round_no as roundNo,
            r.Total_position as amount,
            r.Application_condition as appConditions,
            r.Fee_detail as feeDetails,
            r.Min_education as minEducation,
            p.Position_name as jobTitle,
            p.Position_type as positionType,
            f.Faculty_name as faculty,
            d.Department_name as department
        FROM recruitment r
        LEFT JOIN position p ON r.Position_id = p.Position_id
        LEFT JOIN department d ON r.Department_id = d.Department_id
        LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
        WHERE r.Recruitment_id = ?
    `;
    const [rows] = await db.query(query, [recruitmentId]);
    if (rows.length === 0) return null;

    const job = rows[0];

    const [majors] = await db.query(`SELECT Major_name FROM recruitment_major WHERE Recruitment_id = ?`, [recruitmentId]);
    const [responsibilities] = await db.query(`SELECT Job_description FROM job_description WHERE Recruitment_id = ?`, [recruitmentId]);
    const [prohibitedTraits] = await db.query(`SELECT Prohibited_characteristic FROM prohibited_characteristic WHERE Recruitment_id = ?`, [recruitmentId]);
    const [generalQuals] = await db.query(`SELECT General_qualification FROM general_qualification WHERE Recruitment_id = ?`, [recruitmentId]);
    const [otherAbilities] = await db.query(`SELECT Additional_skill FROM additional_skill WHERE Recruitment_id = ?`, [recruitmentId]);
    const [appSteps] = await db.query(`SELECT Application_step FROM application_step WHERE Recruitment_id = ?`, [recruitmentId]);

    const [engTests] = await db.query(`
        SELECT e.Eng_exam_type_name AS testName, h.Min_score AS minScore 
        FROM has_eng_score h
        JOIN eng_exam_type e ON h.Eng_exam_type_id = e.Eng_exam_type_id
        WHERE h.Recruitment_id = ?
    `, [recruitmentId]);

    const [exams] = await db.query(`
        SELECT t.Exam_type_name AS type, ep.Exam_detail AS details
        FROM exam_position_type ep
        JOIN exam_type t ON ep.Exam_type_id = t.Exam_type_id
        WHERE ep.Recruitment_id = ?
    `, [recruitmentId]);

    const [documents] = await db.query(`
        SELECT d.Document_id AS id, d.Document_name AS docName, COALESCE(ad.Document_detail, d.Default_detail) AS docDetail
        FROM application_document ad
        JOIN document d ON ad.Document_id = d.Document_id
        WHERE ad.Recruitment_id = ?
        ORDER BY d.Document_id ASC
    `, [recruitmentId]);

    return {
        ...job,
        postTitle: job.announcementName || `ประกาศรับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัย ตำแหน่ง ${job.jobTitle || ''}`,
        postDetails: job.announcementDetail,
        applicantDetail: job.applicantDetail,
        applicantDetails: job.applicantDetail,
        majors: majors.map(m => m.Major_name),
        jobResponsibilities: responsibilities.map(r => r.Job_description),
        prohibitedTraits: prohibitedTraits.map(p => p.Prohibited_characteristic),
        generalQuals: generalQuals.map(g => g.General_qualification),
        otherAbilities: otherAbilities.map(a => a.Additional_skill),
        appSteps: appSteps.map(s => s.Application_step),
        engTests: engTests,
        exams: exams,
        documentsList: documents
    };
};

// Helper: ดึงข้อมูลใบสมัครฉบับเต็มจาก DB
const fetchApplicationFullData = async (applicationId) => {
    let appId = applicationId;
    if (typeof appId === 'string' && appId.startsWith('APP-')) {
        appId = parseInt(appId.replace(/^APP-0*/i, ''), 10) || appId;
    }

    const query = `
        SELECT 
            app.Application_id AS appId,
            app.Application_id,
            app.Apply_date AS applyDate,
            app.Apply_time AS applyTime,
            app.Status AS status,
            app.Recruitment_id,
            app.Applicant_id,
            ah.Application_history_id,
            r.Announcement_name AS jobTitle,
            p.Position_name AS positionName,
            d.Department_name AS deptName,
            f.Faculty_name AS facultyName,
            COALESCE(NULLIF(ah.Prefix, ''), ap.Prefix) AS Prefix,
            COALESCE(NULLIF(ah.First_name, ''), ap.First_name) AS First_name,
            COALESCE(NULLIF(ah.Last_name, ''), ap.Last_name) AS Last_name,
            COALESCE(NULLIF(ah.Citizen_id, ''), ap.Citizen_id) AS Citizen_id,
            COALESCE(NULLIF(ah.Email, ''), ap.Email) AS Email,
            COALESCE(NULLIF(ah.Nationality, ''), ap.Nationality) AS Nationality,
            COALESCE(NULLIF(ah.Religion, ''), ap.Religion) AS Religion,
            COALESCE(ap.Birth_day, ah.Birth_day) AS Birth_day,
            COALESCE(NULLIF(ah.Age_year, ''), ap.Age_year) AS Age_year,
            COALESCE(NULLIF(ah.Age_month, ''), ap.Age_month) AS Age_month,
            COALESCE(NULLIF(ah.Birth_province, ''), ap.Birth_province) AS Birth_province,
            COALESCE(NULLIF(ah.House_no, ''), ap.House_no) AS House_no,
            COALESCE(NULLIF(ah.Village_no, ''), ap.Village_no) AS Village_no,
            COALESCE(NULLIF(ah.Alley, ''), ap.Alley) AS Alley,
            COALESCE(NULLIF(ah.Street, ''), ap.Street) AS Street,
            ap.Subdistrict_id AS Subdistrict_id,
            COALESCE(NULLIF(ah.Subdistrict, ''), sub.Subdistrict_name) AS Subdistrict_name,
            COALESCE(NULLIF(ah.District, ''), dist.District_name) AS District_name,
            COALESCE(NULLIF(ah.Province, ''), prov.Province_name) AS Province_name,
            COALESCE(NULLIF(ah.Postal_code, ''), dist.Postal_code) AS Postal_code,
            COALESCE(NULLIF(ah.Father_name, ''), ap.Father_name) AS Father_name,
            COALESCE(NULLIF(ah.Father_religion, ''), ap.Father_religion) AS Father_religion,
            COALESCE(NULLIF(ah.Father_nationality, ''), ap.Father_nationality) AS Father_nationality,
            COALESCE(NULLIF(ah.Father_job, ''), ap.Father_job) AS Father_job,
            COALESCE(NULLIF(ah.Mother_name, ''), ap.Mother_name) AS Mother_name,
            COALESCE(NULLIF(ah.Mother_religion, ''), ap.Mother_religion) AS Mother_religion,
            COALESCE(NULLIF(ah.Mother_nationality, ''), ap.Mother_nationality) AS Mother_nationality,
            COALESCE(NULLIF(ah.Mother_job, ''), ap.Mother_job) AS Mother_job,
            COALESCE(NULLIF(ah.Spouse_name, ''), ap.Spouse_name) AS Spouse_name,
            COALESCE(NULLIF(ah.Spouse_religion, ''), ap.Spouse_religion) AS Spouse_religion,
            COALESCE(NULLIF(ah.Spouse_nationality, ''), ap.Spouse_nationality) AS Spouse_nationality,
            COALESCE(NULLIF(ah.Spouse_job, ''), ap.Spouse_job) AS Spouse_job,
            COALESCE(NULLIF(ah.Current_job, ''), ap.Current_job) AS Current_job,
            COALESCE(NULLIF(ah.Workplace, ''), ap.Workplace) AS Workplace,
            COALESCE(NULLIF(ah.Special_skill, ''), ap.Special_skill) AS Special_skill,
            ah.Work_experience,
            COALESCE(NULLIF(ah.Foreign_language, ''), ap.Foreign_language) AS Foreign_language,
            COALESCE(NULLIF(ah.Has_contract_obligation, ''), ap.Has_contract_obligation) AS Has_contract_obligation,
            COALESCE(NULLIF(ah.Contract_agency, ''), ap.Contract_agency) AS Contract_agency,
            COALESCE(NULLIF(ah.Contract_name, ''), ap.Contract_name) AS Contract_name,
            COALESCE(NULLIF(ah.Has_staff_contract_obligation, ''), ap.Has_staff_contract_obligation) AS Has_staff_contract_obligation,
            COALESCE(NULLIF(ah.University_staff_affiliation, ''), ap.University_staff_affiliation) AS University_staff_affiliation,
            COALESCE(NULLIF(ah.University_staff_affiliation_income, ''), ap.University_staff_affiliation_income) AS University_staff_affiliation_income,
            COALESCE(NULLIF(ah.Staff_type, ''), ap.Staff_type) AS Staff_type
        FROM Application app
        JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
        LEFT JOIN (
            SELECT ah1.*
            FROM application_history ah1
            INNER JOIN (
                SELECT MAX(Application_history_id) AS max_id
                FROM application_history
                GROUP BY Citizen_id, Recruitment_id
            ) ah_max ON ah1.Application_history_id = ah_max.max_id
        ) ah ON (TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id) AND app.Recruitment_id = ah.Recruitment_id)
        LEFT JOIN subdistrict sub ON sub.Subdistrict_id = ap.Subdistrict_id
        LEFT JOIN district dist ON sub.District_id = dist.District_id
        LEFT JOIN province prov ON dist.Province_id = prov.Province_id
        LEFT JOIN Recruitment r ON app.Recruitment_id = r.Recruitment_id
        LEFT JOIN Position p ON r.Position_id = p.Position_id
        LEFT JOIN Department d ON r.Department_id = d.Department_id
        LEFT JOIN Faculty f ON d.Faculty_id = f.Faculty_id
        WHERE app.Application_id = ?
        LIMIT 1
    `;
    const [appRows] = await db.query(query, [appId]);
    if (appRows.length === 0) return null;

    const appData = appRows[0];

    const [seqRows] = await db.query(`
        SELECT COUNT(*) AS seqNo
        FROM Application
        WHERE Recruitment_id = ?
          AND Status != 'Draft'
          AND (Apply_date > ? OR (Apply_date = ? AND Application_id >= ?))
    `, [appData.Recruitment_id, appData.applyDate, appData.applyDate, appData.appId]);
    const seqNo = seqRows[0]?.seqNo || 1;

    // ดึงข้อมูลประวัติการศึกษา (จากตารางหลัก Education ของผู้สมัคร)
    let eduRows = [];
    if (appData.Applicant_id) {
        const [rows] = await db.query(`
            SELECT * FROM Education 
            WHERE Applicant_id = ?
        `, [appData.Applicant_id]);
        eduRows = rows;
    }

    // ดึงข้อมูลผลสอบภาษาอังกฤษ (จากตารางหลัก eng_exam_result ของผู้สมัคร)
    let engRows = [];
    if (appData.Applicant_id) {
        const [rows] = await db.query(`
            SELECT eer.Eng_score as score, eer.Exam_date as examDate, eet.Eng_exam_type_name as name
            FROM eng_exam_result eer
            LEFT JOIN eng_exam_type eet ON eer.Eng_exam_type_id = eet.Eng_exam_type_id
            WHERE eer.Applicant_id = ?
        `, [appData.Applicant_id]);
        engRows = rows;
    }
    let phoneRows = [];
    if (appData.Application_history_id) {
        const [histPhones] = await db.query(`SELECT Mobile_phone_history AS Mobile_phone FROM applicant_mobile_phone_history WHERE Application_history_id = ?`, [appData.Application_history_id]);
        phoneRows = histPhones;
    }
    if (phoneRows.length === 0 && appData.Applicant_id) {
        const [appPhones] = await db.query(`SELECT Mobile_phone FROM applicant_mobile_phone WHERE Applicant_id = ?`, [appData.Applicant_id]);
        phoneRows = appPhones;
    }

    const [docRows] = await db.query(`
        SELECT 
            ds.document_id,
            ds.file_name,
            ds.custom_name,
            ds.file_path,
            COALESCE(NULLIF(ds.custom_name, ''), d.Document_name) AS Document_name,
            d.Default_detail
        FROM document_storage ds
        JOIN document d ON ds.document_id = d.Document_id
        WHERE ds.application_id = ?
        ORDER BY ds.document_id ASC
    `, [appData.Application_id]);

    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
    };

    return {
        id: `ลำดับที่ ${seqNo}`,
        seqNo: seqNo,
        jobTitle: appData.jobTitle || appData.positionName || 'ไม่ระบุตำแหน่ง',
        positionName: appData.positionName || appData.jobTitle || 'ไม่ระบุตำแหน่ง',
        facultyName: appData.facultyName || appData.deptName || 'มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร',
        deptName: appData.deptName || '-',
        appliedDate: formatDate(appData.applyDate),
        status: appData.status || 'รอตรวจสอบคุณสมบัติ',
        idCard: appData.Citizen_id || '-',
        email: appData.Email || '-',
        personal: {
            title: appData.Prefix || '',
            firstName: appData.First_name || '',
            lastName: appData.Last_name || '',
            firstNameEn: appData.First_name_en || '',
            lastNameEn: appData.Last_name_en || '',
            dob: appData.Birth_day ? formatDate(appData.Birth_day) : '-',
            ageYears: appData.Age_year || '-',
            ageMonths: appData.Age_month || '0',
            nationality: appData.Nationality || '-',
            religion: appData.Religion || '-',
            birthplace: appData.Birth_province || '-'
        },
        address: {
            province: appData.Province_name || appData.Birth_province || '-',
            amphoe: appData.District_name || '-',
            tambon: appData.Subdistrict_name || '-',
            zipcode: appData.Postal_code || '-',
            houseNo: appData.House_no || '-',
            moo: appData.Village_no || '-',
            soi: appData.Alley || '-',
            road: appData.Street || '-'
        },
        contact: {
            mobilePhones: phoneRows.length > 0 ? phoneRows.map(p => p.Mobile_phone) : ['-']
        },
        family: {
            father: { name: appData.Father_name || '-', nationality: appData.Father_nationality || '-', religion: appData.Father_religion || '-', occupation: appData.Father_job || '-' },
            mother: { name: appData.Mother_name || '-', nationality: appData.Mother_nationality || '-', religion: appData.Mother_religion || '-', occupation: appData.Mother_job || '-' },
            spouse: { name: appData.Spouse_name || '-', nationality: appData.Spouse_nationality || '-', religion: appData.Spouse_religion || '-', occupation: appData.Spouse_job || '-' }
        },
        educations: eduRows.map(edu => ({
            degree: edu.Applied_degree || '-',
            major: edu.Major || '-',
            gpa: edu.Gpa || '-',
            university: edu.Institute_name || '-',
            country: edu.Country_name || '-',
            approvalDate: edu.Approve_date ? formatDate(edu.Approve_date) : '-'
        })),
        abilities: {
            englishTests: engRows.map(t => ({
                name: t.name || 'การสอบ',
                score: (t.score !== null && t.score !== undefined) ? String(t.score) : '-',
                examDate: t.examDate ? formatDate(t.examDate) : '-'
            })),
            specialSkills: appData.Special_skill || '-',
            languages: appData.Foreign_language || '-'
        },
        workAndObligations: {
            currentJob: appData.Current_job || '-',
            workplace: appData.Workplace || '-',
            workExperience: appData.Work_experience || '-',
            staffType: appData.Staff_type || '-',
            kuStaffStatus: appData.Staff_type || appData.University_staff_affiliation || '-',
            hasContractObligation: appData.Has_contract_obligation || '-',
            scholarshipObligation: appData.Has_contract_obligation || '-',
            contractAgency: appData.Contract_agency || '-',
            contractName: appData.Contract_name || '-',
            hasStaffContractObligation: appData.Has_staff_contract_obligation || '-',
            universityStaffAffiliation: appData.University_staff_affiliation || '-',
            universityStaffAffiliationIncome: appData.University_staff_affiliation_income || '-'
        },
        documents: docRows.map((doc, idx) => ({
            id: doc.document_id || idx + 1,
            name: doc.Document_name || 'เอกสารแนบ',
            fileName: doc.file_name || 'เอกสารแนบ'
        }))
    };
};

// =========================================================================
// 1. Export ประกาศรับสมัครงานเป็น Word (.docx) จาก ID
// =========================================================================
const exportJobAnnouncementDocx = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fetchRecruitmentFullData(id);
        if (!data) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลประกาศรับสมัครงาน' });
        }

        const buffer = await generateJobAnnouncementDocx(data);
        const filename = encodeURIComponent(`ประกาศรับสมัคร_${data.jobTitle || 'ตำแหน่ง'}_${id}.docx`);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    } catch (error) {
        console.error('Error exporting Job Announcement DOCX:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ Word: ' + error.message });
    }
};

// =========================================================================
// 2. Export ประกาศรับสมัครงานเป็น Word (.docx) จาก Form Data (Preview / Live Form)
// =========================================================================
const previewJobAnnouncementDocx = async (req, res) => {
    try {
        let data = req.body || {};
        const recId = data.id || data.recruitmentId || req.query.id || req.query.recruitmentId;
        if (!recId) {
            return res.status(400).json({ success: false, message: 'ยังไม่ได้บันทึกแบบร่าง กรุณากดบันทึกแบบร่างก่อนดาวน์โหลดเอกสาร' });
        }
        const dbData = await fetchRecruitmentFullData(recId);
        if (dbData) {
            data = { ...dbData, ...data };
        }
        if (typeof data.generalInfo === 'object') {
            data = {
                ...data,
                ...data.generalInfo,
                jobTitle: data.generalInfo.jobTitle || data.jobTitle,
                faculty: data.generalInfo.faculty || data.faculty,
                department: data.generalInfo.department || data.department,
                amount: data.generalInfo.amount || data.amount,
                salaryMin: data.generalInfo.salaryMin || data.salaryMin,
                salaryMax: data.generalInfo.salaryMax || data.salaryMax,
                openDate: data.generalInfo.openDate || data.openDate,
                closeDate: data.generalInfo.closeDate || data.closeDate,
                roundNo: data.generalInfo.roundNo || data.roundNo || 1,
                applicantDetail: data.generalInfo.applicantDetails || data.generalInfo.applicantDetail || data.applicantDetail,
                applicantDetails: data.generalInfo.applicantDetails || data.generalInfo.applicantDetail || data.applicantDetails,
                postTitle: data.generalInfo.postTitle || data.postTitle,
                postDetails: data.generalInfo.postDetails || data.postDetails,
                feeDetails: data.feeDetails || data.generalInfo.feeDetails,
                appConditions: data.appConditions || data.generalInfo.appConditions
            };
        }

        const buffer = await generateJobAnnouncementDocx(data);
        const filename = encodeURIComponent(`แบบร่างประกาศ_${data.jobTitle || 'ตำแหน่ง'}.docx`);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    } catch (error) {
        console.error('Error previewing Job Announcement DOCX:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ Word: ' + error.message });
    }
};

// =========================================================================
// 3. Export ประกาศรับสมัครงานเป็น PDF โดยดาวน์โหลดไฟล์ทันที
// =========================================================================
const exportJobAnnouncementPDF = async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบก่อนว่า HR มีการแนบไฟล์ประกาศฉบับสมบูรณ์ (PDF) ไว้ในระบบหรือไม่
        const [recRows] = await db.query('SELECT Announcement_name, Announcement_file FROM recruitment WHERE Recruitment_id = ?', [id]);
        if (recRows.length > 0 && recRows[0].Announcement_file) {
            const rawFileName = recRows[0].Announcement_file;
            const cleanFileName = rawFileName.replace(/^\/?uploads\/announcements\//, '');
            const filePath = path.join(__dirname, '../../uploads/announcements', cleanFileName);
            if (fs.existsSync(filePath)) {
                const ext = path.extname(cleanFileName) || '.pdf';
                const downloadName = `${recRows[0].Announcement_name || 'ประกาศรับสมัคร'}_${id}${ext}`;
                const encodedFilename = encodeURIComponent(downloadName);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
                return res.sendFile(filePath);
            }
        }

        // หากไม่มีไฟล์อัปโหลดไว้ ให้สร้าง PDF จากข้อมูลใน DB ที่ HR กรอกโดยตรง
        const dbData = await fetchRecruitmentFullData(id);
        if (dbData) {
            const buffer = await generateJobAnnouncementPDF(dbData);
            const downloadName = `${dbData.announcementName || dbData.jobTitle || 'ประกาศรับสมัคร'}_${id}.pdf`;
            const encodedFilename = encodeURIComponent(downloadName);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
            res.setHeader('Content-Length', buffer.length);
            return res.end(buffer);
        }

        return res.status(404).send(`
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="utf-8">
                <title>ไม่พบไฟล์ประกาศ</title>
                <style>
                    body { font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 60px 20px; background-color: #f8f9fa; color: #333; }
                    .card { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                    h2 { color: #dc3545; margin-bottom: 12px; }
                    p { color: #6c757d; line-height: 1.6; margin-bottom: 24px; }
                    button { background: #03A96B; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>⚠️ ไม่พบข้อมูลประกาศรับสมัคร</h2>
                    <p>ตำแหน่งงานนี้ยังไม่มีข้อมูลประกาศในระบบ หรือยังไม่ได้บันทึกข้อมูล</p>
                    <button onclick="window.close()">ปิดหน้านี้</button>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error exporting Job Announcement PDF:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ประกาศ');
    }
};

// =========================================================================
// 4. Preview ประกาศรับสมัครงานเป็น PDF จาก Form Body โดยดาวน์โหลดไฟล์ทันที
// =========================================================================
const previewJobAnnouncementPDF = async (req, res) => {
    try {
        let data = req.body || {};
        const recId = data.id || data.recruitmentId || req.query.id || req.query.recruitmentId;
        if (!recId) {
            return res.status(400).json({ success: false, message: 'ยังไม่ได้บันทึกแบบร่าง กรุณากดบันทึกแบบร่างก่อนดาวน์โหลดเอกสาร' });
        }
        const dbData = await fetchRecruitmentFullData(recId);
        if (dbData) {
            data = { ...dbData, ...data };
        }
        if (typeof data.generalInfo === 'object') {
            data = {
                ...data,
                ...data.generalInfo,
                jobTitle: data.generalInfo.jobTitle || data.jobTitle,
                faculty: data.generalInfo.faculty || data.faculty,
                department: data.generalInfo.department || data.department,
                amount: data.generalInfo.amount || data.amount,
                salaryMin: data.generalInfo.salaryMin || data.salaryMin,
                salaryMax: data.generalInfo.salaryMax || data.salaryMax,
                openDate: data.generalInfo.openDate || data.openDate,
                closeDate: data.generalInfo.closeDate || data.closeDate,
                roundNo: data.generalInfo.roundNo || data.roundNo || 1,
                applicantDetail: data.generalInfo.applicantDetails || data.generalInfo.applicantDetail || data.applicantDetail,
                applicantDetails: data.generalInfo.applicantDetails || data.generalInfo.applicantDetail || data.applicantDetails,
                postTitle: data.generalInfo.postTitle || data.postTitle,
                postDetails: data.generalInfo.postDetails || data.postDetails,
                feeDetails: data.feeDetails || data.generalInfo.feeDetails,
                appConditions: data.appConditions || data.generalInfo.appConditions
            };
        }

        const buffer = await generateJobAnnouncementPDF(data);
        const filename = encodeURIComponent(`ร่างประกาศ_${data.jobTitle || 'ตำแหน่ง'}.pdf`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    } catch (error) {
        console.error('Error previewing Job Announcement PDF:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + error.message });
    }
};

// =========================================================================
// 5. Export ใบสมัครงานเป็น Word (.docx) จาก Application ID
// =========================================================================
const exportApplicationDocx = async (req, res) => {
    try {
        const { id } = req.params;
        const appData = await fetchApplicationFullData(id);
        if (!appData) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลใบสมัคร' });
        }

        const buffer = await generateApplicationDocx(appData);
        const namePart = `${appData.personal?.firstName || 'applicant'}_${appData.personal?.lastName || ''}`.trim();
        const filename = encodeURIComponent(`ใบสมัคร_${namePart}_${id}.docx`);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    } catch (error) {
        console.error('Error exporting Application DOCX:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ Word ใบสมัคร: ' + error.message });
    }
};

// =========================================================================
// 6. Export ใบสมัครงานเป็น PDF จาก Application ID โดยดาวน์โหลดไฟล์ทันที
// =========================================================================
const exportApplicationPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const appData = await fetchApplicationFullData(id);
        if (!appData) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลใบสมัคร' });
        }

        const buffer = await generateApplicationPDF(appData);
        const namePart = `${appData.personal?.firstName || 'applicant'}_${appData.personal?.lastName || ''}`.trim();
        const filename = encodeURIComponent(`ใบสมัคร_${namePart}_${id}.pdf`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filename}`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    } catch (error) {
        console.error('Error exporting Application PDF:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + error.message });
    }
};

// =========================================================================
// 7. ดาวน์โหลดไฟล์แม่แบบเปล่า (Raw Templates) เพื่อนำไปจัดแต่ง Format ใน Word
// =========================================================================
const downloadJobAnnouncementTemplate = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../..', 'templates', 'job_announcement_template.docx');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'ไม่พบไฟล์แม่แบบประกาศ' });
        }
        res.download(filePath, 'job_announcement_template.docx');
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const downloadJobApplicationTemplate = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../..', 'templates', 'job_application_template.docx');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'ไม่พบไฟล์แม่แบบใบสมัคร' });
        }
        res.download(filePath, 'job_application_template.docx');
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================================
// 8. ส่งออกประกาศรายชื่อผู้มีสิทธิสอบ / ผลการคัดเลือก (Word & PDF)
// =========================================================================
const enrichCandidateAnnouncementData = async (body) => {
    let data = { ...body };
    if (data.recruitmentId) {
        try {
            const [rows] = await db.query(`
                SELECT p.Position_name, f.Faculty_name, d.Department_name, r.Round_no, r.Total_position, r.Announcement_name
                FROM recruitment r
                LEFT JOIN position p ON r.Position_id = p.Position_id
                LEFT JOIN department d ON r.Department_id = d.Department_id
                LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
                WHERE r.Recruitment_id = ?
            `, [data.recruitmentId]);
            if (rows.length > 0) {
                const rec = rows[0];
                data.positionName = data.positionName || rec.Position_name;
                data.faculty = data.faculty || rec.Faculty_name;
                data.department = data.department || rec.Department_name;
                data.roundNo = data.roundNo || rec.Round_no;
                data.totalPosition = data.totalPosition || rec.Total_position || 1;
                data.announcementName = data.announcementName || rec.Announcement_name;
            }
        } catch (e) {
            console.error('Error enriching candidate announcement data:', e);
        }
    }
    return data;
};

const exportCandidateAnnouncementDocx = async (req, res) => {
    try {
        const data = await enrichCandidateAnnouncementData(req.body);
        const docxBuffer = await generateCandidateAnnouncementDocx(data);
        const safeTitle = encodeURIComponent(data.title || 'announcement');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.docx"; filename*=UTF-8''${safeTitle}.docx`);
        res.send(docxBuffer);
    } catch (error) {
        console.error('Error exporting candidate announcement docx:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างเอกสาร Word: ' + error.message });
    }
};

const exportCandidateAnnouncementPDF = async (req, res) => {
    try {
        const data = await enrichCandidateAnnouncementData(req.body);
        const pdfBuffer = await generateCandidateAnnouncementPDF(data);
        const safeTitle = encodeURIComponent(data.title || 'announcement');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"; filename*=UTF-8''${safeTitle}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error exporting candidate announcement PDF:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + error.message });
    }
};

const downloadCandidateAnnouncementTemplate = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../..', 'templates', 'candidate_announcement_template.docx');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'ไม่พบไฟล์แม่แบบประกาศรายชื่อผู้มีสิทธิสอบ' });
        }
        res.download(filePath, 'candidate_announcement_template.docx');
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const downloadFinalCandidateAnnouncementTemplate = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../..', 'templates', 'final_candidate_announcement_template.docx');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'ไม่พบไฟล์แม่แบบประกาศรายชื่อผู้ผ่านการคัดเลือก' });
        }
        res.download(filePath, 'final_candidate_announcement_template.docx');
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    exportJobAnnouncementDocx,
    previewJobAnnouncementDocx,
    exportJobAnnouncementPDF,
    previewJobAnnouncementPDF,
    exportJobAnnouncementHTML: exportJobAnnouncementPDF,
    previewJobAnnouncementHTML: previewJobAnnouncementPDF,
    exportApplicationDocx,
    exportApplicationPDF,
    exportApplicationHTML: exportApplicationPDF,
    downloadJobAnnouncementTemplate,
    downloadJobApplicationTemplate,
    exportCandidateAnnouncementDocx,
    exportCandidateAnnouncementPDF,
    downloadCandidateAnnouncementTemplate,
    downloadFinalCandidateAnnouncementTemplate,
    fetchRecruitmentFullData,
    fetchApplicationFullData
};
