const db = require('../../config/db');

const thaiMonthMap = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
    'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
    'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4, 'พฤษภาคม': 5, 'มิถุนายน': 6,
    'กรกฎาคม': 7, 'สิงหาคม': 8, 'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12
};

// Helper: ตรวจสอบและแปลงค่าให้เป็น ISO Date (YYYY-MM-DD) ที่ถูกต้องสำหรับจัดเก็บลง Database รองรับทั้ง ค.ศ. พ.ศ. และสตริงภาษาไทย
const parseIsoDateForDb = (dateVal, fallbackVal) => {
    const candidate = dateVal || fallbackVal;
    if (!candidate) return null;
    const s = String(candidate).trim();
    if (!s || s === 'รอกำหนดการ' || s === '-' || s.startsWith('0000-00-00') || s.startsWith('1899') || s.startsWith('1900')) {
        return null;
    }
    // หากเป็นสตริง YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const iso = s.split('T')[0].split(' ')[0];
        const parts = iso.split('-');
        let y = parseInt(parts[0], 10);
        if (y >= 2400 && y <= 2700) y -= 543;
        if (y >= 2000 && y <= 2100) {
            return `${y}-${parts[1]}-${parts[2]}`;
        }
    }
    // หากเป็นสตริงข้อความภาษาไทย เช่น "20 ต.ค. 2569" หรือ "15 พฤศจิกายน 2567"
    for (const [mName, mNum] of Object.entries(thaiMonthMap)) {
        if (s.includes(mName)) {
            const parts = s.split(/\s+/);
            const d = parseInt(parts[0], 10);
            let y = parseInt(parts[2] || parts[parts.length - 1], 10);
            if (!isNaN(y) && y >= 2400 && y <= 2700) y -= 543;
            if (!isNaN(d) && !isNaN(y) && y >= 2000 && y <= 2100 && d >= 1 && d <= 31) {
                return `${y}-${String(mNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            }
        }
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
        let y = d.getFullYear();
        if (y >= 2400 && y <= 2700) y -= 543;
        if (y >= 2000 && y <= 2100) {
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
    }
    return null;
};

// Helper: ตรวจสอบว่าวันที่จาก DB เป็นวันที่ใช้งานได้จริงหรือไม่ (ไม่เป็น 0000-00-00, null, หรือปีก่อน 2000)
const isValidDbDate = (dateVal) => {
    if (!dateVal) return false;
    const s = String(dateVal).trim();
    if (s.startsWith('0000-00-00') || s.startsWith('1899') || s.startsWith('1900') || s === 'รอกำหนดการ' || s === '-') {
        return false;
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
        let y = d.getFullYear();
        if (y >= 2400 && y <= 2700) y -= 543;
        return y >= 2000 && y <= 2100;
    }
    return false;
};

const getApplicationTracking = async (req, res) => {
    try {
        let { id } = req.params;
        let applicationId = id;
        if (typeof id === 'string' && id.startsWith('APP-')) {
            applicationId = parseInt(id.replace(/^APP-0*/i, ''), 10) || id;
        }

        const query = `
            SELECT 
                app.Application_id as appId,
                app.Apply_date as appliedDateRaw,
                app.Apply_time as appliedTimeRaw,
                app.Status as overallStatus,
                p.Position_name as jobTitle,
                r.Announcement_name as announcementTitle,
                r.Open_date as openDateRaw,
                r.Close_date as closeDateRaw,
                d.Department_name as Department_name,
                f.Faculty_name as Faculty_name,
                app.Recruitment_id,
                app.Applicant_id
            FROM Application app
            LEFT JOIN recruitment r ON app.Recruitment_id = r.Recruitment_id
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            WHERE app.Application_id = ?
        `;
        const [rows] = await db.query(query, [applicationId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        const appData = rows[0];

        const examQuery = `
            SELECT 
                ept.Exam_position_type_id,
                et.Exam_type_name as name,
                ept.Is_announced
            FROM exam_position_type ept
            LEFT JOIN exam_type et ON ept.Exam_type_id = et.Exam_type_id
            WHERE ept.Recruitment_id = ?
        `;
        const [examRows] = await db.query(examQuery, [appData.Recruitment_id]);

        const resultQuery = `
            SELECT 
                Exam_position_type_id,
                Exam_result as status,
                Exam_score as score,
                Exam_date as examDate,
                Exam_time as examTime,
                Exam_location as examLocation
            FROM has_exam_result
            WHERE Application_id = ?
        `;
        const [resultRows] = await db.query(resultQuery, [applicationId]);

        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const formatDate = (dateRaw) => {
            if (!isValidDbDate(dateRaw)) return 'รอกำหนดการ';
            const date = new Date(dateRaw);
            if (isNaN(date.getTime())) return 'รอกำหนดการ';
            return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
        };

        const formatIsoDate = (dateRaw) => {
            if (!isValidDbDate(dateRaw)) return '';
            const d = new Date(dateRaw);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const exams = examRows.map(exam => {
            const result = resultRows.find(r => r.Exam_position_type_id === exam.Exam_position_type_id);
            let status = 'รอจัดสอบ';
            let score = '';
            if (result) {
                if (result.status) {
                    if (result.status.includes('|')) {
                        const parts = result.status.split('|');
                        status = parts[0];
                        score = parts[1];
                    } else {
                        status = result.status;
                    }
                }
                if (result.score !== null && result.score !== undefined && result.score !== '') {
                    score = String(result.score);
                }
            }

            const effectiveDate = isValidDbDate(result?.examDate) ? result.examDate : null;
            const effectiveTime = (result?.examTime && result.examTime !== '00:00:00' && result.examTime !== 'รอกำหนดการ') ? result.examTime : '';
            const effectiveLocation = (result?.examLocation && result.examLocation !== 'รอกำหนดการ') ? result.examLocation : '';

            const isAnnounced = String(exam.Is_announced).toLowerCase() === 'true' || exam.Is_announced === 1 || exam.Is_announced === true;

            // ปรับสถานะให้อิง 4 สถานะหลัก: รอจัดการสอบ, รอแจ้งผลคะแนน, ผ่าน, ไม่ผ่าน
            let normalizedStatus = 'รอจัดการสอบ';
            if (status === 'ผ่านการสอบ' || status === 'ผ่าน') {
                normalizedStatus = 'ผ่าน';
            } else if (status === 'ไม่ผ่านการสอบ' || status === 'ไม่ผ่าน') {
                normalizedStatus = 'ไม่ผ่าน';
            } else if (status === 'รอแจ้งผลคะแนน' || (effectiveDate && status !== 'ไม่ผ่าน' && status !== 'ผ่าน')) {
                normalizedStatus = 'รอแจ้งผลคะแนน';
            } else {
                normalizedStatus = 'รอจัดการสอบ';
            }

            return {
                Exam_position_type_id: exam.Exam_position_type_id,
                name: exam.name || 'สอบ',
                date: formatDate(effectiveDate),
                rawDate: formatIsoDate(effectiveDate),
                isoDate: formatIsoDate(effectiveDate),
                time: effectiveTime,
                location: effectiveLocation,
                isAnnounced,
                status: normalizedStatus,
                score
            };
        });

        const rawStatus = appData.overallStatus || '';
        let normalizedStatus = 'รอคณะ/หน่วยงานพิจารณา';
        let statusDescription = 'อยู่ระหว่างคณะ/หน่วยงานตรวจสอบคุณสมบัติเบื้องต้น';
        let statusColor = 'info';

        const totalExamsCount = exams.length;
        const passedExamsCount = exams.filter(e => e.status === 'ผ่าน' || e.status === 'ผ่านการสอบ').length;
        const failedExamsCount = exams.filter(e => e.status === 'ไม่ผ่าน' || e.status === 'ไม่ผ่านการสอบ').length;

        const isDirectPassed = rawStatus === 'ผ่าน' || rawStatus === 'ผ่านการคัดเลือก' || rawStatus === 'ได้งาน';
        const isDirectFailed = rawStatus === 'ไม่ผ่าน' || rawStatus === 'ไม่ผ่านการคัดเลือก' || rawStatus.includes('ไม่ผ่าน');
        const allExamsPassed = totalExamsCount > 0 && passedExamsCount === totalExamsCount;
        const anyExamFailed = failedExamsCount > 0;

        if (isDirectPassed || allExamsPassed) {
            normalizedStatus = 'ผ่าน';
            statusDescription = 'ขอแสดงความยินดี! ท่านผ่านการทดสอบทุกขั้นตอนและได้รับการคัดเลือกในตำแหน่งนี้เรียบร้อยแล้ว';
            statusColor = 'success';
        } else if (isDirectFailed || anyExamFailed) {
            normalizedStatus = 'ไม่ผ่าน';
            statusDescription = 'ท่านไม่ผ่านการคัดเลือกในตำแหน่งนี้';
            statusColor = 'danger';
        } else if (rawStatus === 'รอพิจารณา' || rawStatus === 'ผ่านการคัดเลือกเบื้องต้น' || rawStatus === 'ตรวจสอบแล้ว') {
            normalizedStatus = 'รอพิจารณา';
            statusDescription = 'ผ่านการคัดเลือกคุณสมบัติเบื้องต้นแล้ว อยู่ระหว่างขั้นตอนการทดสอบและประเมินผล';
            statusColor = 'warning';
        } else {
            normalizedStatus = 'รอคณะ/หน่วยงานพิจารณา';
            statusDescription = 'อยู่ระหว่างคณะ/หน่วยงานตรวจสอบคุณสมบัติเบื้องต้น';
            statusColor = 'info';
        }

        let currentStep = 1;
        if (normalizedStatus === 'รอคณะ/หน่วยงานพิจารณา') {
            currentStep = 1;
        } else if (normalizedStatus === 'รอพิจารณา') {
            if (exams.length > 0) {
                const pendingExamIdx = exams.findIndex(e => e.status !== 'ผ่าน' && e.status !== 'ผ่านการสอบ');
                currentStep = pendingExamIdx !== -1 ? pendingExamIdx + 2 : exams.length + 2;
            } else {
                currentStep = 2;
            }
        } else if (normalizedStatus === 'ผ่าน') {
            currentStep = exams.length > 0 ? exams.length + 2 : 2;
        } else if (normalizedStatus === 'ไม่ผ่าน') {
            if (anyExamFailed) {
                const failedExamIdx = exams.findIndex(e => e.status === 'ไม่ผ่าน' || e.status === 'ไม่ผ่านการสอบ');
                currentStep = failedExamIdx !== -1 ? failedExamIdx + 2 : exams.length + 2;
            } else if (rawStatus.includes('เบื้องต้น') || rawStatus.includes('ตรวจสอบ')) {
                currentStep = 1;
            } else {
                currentStep = exams.length > 0 ? exams.length + 2 : 2;
            }
        }

        res.json({
            success: true,
            data: {
                ...appData,
                appliedDate: formatDate(appData.appliedDateRaw),
                appliedTime: appData.appliedTimeRaw ? String(appData.appliedTimeRaw).substring(0, 5) : '-',
                openDateFormatted: formatDate(appData.openDateRaw),
                closeDateFormatted: formatDate(appData.closeDateRaw),
                facultyName: appData.Faculty_name || 'ไม่ระบุคณะ',
                departmentName: appData.Department_name || 'ไม่ระบุหน่วยงาน/ภาควิชา',
                overallStatus: normalizedStatus,
                statusDescription,
                statusColor,
                currentStep,
                exams
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateEvaluation = async (req, res) => {
    try {
        let { id } = req.params;
        let appId = id;
        if (typeof appId === 'string' && appId.startsWith('APP-')) {
            appId = parseInt(appId.replace(/^APP-0*/i, ''), 10) || appId;
        }

        const { qualStatus, finalStatus, exams, emailSubject, emailBody, sendEmail } = req.body;
        const db = require('../../config/db');
        const emailService = require('../../services/emailService');

        const [appRows] = await db.query(`
            SELECT 
                app.Application_id, app.Recruitment_id, app.Applicant_id, r.Position_id, r.Department_id,
                COALESCE(NULLIF(TRIM(ah.Email), ''), NULLIF(TRIM(ap.Email), ''), '') AS Email,
                COALESCE(NULLIF(TRIM(ah.First_name), ''), NULLIF(TRIM(ap.First_name), ''), '') AS First_name,
                COALESCE(NULLIF(TRIM(ah.Last_name), ''), NULLIF(TRIM(ap.Last_name), ''), '') AS Last_name,
                COALESCE(NULLIF(TRIM(ah.Prefix), ''), NULLIF(TRIM(ap.Prefix), ''), '') AS Prefix,
                p.Position_name, f.Faculty_name, d.Department_name
            FROM Application app
            JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
            LEFT JOIN application_history ah ON (TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id) AND app.Recruitment_id = ah.Recruitment_id)
            LEFT JOIN Recruitment r ON app.Recruitment_id = r.Recruitment_id
            LEFT JOIN Position p ON r.Position_id = p.Position_id
            LEFT JOIN Department d ON r.Department_id = d.Department_id
            LEFT JOIN Faculty f ON d.Faculty_id = f.Faculty_id
            WHERE app.Application_id = ?
            LIMIT 1
        `, [appId]);

        if (appRows.length === 0) {
            console.error(`[HR Evaluation] Application not found with id: ${appId}`);
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลใบสมัคร' });
        }
        const appInfo = appRows[0];

        if (finalStatus && finalStatus !== 'รอพิจารณา') {
            await db.query('UPDATE Application SET Status = ? WHERE Application_id = ?', [finalStatus, appId]);
        } else if (qualStatus) {
            await db.query('UPDATE Application SET Status = ? WHERE Application_id = ?', [qualStatus, appId]);
        }

        if (exams && exams.length > 0) {
            for (const exam of exams) {
                // ดึงเฉพาะ ISO Date (YYYY-MM-DD) หากเป็นข้อความภาษาไทย หรือไม่มี ให้เป็น null เพื่อให้ COALESCE รักษาค่าเดิมไว้
                const examDate = parseIsoDateForDb(exam.rawDate || exam.isoDate, exam.date);
                const examTime = (exam.time && typeof exam.time === 'string' && exam.time.trim() && exam.time !== 'รอกำหนดการ' && exam.time !== '00:00:00') ? exam.time.trim() : null;
                const examLocation = (exam.location && typeof exam.location === 'string' && exam.location.trim() && exam.location !== 'รอกำหนดการ') ? exam.location.trim() : null;

                const isAnnounced = (exam.isAnnounced !== undefined) ? (exam.isAnnounced ? 'True' : 'False') : null;
                if (isAnnounced !== null) {
                    await db.query('UPDATE exam_position_type SET Is_announced = ? WHERE Exam_position_type_id = ?', 
                        [isAnnounced, exam.Exam_position_type_id]);
                }

                const [existing] = await db.query('SELECT * FROM has_exam_result WHERE Application_id = ? AND Exam_position_type_id = ?', [appId, exam.Exam_position_type_id]);
                if (existing.length > 0) {
                    await db.query(
                        'UPDATE has_exam_result SET Exam_result = COALESCE(?, Exam_result), Exam_score = COALESCE(?, Exam_score), Exam_date = COALESCE(?, Exam_date), Exam_time = COALESCE(?, Exam_time), Exam_location = COALESCE(?, Exam_location) WHERE Application_id = ? AND Exam_position_type_id = ?', 
                        [exam.status || null, (exam.score !== undefined && exam.score !== null && exam.score !== '') ? parseFloat(exam.score) : null, examDate, examTime, examLocation, appId, exam.Exam_position_type_id]
                    );
                } else {
                    await db.query(
                        'INSERT INTO has_exam_result (Exam_result, Exam_score, Exam_date, Exam_time, Exam_location, Application_id, Exam_position_type_id, Applicant_id, Recruitment_id, Position_id, Department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                        [exam.status || 'รอจัดสอบ', (exam.score !== undefined && exam.score !== null && exam.score !== '') ? parseFloat(exam.score) : null, examDate, examTime, examLocation, appId, exam.Exam_position_type_id, appInfo.Applicant_id, appInfo.Recruitment_id, appInfo.Position_id || 0, appInfo.Department_id || 0]
                    );
                }
            }

            // ตรวจสอบและซิงค์สถานะ Application.Status อัตโนมัติจากผลการสอบทั้งหมด
            const [allExamRows] = await db.query(
                `SELECT ept.Exam_position_type_id, her.Exam_result
                 FROM exam_position_type ept
                 LEFT JOIN has_exam_result her ON ept.Exam_position_type_id = her.Exam_position_type_id AND her.Application_id = ?
                 WHERE ept.Recruitment_id = ?`,
                [appId, appInfo.Recruitment_id]
            );
            if (allExamRows.length > 0) {
                const hasFailed = allExamRows.some(r => r.Exam_result === 'ไม่ผ่าน' || r.Exam_result === 'ไม่ผ่านการสอบ');
                const allPassed = allExamRows.every(r => r.Exam_result === 'ผ่าน' || r.Exam_result === 'ผ่านการสอบ');

                if (allPassed && (!finalStatus || finalStatus === 'รอพิจารณา' || finalStatus === 'ผ่านการคัดเลือกเบื้องต้น')) {
                    await db.query('UPDATE Application SET Status = "ได้งาน" WHERE Application_id = ?', [appId]);
                } else if (hasFailed && (!finalStatus || finalStatus === 'รอพิจารณา' || finalStatus === 'ผ่านการคัดเลือกเบื้องต้น')) {
                    await db.query('UPDATE Application SET Status = "ไม่ผ่านการคัดเลือก" WHERE Application_id = ?', [appId]);
                }
            }
        }

        // ส่งอีเมลแจ้งผลจาก HR หากระบุหัวข้อและเนื้อหา
        let emailResult = null;
        if (sendEmail !== false && (emailBody || emailSubject)) {
            const fullName = `${appInfo.Prefix || ''}${appInfo.First_name || ''} ${appInfo.Last_name || ''}`.trim();
            console.log(`[HR Evaluation] กำลังส่งอีเมลไปยัง: "${appInfo.Email}" (${fullName})`);
            if (appInfo.Email) {
                emailResult = await emailService.sendHrEvaluationEmail({
                    to: appInfo.Email,
                    applicantName: fullName,
                    positionTitle: appInfo.Position_name || 'ตำแหน่งงาน',
                    subject: emailSubject,
                    emailBody: emailBody
                });
                console.log(`[HR Evaluation] ผลการส่งอีเมล:`, emailResult);
            } else {
                console.warn(`[HR Evaluation] ไม่พบอีเมลของผู้สมัครสำหรับ Application_id ${appId}`);
            }
        }

        res.json({ 
            success: true, 
            message: 'Saved successfully',
            emailSent: emailResult ? emailResult.success : false,
            emailError: emailResult && !emailResult.success ? emailResult.error || emailResult.message : null
        });
    } catch (error) {
        console.error('[HR Evaluation Error]:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

/**
 * นัดหมายสอบและส่งอีเมลแจ้งกำหนดการสอบพร้อมกันหลายคน
 */
const batchScheduleExams = async (req, res) => {
    try {
        const { recruitmentId, applicationIds, exams, announcements, initialAnnounce, finalAnnounce, emailSubject, emailBodyTemplate, sendEmail } = req.body;
        const db = require('../../config/db');
        const emailService = require('../../services/emailService');

        // 1. อัปเดตสถานะประกาศรอบคัดเลือกเบื้องต้น (Initial screening)
        if (initialAnnounce !== undefined && recruitmentId) {
            const isInit = (initialAnnounce.isAnnounced !== undefined && initialAnnounce.isAnnounced !== false && String(initialAnnounce.isAnnounced).toLowerCase() !== 'false') ? 'True' : 'False';
            await db.query('UPDATE recruitment SET Is_initial_announced = ? WHERE Recruitment_id = ?', [isInit, recruitmentId]);
        }

        // 2. อัปเดตสถานะประกาศผลรอบสุดท้าย (Final selection)
        if (finalAnnounce !== undefined && recruitmentId) {
            const isFin = (finalAnnounce.isAnnounced !== undefined && finalAnnounce.isAnnounced !== false && String(finalAnnounce.isAnnounced).toLowerCase() !== 'false') ? 'True' : 'False';
            await db.query('UPDATE recruitment SET Is_final_announced = ? WHERE Recruitment_id = ?', [isFin, recruitmentId]);
        }

        // หากส่งมาเฉพาะประกาศรอบคัดเลือกเบื้องต้น หรือประกาศผลรอบสุดท้าย (ไม่ต้องระบุการสอบหรือกำหนดการนัดสอบ)
        if ((initialAnnounce !== undefined || finalAnnounce !== undefined) && (!exams || exams.length === 0) && (!announcements || announcements.length === 0) && (!applicationIds || applicationIds.length === 0)) {
            const actionMsg = initialAnnounce
                ? (initialAnnounce.isAnnounced ? 'เผยแพร่ประกาศรายชื่อผู้ผ่านการคัดเลือกเบื้องต้นสำเร็จ' : 'บันทึกแบบร่างประกาศรายชื่อผู้ผ่านการคัดเลือกเบื้องต้นสำเร็จ')
                : (finalAnnounce.isAnnounced ? 'เผยแพร่ประกาศผลการคัดเลือกสำเร็จ' : 'บันทึกแบบร่างประกาศผลการคัดเลือกสำเร็จ');
            return res.json({ success: true, message: actionMsg });
        }

        // 3. รูปแบบที่ 1: มาจากหน้า CreateExamAnnouncement (ส่ง announcements array แบบ legacy)
        if (Array.isArray(announcements) && announcements.length > 0) {
            for (const announce of announcements) {
                const topic = (announce.topicType || '').trim();
                const isAnnounced = (announce.isAnnounced !== undefined && announce.isAnnounced !== false && String(announce.isAnnounced).toLowerCase() !== 'false') ? 'True' : 'False';

                // ตรวจสอบว่าเป็นประกาศรอบคัดเลือกเบื้องต้นหรือไม่
                if (topic.includes('เบื้องต้น') || topic.includes('คุณสมบัติ')) {
                    if (recruitmentId) {
                        await db.query('UPDATE recruitment SET Is_initial_announced = ? WHERE Recruitment_id = ?', [isAnnounced, recruitmentId]);
                    }
                }

                // ตรวจสอบว่าเป็นประกาศผลการคัดเลือก (รอบสุดท้าย) หรือไม่
                if (topic.includes('สุดท้าย') || topic.includes('ผลการคัดเลือก')) {
                    if (recruitmentId) {
                        await db.query('UPDATE recruitment SET Is_final_announced = ? WHERE Recruitment_id = ?', [isAnnounced, recruitmentId]);
                    }
                }

                // หากระบุ examPositionTypeId หรือหัวข้อตรงกับวิชาสอบใน exam_position_type
                let eptId = announce.examPositionTypeId;
                if (!eptId && recruitmentId) {
                    const [eptRows] = await db.query(`
                        SELECT ept.Exam_position_type_id, et.Exam_type_name
                        FROM exam_position_type ept
                        JOIN exam_type et ON ept.Exam_type_id = et.Exam_type_id
                        WHERE ept.Recruitment_id = ?
                    `, [recruitmentId]);
                    const matched = eptRows.find(r => topic.includes(r.Exam_type_name));
                    if (matched) {
                        eptId = matched.Exam_position_type_id;
                    }
                }

                if (eptId) {
                    await db.query(
                        'UPDATE exam_position_type SET Is_announced = ? WHERE Exam_position_type_id = ?',
                        [isAnnounced, eptId]
                    );

                    // อัปเดตรายบุคคลใน has_exam_result
                    if (Array.isArray(announce.candidates) && announce.candidates.length > 0) {
                        for (const cand of announce.candidates) {
                            const rawId = cand.rawId || (typeof cand.appId === 'number' ? cand.appId : parseInt(String(cand.appId).replace(/\D/g, ''), 10));
                            if (!rawId) continue;

                            const cDate = parseIsoDateForDb(cand.date, cand.rawDate || cand.isoDate);
                            const cTime = (cand.time && typeof cand.time === 'string' && cand.time.trim() && cand.time !== 'รอกำหนดการ' && cand.time !== '00:00:00') ? cand.time.trim() : null;
                            const cLoc = (cand.location && typeof cand.location === 'string' && cand.location.trim() && cand.location !== 'รอกำหนดการ') ? cand.location.trim() : null;

                            const [existing] = await db.query('SELECT * FROM has_exam_result WHERE Application_id = ? AND Exam_position_type_id = ?', [rawId, eptId]);
                            if (existing.length > 0) {
                                const finalDate = (cand.date !== undefined && (!cand.date || cand.date === 'รอกำหนดการ' || cand.date === '-')) ? null : (cDate || existing[0].Exam_date);
                                const finalTime = (cand.time !== undefined && (!cand.time || cand.time === 'รอกำหนดการ' || cand.time === '-' || cand.time === '00:00:00')) ? null : (cTime || existing[0].Exam_time);
                                const finalLoc = (cand.location !== undefined && (!cand.location || cand.location === 'รอกำหนดการ' || cand.location === '-')) ? null : (cLoc || existing[0].Exam_location);

                                await db.query(
                                    'UPDATE has_exam_result SET Exam_date = ?, Exam_time = ?, Exam_location = ? WHERE Application_id = ? AND Exam_position_type_id = ?',
                                    [finalDate, finalTime, finalLoc, rawId, eptId]
                                );
                            } else {
                                const [appInfoRows] = await db.query('SELECT app.Applicant_id, app.Recruitment_id, r.Position_id, r.Department_id FROM Application app LEFT JOIN recruitment r ON app.Recruitment_id = r.Recruitment_id WHERE app.Application_id = ?', [rawId]);
                                const appInfo = appInfoRows[0] || {};
                                await db.query(
                                    'INSERT INTO has_exam_result (Exam_result, Exam_date, Exam_time, Exam_location, Application_id, Exam_position_type_id, Applicant_id, Recruitment_id, Position_id, Department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                    ['รอจัดสอบ', cDate, cTime, cLoc, rawId, eptId, appInfo.Applicant_id, appInfo.Recruitment_id || recruitmentId, appInfo.Position_id || 0, appInfo.Department_id || 0]
                                );
                            }
                        }
                    }
                }
            }

            return res.json({ success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
        }

        // 4. รูปแบบที่ 2: มาจากหน้าจัดการประกาศที่มี array exams โดยตรง
        if (Array.isArray(exams) && exams.length > 0 && !Array.isArray(applicationIds)) {
            for (const exam of exams) {
                const eptId = exam.examPositionTypeId || exam.Exam_position_type_id || exam.id;
                if (!eptId) continue;

                if (exam.isAnnounced !== undefined) {
                    const isAnn = (exam.isAnnounced !== false && String(exam.isAnnounced).toLowerCase() !== 'false') ? 'True' : 'False';
                    await db.query('UPDATE exam_position_type SET Is_announced = ? WHERE Exam_position_type_id = ?', [isAnn, eptId]);
                }

                if (Array.isArray(exam.candidates) && exam.candidates.length > 0) {
                    for (const cand of exam.candidates) {
                        const rawId = cand.rawId || (typeof cand.appId === 'number' ? cand.appId : parseInt(String(cand.appId).replace(/\D/g, ''), 10));
                        if (!rawId) continue;

                        const cDate = parseIsoDateForDb(cand.date, cand.rawDate || cand.isoDate);
                        const cTime = (cand.time && typeof cand.time === 'string' && cand.time.trim() && cand.time !== 'รอกำหนดการ' && cand.time !== '00:00:00') ? cand.time.trim() : null;
                        const cLoc = (cand.location && typeof cand.location === 'string' && cand.location.trim() && cand.location !== 'รอกำหนดการ') ? cand.location.trim() : null;

                        const [existing] = await db.query('SELECT * FROM has_exam_result WHERE Application_id = ? AND Exam_position_type_id = ?', [rawId, eptId]);
                        if (existing.length > 0) {
                            const finalDate = (cand.date !== undefined && (!cand.date || cand.date === 'รอกำหนดการ' || cand.date === '-')) ? null : (cDate || existing[0].Exam_date);
                            const finalTime = (cand.time !== undefined && (!cand.time || cand.time === 'รอกำหนดการ' || cand.time === '-' || cand.time === '00:00:00')) ? null : (cTime || existing[0].Exam_time);
                            const finalLoc = (cand.location !== undefined && (!cand.location || cand.location === 'รอกำหนดการ' || cand.location === '-')) ? null : (cLoc || existing[0].Exam_location);

                            await db.query(
                                'UPDATE has_exam_result SET Exam_date = ?, Exam_time = ?, Exam_location = ? WHERE Application_id = ? AND Exam_position_type_id = ?',
                                [finalDate, finalTime, finalLoc, rawId, eptId]
                            );
                        } else {
                            const [appInfoRows] = await db.query('SELECT app.Applicant_id, app.Recruitment_id, r.Position_id, r.Department_id FROM Application app LEFT JOIN recruitment r ON app.Recruitment_id = r.Recruitment_id WHERE app.Application_id = ?', [rawId]);
                            const appInfo = appInfoRows[0] || {};
                            await db.query(
                                'INSERT INTO has_exam_result (Exam_result, Exam_date, Exam_time, Exam_location, Application_id, Exam_position_type_id, Applicant_id, Recruitment_id, Position_id, Department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                ['รอจัดสอบ', cDate, cTime, cLoc, rawId, eptId, appInfo.Applicant_id, appInfo.Recruitment_id || recruitmentId, appInfo.Position_id || 0, appInfo.Department_id || 0]
                            );
                        }
                    }
                }
            }

            return res.json({ success: true, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
        }

        if (!exams || !Array.isArray(exams)) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุกำหนดการสอบ' });
        }

        // 1. อัปเดตสถานะประกาศในระดับวิชาสอบ (exam_position_type)
        for (const exam of exams) {
            const isAnnounced = (exam.isAnnounced !== undefined) ? (exam.isAnnounced ? 'True' : 'False') : null;
            if (isAnnounced !== null) {
                await db.query(
                    'UPDATE exam_position_type SET Is_announced = ? WHERE Exam_position_type_id = ?',
                    [isAnnounced, exam.Exam_position_type_id || exam.id]
                );
            }
        }

        // 2. อัปเดตวัน เวลา สถานที่สอบ ในระดับรายบุคคลของผู้สมัครที่เลือก (has_exam_result)
        if (Array.isArray(applicationIds) && applicationIds.length > 0) {
            for (const appId of applicationIds) {
                for (const exam of exams) {
                    const eptId = exam.Exam_position_type_id || exam.id;
                    const examDate = parseIsoDateForDb(exam.rawDate || exam.isoDate, exam.date);
                    const examTime = (exam.time && typeof exam.time === 'string' && exam.time.trim() && exam.time !== 'รอกำหนดการ' && exam.time !== '00:00:00') ? exam.time.trim() : null;
                    const examLocation = (exam.location && typeof exam.location === 'string' && exam.location.trim() && exam.location !== 'รอกำหนดการ') ? exam.location.trim() : null;

                    const [existing] = await db.query('SELECT * FROM has_exam_result WHERE Application_id = ? AND Exam_position_type_id = ?', [appId, eptId]);
                    if (existing.length > 0) {
                        await db.query(
                            'UPDATE has_exam_result SET Exam_date = COALESCE(?, Exam_date), Exam_time = COALESCE(?, Exam_time), Exam_location = COALESCE(?, Exam_location), Exam_result = CASE WHEN Exam_result IS NULL OR Exam_result IN ("รอจัดสอบ", "รอจัดการสอบ") THEN "รอแจ้งผลคะแนน" ELSE Exam_result END WHERE Application_id = ? AND Exam_position_type_id = ?',
                            [examDate, examTime, examLocation, appId, eptId]
                        );
                    } else {
                        const [appInfoRows] = await db.query('SELECT app.Applicant_id, app.Recruitment_id, r.Position_id, r.Department_id FROM Application app LEFT JOIN recruitment r ON app.Recruitment_id = r.Recruitment_id WHERE app.Application_id = ?', [appId]);
                        const appInfo = appInfoRows[0] || {};
                        const initialExamStatus = (examDate || sendEmail !== false) ? 'รอแจ้งผลคะแนน' : 'รอจัดการสอบ';
                        await db.query(
                            'INSERT INTO has_exam_result (Exam_result, Exam_date, Exam_time, Exam_location, Application_id, Exam_position_type_id, Applicant_id, Recruitment_id, Position_id, Department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [initialExamStatus, examDate, examTime, examLocation, appId, eptId, appInfo.Applicant_id, appInfo.Recruitment_id || recruitmentId, appInfo.Position_id || 0, appInfo.Department_id || 0]
                        );
                    }
                }
            }
        }

        // 3. หากมีรายชื่อผู้สมัครที่เลือกส่งอีเมล
        let sentCount = 0;
        let errors = [];

        if (sendEmail !== false && Array.isArray(applicationIds) && applicationIds.length > 0) {
            // ดึงข้อมูลผู้สมัครตาม applicationIds
            const placeholders = applicationIds.map(() => '?').join(',');
            const [appRows] = await db.query(`
                SELECT 
                    app.Application_id, app.Recruitment_id, app.Applicant_id,
                    COALESCE(NULLIF(TRIM(ah.Email), ''), NULLIF(TRIM(ap.Email), ''), '') AS Email,
                    COALESCE(NULLIF(TRIM(ah.First_name), ''), NULLIF(TRIM(ap.First_name), ''), '') AS First_name,
                    COALESCE(NULLIF(TRIM(ah.Last_name), ''), NULLIF(TRIM(ap.Last_name), ''), '') AS Last_name,
                    COALESCE(NULLIF(TRIM(ah.Prefix), ''), NULLIF(TRIM(ap.Prefix), ''), '') AS Prefix,
                    p.Position_name, f.Faculty_name, d.Department_name
                FROM Application app
                JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
                LEFT JOIN application_history ah ON (TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id) AND app.Recruitment_id = ah.Recruitment_id)
                LEFT JOIN Recruitment r ON app.Recruitment_id = r.Recruitment_id
                LEFT JOIN Position p ON r.Position_id = p.Position_id
                LEFT JOIN Department d ON r.Department_id = d.Department_id
                LEFT JOIN Faculty f ON d.Faculty_id = f.Faculty_id
                WHERE app.Application_id IN (${placeholders})
            `, applicationIds);

            for (const app of appRows) {
                const prefix = (app.Prefix || '').trim();
                const fullName = `${prefix}${app.First_name || ''} ${app.Last_name || ''}`.trim();
                if (!app.Email) {
                    errors.push(`ผู้สมัคร ${fullName} ไม่มีอีเมลในระบบ`);
                    continue;
                }

                // ปรับแต่งข้อความอีเมลเฉพาะบุคคล เช่น "เรียน นายสมชาย ใจดี," หรือ "เรียน คุณ..."
                const hasTitle = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'].some(t => fullName.startsWith(t));
                const salutation = hasTitle ? fullName : `คุณ${fullName}`;

                let personalizedBody = emailBodyTemplate || '';
                if (/^เรียน\s+[^,\n]+,/m.test(personalizedBody)) {
                    personalizedBody = personalizedBody.replace(/^เรียน\s+[^,\n]+,/m, `เรียน ${salutation},`);
                } else if (personalizedBody.trim()) {
                    personalizedBody = `เรียน ${salutation},\n\n` + personalizedBody;
                }

                try {
                    const result = await emailService.sendHrEvaluationEmail({
                        to: app.Email,
                        applicantName: salutation,
                        positionTitle: app.Position_name || 'ตำแหน่งงาน',
                        subject: emailSubject || `แจ้งกำหนดการสอบ: ตำแหน่ง ${app.Position_name || 'ตำแหน่งงาน'} - มหาวิทยาลัยเกษตรศาสตร์`,
                        emailBody: personalizedBody
                    });

                    if (result && result.success) {
                        sentCount++;
                    } else {
                        errors.push(`ส่งอีเมลให้ ${salutation} ไม่สำเร็จ: ${result?.error || 'Unknown error'}`);
                    }
                } catch (err) {
                    errors.push(`ส่งอีเมลให้ ${salutation} ไม่สำเร็จ: ${err.message}`);
                }
            }
        }

        res.json({
            success: true,
            message: `บันทึกกำหนดการสอบเรียบร้อยแล้ว${sentCount > 0 ? ` และส่งอีเมลสำเร็จ ${sentCount} ท่าน` : ''}`,
            sentCount,
            totalRequested: applicationIds ? applicationIds.length : 0,
            errors: errors.length > 0 ? errors : null
        });
    } catch (error) {
        console.error('[batchScheduleExams Error]:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

/**
 * ส่งอีเมลแจ้งผลสอบพร้อมกันหลายคน
 */
const batchSendResults = async (req, res) => {
    try {
        const { recruitmentId, applicantsResults } = req.body;
        // applicantsResults = [ { applicationId, email, name, positionTitle, subject, body } ]
        const emailService = require('../../services/emailService');

        if (!Array.isArray(applicantsResults) || applicantsResults.length === 0) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุรายชื่อผู้สมัครและผลสอบที่ต้องการส่ง' });
        }

        let sentCount = 0;
        let errors = [];

        for (const item of applicantsResults) {
            if (!item.email) {
                errors.push(`ผู้สมัคร ${item.name || item.applicationId} ไม่มีอีเมลในระบบ`);
                continue;
            }

            const rawName = (item.name || '').trim();
            const hasTitle = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'].some(t => rawName.startsWith(t));
            const salutation = hasTitle ? rawName : `คุณ${rawName || 'ผู้สมัคร'}`;

            let personalizedBody = item.body || '';
            if (/^เรียน\s+[^,\n]+,/m.test(personalizedBody)) {
                personalizedBody = personalizedBody.replace(/^เรียน\s+[^,\n]+,/m, `เรียน ${salutation},`);
            } else if (personalizedBody.trim()) {
                personalizedBody = `เรียน ${salutation},\n\n` + personalizedBody;
            }

            try {
                const result = await emailService.sendHrEvaluationEmail({
                    to: item.email,
                    applicantName: salutation,
                    positionTitle: item.positionTitle || 'ตำแหน่งงาน',
                    subject: item.subject,
                    emailBody: personalizedBody
                });

                if (result && result.success) {
                    sentCount++;
                } else {
                    errors.push(`ส่งอีเมลให้ ${item.name} ไม่สำเร็จ: ${result?.error || 'Unknown error'}`);
                }
            } catch (err) {
                errors.push(`ส่งอีเมลให้ ${item.name} ไม่สำเร็จ: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `ส่งอีเมลแจ้งผลสอบสำเร็จ ${sentCount} ท่าน`,
            sentCount,
            totalRequested: applicantsResults.length,
            errors: errors.length > 0 ? errors : null
        });
    } catch (error) {
        console.error('[batchSendResults Error]:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

/**
 * อัปโหลดและแนบไฟล์ PDF ประกาศรายชื่อฉบับลงนาม
 */
const uploadSignedAnnouncementFile = async (req, res) => {
    try {
        const { recruitmentId, type, examPositionTypeId } = req.body;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์ PDF ที่ต้องการแนบ' });
        }
        const fileName = req.file.filename;
        const fileUrl = `http://localhost:3000/uploads/exam_announcements/${fileName}`;
        const db = require('../../config/db');

        if (type === 'initial') {
            await db.query('UPDATE recruitment SET Initial_announcement_file = ? WHERE Recruitment_id = ?', [fileName, recruitmentId]);
        } else if (type === 'final') {
            await db.query('UPDATE recruitment SET Final_announcement_file = ? WHERE Recruitment_id = ?', [fileName, recruitmentId]);
        } else if (type === 'exam') {
            const eptId = examPositionTypeId;
            if (!eptId) {
                return res.status(400).json({ success: false, message: 'กรุณาระบุ Exam_position_type_id' });
            }
            await db.query('UPDATE exam_position_type SET Announcement_file = ? WHERE Exam_position_type_id = ?', [fileName, eptId]);
        } else {
            return res.status(400).json({ success: false, message: 'ประเภทประกาศไม่ถูกต้อง' });
        }

        res.json({
            success: true,
            message: 'อัปโหลดและแนบไฟล์ประกาศฉบับลงนามสำเร็จเรียบร้อยแล้ว',
            fileName,
            fileUrl
        });
    } catch (error) {
        console.error('Error uploading signed announcement file:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + error.message });
    }
};

/**
 * ลบไฟล์ PDF ประกาศรายชื่อฉบับลงนาม
 */
const deleteSignedAnnouncementFile = async (req, res) => {
    try {
        const { recruitmentId, type, examPositionTypeId } = req.body;
        const db = require('../../config/db');
        const fs = require('fs');
        const path = require('path');

        let oldFileName = null;
        if (type === 'initial') {
            const [rows] = await db.query('SELECT Initial_announcement_file FROM recruitment WHERE Recruitment_id = ?', [recruitmentId]);
            oldFileName = rows[0]?.Initial_announcement_file;
            await db.query('UPDATE recruitment SET Initial_announcement_file = NULL WHERE Recruitment_id = ?', [recruitmentId]);
        } else if (type === 'final') {
            const [rows] = await db.query('SELECT Final_announcement_file FROM recruitment WHERE Recruitment_id = ?', [recruitmentId]);
            oldFileName = rows[0]?.Final_announcement_file;
            await db.query('UPDATE recruitment SET Final_announcement_file = NULL WHERE Recruitment_id = ?', [recruitmentId]);
        } else if (type === 'exam') {
            const [rows] = await db.query('SELECT Announcement_file FROM exam_position_type WHERE Exam_position_type_id = ?', [examPositionTypeId]);
            oldFileName = rows[0]?.Announcement_file;
            await db.query('UPDATE exam_position_type SET Announcement_file = NULL WHERE Exam_position_type_id = ?', [examPositionTypeId]);
        }

        if (oldFileName) {
            const cleanOld = oldFileName.replace(/^\/?uploads\/(exam_announcements|announcements)\//, '');
            const filePathExam = path.join(__dirname, '../../uploads/exam_announcements', cleanOld);
            const filePathLegacy = path.join(__dirname, '../../uploads/announcements', cleanOld);
            if (fs.existsSync(filePathExam)) {
                try { fs.unlinkSync(filePathExam); } catch (e) {}
            } else if (fs.existsSync(filePathLegacy)) {
                try { fs.unlinkSync(filePathLegacy); } catch (e) {}
            }
        }

        res.json({ success: true, message: 'ลบไฟล์แนบเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Error deleting signed announcement file:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบไฟล์: ' + error.message });
    }
};

module.exports = { 
    getApplicationTracking, 
    updateEvaluation, 
    batchScheduleExams, 
    batchSendResults,
    uploadSignedAnnouncementFile,
    deleteSignedAnnouncementFile
};