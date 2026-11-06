const db = require('../../config/db');

// 🛡️ Helper ตรวจสอบและดักกรองข้อมูลคำขอเปิดรับสมัคร (Job Request Validation)
const validateJobRequestData = (data) => {
    let { positionId, departmentId, amount, education, major, jobCategory } = data;

    // 1. สายปฏิบัติงาน
    const cleanCategory = String(jobCategory || '').trim();
    if (!cleanCategory || !['สายวิชาการ', 'สายสนับสนุน'].includes(cleanCategory)) {
        return { isValid: false, message: 'กรุณาระบุสายปฏิบัติงานให้ถูกต้อง (สายวิชาการ หรือ สายสนับสนุน)' };
    }

    // 2. ตำแหน่งที่ต้องการรับสมัคร
    if (!positionId) {
        return { isValid: false, message: 'กรุณาเลือกหรือระบุตำแหน่งที่ต้องการรับสมัคร' };
    }
    if (String(positionId).startsWith('NEW:')) {
        const posName = String(positionId).replace('NEW:', '').trim();
        if (!posName || posName.length < 2 || posName.length > 100) {
            return { isValid: false, message: 'ชื่อตำแหน่งใหม่ต้องมีความยาวระหว่าง 2 ถึง 100 ตัวอักษร' };
        }
    }

    // 3. ภาควิชา / หน่วยงาน
    if (!departmentId) {
        return { isValid: false, message: 'กรุณาเลือกหรือระบุภาควิชา/หน่วยงาน' };
    }
    if (String(departmentId).startsWith('NEW:')) {
        const deptName = String(departmentId).replace('NEW:', '').trim();
        if (!deptName || deptName.length < 2 || deptName.length > 100) {
            return { isValid: false, message: 'ชื่อภาควิชา/หน่วยงานใหม่ต้องมีความยาวระหว่าง 2 ถึง 100 ตัวอักษร' };
        }
    }

    // 4. จำนวนอัตราที่รับ
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 999) {
        return { isValid: false, message: 'จำนวนอัตราที่รับต้องเป็นตัวเลขจำนวนเต็มตั้งแต่ 1 ถึง 999 อัตรา' };
    }

    // 5. วุฒิการศึกษาขั้นต่ำ
    const eduStr = Array.isArray(education) ? education.join(' หรือ ').trim() : String(education || '').trim();
    if (!eduStr || eduStr.length < 2 || eduStr.length > 255) {
        return { isValid: false, message: 'กรุณาระบุวุฒิการศึกษาขั้นต่ำที่ต้องการรับสมัคร' };
    }

    // 6. สาขาวิชาเอก
    let majorList = [];
    if (Array.isArray(major)) {
        majorList = major.map(m => String(m || '').trim()).filter(Boolean);
    } else if (typeof major === 'string') {
        majorList = major.split(/,|\s+หรือ\s+/).map(m => m.trim()).filter(Boolean);
    }

    if (majorList.length === 0) {
        return { isValid: false, message: 'กรุณาเลือกหรือระบุสาขาวิชาเอกอย่างน้อย 1 สาขา' };
    }

    return {
        isValid: true,
        cleanData: {
            cleanCategory,
            numAmount,
            eduStr,
            majorList
        }
    };
};

const createRequest = async (req, res) => {
    try {
        // 📍 1. ตรวจสอบความถูกต้องของข้อมูลทุกช่อง
        const validation = validateJobRequestData(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        let { positionId, departmentId, facultyName, status } = req.body;
        const { cleanCategory, numAmount, eduStr, majorList } = validation.cleanData;

        // 📍 2. ดักจับ "ตำแหน่งใหม่" (ถ้ามี)
        if (String(positionId).startsWith('NEW:')) {
            const posName = positionId.replace('NEW:', '').trim();
            const [posResult] = await db.query(
                'INSERT INTO `Position` (Position_name, Position_type) VALUES (?, ?)', 
                [posName, cleanCategory]
            );
            positionId = posResult.insertId;
        }

        // 📍 3. ดักจับคณะและภาควิชา
        let facId = null;
        if (facultyName) {
            const cleanFacName = String(facultyName).replace(/^NEW:/, '').trim();
            if (cleanFacName) {
                const [facRows] = await db.query('SELECT Faculty_id FROM faculty WHERE Faculty_name = ?', [cleanFacName]);
                if (facRows.length > 0) {
                    facId = facRows[0].Faculty_id;
                }
            }
        }

        if (String(departmentId).startsWith('NEW:')) {
            const deptName = departmentId.replace('NEW:', '').trim();
            const [deptResult] = await db.query(
                'INSERT INTO department (Department_name, Faculty_id) VALUES (?, ?)', 
                [deptName, facId]
            );
            departmentId = deptResult.insertId;
        }

        // 📍 4. ตรวจสอบสถานะ (ถ้าไม่ได้ส่งมา ให้ Default เป็น 'Pending')
        const currentStatus = status || 'Pending';

        // 📍 5. Insert ลงตารางหลัก
        const queryRecruitment = `
            INSERT INTO recruitment 
            (Position_id, Department_id, Total_position, Min_education, Request_date, Request_status) 
            VALUES (?, ?, ?, ?, CURDATE(), ?)
        `;
        const [result] = await db.query(queryRecruitment, [positionId, departmentId, numAmount, eduStr, currentStatus]);
        
        const newRecruitmentId = result.insertId;

        // 📍 6. Insert ลงตาราง recruitment_major
        for (const mName of majorList) {
            await db.query(`INSERT INTO recruitment_major (Recruitment_id, Major_name) VALUES (?, ?)`, [newRecruitmentId, mName]);
        }

        // 📍 7. Insert ลงตาราง additional_skill (ความรู้ความสามารถพิเศษ หรือทักษะเฉพาะตำแหน่ง)
        let abilitiesList = [];
        if (Array.isArray(req.body.otherAbilities)) {
            abilitiesList = req.body.otherAbilities.map(a => String(a || '').trim()).filter(Boolean);
        } else if (typeof req.body.otherAbilities === 'string' && req.body.otherAbilities.trim()) {
            abilitiesList = req.body.otherAbilities.split(/,\s*/).map(a => a.trim()).filter(Boolean);
        }
        for (const ab of abilitiesList) {
            await db.query(`INSERT INTO additional_skill (Recruitment_id, Additional_skill) VALUES (?, ?)`, [newRecruitmentId, ab]);
        }

        res.status(201).json({ success: true, message: 'สร้างคำขอสำเร็จ', requestId: newRecruitmentId });

    } catch (error) {
        console.error('Error creating job request:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำขอ' });
    }
};

const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT 
                r.Recruitment_id AS id,
                r.Position_id AS positionId,
                r.Department_id AS departmentId,
                r.Total_position AS amount,
                r.Min_education AS minEducation,
                r.Request_status AS status,
                r.Announcement_name AS announcementName,
                r.Announcement_detail AS announcementDetail,
                r.Announcement_file AS announcementFile,
                r.Salary_min AS salaryMin,
                r.Salary_max AS salaryMax,
                r.Round_no AS roundNo,
                r.Open_date AS openDate,
                r.Close_date AS closeDate,
                r.Applicant_detail AS applicantDetails,
                r.Application_condition AS appConditions,
                r.Fee_detail AS feeDetails,
                TRIM(p.Position_type) AS jobCategory,
                p.Position_name AS jobTitle,
                d.Department_name AS department,
                f.Faculty_name AS faculty
            FROM recruitment r
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            WHERE r.Recruitment_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอ' });
        }

        const requestData = rows[0];

        // Fetch majors
        const [majorRows] = await db.query(`SELECT Major_name FROM recruitment_major WHERE Recruitment_id = ?`, [id]);
        requestData.majors = majorRows.map(row => row.Major_name);
        requestData.major = requestData.majors.join(', ');
        requestData.education = requestData.minEducation ? requestData.minEducation.split(' หรือ ') : [];

        // Fetch detail lists
        const [jobDescRows] = await db.query(`SELECT Job_description FROM job_description WHERE Recruitment_id = ?`, [id]);
        requestData.jobResponsibilities = jobDescRows.map(r => r.Job_description);

        const [prohibitedRows] = await db.query(`SELECT Prohibited_characteristic FROM prohibited_characteristic WHERE Recruitment_id = ?`, [id]);
        requestData.prohibitedTraits = prohibitedRows.map(r => r.Prohibited_characteristic);

        const [generalQualRows] = await db.query(`SELECT General_qualification FROM general_qualification WHERE Recruitment_id = ?`, [id]);
        requestData.generalQuals = generalQualRows.map(r => r.General_qualification);

        const [skillRows] = await db.query(`SELECT Additional_skill FROM additional_skill WHERE Recruitment_id = ?`, [id]);
        requestData.otherAbilities = skillRows.map(r => r.Additional_skill);

        const [stepRows] = await db.query(`SELECT Application_step FROM application_step WHERE Recruitment_id = ?`, [id]);
        requestData.appSteps = stepRows.map(r => r.Application_step);

        const [engRows] = await db.query(`
            SELECT e.Eng_exam_type_name AS testName, h.Min_score AS minScore 
            FROM has_eng_score h
            JOIN eng_exam_type e ON h.Eng_exam_type_id = e.Eng_exam_type_id
            WHERE h.Recruitment_id = ?
        `, [id]);
        requestData.engTests = engRows.map(r => ({ testName: r.testName, minScore: String(r.minScore) }));

        const [examRows] = await db.query(`
            SELECT t.Exam_type_name AS examName, ep.Exam_detail AS examDetail
            FROM exam_position_type ep
            JOIN exam_type t ON ep.Exam_type_id = t.Exam_type_id
            WHERE ep.Recruitment_id = ?
        `, [id]);
        requestData.exams = examRows.map(r => ({ type: r.examName, details: r.examDetail }));

        const [docRows] = await db.query(`
            SELECT ad.Document_id AS docId, d.Document_name AS docName, ad.Document_detail AS docDetail
            FROM application_document ad
            JOIN document d ON ad.Document_id = d.Document_id
            WHERE ad.Recruitment_id = ?
            ORDER BY ad.Document_id
        `, [id]);
        requestData.documentsList = docRows.map(r => ({
            docId: r.docId,
            docName: r.docName,
            docDetail: r.docDetail
        }));
        requestData.documents = docRows.map(r => `${r.docName}: ${r.docDetail}`);

        res.json({ success: true, data: requestData });
    } catch (error) {
        console.error('Error fetching request by id:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // 📍 ตรวจสอบสถานะเดิมของคำขอในฐานข้อมูล (ต้องเป็นแบบร่างเท่านั้นจึงจะแก้ไขได้)
        const [existingRows] = await db.query('SELECT Request_status FROM recruitment WHERE Recruitment_id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอ' });
        }

        const currentDbStatus = existingRows[0].Request_status;
        if (currentDbStatus !== 'RequestDraft' && currentDbStatus !== 'Draft') {
            return res.status(403).json({ 
                success: false, 
                message: 'คำขอนี้ถูกส่งไปยังหน่วยทรัพยากรมนุษย์แล้ว จึงไม่สามารถแก้ไขได้ (สามารถแก้ไขได้เฉพาะคำขอที่บันทึกเป็นแบบร่างเท่านั้น)' 
            });
        }

        // 📍 1. ตรวจสอบความถูกต้องของข้อมูลทุกช่อง
        const validation = validateJobRequestData(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        let { positionId, departmentId, facultyName, status } = req.body;
        const { cleanCategory, numAmount, eduStr, majorList } = validation.cleanData;

        if (String(positionId).startsWith('NEW:')) {
            const posName = positionId.replace('NEW:', '').trim();
            const [posResult] = await db.query(
                'INSERT INTO `Position` (Position_name, Position_type) VALUES (?, ?)', 
                [posName, cleanCategory]
            );
            positionId = posResult.insertId;
        }

        // 📍 ดักจับคณะและภาควิชา
        let facId = null;
        if (facultyName) {
            const cleanFacName = String(facultyName).replace(/^NEW:/, '').trim();
            if (cleanFacName) {
                const [facRows] = await db.query('SELECT Faculty_id FROM faculty WHERE Faculty_name = ?', [cleanFacName]);
                if (facRows.length > 0) {
                    facId = facRows[0].Faculty_id;
                }
            }
        }

        if (String(departmentId).startsWith('NEW:')) {
            const deptName = departmentId.replace('NEW:', '').trim();
            const [deptResult] = await db.query(
                'INSERT INTO department (Department_name, Faculty_id) VALUES (?, ?)', 
                [deptName, facId]
            );
            departmentId = deptResult.insertId;
        }

        const currentStatus = status || 'Pending';

        const updateQuery = `
            UPDATE recruitment 
            SET Position_id = ?, Department_id = ?, Total_position = ?, Min_education = ?, Request_status = ?
            WHERE Recruitment_id = ?
        `;
        await db.query(updateQuery, [positionId, departmentId, numAmount, eduStr, currentStatus, id]);

        // Update majors in recruitment_major (delete old, insert new)
        await db.query('DELETE FROM recruitment_major WHERE Recruitment_id = ?', [id]);
        
        for (const mName of majorList) {
            await db.query(`INSERT INTO recruitment_major (Recruitment_id, Major_name) VALUES (?, ?)`, [id, mName]);
        }

        // Update skills in additional_skill (delete old, insert new)
        await db.query('DELETE FROM additional_skill WHERE Recruitment_id = ?', [id]);
        let abilitiesList = [];
        if (Array.isArray(req.body.otherAbilities)) {
            abilitiesList = req.body.otherAbilities.map(a => String(a || '').trim()).filter(Boolean);
        } else if (typeof req.body.otherAbilities === 'string' && req.body.otherAbilities.trim()) {
            abilitiesList = req.body.otherAbilities.split(/,\s*/).map(a => a.trim()).filter(Boolean);
        }
        for (const ab of abilitiesList) {
            await db.query(`INSERT INTO additional_skill (Recruitment_id, Additional_skill) VALUES (?, ?)`, [id, ab]);
        }

        res.status(200).json({ success: true, message: 'อัปเดตคำขอสำเร็จ' });
    } catch (error) {
        console.error('Error updating job request:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตคำขอ' });
    }
};

const getFormOptions = async (req, res) => {
    try {
        const [faculties] = await db.query('SELECT Faculty_id AS id, Faculty_name AS name, Faculty_id, Faculty_name FROM faculty ORDER BY Faculty_id');
        const [positions] = await db.query('SELECT Position_id AS id, Position_name AS name, TRIM(Position_type) AS type FROM `Position`');
        
        const [departments] = await db.query(`
            SELECT 
                d.Department_id AS id, 
                d.Department_name AS name, 
                f.Faculty_name AS facultyName,
                d.Faculty_id AS facultyId
            FROM department d
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
        `);
        
        const [documents] = await db.query('SELECT Document_id AS id, Document_name AS name, Default_detail AS defaultDetail FROM document ORDER BY Document_id');
        const [engExamTypes] = await db.query('SELECT Eng_exam_type_id AS id, Eng_exam_type_name AS name FROM eng_exam_type ORDER BY Eng_exam_type_id');
        const [examTypes] = await db.query('SELECT Exam_type_id AS id, Exam_type_name AS name FROM exam_type ORDER BY Exam_type_id');

        res.status(200).json({
            success: true,
            faculties,
            positions,
            departments,
            documents,
            engExamTypes,
            examTypes
        });
    } catch (error) {
        console.error('❌ [Error] getFormOptions:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงตัวเลือกฟอร์ม' });
    }
};

module.exports = { 
    createRequest,
    getRequestById,
    updateRequest,
    getFormOptions
};
