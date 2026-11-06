const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');

const templatesDir = path.join(__dirname, '..', 'templates');
const announcementTemplatePath = path.join(templatesDir, 'job_announcement_template.docx');
const applicationTemplatePath = path.join(templatesDir, 'job_application_template.docx');
const candidateTemplatePath = path.join(templatesDir, 'candidate_announcement_template.docx');
const finalCandidateTemplatePath = path.join(templatesDir, 'final_candidate_announcement_template.docx');

// แปลงเลขอารบิกเป็นเลขไทย
const toThaiDigits = (num) => {
    if (num === null || num === undefined) return '';
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return String(num).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
};

// แปลงวันที่เป็นวันที่ไทย
const formatThaiDate = (dateVal) => {
    if (!dateVal) return "-";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
};

// แปลงวันที่เป็นวันที่ไทยแบบเลขไทย
const formatThaiDateDigits = (dateVal) => {
    if (!dateVal) return "๕ มีนาคม พ.ศ. ๒๕๖๙";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return toThaiDigits(dateVal);
    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${toThaiDigits(d.getDate())} ${thaiMonths[d.getMonth()]} พ.ศ. ${toThaiDigits(d.getFullYear() + 543)}`;
};

// Helper: ปลอดภัยในการโหลดและ Render template พร้อมดึงรายละเอียด Error ของแต่ละ Tag หากเกิดข้อผิดพลาด
const renderDocxTemplate = (templatePath, data) => {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    let doc;
    try {
        doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
        doc.render(data);
    } catch (error) {
        if (error.properties && error.properties.errors) {
            const errorDetails = error.properties.errors
                .map(e => `${e.message || 'Error'} (tag: ${e.properties?.tag || e.properties?.xtag || 'unknown'})`)
                .join('; ');
            console.error('Docxtemplater errors:', JSON.stringify(error.properties.errors, null, 2));
            throw new Error(`Docxtemplater syntax error: ${errorDetails}`);
        }
        throw error;
    }
    return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
};

const convertHtmlToPdfBuffer = async (html, options = {}) => {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: options.margin || { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
            printBackground: true
        });
        return pdfBuffer;
    } finally {
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }
    }
};

// =========================================================================
// 1. สร้างเอกสาร Word ประกาศรับสมัครงาน (.docx) โดยใช้แม่แบบ Word Template
// =========================================================================
const generateJobAnnouncementDocx = async (data) => {
    if (!fs.existsSync(announcementTemplatePath)) {
        throw new Error(`ไม่พบไฟล์แม่แบบประกาศรับสมัครงานที่: ${announcementTemplatePath}`);
    }

    const jobTitle = data.jobTitle || 'พนักงานมหาวิทยาลัย';
    const faculty = data.faculty || 'มหาวิทยาลัยเกษตรศาสตร์';
    const department = (data.department && data.department !== '-') ? data.department : '-';
    const amount = data.amount || 1;
    const roundNo = data.roundNo || 1;
    const salaryMin = data.salaryMin ? Number(data.salaryMin).toLocaleString() : 'ตามโครงสร้างเงินเดือน';
    const salaryMax = data.salaryMax ? Number(data.salaryMax).toLocaleString() : '';
    const salaryStr = salaryMax ? `${salaryMin} - ${salaryMax} บาท` : `${salaryMin} บาท`;
    const openDate = formatThaiDate(data.openDate);
    const closeDate = formatThaiDate(data.closeDate);

    const postTitle = data.postTitle || data.announcementName || `ประกาศรับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัย ตำแหน่ง ${jobTitle}`;
    const cleanPostTitle = postTitle.replace(/^ประกาศเรื่อง\s*|^เรื่อง\s*/, '');
    const postDetails = data.postDetails || data.announcementDetail || `ด้วย มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร มีความประสงค์จะรับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัย`;

    const cleanItemText = (val) => {
        if (!val) return '';
        const s = typeof val === 'string' ? val : val.text || val.docName || val.name || val.type || val.examName || '';
        return s.trim().replace(/^(\(?[๒-๖0-9]+(\.[๐-๙0-9]+)*\)?|[0-9]+[\.\)])\s*/, '');
    };

    // คุณสมบัติทั่วไป
    const rawGeneralQuals = (data.generalQuals && data.generalQuals.length > 0) ? data.generalQuals : [
        "มีอายุไม่ต่ำกว่าสิบแปดปีบริบูรณ์และไม่เกินหกสิบปีบริบูรณ์",
        "เป็นผู้เลื่อมใสในการปกครองระบอบประชาธิปไตยอันมีพระมหากษัตริย์ทรงเป็นประมุข",
        "เป็นผู้มีสุขภาพร่างกายแข็งแรงและไม่เป็นโรคต้องห้ามตามที่ ก.บ.ม. กำหนด"
    ];
    const generalQuals = rawGeneralQuals.map((q, idx) => ({
        text: `(${toThaiDigits(idx + 1)}) ${cleanItemText(q)}`
    }));

    // ลักษณะต้องห้าม
    const rawProhibited = (data.prohibitedTraits && data.prohibitedTraits.length > 0) ? data.prohibitedTraits : [
        "เป็นผู้ดำรงตำแหน่งทางการเมือง กรรมการบริหารพรรคการเมือง",
        "เป็นคนวิกลจริตหรือจิตฟั่นเฟือนไม่สมประกอบ หรือเป็นบุคคลล้มละลาย",
        "เคยได้รับโทษจำคุกโดยคำพิพากษาถึงที่สุด"
    ];
    const prohibitedTraits = rawProhibited.map((p, idx) => ({
        text: `(${toThaiDigits(idx + 1)}) ${cleanItemText(p)}`
    }));

    // ทักษะความสามารถพิเศษ
    const skills = (data.otherAbilities && data.otherAbilities.length > 0)
        ? data.otherAbilities.map(s => ({ text: typeof s === 'string' ? s : s.text || '' }))
        : [];

    // เกณฑ์ภาษาอังกฤษ
    const engTests = (data.engTests && data.engTests.length > 0)
        ? data.engTests.map(t => ({
            test_name: t.testName || t.name || 'ภาษาอังกฤษ',
            min_score: String(t.minScore || t.score || '-')
        }))
        : [];

    // หน้าที่ความรับผิดชอบ
    const rawDuties = (data.jobResponsibilities && data.jobResponsibilities.length > 0) ? data.jobResponsibilities : [
        "ปฏิบัติงานสอน วิจัย และบริการวิชาการตามภารกิจของคณะ",
        "ปฏิบัติงานอื่นๆ ตามที่มหาวิทยาลัยมอบหมาย"
    ];
    const jobResponsibilities = rawDuties.map((d, idx) => ({
        text: `๓.${toThaiDigits(idx + 1)} ${cleanItemText(d)}`
    }));

    // ขั้นตอนการสมัคร
    const rawSteps = (data.appSteps && data.appSteps.length > 0) ? data.appSteps : [
        "กรอกใบสมัครผ่านระบบรับสมัครงานออนไลน์ของมหาวิทยาลัย",
        "ชำระค่าธรรมเนียมการสมัครสอบ",
        "แนบเอกสารและหลักฐานประกอบการสมัครให้ครบถ้วน"
    ];
    const appSteps = rawSteps.map((s, idx) => ({
        text: `๔.${toThaiDigits(idx + 1)} ${cleanItemText(s)}`
    }));

    // เอกสารแนบ
    const rawDocs = (data.documentsList && data.documentsList.length > 0) ? data.documentsList : [
        { docName: "สำเนาปริญญาบัตร หรือหนังสือรับรองคุณวุฒิ", docDetail: "จำนวน 1 ฉบับ" },
        { docName: "สำเนาใบแสดงผลการเรียน (Transcript)", docDetail: "จำนวน 1 ฉบับ" },
        { docName: "สำเนาบัตรประจำตัวประชาชน และสำเนาทะเบียนบ้าน", docDetail: "จำนวน 1 ฉบับ" },
        { docName: "รูปถ่ายหน้าตรง ไม่สวมหมวกและแว่นตาดำ", docDetail: "ขนาด 1 หรือ 1.5 นิ้ว" },
        { docName: "ผลการทดสอบภาษาอังกฤษ (ถ้ามี)", docDetail: "อายุไม่เกิน 2 ปี" }
    ];
    const documents = rawDocs.map((doc, idx) => {
        const docName = doc.docName || doc.name || (typeof doc === 'string' ? doc : 'เอกสารแนบ');
        const detailStr = (doc.docDetail || doc.detail || '').trim();
        const formattedDetail = detailStr ? (detailStr.startsWith('(') ? detailStr : `(${detailStr})`) : '';
        return {
            doc_name: `๕.${toThaiDigits(idx + 1)} ${cleanItemText(docName)}`,
            doc_detail: formattedDetail
        };
    });

    // การสอบ
    const rawExams = (data.exams && data.exams.length > 0) ? data.exams : [
        { type: "สอบข้อเขียน", details: "ทดสอบความรู้ความสามารถเฉพาะตำแหน่ง (100 คะแนน)" },
        { type: "สอบสัมภาษณ์", details: "ประเมินความเหมาะสมกับตำแหน่ง (100 คะแนน)" }
    ];
    const exams = rawExams.map((ex, idx) => ({
        type: `๖.${toThaiDigits(idx + 1)} ${cleanItemText(ex.type || ex.examName || 'การสอบ')}`,
        details: ex.details || ex.examDetail || '-'
    }));

    const majors = Array.isArray(data.majors) ? data.majors.join(', ') : (data.reqMajor || data.major || 'ทุกสาขาวิชาที่เกี่ยวข้อง');
    const educationReq = data.minEducation || data.reqEducation || 'ไม่จำกัดวุฒิ';
    const applicantDetails = data.applicantDetail || data.applicantDetails || 'รายละเอียดคุณสมบัติเฉพาะสำหรับตำแหน่งตามประกาศกำหนด';

    // เตรียมตัวแปรทั้งหมดลง Template
    const templateData = {
        announcement_org: "ประกาศมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร",
        announcement_title: cleanPostTitle,
        announcement_details: postDetails,
        position_name: jobTitle,
        faculty: faculty,
        department: department,
        amount: String(amount),
        round_no: String(roundNo),
        salary_text: salaryStr,
        general_quals: generalQuals,
        prohibited_traits: prohibitedTraits,
        education_req: educationReq,
        major_req: majors,
        applicant_details: applicantDetails,
        skills: skills,
        eng_tests: engTests,
        job_responsibilities: jobResponsibilities,
        open_date: openDate,
        close_date: closeDate,
        app_steps: appSteps,
        fee_details: data.feeDetails || "ตามประกาศกำหนด",
        documents: documents,
        exams: exams,
        app_conditions: data.appConditions || "ผู้สมัครเข้ารับการคัดเลือกต้องรับผิดชอบในการตรวจสอบและรับรองตนเองว่าเป็นผู้มีคุณสมบัติทั่วไปและคุณสมบัติเฉพาะสำหรับตำแหน่งตรงตามประกาศรับสมัคร",
        announced_date: openDate
    };

    return renderDocxTemplate(announcementTemplatePath, templateData);
};

// =========================================================================
// 2. สร้างเอกสาร Word ใบสมัครงานของผู้สมัคร (.docx) โดยใช้แม่แบบ Word Template
// =========================================================================
const generateApplicationDocx = async (appData) => {
    if (!fs.existsSync(applicationTemplatePath)) {
        throw new Error(`ไม่พบไฟล์แม่แบบใบสมัครงานที่: ${applicationTemplatePath}`);
    }

    const fullName = `${appData.personal?.title || ''}${appData.personal?.firstName || ''} ${appData.personal?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
    const fullNameEn = `${appData.personal?.firstNameEn || ''} ${appData.personal?.lastNameEn || ''}`.trim() || '-';
    const positionName = appData.jobTitle || appData.positionName || 'ไม่ระบุตำแหน่ง';
    const citizenId = appData.idCard || appData.Citizen_id || '-';
    const appliedDate = appData.appliedDate || '-';
    const seqNo = appData.seqNo || (typeof appData.id === 'string' ? appData.id.replace(/^APP-0*/, '').replace('ลำดับที่ ', '') : appData.id);

    // ประวัติการศึกษาสำหรับใส่ในตาราง
    const educations = (appData.educations && appData.educations.length > 0)
        ? appData.educations.map(edu => ({
            degree: edu.degree || '-',
            major: edu.major || '-',
            university: edu.university || '-',
            gpa: String(edu.gpa || '-'),
            approval_date: edu.approvalDate || '-',
            // Tags ภาษาไทย
            'ระดับวุฒิ': edu.degree || '-',
            'ระดับการศึกษา': edu.degree || '-',
            'สาขาวิชา': edu.major || '-',
            'สถาบันการศึกษา': edu.university || '-',
            'มหาวิทยาลัย': edu.university || '-',
            'เกรดเฉลี่ย': String(edu.gpa || '-'),
            'เกรดเฉลี่ยรวม': String(edu.gpa || '-'),
            'ปีที่สำเร็จ': edu.approvalDate || '-',
            'วันที่สำเร็จการศึกษา': edu.approvalDate || '-'
        }))
        : [{
            degree: '-', major: '-', university: '-', gpa: '-', approval_date: '-',
            'ระดับวุฒิ': '-', 'ระดับการศึกษา': '-', 'สาขาวิชา': '-', 'สถาบันการศึกษา': '-',
            'มหาวิทยาลัย': '-', 'เกรดเฉลี่ย': '-', 'เกรดเฉลี่ยรวม': '-', 'ปีที่สำเร็จ': '-', 'วันที่สำเร็จการศึกษา': '-'
        }];

    // ผลการทดสอบภาษาอังกฤษ
    const englishTests = (appData.abilities?.englishTests && appData.abilities.englishTests.length > 0)
        ? appData.abilities.englishTests.map(test => ({
            name: test.name || '-',
            score: String(test.score || '-'),
            exam_date: test.examDate || '-',
            // Tags ภาษาไทย
            'ประเภทการทดสอบ': test.name || '-',
            'ชื่อการทดสอบ': test.name || '-',
            'คะแนน': String(test.score || '-'),
            'คะแนนที่ได้': String(test.score || '-'),
            'วันที่สอบ': test.examDate || '-'
        }))
        : [{
            name: '-', score: '-', exam_date: '-',
            'ประเภทการทดสอบ': '-', 'ชื่อการทดสอบ': '-', 'คะแนน': '-', 'คะแนนที่ได้': '-', 'วันที่สอบ': '-'
        }];

    // ที่อยู่
    const houseNo = appData.address?.houseNo || '-';
    const moo = appData.address?.moo || '-';
    const soi = appData.address?.soi || '-';
    const road = appData.address?.road || '-';
    const tambon = appData.address?.tambon || '-';
    const amphoe = appData.address?.amphoe || '-';
    const province = appData.address?.province || '-';
    const zipcode = appData.address?.zipcode || '-';

    const addressText = [
        appData.address?.houseNo ? `บ้านเลขที่ ${appData.address.houseNo}` : '',
        appData.address?.moo ? `หมู่ ${appData.address.moo}` : '',
        appData.address?.soi ? `ซอย ${appData.address.soi}` : '',
        appData.address?.road ? `ถนน ${appData.address.road}` : '',
        appData.address?.tambon ? `ตำบล/แขวง ${appData.address.tambon}` : '',
        appData.address?.amphoe ? `อำเภอ/เขต ${appData.address.amphoe}` : '',
        appData.address?.province ? `จังหวัด ${appData.address.province}` : '',
        appData.address?.zipcode || ''
    ].filter(Boolean).join(' ') || '-';

    // รายการเอกสารแนบ
    const documents = (appData.documents && appData.documents.length > 0)
        ? appData.documents.map((doc, idx) => ({
            doc_name: `${idx + 1}. ${doc.name || 'เอกสารแนบ'}`,
            file_name: doc.fileName || 'แนบแล้ว'
        }))
        : [{ doc_name: 'ไม่พบเอกสารแนบ', file_name: '-' }];

    const facultyName = appData.facultyName || appData.deptName || 'มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร';
    const fatherReligion = appData.family?.father?.religion || '-';
    const motherReligion = appData.family?.mother?.religion || '-';
    const spouseReligion = appData.family?.spouse?.religion || '-';

    const workExperience = appData.workAndObligations?.workExperience || '-';
    const scholarshipObligation = appData.workAndObligations?.scholarshipObligation || appData.workAndObligations?.hasContractObligation || '-';
    const contractName = appData.workAndObligations?.contractName || '-';
    const contractAgency = appData.workAndObligations?.contractAgency || '-';
    const staffAffiliation = appData.workAndObligations?.universityStaffAffiliation || '-';
    const staffAffiliationIncome = appData.workAndObligations?.universityStaffAffiliationIncome || '-';
    const staffType = appData.workAndObligations?.staffType || appData.workAndObligations?.kuStaffStatus || '-';
    const phoneNumber = (appData.contact?.mobilePhones || []).filter(p => p && p !== '-').join(', ') || appData.contact?.mobilePhones?.[0] || '-';

    // ตัวแปรทั้งหมดที่ส่งเข้า Template (รองรับทั้งภาษาไทยและอังกฤษ)
    const templateData = {
        // ==========================================
        // หัวเอกสารและข้อมูลการสมัคร
        // ==========================================
        'ตำแหน่ง': positionName,
        'ชื่อตำแหน่ง': positionName,
        'ชื่อตำแหน่ง ': positionName,
        position_name: positionName,
        job_title: positionName,
        'สังกัด': facultyName,
        'สังกัดคณะ': facultyName,
        'คณะ': facultyName,
        faculty_name: facultyName,
        faculty: facultyName,
        department_name: appData.deptName || '-',
        'ลำดับที่': String(seqNo),
        seq_no: String(seqNo),
        'วันที่สมัคร': String(appliedDate),
        applied_date: String(appliedDate),
        'สถานะการสมัคร': appData.status || 'รอตรวจสอบคุณสมบัติ',
        applicant_status: appData.status || 'รอตรวจสอบคุณสมบัติ',

        // ==========================================
        // ๑. ข้อมูลทั่วไปของผู้สมัคร
        // ==========================================
        'ชื่อ_นามสกุล': fullName,
        'ชื่อนามสกุล': fullName,
        'ชื่อผู้สมัคร': fullName,
        full_name: fullName,
        full_name_th: fullName,
        'คำนำหน้า': appData.personal?.title || '',
        title: appData.personal?.title || '',
        'ชื่อ': appData.personal?.firstName || '',
        first_name: appData.personal?.firstName || '',
        'นามสกุล': appData.personal?.lastName || '',
        last_name: appData.personal?.lastName || '',
        'ชื่อ_ภาษาอังกฤษ': fullNameEn,
        'ชื่อภาษาอังกฤษ': fullNameEn,
        full_name_en: fullNameEn,
        'สัญชาติ': appData.personal?.nationality || '-',
        nationality: appData.personal?.nationality || '-',
        'ศาสนา': appData.personal?.religion || '-',
        religion: appData.personal?.religion || '-',
        'เลขประจำตัวประชาชน': citizenId,
        'เลขบัตรประชาชน': citizenId,
        citizen_id: citizenId,
        id_card: citizenId,

        // ==========================================
        // ๒. วัน เดือน ปีเกิด
        // ==========================================
        'วันเกิด': appData.personal?.dob || '-',
        'วันเดือนปีเกิด': appData.personal?.dob || '-',
        dob: appData.personal?.dob || '-',
        birth_date: appData.personal?.dob || '-',
        'อายุ_ปี': String(appData.personal?.ageYears ?? '-'),
        'อายุปี': String(appData.personal?.ageYears ?? '-'),
        age_years: String(appData.personal?.ageYears ?? '-'),
        'อายุ_เดือน': String(appData.personal?.ageMonths ?? '0'),
        'อายุเดือน': String(appData.personal?.ageMonths ?? '0'),
        age_months: String(appData.personal?.ageMonths ?? '0'),
        'อายุ': `${appData.personal?.ageYears || '-'} ปี ${appData.personal?.ageMonths || '0'} เดือน`,
        age: `${appData.personal?.ageYears || '-'} ปี ${appData.personal?.ageMonths || '0'} เดือน`,
        'จังหวัดที่เกิด': appData.personal?.birthplace || '-',
        birth_province: appData.personal?.birthplace || '-',
        birthplace: appData.personal?.birthplace || '-',

        // ==========================================
        // ๓. ที่อยู่ปัจจุบันและการติดต่อ
        // ==========================================
        'ที่อยู่': houseNo,
        'ที่อยู่ปัจจุบัน': houseNo,
        'ที่อยู่เต็ม': addressText,
        'บ้านเลขที่': houseNo,
        address: houseNo,
        address_text: houseNo,
        full_address: addressText,
        house_no: houseNo,
        'หมู่': moo,
        moo: moo,
        village_no: moo,
        'ตรอก/ซอย': soi,
        'ตรอก_ซอย': soi,
        'ซอย': soi,
        soi: soi,
        alley: soi,
        'ถนน': road,
        road: road,
        street: road,
        'ตำบล/แขวง': tambon,
        'ตำบล_แขวง': tambon,
        'ตำบล': tambon,
        'แขวง': tambon,
        tambon: tambon,
        subdistrict: tambon,
        'อำเภอ/เขต': amphoe,
        'อำเภอ_เขต': amphoe,
        'อำเภอ': amphoe,
        'เขต': amphoe,
        amphoe: amphoe,
        district: amphoe,
        'จังหวัด': province,
        province: province,
        'รหัสไปรษณีย์': zipcode,
        zipcode: zipcode,
        postal_code: zipcode,
        'เบอร์โทรศัพท์': phoneNumber,
        'เบอร์โทรศัพท์มือถือ': phoneNumber,
        'เบอร์มือถือ': phoneNumber,
        'โทรศัพท์มือถือ': phoneNumber,
        phone_number: phoneNumber,
        mobile_phone: phoneNumber,
        'อีเมล': appData.email || '-',
        email: appData.email || '-',

        // ==========================================
        // ๔. ข้อมูลคู่สมรส
        // ==========================================
        'ชื่อคู่สมรส': appData.family?.spouse?.name || '-',
        spouse_name: appData.family?.spouse?.name || '-',
        'สัญชาติคู่สมรส': appData.family?.spouse?.nationality || '-',
        spouse_nationality: appData.family?.spouse?.nationality || '-',
        'ศาสนาคู่สมรส': spouseReligion,
        spouse_religion: spouseReligion,
        'อาชีพคู่สมรส': appData.family?.spouse?.occupation || '-',
        spouse_job: appData.family?.spouse?.occupation || '-',
        spouse_occupation: appData.family?.spouse?.occupation || '-',

        // ==========================================
        // ๕. ข้อมูลบิดา / มารดา
        // ==========================================
        'ชื่อบิดา': appData.family?.father?.name || '-',
        father_name: appData.family?.father?.name || '-',
        'สัญชาติบิดา': appData.family?.father?.nationality || '-',
        father_nationality: appData.family?.father?.nationality || '-',
        'ศาสนาบิดา': fatherReligion,
        'ศาสนาคู่บิดา': fatherReligion,
        father_religion: fatherReligion,
        'อาชีพบิดา': appData.family?.father?.occupation || '-',
        father_job: appData.family?.father?.occupation || '-',
        father_occupation: appData.family?.father?.occupation || '-',

        'ชื่อมารดา': appData.family?.mother?.name || '-',
        mother_name: appData.family?.mother?.name || '-',
        'สัญชาติมารดา': appData.family?.mother?.nationality || '-',
        mother_nationality: appData.family?.mother?.nationality || '-',
        'ศาสนามารดา': motherReligion,
        mother_religion: motherReligion,
        'อาชีพมารดา': appData.family?.mother?.occupation || '-',
        mother_job: appData.family?.mother?.occupation || '-',
        mother_occupation: appData.family?.mother?.occupation || '-',

        // ==========================================
        // ๖. วุฒิการศึกษา (ตารางวนลูป)
        // ==========================================
        'ประวัติการศึกษา': educations,
        'รายการการศึกษา': educations,
        educations: educations,

        // ==========================================
        // ๗. ความรู้ภาษาต่างประเทศ
        // ==========================================
        'ภาษาต่างประเทศ': appData.abilities?.languages || '-',
        'ความรู้ภาษาต่างประเทศ': appData.abilities?.languages || '-',
        languages: appData.abilities?.languages || '-',
        'ผลสอบภาษาอังกฤษ': englishTests,
        'รายการทดสอบภาษาอังกฤษ': englishTests,
        english_tests: englishTests,

        // ==========================================
        // ๘. ความรู้ความสามารถพิเศษ
        // ==========================================
        'ความรู้ความสามารถพิเศษ': appData.abilities?.specialSkills || '-',
        'ทักษะพิเศษ': appData.abilities?.specialSkills || '-',
        special_skills: appData.abilities?.specialSkills || '-',

        // ==========================================
        // ๙. การทำงานและภาระผูกพัน
        // ==========================================
        'อาชีพปัจจุบัน': appData.workAndObligations?.currentJob || '-',
        current_job: appData.workAndObligations?.currentJob || '-',
        'สถานที่ทำงาน': appData.workAndObligations?.workplace || '-',
        workplace: appData.workAndObligations?.workplace || '-',
        'สถานะบุคลากร': staffType,
        'สถานะบุคลากร_มก': staffType,
        'สถานะบุคลากรมหาวิทยาลัย': staffType,
        staff_type: staffType,
        ku_staff_status: staffType,
        'ภาระผูกพันทุนการศึกษา': scholarshipObligation,
        'ภาระผูกพันชดใช้ทุน': scholarshipObligation,
        scholarship_obligation: scholarshipObligation,
        has_contract_obligation: scholarshipObligation,

        // ==========================================
        // ๑๐. ประวัติการทำงาน
        // ==========================================
        'เคยทำงานอะไรมาบ้าง': workExperience,
        'ประวัติการทำงาน': workExperience,
        work_experience: workExperience,

        // ==========================================
        // ๑๑. ภาระผูกพันสัญญารับทุน
        // ==========================================
        'มีภาระผูกพันตามสัญญารับทุน': scholarshipObligation,
        'ชื่อสัญญารับทุน': contractName,
        contract_name: contractName,
        'หน่วยงานที่ชดใช้ทุน': contractAgency,
        contract_agency: contractAgency,

        // ==========================================
        // ๑๒. ภาระผูกพันขณะเป็นบุคลากร มก.
        // ==========================================
        'พนักงานมหาวิทยาลัยสังกัด': staffAffiliation,
        university_staff_affiliation: staffAffiliation,
        staff_affiliation: staffAffiliation,
        'พนักงานมหาวิทยาลัยเงินรายได้สังกัด': staffAffiliationIncome,
        university_staff_affiliation_income: staffAffiliationIncome,
        staff_affiliation_income: staffAffiliationIncome,

        // ==========================================
        // เอกสารแนบและลายมือชื่อ
        // ==========================================
        'รายการเอกสารแนบ': documents,
        documents: documents,
        'ลงชื่อผู้สมัคร': fullName,
        'ชื่อผู้ลงนาม': fullName,
        sign_name: fullName
    };

    return renderDocxTemplate(applicationTemplatePath, templateData);
};

// =========================================================================
// 3. สร้างไฟล์ PDF ประกาศรับสมัครงาน (แปลงตรงจาก Template Word)
// =========================================================================
const generateJobAnnouncementPDF = async (data) => {
    // 1. Render Word Docx จาก Template
    const docxBuf = await generateJobAnnouncementDocx(data);

    // 2. แปลงเป็น HTML ด้วย mammoth
    const conversionResult = await mammoth.convertToHtml({ buffer: docxBuf });
    const innerHtml = conversionResult.value;
    const postTitle = data.postTitle || data.announcementName || `ประกาศรับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัย`;

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>${postTitle}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        @page {
            size: A4;
            margin: 20mm 15mm 20mm 20mm;
        }
        body {
            font-family: 'Sarabun', 'TH Sarabun New', 'TH Sarabun PSK', sans-serif;
            font-size: 15pt;
            line-height: 1.45;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        img {
            display: block;
            margin: 0 auto 12px auto;
            width: 80px;
            height: auto;
        }
        p {
            margin: 0 0 6px 0;
            text-align: justify;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
        }
        table td, table th {
            border: 1px solid #777;
            padding: 6px 10px;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    ${innerHtml}
</body>
</html>`;

    return await convertHtmlToPdfBuffer(html);
};

// =========================================================================
// 4. สร้างไฟล์ PDF ใบสมัครงาน (แปลงตรงจาก Template Word)
// =========================================================================
const generateApplicationPDF = async (appData) => {
    // 1. Render Word Docx ใบสมัครจาก Template
    const docxBuf = await generateApplicationDocx(appData);

    // 2. แปลงเป็น HTML ด้วย mammoth
    const conversionResult = await mammoth.convertToHtml({ buffer: docxBuf });
    const innerHtml = conversionResult.value;
    const fullName = `${appData.personal?.title || ''}${appData.personal?.firstName || ''} ${appData.personal?.lastName || ''}`.trim() || 'applicant';

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบสมัครงาน - ${fullName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
        }
        body {
            font-family: 'Sarabun', 'TH Sarabun New', 'TH Sarabun PSK', sans-serif;
            font-size: 13.5pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        p {
            margin: 0 0 5px 0;
            text-align: justify;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 12px 0;
        }
        table td, table th {
            border: 1px solid #777;
            padding: 5px 8px;
            vertical-align: middle;
        }
        table tr:first-child th,
        table tr:first-child td {
            background: #f5f5f5;
        }
    </style>
</head>
<body>
    ${innerHtml}
</body>
</html>`;

    return await convertHtmlToPdfBuffer(html);
};

// =========================================================================
// 5. สร้างไฟล์ Word ประกาศรายชื่อผู้มีสิทธิสอบ / ผลการคัดเลือก (.docx) โดยใช้แม่แบบ Word Template
// =========================================================================
const generateCandidateAnnouncementDocx = async (data) => {
    const isFinalAnnouncement = data.isFinal || data.topicType === 'final' || (data.title && (data.title.includes('ผู้ผ่านการคัดเลือก') || data.title.includes('ผลการคัดเลือก')));

    // เลือกแม่แบบ Word Template ให้ตรงกับประเภทประกาศ (ผู้มีสิทธิ์สอบ vs ผู้ผ่านการคัดเลือก)
    const templatePathToUse = (isFinalAnnouncement && fs.existsSync(finalCandidateTemplatePath))
        ? finalCandidateTemplatePath
        : candidateTemplatePath;

    if (!fs.existsSync(templatePathToUse)) {
        throw new Error(`ไม่พบไฟล์แม่แบบประกาศที่: ${templatePathToUse}`);
    }

    const title = data.title || (isFinalAnnouncement ? "ประกาศรายชื่อผู้ผ่านการคัดเลือก" : "ประกาศรายชื่อผู้มีสิทธิเข้ารับการคัดเลือก");
    const cleanTitle = title.replace(/^ประกาศเรื่อง\s*|^เรื่อง\s*/, '');
    const positionName = data.positionName || "พนักงานมหาวิทยาลัย";
    const faculty = (data.faculty && data.faculty !== '-') ? data.faculty.trim() : '';
    const department = (data.department && data.department !== '-') ? data.department.trim() : '';
    const roundNo = data.roundNo ? `รอบที่ ${data.roundNo}` : '';
    const rawCandidates = Array.isArray(data.candidates) ? data.candidates : [];
    const dateThai = data.dateThai || formatThaiDate(new Date());

    const candidates = rawCandidates.length > 0 ? rawCandidates.map((c, idx) => ({
        seq: String(idx + 1),
        app_id: c.appId || c.id || `APP-${String(c.rawId || idx + 1).padStart(5, '0')}`,
        name: c.name || '-',
        date: c.date || '-',
        time: c.time || '-',
        location_or_remark: c.location || c.remark || '-',
        remark: c.remark || (isFinalAnnouncement ? 'ผ่านการคัดเลือก' : (c.location || '-'))
    })) : [{
        seq: '-',
        app_id: '-',
        name: isFinalAnnouncement ? 'ไม่พบรายชื่อผู้ผ่านการคัดเลือกในรอบนี้' : 'ไม่พบรายชื่อผู้มีสิทธิสอบในรอบนี้',
        date: '-',
        time: '-',
        location_or_remark: '-',
        remark: '-'
    }];

    const remark = data.remark || (isFinalAnnouncement
        ? "๑. ให้ผู้ผ่านการคัดเลือกมารายงานตัว ณ หน่วยทรัพยากรมนุษย์และสวัสดิการ ตามวันและเวลาที่กำหนด\n๒. โปรดนำเอกสารและหลักฐานตัวจริงมาแสดงในวันรายงานตัว"
        : "๑. ให้ผู้มีสิทธิสอบแต่งกายด้วยชุดสุภาพ และนำบัตรประจำตัวประชาชนมาแสดงต่อเจ้าหน้าที่\n๒. ให้ผู้มีสิทธิสอบมารายงานตัวก่อนเวลาเริ่มสอบอย่างน้อย ๑๕ นาที");
    const remark_lines = remark.split('\n').filter(l => l.trim()).map(l => ({ text: l.trim() }));

    // แปลงจำนวนอัตราเป็นเลขไทย
    const totalPosNum = Number(data.totalPosition) || 1;
    const totalPosThai = toThaiDigits(totalPosNum);

    // รูปแบบการจัดสังกัด (หน่วยงาน / กอง / คณะ)
    let affiliationText = '';
    if (department && faculty) {
        affiliationText = `สังกัด${department} ${faculty}`;
    } else if (department) {
        affiliationText = `สังกัด${department}`;
    } else if (faculty) {
        affiliationText = `สังกัด${faculty}`;
    } else {
        affiliationText = 'สังกัดมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร';
    }

    // กำหนดประเภทการสอบ หรือชื่อการสอบ
    let examTargetText = '';
    if (data.examName) {
        examTargetText = data.examName.trim();
        if (examTargetText.startsWith('สอบ')) {
            examTargetText = examTargetText.substring(3).trim();
        }
    } else if (data.title && (data.title.includes('สิทธิสอบ') || data.title.includes('สิทธิ'))) {
        examTargetText = data.title.replace(/^.*ผู้มีสิทธิ(สอบ)?/, '').trim();
    }

    let defaultDetails = '';

    if (isFinalAnnouncement) {
        defaultDetails = `ตามประกาศมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร เรื่อง รายชื่อผู้มีสิทธิเข้ารับสอบคัดเลือก กำหนดวัน เวลา สถานที่ และระเบียบเกี่ยวกับการคัดเลือกตำแหน่ง${positionName} จำนวน ${totalPosThai} อัตรา ${affiliationText} นั้น บัดนี้ การคัดเลือกได้เสร็จสิ้นเรียบร้อยแล้ว จึงขอประกาศรายชื่อผู้ผ่านการคัดเลือก ดังต่อไปนี้`;
    } else {
        const examClause = examTargetText ? `เข้าสอบ${examTargetText}` : 'เข้ารับการคัดเลือก';
        defaultDetails = `ตามประกาศมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร เรื่อง รายชื่อผู้มีสิทธิเข้ารับสอบคัดเลือก กำหนดวัน เวลา สถานที่ และระเบียบเกี่ยวกับการคัดเลือกตำแหน่ง${positionName} จำนวน ${totalPosThai} อัตรา ${affiliationText} นั้น จึงขอประกาศรายชื่อผู้มีสิทธิ${examClause} ดังนี้`;
    }

    const announcementDetails = data.announcementDetail || defaultDetails;

    const templateData = {
        announcement_org: "ประกาศมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร",
        announcement_title: cleanTitle,
        position_name: positionName,
        faculty: faculty,
        department: department,
        round_no: roundNo,
        total_position: totalPosThai,
        announcement_details: announcementDetails,
        candidates: candidates,
        remark_lines: remark_lines,
        date_thai: dateThai,
        signer_name: data.signerName || '................................................................',
        signer_position: data.signerPosition || 'ประธานคณะกรรมการคัดเลือก / คณบดี'
    };

    return renderDocxTemplate(templatePathToUse, templateData);
};

// =========================================================================
// 6. สร้างไฟล์ PDF ประกาศรายชื่อผู้มีสิทธิสอบ / ผลการคัดเลือก (แปลงตรงจาก Template Word)
// =========================================================================
const generateCandidateAnnouncementPDF = async (data) => {
    // 1. Render Word Docx จาก Template
    const docxBuf = await generateCandidateAnnouncementDocx(data);

    // 2. แปลงเป็น HTML ด้วย mammoth
    const conversionResult = await mammoth.convertToHtml({ buffer: docxBuf });
    const innerHtml = conversionResult.value;
    const title = data.title || "ประกาศรายชื่อผู้มีสิทธิเข้ารับการคัดเลือก";

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        @page {
            size: A4;
            margin: 20mm 15mm 20mm 20mm;
        }
        body {
            font-family: 'Sarabun', 'TH Sarabun New', 'TH Sarabun PSK', sans-serif;
            font-size: 14pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        img {
            display: block;
            margin: 0 auto 12px auto;
            width: 80px;
            height: auto;
        }
        p {
            margin: 0 0 6px 0;
            text-align: justify;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 16px 0;
        }
        table th {
            border: 1px solid #555;
            background: #f4f6f8;
            padding: 6px 8px;
            font-weight: 600;
            font-size: 13.5pt;
            vertical-align: middle;
            text-align: center;
        }
        table td {
            border: 1px solid #777;
            padding: 6px 8px;
            font-size: 13pt;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    ${innerHtml}
</body>
</html>`;

    return await convertHtmlToPdfBuffer(html);
};

const generateFinalCandidateAnnouncementDocx = async (data) => {
    return generateCandidateAnnouncementDocx({ ...data, isFinal: true, topicType: 'final' });
};

const generateFinalCandidateAnnouncementPDF = async (data) => {
    return generateCandidateAnnouncementPDF({ ...data, isFinal: true, topicType: 'final' });
};

module.exports = {
    generateJobAnnouncementDocx,
    generateApplicationDocx,
    generateJobAnnouncementPDF,
    generateApplicationPDF,
    generateCandidateAnnouncementDocx,
    generateCandidateAnnouncementPDF,
    generateFinalCandidateAnnouncementDocx,
    generateFinalCandidateAnnouncementPDF
};
