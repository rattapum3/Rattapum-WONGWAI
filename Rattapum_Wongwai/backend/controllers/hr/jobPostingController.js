const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

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

// สร้างหรือเผยแพร่ประกาศรับสมัครงาน (รองรับทั้งการสร้างใหม่โดยตรงจาก HR และการนำคำร้องจากคณะมาออกประกาศ)
const publishJobPosting = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const id = req.params.id || req.body.id || 'new';
        let data = req.body || {};

        // Parse JSON strings if needed
        const parseIfString = (val) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return val; }
            }
            return val;
        };

        data.generalInfo = parseIfString(data.generalInfo) || {};
        data.jobResponsibilities = parseIfString(data.jobResponsibilities) || [];
        data.prohibitedTraits = parseIfString(data.prohibitedTraits) || [];
        data.generalQuals = parseIfString(data.generalQuals) || [];
        data.otherAbilities = parseIfString(data.otherAbilities) || [];
        data.appSteps = parseIfString(data.appSteps) || [];
        data.engTests = parseIfString(data.engTests) || [];
        data.exams = parseIfString(data.exams) || [];
        data.documents = parseIfString(data.documents) || [];
        data.documentsList = parseIfString(data.documentsList) || [];
        data.selectedDegrees = parseIfString(data.selectedDegrees) || [];

        let recruitmentId = (id === 'new' || id === 'NEW' || !id || id === 'undefined') ? null : parseInt(id);
        let positionId = null;
        let departmentId = null;

        // 0. ตรวจสอบความถูกต้องของข้อมูล (Validation)
        const posName = (data.generalInfo?.jobTitle || data.jobTitle || data.positionName || '').trim();
        if (!posName) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อตำแหน่งที่รับสมัคร' });
        }
        if (posName.length < 2 || posName.length > 100) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'ชื่อตำแหน่งต้องมีความยาวระหว่าง 2 ถึง 100 ตัวอักษร' });
        }

        const facultyName = (data.generalInfo?.faculty || data.faculty || data.facultyName || '').trim();
        if (!facultyName) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'กรุณาระบุคณะ / สังกัดหน่วยงาน' });
        }

        const rawOpen = data.generalInfo?.openDate || data.publishDate;
        const rawClose = data.generalInfo?.closeDate;
        if (rawOpen && rawClose && rawClose < rawOpen) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'วันที่ปิดรับสมัครต้องไม่น้อยกว่าวันที่เปิดรับสมัคร' });
        }

        const posType = (data.jobCategory || data.generalInfo?.jobCategory || 'สายวิชาการ').trim();

        // 1. หาหรือสร้าง Position_id

        if (posName) {
            const [matchedPos] = await connection.query('SELECT Position_id FROM `position` WHERE Position_name = ?', [posName]);
            if (matchedPos.length > 0) {
                positionId = matchedPos[0].Position_id;
            } else {
                const [newPos] = await connection.query('INSERT INTO `position` (Position_name, Position_type) VALUES (?, ?)', [posName, posType]);
                positionId = newPos.insertId;
            }
        } else if (data.positionId && !String(data.positionId).startsWith('NEW:')) {
            positionId = parseInt(data.positionId);
        } else {
            const [firstPos] = await connection.query('SELECT Position_id FROM `position` LIMIT 1');
            positionId = firstPos.length > 0 ? firstPos[0].Position_id : 1;
        }

        // 2. หาหรือสร้าง Department_id และ Faculty_id
        const deptName = (data.generalInfo?.department || data.department || data.departmentName || '-').trim();

        if (facultyName) {
            let facultyId = null;
            const [matchedFac] = await connection.query('SELECT Faculty_id FROM faculty WHERE Faculty_name = ?', [facultyName]);
            if (matchedFac.length > 0) {
                facultyId = matchedFac[0].Faculty_id;
            } else {
                const [newFac] = await connection.query('INSERT INTO faculty (Faculty_name) VALUES (?)', [facultyName]);
                facultyId = newFac.insertId;
            }

            const [matchedDept] = await connection.query(
                'SELECT Department_id FROM department WHERE Faculty_id = ? AND (Department_name = ? OR ? = "-")', 
                [facultyId, deptName, deptName]
            );
            if (matchedDept.length > 0) {
                departmentId = matchedDept[0].Department_id;
            } else {
                const [newDept] = await connection.query(
                    'INSERT INTO department (Department_name, Faculty_id) VALUES (?, ?)', 
                    [deptName === '-' ? (facultyName || 'สำนักงาน') : deptName, facultyId]
                );
                departmentId = newDept.insertId;
            }
        } else if (data.departmentId && !String(data.departmentId).startsWith('NEW:')) {
            departmentId = parseInt(data.departmentId);
        } else {
            const [firstDept] = await connection.query('SELECT Department_id FROM department LIMIT 1');
            departmentId = firstDept.length > 0 ? firstDept[0].Department_id : 1;
        }

        const salaryMinVal = data.generalInfo.salaryMin 
            ? parseInt(String(data.generalInfo.salaryMin).replace(/,/g, '')) 
            : (data.generalInfo.salaryMaster ? parseInt(String(data.generalInfo.salaryMaster).replace(/,/g, '')) : null);
        const salaryMaxVal = data.generalInfo.salaryMax 
            ? parseInt(String(data.generalInfo.salaryMax).replace(/,/g, '')) 
            : (data.generalInfo.salaryPhd ? parseInt(String(data.generalInfo.salaryPhd).replace(/,/g, '')) : null);

        const requestStatus = (data.publishMode === 'HR_Draft' || data.publishMode === 'draft') ? 'HR_Draft' : 'Processed';

        const openDateVal = data.generalInfo.openDate 
            || data.publishDate 
            || formatDateYMD(new Date());

        let closeDateVal = data.generalInfo.closeDate || null;
        if (!closeDateVal && openDateVal) {
            const parts = openDateVal.split('-');
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            d.setDate(d.getDate() + 15);
            closeDateVal = formatDateYMD(d);
        }

        let announcementFileVal = null;
        if (requestStatus === 'HR_Draft') {
            // หากบันทึกเป็นแบบร่าง (Draft) จะไม่เก็บไฟล์ PDF และหากมีไฟล์อัปโหลดมากับ request ให้ลบออกจากดิสก์
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) {
                    console.error('Error removing draft file:', e);
                }
            }
            announcementFileVal = null;
        } else {
            // เมื่อกดเผยแพร่ประกาศ (Processed)
            if (req.file) {
                announcementFileVal = req.file.filename;
                // หากเป็นการอัปเดต ให้ลบไฟล์ประกาศเดิมในโฟลเดอร์ทิ้งเพื่อไม่ให้ไฟล์สะสม
                if (recruitmentId) {
                    const [oldRec] = await connection.query('SELECT Announcement_file FROM recruitment WHERE Recruitment_id = ?', [recruitmentId]);
                    if (oldRec.length > 0 && oldRec[0].Announcement_file && oldRec[0].Announcement_file !== announcementFileVal) {
                        const oldFilePath = path.join(__dirname, '../../uploads/announcements', oldRec[0].Announcement_file);
                        if (fs.existsSync(oldFilePath)) {
                            try {
                                fs.unlinkSync(oldFilePath);
                            } catch (e) {
                                console.error('Error removing old announcement file:', e);
                            }
                        }
                    }
                }
            } else if (recruitmentId) {
                const [oldRec] = await connection.query('SELECT Announcement_file FROM recruitment WHERE Recruitment_id = ?', [recruitmentId]);
                announcementFileVal = oldRec.length > 0 ? oldRec[0].Announcement_file : null;
            } else {
                announcementFileVal = data.announcementFile || data.announcement_file || null;
            }
        }

        let totalPosition = data.generalInfo.amount ? parseInt(data.generalInfo.amount) : 1;
        const roundNo = data.generalInfo?.roundNo ? parseInt(data.generalInfo.roundNo) : 1;
        let minEducationVal = data.reqEducation || (Array.isArray(data.selectedDegrees) ? data.selectedDegrees.join(' หรือ ') : data.selectedDegrees) || null;

        // 🛡️ หากเป็นการนำคำขอจากคณะ/หน่วยงานมาออกประกาศ (recruitmentId)
        // ให้ล็อก Position_id, Department_id, Total_position, Min_education ตามที่คณะขอมา โดย HR ไม่สามารถแก้ไขทับได้
        if (recruitmentId) {
            const [origRecRows] = await connection.query(
                'SELECT Position_id, Department_id, Total_position, Min_education FROM recruitment WHERE Recruitment_id = ?',
                [recruitmentId]
            );
            if (origRecRows.length > 0) {
                positionId = origRecRows[0].Position_id;
                departmentId = origRecRows[0].Department_id;
                if (origRecRows[0].Total_position) {
                    totalPosition = origRecRows[0].Total_position;
                }
                if (origRecRows[0].Min_education) {
                    minEducationVal = origRecRows[0].Min_education;
                }
            }
        }

        if (!recruitmentId) {
            // สร้างประกาศรับสมัครใหม่โดยตรงจาก HR
            const [insertResult] = await connection.query(`
                INSERT INTO recruitment (
                    Announcement_name,
                    Announcement_detail,
                    Announcement_file,
                    Salary_min,
                    Salary_max,
                    Round_no,
                    Total_position,
                    Open_date,
                    Close_date,
                    Min_education,
                    Applicant_detail,
                    Application_condition,
                    Fee_detail,
                    Request_date,
                    Request_status,
                    Position_id,
                    Department_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)
            `, [
                data.generalInfo?.postTitle || data.postTitle || null,
                data.generalInfo?.postDetails || data.postDetails || null,
                announcementFileVal,
                salaryMinVal,
                salaryMaxVal,
                roundNo,
                totalPosition,
                openDateVal,
                closeDateVal,
                minEducationVal,
                data.generalInfo?.applicantDetails || null,
                data.appConditions || null,
                data.feeDetails || null,
                requestStatus,
                positionId,
                departmentId
            ]);
            recruitmentId = insertResult.insertId;
        } else {
            // อัปเดตข้อมูลประกาศเดิม
            await connection.query(`
                UPDATE recruitment 
                SET 
                    Announcement_name = ?,
                    Announcement_detail = ?,
                    Announcement_file = COALESCE(?, Announcement_file),
                    Salary_min = ?,
                    Salary_max = ?,
                    Round_no = ?,
                    Total_position = ?,
                    Open_date = ?,
                    Close_date = ?, 
                    Applicant_detail = ?, 
                    Application_condition = ?,
                    Fee_detail = ?,
                    Min_education = ?,
                    Request_status = ?,
                    Position_id = ?,
                    Department_id = ?
                WHERE Recruitment_id = ?
            `, [
                data.generalInfo?.postTitle || data.postTitle || null,
                data.generalInfo?.postDetails || data.postDetails || null,
                announcementFileVal,
                salaryMinVal,
                salaryMaxVal,
                roundNo,
                totalPosition,
                openDateVal,
                closeDateVal,
                data.generalInfo?.applicantDetails || null,
                data.appConditions || null,
                data.feeDetails || null,
                minEducationVal,
                requestStatus,
                positionId,
                departmentId,
                recruitmentId
            ]);
        }

        // ฟังก์ชันช่วยเหลือสำหรับเคลียร์ข้อมูลเก่าและเพิ่มข้อมูลใหม่ลงในตารางย่อย
        const insertMulti = async (table, column, values) => {
            await connection.query(`DELETE FROM ${table} WHERE Recruitment_id = ?`, [recruitmentId]);
            if (!values || values.length === 0) return;
            for (const val of values) {
                if (val && typeof val === 'string' && val.trim() !== '') {
                    await connection.query(`INSERT INTO ${table} (${column}, Recruitment_id) VALUES (?, ?)`, [val.trim(), recruitmentId]);
                }
            }
        };

        // 2. บันทึกลงตารางย่อยพื้นฐาน
        await insertMulti('job_description', 'Job_description', data.jobResponsibilities);
        await insertMulti('prohibited_characteristic', 'Prohibited_characteristic', data.prohibitedTraits);
        // บันทึกความรู้ความสามารถพิเศษ หรือทักษะเฉพาะตำแหน่ง (additional_skill)
        await insertMulti('additional_skill', 'Additional_skill', data.otherAbilities);
        await insertMulti('application_step', 'Application_step', data.appSteps);

        // ดึงข้อมูล Position_id และ Department_id สำหรับตารางย่อยที่จำเป็น
        const [recRow] = await connection.query(`SELECT Position_id, Department_id FROM recruitment WHERE Recruitment_id = ?`, [recruitmentId]);
        const finalPosId = recRow.length > 0 ? recRow[0].Position_id : positionId;
        const finalDeptId = recRow.length > 0 ? recRow[0].Department_id : departmentId;

        // 3. บันทึกสาขาวิชา (recruitment_major)
        // หากเป็นการสร้างประกาศใหม่โดยตรงจาก HR ให้บันทึกสาขาวิชาใหม่ แต่หากมาจากคำขอของคณะ ให้คงสาขาวิชาเดิมของคณะไว้
        const [existingMajors] = await connection.query(`SELECT Major_name FROM recruitment_major WHERE Recruitment_id = ?`, [recruitmentId]);
        if (existingMajors.length === 0 && (data.reqMajor || data.majorsList)) {
            let majorList = Array.isArray(data.majorsList) && data.majorsList.length > 0
                ? data.majorsList
                : (Array.isArray(data.reqMajor) ? data.reqMajor : String(data.reqMajor || '').split(/,|\s+หรือ\s+/).map(m => m.trim()).filter(Boolean));
            for (const mName of majorList) {
                if (mName && mName.trim()) {
                    await connection.query(`INSERT INTO recruitment_major (Recruitment_id, Major_name) VALUES (?, ?)`, [recruitmentId, mName.trim()]);
                }
            }
        }

        // 4. บันทึกคะแนนภาษาอังกฤษ (engTests)
        await connection.query(`DELETE FROM has_eng_score WHERE Recruitment_id = ?`, [recruitmentId]);
        if (data.engTests && data.engTests.length > 0 && finalPosId && finalDeptId) {
            const [engExamTypes] = await connection.query(`SELECT * FROM eng_exam_type`);
            const insertedEngTypes = new Set();
            for (const test of data.engTests) {
                if (test.testName && (test.minScore !== '' && test.minScore !== null && test.minScore !== undefined)) {
                    const matchType = engExamTypes.find(t => t.Eng_exam_type_name.toLowerCase() === test.testName.toLowerCase() || t.Eng_exam_type_name.replace(/[\s\-_()\/]/g, '').toLowerCase() === test.testName.replace(/[\s\-_()\/]/g, '').toLowerCase());
                    if (matchType && !insertedEngTypes.has(matchType.Eng_exam_type_id)) {
                        insertedEngTypes.add(matchType.Eng_exam_type_id);
                        await connection.query(`INSERT INTO has_eng_score (Min_score, Eng_exam_type_id, Recruitment_id, Position_id, Department_id) VALUES (?, ?, ?, ?, ?)`, 
                        [parseInt(test.minScore) || 0, matchType.Eng_exam_type_id, recruitmentId, finalPosId, finalDeptId]);
                    }
                }
            }
        }

        // 5. บันทึกวิธีการสอบคัดเลือก (exams)
        await connection.query(`DELETE FROM exam_position_type WHERE Recruitment_id = ?`, [recruitmentId]);
        if (data.exams && data.exams.length > 0 && finalPosId && finalDeptId) {
            const [examTypes] = await connection.query(`SELECT * FROM exam_type`);
            const [maxIdRow] = await connection.query(`SELECT MAX(Exam_position_type_id) as maxId FROM exam_position_type`);
            let currentMaxId = maxIdRow[0].maxId || 0;

            for (const exam of data.exams) {
                if (exam.type) {
                    const matchType = examTypes.find(t => t.Exam_type_name === exam.type);
                    if (matchType) {
                        currentMaxId++;
                        await connection.query(`INSERT INTO exam_position_type (Exam_position_type_id, Exam_detail, Exam_type_id, Recruitment_id, Position_id, Department_id) VALUES (?, ?, ?, ?, ?, ?)`, 
                        [currentMaxId, exam.details || '', matchType.Exam_type_id, recruitmentId, finalPosId, finalDeptId]);
                    }
                }
            }
        }

        // 6. บันทึกเอกสารหลักฐาน (application_document)
        await connection.query(`DELETE FROM application_document WHERE Recruitment_id = ?`, [recruitmentId]);
        
        if (data.documentsList && Array.isArray(data.documentsList) && data.documentsList.length > 0) {
            const insertedDocIds = new Set();
            for (const docItem of data.documentsList) {
                let targetDocId = docItem.docId ? parseInt(docItem.docId) : null;
                const detailText = docItem.docDetail !== undefined ? docItem.docDetail : (docItem.detail || '');

                if (!targetDocId && docItem.docName) {
                    const [matchedDocs] = await connection.query(`SELECT Document_id FROM document WHERE Document_name = ?`, [docItem.docName]);
                    if (matchedDocs.length > 0) {
                        targetDocId = matchedDocs[0].Document_id;
                    } else {
                        targetDocId = 4; // เอกสารอื่น
                    }
                }

                if (targetDocId && !insertedDocIds.has(targetDocId)) {
                    insertedDocIds.add(targetDocId);
                    const finalDetail = detailText.length > 255 ? detailText.substring(0, 252) + "..." : detailText;
                    await connection.query(`INSERT INTO application_document (Recruitment_id, Document_id, Document_detail) VALUES (?, ?, ?)`, 
                    [recruitmentId, targetDocId, finalDetail]);
                }
            }
        } else if (data.documents && data.documents.length > 0) {
            const [docs] = await connection.query(`SELECT * FROM document`);
            const docMap = {};
            for (const docStr of data.documents) {
                if (typeof docStr === 'string' && docStr.trim() !== '') {
                    let docId = 4; 
                    for (const d of docs) {
                        if (docStr.includes(d.Document_name)) {
                            docId = d.Document_id;
                            break;
                        }
                    }
                    if (docMap[docId]) {
                        docMap[docId] += ", " + docStr.trim();
                    } else {
                        docMap[docId] = docStr.trim();
                    }
                }
            }
            
            for (const [id, detail] of Object.entries(docMap)) {
                const finalDetail = detail.length > 255 ? detail.substring(0, 252) + "..." : detail;
                await connection.query(`INSERT INTO application_document (Recruitment_id, Document_id, Document_detail) VALUES (?, ?, ?)`, 
                [recruitmentId, parseInt(id), finalDetail]);
            }
        }

        await connection.commit();
        res.status(200).json({ 
            success: true, 
            message: requestStatus === 'HR_Draft' ? 'บันทึกแบบร่างประกาศรับสมัครเรียบร้อยแล้ว' : 'บันทึกและเผยแพร่ประกาศรับสมัครเรียบร้อยแล้ว',
            recruitmentId 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error publishing job posting:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message });
    } finally {
        connection.release();
    }
};

const getAllPostings = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.Recruitment_id AS id,
                p.Position_name AS jobTitle,
                r.Announcement_name AS announcementName,
                r.Announcement_file AS announcementFile,
                r.Round_no AS roundNo,
                d.Department_name AS deptName,
                f.Faculty_name AS facultyName,
                r.Open_date AS openDateRaw,
                r.Close_date AS closeDateRaw,
                r.Request_status AS requestStatus,
                (SELECT COUNT(*) FROM Application a WHERE a.Recruitment_id = r.Recruitment_id AND a.Status != 'Draft') AS applicantCount,
                (SELECT COUNT(*) FROM Application a WHERE a.Recruitment_id = r.Recruitment_id AND (a.Status = 'ผ่านการคัดเลือกเบื้องต้น' OR a.Status = 'รอพิจารณา' OR a.Status = 'ตรวจสอบแล้ว')) AS hrPendingCount,
                (SELECT COUNT(*) FROM Application a WHERE a.Recruitment_id = r.Recruitment_id AND (a.Status = 'ผ่าน' OR a.Status = 'ผ่านการคัดเลือก' OR a.Status = 'ได้งาน')) AS finalPassedCount,
                (SELECT COUNT(*) FROM Application a WHERE a.Recruitment_id = r.Recruitment_id AND (a.Status = 'ไม่ผ่าน' OR a.Status = 'ไม่ผ่านการคัดเลือก')) AS finalRejectedCount,
                (SELECT COUNT(*) FROM has_exam_result her WHERE her.Recruitment_id = r.Recruitment_id AND her.Exam_result = 'รอจัดสอบ') AS examPendingCount,
                (SELECT COUNT(*) FROM has_exam_result her WHERE her.Recruitment_id = r.Recruitment_id AND her.Exam_result = 'ผ่านการสอบ') AS examPassedCount,
                (SELECT COUNT(*) FROM has_exam_result her WHERE her.Recruitment_id = r.Recruitment_id AND her.Exam_result = 'ไม่ผ่าน') AS examFailedCount
            FROM recruitment r
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            WHERE r.Request_status = 'Processed'
            ORDER BY r.Recruitment_id DESC
        `;
        const [rows] = await db.query(query);

        const formatted = rows.map(r => {
            let status = "รอเปิดรับสมัคร";
            if (r.openDateRaw && r.closeDateRaw) {
                const now = new Date();
                const openDate = new Date(r.openDateRaw);
                const closeDate = new Date(r.closeDateRaw);
                closeDate.setHours(23, 59, 59, 999);
                
                if (now >= openDate && now <= closeDate) status = "เปิดรับสมัคร";
                else if (now > closeDate) status = "ปิดรับสมัครแล้ว";
            }

            const cleanFileName = r.announcementFile ? r.announcementFile.replace(/^\/?uploads\/announcements\//, '') : null;
            const fileUrl = cleanFileName
                ? (cleanFileName.startsWith('http') ? cleanFileName : `http://localhost:3000/uploads/announcements/${cleanFileName}`)
                : null;

            return {
                id: r.id,
                rawId: r.id,
                jobTitle: r.jobTitle || 'ไม่ระบุตำแหน่ง',
                announcementName: r.announcementName || '-',
                announcementFile: cleanFileName,
                fileUrl: fileUrl,
                roundNo: r.roundNo ? Number(r.roundNo) : 1,
                round: r.roundNo ? Number(r.roundNo) : 1,
                department: `${r.facultyName || ''} ${r.deptName && r.deptName !== '-' ? r.deptName : ''}`.trim(),
                applicantCount: Number(r.applicantCount || 0),
                waitingExamCount: Number(r.hrPendingCount || 0),
                hrPendingCount: Number(r.hrPendingCount || 0),
                finalPassedCount: Number(r.finalPassedCount || 0),
                finalRejectedCount: Number(r.finalRejectedCount || 0),
                examPendingCount: Number(r.examPendingCount || 0),
                examPassedCount: Number(r.examPassedCount || 0),
                examFailedCount: Number(r.examFailedCount || 0),
                status,
                openDate: r.openDateRaw,
                closeDate: r.closeDateRaw
            };
        });

        const summary = {
            totalJobs: formatted.length,
            activeJobs: formatted.filter(j => j.status === 'เปิดรับสมัคร').length,
            closedJobs: formatted.filter(j => j.status === 'ปิดรับสมัครแล้ว').length,
            totalApplicants: formatted.reduce((sum, j) => sum + (j.applicantCount || 0), 0),
            // ผู้สมัครที่รอจัดสอบ
            totalWaitingExam: formatted.reduce((sum, j) => sum + (j.waitingExamCount || 0), 0),
            totalHrPending: formatted.reduce((sum, j) => sum + (j.waitingExamCount || 0), 0),
            totalFinalPassed: formatted.reduce((sum, j) => sum + (j.finalPassedCount || 0), 0),
            totalFinalRejected: formatted.reduce((sum, j) => sum + (j.finalRejectedCount || 0), 0),
            totalExamPending: formatted.reduce((sum, j) => sum + (j.examPendingCount || 0), 0),
            totalExamPassed: formatted.reduce((sum, j) => sum + (j.examPassedCount || 0), 0),
            totalExamFailed: formatted.reduce((sum, j) => sum + (j.examFailedCount || 0), 0)
        };

        res.json({ success: true, data: formatted, summary });
    } catch (error) {
        console.error('Error fetching job postings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateDeadline = async (req, res) => {
    try {
        const { id } = req.params;
        const { closeDate } = req.body;
        
        if (!closeDate) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุวันที่สิ้นสุดการรับสมัคร' });
        }

        // 1. ตรวจสอบข้อมูลประกาศเดิม
        const [rows] = await db.query(`
            SELECT Recruitment_id, Open_date, Close_date, Round_no 
            FROM recruitment 
            WHERE Recruitment_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบประกาศรับสมัครงาน' });
        }

        const currentRecruit = rows[0];
        let currentRound = currentRecruit.Round_no ? Number(currentRecruit.Round_no) : 1;
        if (isNaN(currentRound) || currentRound < 1) currentRound = 1;

        // 2. ตรวจสอบว่าตำแหน่งนี้ปิดรับสมัครไปแล้วหรือไม่ (วันที่ปิดเดิมผ่านพ้นไปแล้ว)
        let isClosed = false;
        if (currentRecruit.Close_date) {
            const now = new Date();
            const prevClose = new Date(currentRecruit.Close_date);
            prevClose.setHours(23, 59, 59, 999);
            if (now > prevClose) {
                isClosed = true;
            }
        }

        // ถ้าปิดไปแล้ว ให้ += 1 รอบการรับสมัคร (Round_no) ไปเรื่อยๆ
        let newRound = currentRound;
        if (isClosed) {
            newRound = currentRound + 1;
        }

        await db.query(`
            UPDATE recruitment 
            SET Close_date = ?, Round_no = ? 
            WHERE Recruitment_id = ?
        `, [closeDate, newRound, id]);

        res.json({ 
            success: true, 
            message: isClosed 
                ? `ขยายเวลาเปิดรับสมัครสำเร็จ (ปรับเป็นรอบที่ ${newRound})` 
                : 'ขยายเวลาเปิดรับสมัครสำเร็จ',
            roundNo: newRound,
            isNewRound: isClosed
        });
    } catch (error) {
        console.error('Error updating deadline:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

const closeRecruitment = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT Recruitment_id, Open_date, Close_date, Round_no 
            FROM recruitment 
            WHERE Recruitment_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบประกาศรับสมัครงาน' });
        }

        // กำหนด Close_date เป็นเมื่อวานนี้ เพื่อให้สถานะของระบบเปลี่ยนเป็น "ปิดรับสมัครแล้ว" ทันที
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDateYMD(yesterday);

        await db.query(`
            UPDATE recruitment 
            SET Close_date = ? 
            WHERE Recruitment_id = ?
        `, [yesterdayStr, id]);

        res.json({ 
            success: true, 
            message: 'ปิดรับสมัครเรียบร้อยแล้ว',
            closeDate: yesterdayStr
        });
    } catch (error) {
        console.error('Error closing recruitment:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

module.exports = {
    publishJobPosting,
    getAllPostings,
    updateDeadline,
    closeRecruitment
};

