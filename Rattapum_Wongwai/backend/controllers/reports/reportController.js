const db = require('../../config/db');

// Helper สำหรับคำนวณสถานะผ่าน / ไม่ผ่าน / รอตรวจสอบ อย่างถูกต้อง (แก้ปัญหา Substring 'ผ่าน'/'ไม่ผ่าน')
const parseApplicationStatuses = (qualRows) => {
    let prelimPass = 0, prelimFail = 0, finalPass = 0, finalFail = 0, pending = 0;

    qualRows.forEach(r => {
        const st = (r.Status || '').trim();
        const count = Number(r.count || 0);

        // ละเว้นสถานะ Draft ไม่นำมานับเป็นผู้สมัคร
        if (st.toLowerCase() === 'draft') return;

        // 1. ตรวจสอบสถานะเบื้องต้น (Preliminary)
        if (st.includes('ไม่ผ่านการคัดเลือกเบื้องต้น') || st.includes('ไม่ผ่านคุณสมบัติ')) {
            prelimFail += count;
        } else if (st.includes('ผ่านการคัดเลือกเบื้องต้น') || (st.includes('ผ่าน') && !st.includes('ไม่ผ่าน') && !st.includes('รอบสุดท้าย') && !st.includes('ได้งาน'))) {
            prelimPass += count;
        } else if (st === 'รอตรวจสอบ' || st === 'รอการตรวจสอบ' || st === 'ยื่นใบสมัครแล้ว' || !st) {
            pending += count;
        }

        // 2. ตรวจสอบสถานะการคัดเลือกรอบสุดท้าย (Final Selection)
        if (st.includes('ได้งาน') || st.includes('ผ่านการคัดเลือกรอบสุดท้าย') || st === 'ผ่านการคัดเลือก') {
            finalPass += count;
        } else if (st.includes('ไม่ผ่านการคัดเลือก') || st.includes('ไม่ผ่านการคัดเลือกรอบสุดท้าย')) {
            finalFail += count;
        }
    });

    return { prelimPass, prelimFail, finalPass, finalFail, pending };
};

// Helper สำหรับคำนวณสถิติผลการคัดเลือก:
// 1. ผู้ผ่านการคัดเลือก (finalPass) = เอาเฉพาะผู้ที่ผ่านจริง ๆ (ได้งาน / ผ่านการคัดเลือกรอบสุดท้าย) ไม่ใช่แค่ผ่านการสอบแต่ละรอบ
// 2. ผลรวมผู้ไม่ผ่านการคัดเลือก (finalFail) = อิงจากผู้สมัครทั้งหมดทุกประเภทการสอบและทุกขั้นตอน (ตกคณะ หรือตกวิชาใดวิชาหนึ่ง หรือตกรอบสุดท้าย)
const getApplicantEvaluationStats = async (recId = null, appDateFilter = '', appDateParams = []) => {
    const recFilter = recId ? ' AND app.Recruitment_id = ? ' : '';
    const queryParams = recId ? [recId, ...appDateParams] : appDateParams;

    // 1. ผู้ผ่านการคัดเลือกจริง (ได้งาน / ผ่านการคัดเลือกรอบสุดท้าย)
    const [finalPassRows] = await db.query(`
        SELECT COUNT(DISTINCT app.Application_id) as count
        FROM Application app
        WHERE app.Apply_date IS NOT NULL AND app.Status != 'Draft'
          ${recFilter} ${appDateFilter}
          AND (
            app.Status = 'ได้งาน' 
            OR app.Status = 'ผ่านการคัดเลือกรอบสุดท้าย' 
            OR (app.Status = 'ผ่านการคัดเลือก' AND app.Status NOT LIKE '%เบื้องต้น%')
            OR app.Status LIKE '%ได้งาน%'
          )
          AND app.Status NOT LIKE '%ไม่ผ่าน%'
    `, queryParams);
    const finalPass = Number(finalPassRows[0]?.count || 0);

    // 2. ผลรวมผู้ไม่ผ่านการคัดเลือก (อิงจากผู้สมัครทั้งหมดทุกประเภทการสอบและทุกขั้นตอน)
    const [finalFailRows] = await db.query(`
        SELECT COUNT(DISTINCT app.Application_id) as count
        FROM Application app
        LEFT JOIN has_exam_result her ON app.Application_id = her.Application_id
        WHERE app.Apply_date IS NOT NULL AND app.Status != 'Draft'
          ${recFilter} ${appDateFilter}
          AND (
            app.Status LIKE '%ไม่ผ่าน%'
            OR her.Exam_result = 'ไม่ผ่าน'
            OR her.Exam_result = 'ไม่ผ่านการสอบ'
          )
          AND NOT (
            app.Status = 'ได้งาน' 
            OR app.Status = 'ผ่านการคัดเลือกรอบสุดท้าย' 
            OR (app.Status = 'ผ่านการคัดเลือก' AND app.Status NOT LIKE '%เบื้องต้น%')
            OR app.Status LIKE '%ได้งาน%'
          )
    `, queryParams);
    const finalFail = Number(finalFailRows[0]?.count || 0);

    // 3. ผ่านการคัดเลือกเบื้องต้น (คุณสมบัติจากคณะ)
    const [prelimPassRows] = await db.query(`
        SELECT COUNT(DISTINCT app.Application_id) as count
        FROM Application app
        LEFT JOIN has_exam_result her ON app.Application_id = her.Application_id
        WHERE app.Apply_date IS NOT NULL AND app.Status != 'Draft'
          ${recFilter} ${appDateFilter}
          AND (
            app.Status = 'ผ่านการคัดเลือกเบื้องต้น'
            OR app.Status = 'ผ่าน'
            OR app.Status = 'ได้งาน'
            OR app.Status = 'ไม่ผ่านการคัดเลือก'
            OR app.Status = 'ผ่านการคัดเลือกรอบสุดท้าย'
            OR her.Exam_result IS NOT NULL
          )
          AND app.Status NOT LIKE '%ไม่ผ่านการคัดเลือกเบื้องต้น%'
          AND app.Status NOT LIKE '%ไม่ผ่านคุณสมบัติ%'
    `, queryParams);
    const prelimPass = Number(prelimPassRows[0]?.count || 0);

    // 4. ไม่ผ่านการคัดเลือกเบื้องต้น (คุณสมบัติจากคณะ)
    const [prelimFailRows] = await db.query(`
        SELECT COUNT(DISTINCT app.Application_id) as count
        FROM Application app
        WHERE app.Apply_date IS NOT NULL AND app.Status != 'Draft'
          ${recFilter} ${appDateFilter}
          AND (
            app.Status LIKE '%ไม่ผ่านการคัดเลือกเบื้องต้น%'
            OR app.Status LIKE '%ไม่ผ่านคุณสมบัติ%'
          )
    `, queryParams);
    const prelimFail = Number(prelimFailRows[0]?.count || 0);

    // 5. รอการตรวจสอบคุณสมบัติเบื้องต้น (คณะยังไม่พิจารณา)
    const [pendingRows] = await db.query(`
        SELECT COUNT(DISTINCT app.Application_id) as count
        FROM Application app
        LEFT JOIN has_exam_result her ON app.Application_id = her.Application_id
        WHERE app.Apply_date IS NOT NULL AND app.Status != 'Draft'
          ${recFilter} ${appDateFilter}
          AND (
            app.Status = 'รอตรวจสอบ' 
            OR app.Status = 'รอการตรวจสอบ' 
            OR app.Status = 'ยื่นใบสมัครแล้ว' 
            OR app.Status IS NULL 
            OR app.Status = ''
          )
          AND her.Application_id IS NULL
    `, queryParams);
    const pending = Number(pendingRows[0]?.count || 0);

    return { finalPass, finalFail, prelimPass, prelimFail, pending };
};

const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const thaiMonthsFull = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

// Helper สำหรับดึงสถิติรายปี (12 เดือน) และรายเดือน (ใน 1 เดือน แยกรายวัน)
const getRecruitmentStatistics = async (recId = null, queryYear = null, queryMonth = null) => {
    // 1. หาปีทั้งหมดที่มีข้อมูลการสมัคร (ไม่นับ Draft)
    let yearsQuery = `SELECT DISTINCT YEAR(Apply_date) as yr FROM Application WHERE Apply_date IS NOT NULL AND Status != 'Draft'`;
    const yearsParams = [];
    if (recId) {
        yearsQuery += ` AND Recruitment_id = ?`;
        yearsParams.push(recId);
    }
    yearsQuery += ` ORDER BY yr DESC`;
    const [yearsRows] = await db.query(yearsQuery, yearsParams);

    const currentYear = new Date().getFullYear();
    let availableYears = yearsRows.map(r => r.yr).filter(Boolean);
    if (availableYears.length === 0) {
        availableYears = [currentYear];
    } else if (!availableYears.includes(currentYear)) {
        availableYears = [currentYear, ...availableYears];
    }

    // 2. กำหนด selectedYear
    let selectedYear = parseInt(queryYear, 10);
    if (isNaN(selectedYear) || !selectedYear) {
        selectedYear = availableYears.includes(currentYear) ? currentYear : availableYears[0];
    }

    // 3. กำหนด selectedMonth
    let selectedMonth = parseInt(queryMonth, 10);
    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
        let latestMonthQuery = `SELECT MONTH(Apply_date) as mo FROM Application WHERE Apply_date IS NOT NULL AND YEAR(Apply_date) = ? AND Status != 'Draft'`;
        const latestMonthParams = [selectedYear];
        if (recId) {
            latestMonthQuery += ` AND Recruitment_id = ?`;
            latestMonthParams.push(recId);
        }
        latestMonthQuery += ` ORDER BY Apply_date DESC LIMIT 1`;
        const [latestMonthRows] = await db.query(latestMonthQuery, latestMonthParams);

        const currentMonth = new Date().getMonth() + 1;
        if (latestMonthRows.length > 0 && latestMonthRows[0].mo) {
            selectedMonth = latestMonthRows[0].mo;
        } else {
            selectedMonth = currentMonth;
        }
    }

    // 4. สถิติรายปี (12 เดือน) ประจำ selectedYear (ไม่นับ Draft)
    let yearlyQuery = `
        SELECT MONTH(Apply_date) as monthNum, COUNT(*) as count
        FROM Application
        WHERE Apply_date IS NOT NULL AND YEAR(Apply_date) = ? AND Status != 'Draft'
    `;
    const yearlyParams = [selectedYear];
    if (recId) {
        yearlyQuery += ` AND Recruitment_id = ?`;
        yearlyParams.push(recId);
    }
    yearlyQuery += ` GROUP BY MONTH(Apply_date) ORDER BY monthNum ASC`;
    const [yearlyRows] = await db.query(yearlyQuery, yearlyParams);

    const yearlyMap = {};
    let yearlyTotal = 0;
    yearlyRows.forEach(r => {
        if (r.monthNum >= 1 && r.monthNum <= 12) {
            const count = Number(r.count || 0);
            yearlyMap[r.monthNum] = count;
            yearlyTotal += count;
        }
    });

    const yearlyApplicants = thaiMonthsShort.map((m, idx) => ({
        monthNum: idx + 1,
        month: m,
        monthFull: thaiMonthsFull[idx],
        applicants: yearlyMap[idx + 1] || 0
    }));

    // 5. สถิติรายเดือน (ใน 1 เดือน: วันที่ 1 ถึง สิ้นเดือน) ประจำ selectedMonth และ selectedYear (ไม่นับ Draft)
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    let monthlyDailyQuery = `
        SELECT DAY(Apply_date) as dayNum, COUNT(*) as count
        FROM Application
        WHERE Apply_date IS NOT NULL 
          AND YEAR(Apply_date) = ? 
          AND MONTH(Apply_date) = ?
          AND Status != 'Draft'
    `;
    const monthlyDailyParams = [selectedYear, selectedMonth];
    if (recId) {
        monthlyDailyQuery += ` AND Recruitment_id = ?`;
        monthlyDailyParams.push(recId);
    }
    monthlyDailyQuery += ` GROUP BY DAY(Apply_date) ORDER BY dayNum ASC`;
    const [monthlyDailyRows] = await db.query(monthlyDailyQuery, monthlyDailyParams);

    const dailyMap = {};
    let monthlyTotal = 0;
    monthlyDailyRows.forEach(r => {
        const count = Number(r.count || 0);
        dailyMap[r.dayNum] = count;
        monthlyTotal += count;
    });

    const monthlyDailyApplicants = [];
    for (let d = 1; d <= daysInMonth; d++) {
        monthlyDailyApplicants.push({
            day: d,
            date: String(d),
            dateLabel: `วันที่ ${d}`,
            dateFull: `${d} ${thaiMonthsShort[selectedMonth - 1]} ${String(selectedYear + 543).slice(-2)}`,
            dateFullThai: `วันที่ ${d} ${thaiMonthsFull[selectedMonth - 1]} พ.ศ. ${selectedYear + 543}`,
            applicants: dailyMap[d] || 0
        });
    }

    return {
        availableYears: availableYears.map(y => ({
            ceYear: y,
            beYear: y + 543,
            label: `พ.ศ. ${y + 543} (${y})`
        })),
        selectedYear,
        selectedMonth,
        selectedMonthName: thaiMonthsFull[selectedMonth - 1],
        selectedYearBE: selectedYear + 543,
        daysInMonth,
        yearlyTotal,
        monthlyTotal,
        yearlyApplicants,
        monthlyDailyApplicants,
        // รองรับ fallback ตัวแปรเดิม
        monthlyApplicants: yearlyApplicants,
        dailyApplicants: monthlyDailyApplicants
    };
};

// GET /api/reports/list
const getReportList = async (req, res) => {
    try {
        const { facultyName } = req.query;

        const thaiMonths = thaiMonthsShort;
        const formatThaiDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;
            return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
        };

        let query = `
            SELECT 
                r.Recruitment_id AS id,
                p.Position_name AS title,
                d.Department_name AS departmentName,
                f.Faculty_name AS facultyName,
                r.Open_date AS openDateRaw,
                r.Close_date AS closeDateRaw,
                r.Request_date AS requestDateRaw,
                r.Total_position AS totalPosition,
                r.Round_no AS roundNo,
                r.Request_status AS requestStatus,
                YEAR(COALESCE(r.Open_date, r.Request_date, NOW())) + 543 AS year,
                (SELECT COUNT(*) FROM Application WHERE Recruitment_id = r.Recruitment_id AND Status != 'Draft') AS applicants
            FROM recruitment r
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            WHERE (r.Request_status = 'Processed' OR (r.Open_date IS NOT NULL AND r.Close_date IS NOT NULL))
        `;

        const params = [];
        if (facultyName && facultyName !== 'all') {
            query += ` AND (f.Faculty_name = ? OR d.Department_name LIKE ?)`;
            params.push(facultyName, `%${facultyName}%`);
        }

        query += ` ORDER BY r.Recruitment_id DESC`;

        const [rows] = await db.query(query, params);

        const formatted = rows.map((r, index) => {
            let status = "กำลังเปิดรับสมัคร";
            if (r.closeDateRaw) {
                const closeDate = new Date(r.closeDateRaw);
                const today = new Date();
                // กำหนดให้สิ้นสุด ณ สิ้นวันของวันปิดรับสมัคร
                closeDate.setHours(23, 59, 59, 999);
                if (closeDate < today) {
                    status = "ปิดรับสมัครแล้ว";
                }
            }

            const openDate = formatThaiDate(r.openDateRaw);
            const closeDate = formatThaiDate(r.closeDateRaw);
            const requestDate = formatThaiDate(r.requestDateRaw);

            let dateRange = "ยังไม่กำหนดช่วงเวลา";
            if (openDate && closeDate) {
                dateRange = `${openDate} - ${closeDate}`;
            } else if (openDate) {
                dateRange = `เปิดรับตั้งแต่ ${openDate}`;
            } else if (requestDate) {
                dateRange = `ยื่นคำขอ ${requestDate}`;
            }

            return {
                id: String(r.id),
                rawId: r.id,
                seqNo: index + 1,
                code: `JOB-${String(r.id).padStart(5, '0')}`,
                title: r.title || 'ไม่ระบุตำแหน่ง',
                facultyName: r.facultyName || '',
                departmentName: r.departmentName || '',
                department: `${r.facultyName || ''} ${r.departmentName && r.departmentName !== '-' ? r.departmentName : ''}`.trim(),
                openDate,
                closeDate,
                requestDate,
                dateRange,
                year: String(r.year || '2569'),
                applicants: Number(r.applicants || 0),
                totalPosition: Number(r.totalPosition || 1),
                roundNo: Number(r.roundNo || 1),
                status
            };
        });

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching report list:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/reports/summary/:id
const getReportSummary = async (req, res) => {
    try {
        const { id } = req.params;
        const { year, month, mode } = req.query;
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const formatThaiDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;
            return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
        };

        if (id === 'all' || !id) {
            // ดึงสถิติรายปี (12 เดือน) และรายเดือน (ใน 1 เดือน)
            const statsData = await getRecruitmentStatistics(null, year, month);

            const filterMode = mode === 'yearly' ? 'yearly' : 'monthly';
            const appDateFilter = filterMode === 'yearly' 
                ? ' AND YEAR(Apply_date) = ? ' 
                : ' AND YEAR(Apply_date) = ? AND MONTH(Apply_date) = ? ';
            const appDateParams = filterMode === 'yearly' 
                ? [statsData.selectedYear] 
                : [statsData.selectedYear, statsData.selectedMonth];

            const examDateFilter = filterMode === 'yearly' 
                ? ' AND YEAR(app.Apply_date) = ? ' 
                : ' AND YEAR(app.Apply_date) = ? AND MONTH(app.Apply_date) = ? ';
            const examDateParams = filterMode === 'yearly' 
                ? [statsData.selectedYear] 
                : [statsData.selectedYear, statsData.selectedMonth];

            // 1. ภาพรวมทุกตำแหน่ง (ไม่นับ Draft)
            const [totalRows] = await db.query(`SELECT COUNT(*) as total FROM Application WHERE Apply_date IS NOT NULL AND Status != 'Draft' ${appDateFilter}`, appDateParams);
            const totalApplicants = totalRows[0]?.total || 0;

            const [allTimeTotalRows] = await db.query(`SELECT COUNT(*) as total FROM Application WHERE Status != 'Draft'`);
            const totalApplicantsAllTime = allTimeTotalRows[0]?.total || 0;

            const [totalJobsRows] = await db.query(`SELECT COUNT(*) as totalJobs FROM recruitment WHERE (Request_status = 'Processed' OR (Open_date IS NOT NULL AND Close_date IS NOT NULL))`);
            const totalJobs = totalJobsRows[0]?.totalJobs || 0;

            const {
                finalPass,
                finalFail,
                prelimPass,
                prelimFail,
                pending
            } = await getApplicantEvaluationStats(null, appDateFilter, appDateParams);

            // ดึงผลการสอบแต่ละประเภท กรองตามช่วงเวลาที่เลือก (เดือน หรือ ปี)
            const [examResults] = await db.query(`
                SELECT et.Exam_type_name, her.Exam_result, COUNT(*) as count
                FROM has_exam_result her
                JOIN Application app ON her.Application_id = app.Application_id
                JOIN exam_position_type ept ON her.Exam_position_type_id = ept.Exam_position_type_id
                JOIN exam_type et ON ept.Exam_type_id = et.Exam_type_id
                WHERE app.Apply_date IS NOT NULL AND app.Status != 'Draft' ${examDateFilter}
                GROUP BY et.Exam_type_name, her.Exam_result
            `, examDateParams);

            const examsStats = {
                writtenExam: { hasExam: true, pass: 0, fail: 0, waiting: 0 },
                teachingDemo: { hasExam: true, pass: 0, fail: 0, waiting: 0 },
                psychology: { hasExam: true, pass: 0, fail: 0, waiting: 0 },
                interview: { hasExam: true, pass: 0, fail: 0, waiting: 0 }
            };

            examResults.forEach(r => {
                const name = r.Exam_type_name || '';
                const result = (r.Exam_result || '').trim();
                const count = Number(r.count || 0);

                let target = null;
                if (name.includes('ข้อเขียน')) target = examsStats.writtenExam;
                else if (name.includes('สาธิต')) target = examsStats.teachingDemo;
                else if (name.includes('จิตวิทยา')) target = examsStats.psychology;
                else if (name.includes('สัมภาษณ์')) target = examsStats.interview;

                if (target) {
                    if (result.includes('ไม่ผ่าน')) {
                        target.fail += count;
                    } else if (result.includes('ผ่าน')) {
                        target.pass += count;
                    } else {
                        target.waiting += count;
                    }
                }
            });

            return res.json({
                success: true,
                data: {
                    title: "ภาพรวมทุกตำแหน่ง (รวมทั้งหมดในระบบ)",
                    status: "รวมสถิติทั้งหมด",
                    filterMode,
                    periodLabel: filterMode === 'yearly'
                        ? `ประจำปี พ.ศ. ${statsData.selectedYearBE} (12 เดือน)`
                        : `ประจำเดือน${statsData.selectedMonthName} พ.ศ. ${statsData.selectedYearBE}`,
                    totalApplicants,
                    totalApplicantsAllTime,
                    totalJobs,
                    pendingApplicants: pending,
                    pendingFacultyReview: pending,
                    waitingExamHr: prelimPass,
                    prelimPass,
                    prelimFail,
                    finalPass,
                    finalFail,
                    totalFailedAllExams: finalFail,
                    passedFinalReal: finalPass,
                    stages: [
                        { key: 'preliminary', name: 'การคัดเลือกคุณสมบัติเบื้องต้น', icon: 'bi-person-vcard', pass: prelimPass, fail: prelimFail, waiting: pending, hasExam: true },
                        ...(examsStats.writtenExam.hasExam ? [{ key: 'writtenExam', name: 'การทดสอบข้อเขียน', icon: 'bi-pencil-square', pass: examsStats.writtenExam.pass, fail: examsStats.writtenExam.fail, waiting: examsStats.writtenExam.waiting, hasExam: true }] : []),
                        ...(examsStats.interview.hasExam ? [{ key: 'interview', name: 'การสอบสัมภาษณ์', icon: 'bi-mic', pass: examsStats.interview.pass, fail: examsStats.interview.fail, waiting: examsStats.interview.waiting, hasExam: true }] : []),
                        ...(examsStats.teachingDemo.hasExam ? [{ key: 'teachingDemo', name: 'การทดสอบสาธิตการสอน', icon: 'bi-easel', pass: examsStats.teachingDemo.pass, fail: examsStats.teachingDemo.fail, waiting: examsStats.teachingDemo.waiting, hasExam: true }] : []),
                        ...(examsStats.psychology.hasExam ? [{ key: 'psychology', name: 'การทดสอบจิตวิทยา', icon: 'bi-clipboard-heart', pass: examsStats.psychology.pass, fail: examsStats.psychology.fail, waiting: examsStats.psychology.waiting, hasExam: true }] : []),
                        { key: 'finalSelection', name: 'สรุปผลการคัดเลือก (ได้งาน)', icon: 'bi-award-fill', pass: finalPass, fail: finalFail, waiting: Math.max(0, totalApplicants - (finalPass + finalFail)), hasExam: true }
                    ],
                    preliminary: { hasExam: true, pass: prelimPass, fail: prelimFail, pending, waiting: pending },
                    writtenExam: examsStats.writtenExam,
                    teachingDemo: examsStats.teachingDemo,
                    psychology: examsStats.psychology,
                    interview: examsStats.interview,
                    finalSelection: { hasExam: true, pass: finalPass, fail: finalFail, waiting: Math.max(0, totalApplicants - (finalPass + finalFail)) },
                    ...statsData
                }
            });
        }

        // 2. สถิติเฉพาะตำแหน่งงาน (:id)
        const recId = parseInt(id, 10);
        const [titleRows] = await db.query(`
            SELECT 
                r.Recruitment_id,
                p.Position_name AS title,
                d.Department_name AS departmentName,
                f.Faculty_name AS facultyName,
                r.Open_date,
                r.Close_date,
                r.Request_date,
                r.Request_status AS requestStatus,
                r.Total_position AS totalPosition,
                r.Round_no AS roundNo
            FROM recruitment r
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            WHERE r.Recruitment_id = ?
        `, [recId]);

        if (titleRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลสถิติประกาศนี้' });
        }

        const jobInfo = titleRows[0];
        let status = "กำลังเปิดรับสมัคร";
        if (jobInfo.requestStatus === 'Pending') {
            status = "รอเปิดรับสมัคร";
        } else if (jobInfo.requestStatus === 'HR_Draft') {
            status = "ร่างประกาศ (HR)";
        } else if (jobInfo.Close_date) {
            const closeDate = new Date(jobInfo.Close_date);
            closeDate.setHours(23, 59, 59, 999);
            if (closeDate < new Date()) {
                status = "ปิดรับสมัครแล้ว";
            }
        } else if (!jobInfo.Open_date) {
            status = "รอเปิดรับสมัคร";
        }

        const openDate = formatThaiDate(jobInfo.Open_date);
        const closeDate = formatThaiDate(jobInfo.Close_date);
        const requestDate = formatThaiDate(jobInfo.Request_date);

        let dateRange = "ยังไม่กำหนดช่วงเวลา (รอประกาศ)";
        if (openDate && closeDate) {
            dateRange = `${openDate} - ${closeDate}`;
        } else if (openDate) {
            dateRange = `เปิดรับตั้งแต่ ${openDate}`;
        } else if (requestDate) {
            dateRange = `ยื่นคำขอเปิดรับเมื่อ ${requestDate}`;
        }

        // ดึงสถิติรายปี (12 เดือน) และรายเดือน (ใน 1 เดือน) สำหรับตำแหน่งนี้
        const statsData = await getRecruitmentStatistics(recId, year, month);

        const filterMode = mode === 'yearly' ? 'yearly' : 'monthly';
        const appDateFilter = filterMode === 'yearly' 
            ? ' AND YEAR(Apply_date) = ? ' 
            : ' AND YEAR(Apply_date) = ? AND MONTH(Apply_date) = ? ';
        const appDateParams = filterMode === 'yearly' 
            ? [statsData.selectedYear] 
            : [statsData.selectedYear, statsData.selectedMonth];

        const examDateFilter = filterMode === 'yearly' 
            ? ' AND YEAR(app.Apply_date) = ? ' 
            : ' AND YEAR(app.Apply_date) = ? AND MONTH(app.Apply_date) = ? ';
        const examDateParams = filterMode === 'yearly' 
            ? [statsData.selectedYear] 
            : [statsData.selectedYear, statsData.selectedMonth];

        const [totalRows] = await db.query(`SELECT COUNT(*) as total FROM Application WHERE Recruitment_id = ? AND Apply_date IS NOT NULL AND Status != 'Draft' ${appDateFilter}`, [recId, ...appDateParams]);
        const totalApplicants = totalRows[0]?.total || 0;

        const [allTimeTotalRows] = await db.query(`SELECT COUNT(*) as total FROM Application WHERE Recruitment_id = ? AND Status != 'Draft'`, [recId]);
        const totalApplicantsAllTime = allTimeTotalRows[0]?.total || 0;

        const {
            finalPass,
            finalFail,
            prelimPass,
            prelimFail,
            pending
        } = await getApplicantEvaluationStats(recId, appDateFilter, appDateParams);

        // ตรวจสอบว่าตำแหน่งนี้มีการจัดสอบประเภทใดบ้างใน exam_position_type เรียงตามลำดับที่กำหนดไว้จริง
        const [definedExams] = await db.query(`
            SELECT 
                ept.Exam_position_type_id,
                ept.Exam_type_id,
                et.Exam_type_name,
                ept.Exam_detail
            FROM exam_position_type ept
            LEFT JOIN exam_type et ON ept.Exam_type_id = et.Exam_type_id
            WHERE ept.Recruitment_id = ?
            ORDER BY ept.Exam_position_type_id ASC
        `, [recId]);

        const [examResults] = await db.query(`
            SELECT 
                her.Exam_position_type_id,
                et.Exam_type_name,
                her.Exam_result,
                COUNT(*) as count
            FROM has_exam_result her
            JOIN Application app ON her.Application_id = app.Application_id
            JOIN exam_position_type ept ON her.Exam_position_type_id = ept.Exam_position_type_id
            JOIN exam_type et ON ept.Exam_type_id = et.Exam_type_id
            WHERE her.Recruitment_id = ?
              AND app.Apply_date IS NOT NULL AND app.Status != 'Draft' ${examDateFilter}
            GROUP BY her.Exam_position_type_id, et.Exam_type_name, her.Exam_result
        `, [recId, ...examDateParams]);

        // สร้างรายการขั้นตอนเรียงลำดับตามที่กำหนดไว้จริงในการรับสมัคร
        const stages = [
            {
                key: 'preliminary',
                name: 'การคัดเลือกคุณสมบัติเบื้องต้น',
                icon: 'bi-person-vcard',
                pass: prelimPass,
                fail: prelimFail,
                waiting: pending,
                pending,
                hasExam: true
            }
        ];

        if (definedExams.length > 0) {
            definedExams.forEach(exam => {
                const eptId = exam.Exam_position_type_id;
                const rawName = exam.Exam_type_name || '';

                let name = rawName;
                if (rawName.includes('ข้อเขียน')) name = 'การทดสอบข้อเขียน';
                else if (rawName.includes('สัมภาษณ์')) name = 'การสอบสัมภาษณ์';
                else if (rawName.includes('สาธิต')) name = 'การทดสอบสาธิตการสอน';
                else if (rawName.includes('จิตวิทยา')) name = 'การทดสอบจิตวิทยา';

                let icon = 'bi-pencil-square';
                if (rawName.includes('สัมภาษณ์')) icon = 'bi-mic';
                else if (rawName.includes('สาธิต')) icon = 'bi-easel';
                else if (rawName.includes('จิตวิทยา')) icon = 'bi-clipboard-heart';

                let pass = 0, fail = 0, waitingDb = 0;
                const results = examResults.filter(r => r.Exam_position_type_id === eptId);
                results.forEach(r => {
                    const resStr = (r.Exam_result || '').trim();
                    if (resStr.includes('ไม่ผ่าน')) fail += Number(r.count || 0);
                    else if (resStr.includes('ผ่าน')) pass += Number(r.count || 0);
                    else waitingDb += Number(r.count || 0);
                });
                const waiting = Math.max(waitingDb, Math.max(0, prelimPass - (pass + fail)));

                stages.push({
                    key: `exam_${eptId}`,
                    Exam_position_type_id: eptId,
                    name,
                    icon,
                    pass,
                    fail,
                    waiting,
                    hasExam: true
                });
            });
        } else {
            // Fallback สำหรับข้อมูลเก่า
            const hasWritten = examResults.some(r => (r.Exam_type_name || '').includes('ข้อเขียน'));
            const hasInterview = examResults.some(r => (r.Exam_type_name || '').includes('สัมภาษณ์'));
            if (hasWritten) {
                let p = 0, f = 0, w = 0;
                examResults.filter(r => (r.Exam_type_name || '').includes('ข้อเขียน')).forEach(r => {
                    const res = (r.Exam_result || '').trim();
                    if (res.includes('ไม่ผ่าน')) f += Number(r.count || 0);
                    else if (res.includes('ผ่าน')) p += Number(r.count || 0);
                    else w += Number(r.count || 0);
                });
                stages.push({ key: 'writtenExam', name: 'การทดสอบข้อเขียน', icon: 'bi-pencil-square', pass: p, fail: f, waiting: Math.max(w, Math.max(0, prelimPass - (p + f))), hasExam: true });
            }
            if (hasInterview) {
                let p = 0, f = 0, w = 0;
                examResults.filter(r => (r.Exam_type_name || '').includes('สัมภาษณ์')).forEach(r => {
                    const res = (r.Exam_result || '').trim();
                    if (res.includes('ไม่ผ่าน')) f += Number(r.count || 0);
                    else if (res.includes('ผ่าน')) p += Number(r.count || 0);
                    else w += Number(r.count || 0);
                });
                stages.push({ key: 'interview', name: 'การสอบสัมภาษณ์', icon: 'bi-mic', pass: p, fail: f, waiting: Math.max(w, Math.max(0, prelimPass - (p + f))), hasExam: true });
            }
        }

        stages.push({
            key: 'finalSelection',
            name: 'สรุปผลการคัดเลือก (ได้งาน)',
            icon: 'bi-award-fill',
            pass: finalPass,
            fail: finalFail,
            waiting: Math.max(0, totalApplicants - (finalPass + finalFail)),
            hasExam: true
        });

        res.json({
            success: true,
            data: {
                id: String(recId),
                title: jobInfo.title || 'ไม่ระบุตำแหน่ง',
                department: `${jobInfo.facultyName || ''} ${jobInfo.departmentName && jobInfo.departmentName !== '-' ? jobInfo.departmentName : ''}`.trim(),
                facultyName: jobInfo.facultyName || '',
                departmentName: (jobInfo.departmentName && jobInfo.departmentName !== '-') ? jobInfo.departmentName : '',
                totalPosition: Number(jobInfo.totalPosition || 1),
                roundNo: Number(jobInfo.roundNo || 1),
                openDate,
                closeDate,
                requestDate,
                dateRange,
                status,
                filterMode,
                periodLabel: filterMode === 'yearly'
                    ? `ประจำปี พ.ศ. ${statsData.selectedYearBE} (12 เดือน)`
                    : `ประจำเดือน${statsData.selectedMonthName} พ.ศ. ${statsData.selectedYearBE}`,
                totalApplicants,
                totalApplicantsAllTime,
                pendingApplicants: pending,
                pendingFacultyReview: pending,
                waitingExamHr: prelimPass,
                prelimPass,
                prelimFail,
                finalPass,
                finalFail,
                totalFailedAllExams: finalFail,
                passedFinalReal: finalPass,
                preliminary: { hasExam: true, pass: prelimPass, fail: prelimFail, pending },
                finalSelection: { hasExam: true, pass: finalPass, fail: finalFail, waiting: Math.max(0, totalApplicants - (finalPass + finalFail)) },
                stages,
                ...statsData
            }
        });
    } catch (error) {
        console.error('Error fetching report summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getReportList,
    getReportSummary
};
