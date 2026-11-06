const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

// Helper: ดึงวันที่ก่อนหน้าปัจจุบัน 1 วันตามเวลาท้องถิ่น (YYYY-MM-DD)
const getYesterdayDateYMD = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: จัดรูปแบบวันที่เป็น YYYY-MM-DD แบบ local time ป้องกัน Timezone Offset ย้อนหลัง 1 วัน
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

// Helper: ดึง URL ของไฟล์ประกาศรายชื่อ/สิทธิ์สอบ (รองรับทั้งโฟลเดอร์ใหม่ uploads/exam_announcements และ legacy uploads/announcements)
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

// Helper: ดึงวัน เดือน ปี พ.ศ. จาก Date
const parseBirthDateParts = (dob) => {
    if (!dob) return { day: null, month: null, yearBe: null, dateStr: null };
    if (typeof dob === 'string' && dob.includes('-')) {
        const cleanStr = dob.split('T')[0].split(' ')[0].trim();
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                return {
                    day: d,
                    month: m,
                    yearBe: y > 2400 ? y : y + 543,
                    dateStr: `${parts[0]}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                };
            }
        }
    }
    const d = new Date(dob);
    if (isNaN(d.getTime())) return { day: null, month: null, yearBe: null, dateStr: null };
    return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        yearBe: d.getFullYear() + 543,
        dateStr: formatDateYMD(dob)
    };
};

// Helper: แปลงวันที่เป็นข้อความวันที่แบบไทย (วัน เดือนย่อ ปี พ.ศ.) ป้องกัน Timezone Offset และป้องกันการบวก 543 ซ้ำ
const formatThaiDate = (dateVal) => {
    if (!dateVal) return "-";
    const str = String(dateVal).trim();
    if (str.startsWith('0000-00-00') || str.startsWith('1899') || str.startsWith('1900') || str === '-' || str === 'รอกำหนดการ') {
        return "-";
    }
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
        const cleanStr = dateVal.split('T')[0].split(' ')[0].trim();
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && y >= 1900) {
                const thaiY = y > 2400 ? y : y + 543;
                return `${d} ${thaiMonths[m - 1]} ${thaiY}`;
            }
        }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime()) || d.getFullYear() < 1900) return "-";
    const y = d.getFullYear();
    const thaiY = y > 2400 ? y : y + 543;
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${thaiY}`;
};

// Helper: หา Eng_exam_type_id จากชื่อประเภทการสอบ
const getEngExamTypeId = async (connectionOrDb, testName) => {
    if (!testName) return null;
    const cleanName = testName.replace(/[\s\-_()\/]/g, '').toLowerCase();
    const [rows] = await connectionOrDb.query('SELECT Eng_exam_type_id, Eng_exam_type_name FROM eng_exam_type');
    for (const r of rows) {
        const dbClean = r.Eng_exam_type_name.replace(/[\s\-_()\/]/g, '').toLowerCase();
        if (dbClean === cleanName || dbClean.includes(cleanName) || cleanName.includes(dbClean)) {
            return r.Eng_exam_type_id;
        }
    }
    return rows[0]?.Eng_exam_type_id || 1;
};

// Helper: ทำความสะอาด Parameter ป้องกัน NaN หรือ undefined เข้า MySQL
const sanitizeSqlParams = (params) => {
    return params.map(val => (typeof val === 'number' && isNaN(val)) ? null : (val === undefined ? null : val));
};

// Helper: หาข้อมูลที่อยู่แบบครบชุด (ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์)
const resolveAddressDetails = async (connectionOrDb, subdistrictId, selectedTambon, selectedProvince, fallbackZipcode) => {
    let numericSubdistrictId = null;
    if (subdistrictId !== null && subdistrictId !== undefined && subdistrictId !== '' && subdistrictId !== 'null' && subdistrictId !== 'undefined') {
        const parsed = Number(subdistrictId);
        if (!isNaN(parsed) && parsed > 0) {
            numericSubdistrictId = Math.floor(parsed);
        }
    }

    let result = {
        subdistrictId: numericSubdistrictId,
        subdistrictName: (selectedTambon && selectedTambon !== 'null' && selectedTambon !== 'undefined') ? String(selectedTambon).trim() : null,
        districtName: null,
        provinceName: (selectedProvince && selectedProvince !== 'null' && selectedProvince !== 'undefined') ? String(selectedProvince).trim() : null,
        postalCode: (fallbackZipcode && fallbackZipcode !== 'null' && fallbackZipcode !== 'undefined') ? String(fallbackZipcode).trim() : null
    };

    if (result.subdistrictId) {
        const [rows] = await connectionOrDb.query(`
            SELECT s.Subdistrict_id, s.Subdistrict_name, d.District_name, d.Postal_code, p.Province_name
            FROM subdistrict s
            JOIN district d ON s.District_id = d.District_id
            JOIN province p ON d.Province_id = p.Province_id
            WHERE s.Subdistrict_id = ?
        `, [result.subdistrictId]);
        if (rows.length > 0) {
            result.subdistrictName = rows[0].Subdistrict_name;
            result.districtName = rows[0].District_name;
            result.provinceName = rows[0].Province_name;
            result.postalCode = rows[0].Postal_code || result.postalCode;
            return result;
        }
    }

    if (result.subdistrictName && result.provinceName) {
        const [rows] = await connectionOrDb.query(`
            SELECT s.Subdistrict_id, s.Subdistrict_name, d.District_name, d.Postal_code, p.Province_name
            FROM subdistrict s
            JOIN district d ON s.District_id = d.District_id
            JOIN province p ON d.Province_id = p.Province_id
            WHERE s.Subdistrict_name = ? AND p.Province_name = ?
            LIMIT 1
        `, [result.subdistrictName, result.provinceName]);
        if (rows.length > 0) {
            result.subdistrictId = rows[0].Subdistrict_id;
            result.subdistrictName = rows[0].Subdistrict_name;
            result.districtName = rows[0].District_name;
            result.provinceName = rows[0].Province_name;
            result.postalCode = rows[0].Postal_code || result.postalCode;
            return result;
        }
    }

    result.subdistrictId = (result.subdistrictId && !isNaN(result.subdistrictId)) ? Number(result.subdistrictId) : null;
    return result;
};

// Helper: Upsert Applicant Profile
const upsertApplicant = async (connection, citizenId, applicantEmail, data, addr) => {
    let applicantId;
    let existingApplicant = [];
    if (applicantEmail && citizenId) {
        [existingApplicant] = await connection.query(
            `SELECT Applicant_id FROM Applicant WHERE TRIM(Citizen_id) = ? AND LOWER(TRIM(Email)) = ?`,
            [citizenId, applicantEmail]
        );
    } else if (applicantEmail) {
        [existingApplicant] = await connection.query(
            `SELECT Applicant_id FROM Applicant WHERE LOWER(TRIM(Email)) = ?`,
            [applicantEmail]
        );
    } else if (citizenId) {
        [existingApplicant] = await connection.query(
            `SELECT Applicant_id FROM Applicant WHERE TRIM(Citizen_id) = ?`,
            [citizenId]
        );
    }

    const birthParts = parseBirthDateParts(data.dob || data.Birth_day);

    const subdistrictId = (addr && typeof addr === 'object') ? addr.subdistrictId : (addr || data.subdistrictId || data.Subdistrict_id || null);
    const subdistrict = (addr && typeof addr === 'object' && addr.subdistrictName) ? addr.subdistrictName : (data.selectedTambon || data.Subdistrict || data.Subdistrict_name || null);
    const district = (addr && typeof addr === 'object' && addr.districtName) ? addr.districtName : (data.selectedAmphoe || data.District || data.District_name || null);
    const province = (addr && typeof addr === 'object' && addr.provinceName) ? addr.provinceName : (data.selectedProvince || data.Province || data.Province_name || null);
    const postalCode = (addr && typeof addr === 'object' && addr.postalCode) ? addr.postalCode : (data.zipcode || data.Postal_code || data.postalCode || null);

    const applicantFields = [
        citizenId,
        applicantEmail || null,
        data.prefix || data.Prefix || '',
        data.firstName || data.First_name || '',
        data.lastName || data.Last_name || '',
        data.nationality || data.Nationality || 'ไทย',
        data.religion || data.Religion || null,
        data.birthProvince || data.selectedProvince || data.Birth_province || null,
        data.houseNo || data.House_no || null,
        data.street || data.Street || null,
        data.villageNo || data.Village_no || null,
        data.alley || data.Alley || null,
        data.fatherName || data.Father_name || null,
        data.fatherReligion || data.Father_religion || null,
        data.fatherNationality || data.Father_nationality || null,
        data.fatherJob || data.Father_job || null,
        data.motherName || data.Mother_name || null,
        data.motherReligion || data.Mother_religion || null,
        data.motherNationality || data.Mother_nationality || null,
        data.motherJob || data.Mother_job || null,
        data.spouseName || data.Spouse_name || null,
        data.spouseReligion || data.Spouse_religion || null,
        data.spouseNationality || data.Spouse_nationality || null,
        data.spouseJob || data.Spouse_job || null,
        birthParts.dateStr || null,
        data.ageYears || data.Age_year || null,
        data.ageMonths || data.Age_month || null,
        data.obligation || data.Has_contract_obligation || 'ไม่มี',
        data.contractAgency || data.Contract_agency || null,
        data.contractName || data.Contract_name || null,
        data.staffAffiliationIncome || data.University_staff_affiliation_income || null,
        (data.staffAffiliation || data.staffAffiliationIncome || data.University_staff_affiliation) ? 'มี' : 'ไม่มี',
        data.staffAffiliation || data.University_staff_affiliation || null,
        data.currentJob || data.Current_job || null,
        data.workplace || data.Workplace || null,
        data.staffType || data.Staff_type || null,
        data.foreignLanguage || data.Foreign_language || null,
        data.specialSkill || data.Special_skill || null,
        subdistrictId || null
    ];

    if (existingApplicant.length > 0) {
        applicantId = existingApplicant[0].Applicant_id;
        await connection.query(`
            UPDATE Applicant SET
                Citizen_id = COALESCE(?, Citizen_id),
                Email = COALESCE(?, Email),
                Prefix = COALESCE(?, Prefix),
                First_name = COALESCE(?, First_name),
                Last_name = COALESCE(?, Last_name),
                Nationality = COALESCE(?, Nationality),
                Religion = COALESCE(?, Religion),
                Birth_province = COALESCE(?, Birth_province),
                House_no = COALESCE(?, House_no),
                Street = COALESCE(?, Street),
                Village_no = COALESCE(?, Village_no),
                Alley = COALESCE(?, Alley),
                Father_name = COALESCE(?, Father_name),
                Father_religion = COALESCE(?, Father_religion),
                Father_nationality = COALESCE(?, Father_nationality),
                Father_job = COALESCE(?, Father_job),
                Mother_name = COALESCE(?, Mother_name),
                Mother_religion = COALESCE(?, Mother_religion),
                Mother_nationality = COALESCE(?, Mother_nationality),
                Mother_job = COALESCE(?, Mother_job),
                Spouse_name = COALESCE(?, Spouse_name),
                Spouse_religion = COALESCE(?, Spouse_religion),
                Spouse_nationality = COALESCE(?, Spouse_nationality),
                Spouse_job = COALESCE(?, Spouse_job),
                Birth_day = COALESCE(?, Birth_day),
                Age_year = COALESCE(?, Age_year),
                Age_month = COALESCE(?, Age_month),
                Has_contract_obligation = COALESCE(?, Has_contract_obligation),
                Contract_agency = COALESCE(?, Contract_agency),
                Contract_name = COALESCE(?, Contract_name),
                University_staff_affiliation_income = COALESCE(?, University_staff_affiliation_income),
                Has_staff_contract_obligation = COALESCE(?, Has_staff_contract_obligation),
                University_staff_affiliation = COALESCE(?, University_staff_affiliation),
                Current_job = COALESCE(?, Current_job),
                Workplace = COALESCE(?, Workplace),
                Staff_type = COALESCE(?, Staff_type),
                Foreign_language = COALESCE(?, Foreign_language),
                Special_skill = COALESCE(?, Special_skill),
                Subdistrict_id = COALESCE(?, Subdistrict_id)
            WHERE Applicant_id = ?
        `, sanitizeSqlParams([...applicantFields, applicantId]));
    } else {
        const [res] = await connection.query(`
            INSERT INTO Applicant (
                Citizen_id, Email, Prefix, First_name, Last_name,
                Nationality, Religion, Birth_province, House_no, Street, Village_no, Alley,
                Father_name, Father_religion, Father_nationality, Father_job,
                Mother_name, Mother_religion, Mother_nationality, Mother_job,
                Spouse_name, Spouse_religion, Spouse_nationality, Spouse_job,
                Birth_day, Age_year, Age_month,
                Has_contract_obligation, Contract_agency, Contract_name,
                University_staff_affiliation_income, Has_staff_contract_obligation,
                University_staff_affiliation, Current_job, Workplace,
                Staff_type, Foreign_language, Special_skill, Subdistrict_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, sanitizeSqlParams(applicantFields));
        applicantId = res.insertId;
    }
    return applicantId;
};

// Helper: Upsert application_history Snapshot
const upsertApplicationHistory = async (connection, citizenId, recruitmentId, positionId, departmentId, applicantEmail, data, addr) => {
    const birthParts = parseBirthDateParts(data.dob || data.Birth_day);

    const subdistrict = (addr && typeof addr === 'object' && addr.subdistrictName) ? addr.subdistrictName : (data.selectedTambon || data.Subdistrict || data.Subdistrict_name || null);
    const district = (addr && typeof addr === 'object' && addr.districtName) ? addr.districtName : (data.selectedAmphoe || data.District || data.District_name || null);
    const province = (addr && typeof addr === 'object' && addr.provinceName) ? addr.provinceName : (data.selectedProvince || data.Province || data.Province_name || null);
    const postalCode = (addr && typeof addr === 'object' && addr.postalCode) ? addr.postalCode : (data.zipcode || data.Postal_code || data.postalCode || null);

    const histFields = [
        citizenId,
        applicantEmail || null,
        data.prefix || data.Prefix || '',
        data.firstName || data.First_name || '',
        data.lastName || data.Last_name || '',
        data.nationality || data.Nationality || 'ไทย',
        data.religion || data.Religion || null,
        data.birthProvince || data.selectedProvince || data.Birth_province || null,
        data.houseNo || data.House_no || null,
        data.street || data.Street || null,
        data.villageNo || data.Village_no || null,
        data.alley || data.Alley || null,
        data.fatherName || data.Father_name || null,
        data.fatherReligion || data.Father_religion || null,
        data.fatherNationality || data.Father_nationality || null,
        data.fatherJob || data.Father_job || null,
        data.motherName || data.Mother_name || null,
        data.motherReligion || data.Mother_religion || null,
        data.motherNationality || data.Mother_nationality || null,
        data.motherJob || data.Mother_job || null,
        data.spouseName || data.Spouse_name || null,
        data.spouseReligion || data.Spouse_religion || null,
        data.spouseNationality || data.Spouse_nationality || null,
        data.spouseJob || data.Spouse_job || null,
        birthParts.day,
        birthParts.month,
        data.ageYears || data.Age_year || null,
        data.ageMonths || data.Age_month || null,
        birthParts.yearBe,
        data.currentJob || data.Current_job || null,
        data.workplace || data.Workplace || null,
        data.foreignLanguage || data.Foreign_language || null,
        data.specialSkill || data.Special_skill || null,
        data.workExperience || data.Work_experience || data.workHistory || null,
        recruitmentId,
        positionId,
        departmentId,
        data.obligation || data.Has_contract_obligation || 'ไม่มี',
        data.contractAgency || data.Contract_agency || null,
        data.contractName || data.Contract_name || null,
        (data.staffAffiliation || data.staffAffiliationIncome || data.University_staff_affiliation) ? 'มี' : 'ไม่มี',
        data.staffAffiliation || data.University_staff_affiliation || null,
        data.staffAffiliationIncome || data.University_staff_affiliation_income || null,
        data.staffType || data.Staff_type || null,
        subdistrict || null,
        district || null,
        province || null,
        postalCode || null
    ];

    const [existing] = await connection.query(
        `SELECT Application_history_id FROM application_history WHERE TRIM(Citizen_id) = ? AND Recruitment_id = ? ORDER BY Application_history_id DESC LIMIT 1`,
        [citizenId, recruitmentId]
    );

    let historyId;
    if (existing.length > 0) {
        historyId = existing[0].Application_history_id;
        await connection.query(`
            UPDATE application_history SET
                Citizen_id = ?, Email = ?, Prefix = ?, First_name = ?, Last_name = ?,
                Nationality = ?, Religion = ?, Birth_province = ?, House_no = ?, Street = ?, Village_no = ?, Alley = ?,
                Father_name = ?, Father_religion = ?, Father_nationality = ?, Father_job = ?,
                Mother_name = ?, Mother_religion = ?, Mother_nationality = ?, Mother_job = ?,
                Spouse_name = ?, Spouse_religion = ?, Spouse_nationality = ?, Spouse_job = ?,
                Birth_day = ?, Birth_month = ?, Age_year = ?, Age_month = ?, Birth_year_be = ?,
                Current_job = ?, Workplace = ?, Foreign_language = ?, Special_skill = ?, Work_experience = ?,
                Recruitment_id = ?, Position_id = ?, Department_id = ?,
                Has_contract_obligation = ?, Contract_agency = ?, Contract_name = ?,
                Has_staff_contract_obligation = ?, University_staff_affiliation = ?, University_staff_affiliation_income = ?,
                Staff_type = ?,
                Subdistrict = ?, District = ?, Province = ?, Postal_code = ?
            WHERE Application_history_id = ?
        `, sanitizeSqlParams([...histFields, historyId]));
    } else {
        const [insHist] = await connection.query(`
            INSERT INTO application_history (
                Citizen_id, Email, Prefix, First_name, Last_name,
                Nationality, Religion, Birth_province, House_no, Street, Village_no, Alley,
                Father_name, Father_religion, Father_nationality, Father_job,
                Mother_name, Mother_religion, Mother_nationality, Mother_job,
                Spouse_name, Spouse_religion, Spouse_nationality, Spouse_job,
                Birth_day, Birth_month, Age_year, Age_month, Birth_year_be,
                Current_job, Workplace, Foreign_language, Special_skill, Work_experience,
                Recruitment_id, Position_id, Department_id,
                Has_contract_obligation, Contract_agency, Contract_name,
                Has_staff_contract_obligation, University_staff_affiliation, University_staff_affiliation_income,
                Staff_type,
                Subdistrict, District, Province, Postal_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, sanitizeSqlParams(histFields));
        historyId = insHist.insertId;
    }
    return historyId;
};

// Helper: บันทึกเบอร์โทรศัพท์ลง applicant_mobile_phone_history และ applicant_mobile_phone
const savePhones = async (connection, applicantId, historyId, mobilePhones, singlePhone) => {
    let phoneList = [];
    if (mobilePhones) {
        try {
            phoneList = typeof mobilePhones === 'string' ? JSON.parse(mobilePhones) : mobilePhones;
        } catch (e) {
            if (singlePhone) phoneList = [singlePhone];
        }
    } else if (singlePhone) {
        phoneList = [singlePhone];
    }

    if (historyId) {
        await connection.query(`DELETE FROM applicant_mobile_phone_history WHERE Application_history_id = ?`, [historyId]);
    }

    for (const phone of phoneList) {
        if (phone && String(phone).trim()) {
            const cleanPhone = String(phone).replace(/[^0-9]/g, '').slice(0, 10);
            if (cleanPhone) {
                if (historyId) {
                    await connection.query(
                        `INSERT IGNORE INTO applicant_mobile_phone_history (Mobile_phone_history, Application_history_id) VALUES (?, ?)`,
                        [cleanPhone, historyId]
                    );
                }
                if (applicantId) {
                    await connection.query(
                        `INSERT IGNORE INTO applicant_mobile_phone (Mobile_phone, Applicant_id) VALUES (?, ?)`,
                        [cleanPhone, applicantId]
                    );
                }
            }
        }
    }
};

// Helper: บันทึกข้อมูลการศึกษา (ตารางหลัก Education ผูกกับ Applicant_id)
const saveEducations = async (connection, applicantId, educationsData) => {
    if (applicantId) {
        await connection.query(`DELETE FROM Education WHERE Applicant_id = ?`, [applicantId]);
    }
    if (!educationsData) return;

    let educations = [];
    try {
        educations = typeof educationsData === 'string' ? JSON.parse(educationsData) : educationsData;
    } catch (e) {
        console.error("Error parsing educations:", e);
        return;
    }

    for (const edu of educations) {
        if (edu && (edu.degree || edu.major || edu.university)) {
            let approveDateStr = formatDateYMD(edu.approvalDate || edu.approveDate);
            const maxAllowedDateStr = getYesterdayDateYMD();
            if (approveDateStr && approveDateStr > maxAllowedDateStr) {
                throw new Error('วันที่ได้รับอนุมัติผลการศึกษาต้องเป็นวันที่ก่อนหน้าวันสมัครอย่างน้อย 1 วัน');
            }

            await connection.query(`
                INSERT INTO Education (
                    Applied_degree, Major, Institute_name, Country_name, 
                    Approve_date, Gpa, 
                    Applicant_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, sanitizeSqlParams([
                edu.degree || edu.Applied_degree || '',
                edu.major || edu.Major || '',
                edu.university || edu.Institute_name || '',
                edu.country || edu.Country_name || 'ไทย',
                approveDateStr || null,
                (edu.gpa !== undefined && edu.gpa !== null && edu.gpa !== '') ? edu.gpa : (edu.Gpa || null),
                applicantId
            ]));
        }
    }
};

// Helper: บันทึกผลสอบภาษาอังกฤษ (ตารางหลัก eng_exam_result ผูกกับ Applicant_id)
const saveEngTests = async (connection, applicantId, engTestsData) => {
    if (applicantId) {
        await connection.query(`DELETE FROM eng_exam_result WHERE Applicant_id = ?`, [applicantId]);
    }
    if (!engTestsData) return;

    let engTests = [];
    try {
        engTests = typeof engTestsData === 'string' ? JSON.parse(engTestsData) : engTestsData;
    } catch (e) {
        console.error("Error parsing engTests:", e);
        return;
    }

    for (const test of engTests) {
        if (test && (test.testName || test.name) && (test.score !== '' && test.score !== null && test.score !== undefined)) {
            const examTypeId = await getEngExamTypeId(connection, test.testName || test.name);
            const examDate = (test.examDate && String(test.examDate).trim() !== '') ? formatDateYMD(test.examDate) : null;
            const maxAllowedDateStr = getYesterdayDateYMD();
            if (examDate && examDate > maxAllowedDateStr) {
                throw new Error('วันที่สอบภาษาอังกฤษต้องเป็นวันที่ก่อนหน้าวันสมัครอย่างน้อย 1 วัน');
            }

            await connection.query(`
                INSERT INTO eng_exam_result (
                    Eng_score, Exam_date, Applicant_id, Eng_exam_type_id
                ) VALUES (?, ?, ?, ?)
            `, sanitizeSqlParams([
                String(test.score),
                examDate,
                applicantId,
                examTypeId
            ]));
        }
    }
};

// API สำหรับบันทึกใบสมัครงานพร้อมไฟล์แนบ
const submitApplication = async (req, res) => {
    let connection;
    try {
        const { recruitmentId } = req.params;
        const applicantData = req.body;

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. ดึง Position_id, Department_id และ Round_no จาก Recruitment
        const [recRow] = await connection.query(`SELECT Position_id, Department_id, Round_no FROM Recruitment WHERE Recruitment_id = ?`, [recruitmentId]);
        if (recRow.length === 0) throw new Error("ไม่พบประกาศรับสมัครนี้ในระบบ");
        const positionId = recRow[0].Position_id;
        const departmentId = recRow[0].Department_id;
        const currentRound = recRow[0].Round_no ? Number(recRow[0].Round_no) : 1;

        // 2. ตรวจสอบเลขประจำตัวประชาชน (13 หลัก เฉพาะตัวเลข)
        const citizenId = (applicantData.citizenId || '').trim();
        if (!citizenId) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "กรุณาระบุเลขประจำตัวประชาชน 13 หลัก" });
        }
        if (!/^\d{13}$/.test(citizenId)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น (ห้ามมีตัวอักษรหรือสัญลักษณ์)" });
        }

        // ตรวจสอบอีเมล (ไม่เกิน 100 ตัวอักษร, ไม่มีอักษรไทย/ช่องว่าง, รูปแบบถูกต้อง)
        const applicantEmail = (applicantData.email || '').trim().toLowerCase();
        if (!applicantEmail) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "กรุณาระบุอีเมล" });
        }
        if (applicantEmail.length > 100 || /[\u0E00-\u0E7F\s]/.test(applicantEmail) || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(applicantEmail)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง หรือมีตัวอักษรภาษาไทย/ช่องว่าง" });
        }

        // ตรวจสอบชื่อ-นามสกุล (ตัวอักษรไทย/อังกฤษ 2-50 ตัวอักษร ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ)
        const firstName = (applicantData.firstName || '').trim();
        const lastName = (applicantData.lastName || '').trim();
        if (!firstName || firstName.length < 2 || firstName.length > 50) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "ชื่อผู้สมัครต้องมีความยาวระหว่าง 2 ถึง 50 ตัวอักษร" });
        }
        if (/[0-9]/.test(firstName) || /[^a-zA-Z\u0E00-\u0E7F\s]/.test(firstName)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "ชื่อผู้สมัครต้องเป็นตัวอักษรภาษาไทยหรือภาษาอังกฤษเท่านั้น ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ" });
        }
        if (!lastName || lastName.length < 2 || lastName.length > 50) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "นามสกุลผู้สมัครต้องมีความยาวระหว่าง 2 ถึง 50 ตัวอักษร" });
        }
        if (/[0-9]/.test(lastName) || /[^a-zA-Z\u0E00-\u0E7F\s]/.test(lastName)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "นามสกุลผู้สมัครต้องเป็นตัวอักษรภาษาไทยหรือภาษาอังกฤษเท่านั้น ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ" });
        }

        // ตรวจสอบที่อยู่เลขที่ (ไม่เกิน 30 ตัวอักษร และไม่มีอักขระต้องห้าม)
        const houseNo = (applicantData.houseNo || '').trim();
        if (!houseNo || houseNo.length > 30 || /[<>"';%]/.test(houseNo)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "ที่อยู่เลขที่ไม่ถูกต้องหรือมีอักขระต้องห้าม (ความยาว 1-30 ตัวอักษร)" });
        }

        // ตรวจสอบชื่อบิดา มารดา และคู่สมรส
        const fatherName = (applicantData.fatherName || '').trim();
        if (!fatherName || fatherName.length < 2 || fatherName.length > 80 || /[0-9]/.test(fatherName) || /[^a-zA-Z\u0E00-\u0E7F\s]/.test(fatherName)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "ชื่อบิดาต้องเป็นตัวอักษรเท่านั้น (ความยาว 2-80 ตัวอักษร)" });
        }
        const motherName = (applicantData.motherName || '').trim();
        if (!motherName || motherName.length < 2 || motherName.length > 80 || /[0-9]/.test(motherName) || /[^a-zA-Z\u0E00-\u0E7F\s]/.test(motherName)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "ชื่อมารดาต้องเป็นตัวอักษรเท่านั้น (ความยาว 2-80 ตัวอักษร)" });
        }
        if (applicantData.spouseName && String(applicantData.spouseName).trim()) {
            const spName = String(applicantData.spouseName).trim();
            if (spName.length < 2 || spName.length > 80 || /[0-9]/.test(spName) || /[^a-zA-Z\u0E00-\u0E7F\s]/.test(spName)) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: "ชื่อคู่สมรสต้องเป็นตัวอักษรเท่านั้น (ความยาว 2-80 ตัวอักษร)" });
            }
        }

        // ตรวจสอบวันเกิดและอายุของผู้สมัคร (ต้องมีอายุอย่างน้อย 18 ปีบริบูรณ์ และไม่ใช่วันในอนาคต)
        if (applicantData.dob) {
            const birthYMD = formatDateYMD(applicantData.dob);
            const d = new Date();
            d.setFullYear(d.getFullYear() - 18);
            const maxDobStr = formatDateYMD(d);
            if (birthYMD > maxDobStr) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: "ผู้สมัครต้องมีอายุอย่างน้อย 18 ปีบริบูรณ์ และไม่สามารถระบุวันเกิดในอนาคตได้"
                });
            }
        }

        // ตรวจสอบเบอร์โทรศัพท์มือถือ (ต้องขึ้นต้นด้วย 0, 9-10 หลัก, ห้ามซ้ำกัน)
        if (applicantData.mobilePhones) {
            try {
                const phones = typeof applicantData.mobilePhones === 'string' ? JSON.parse(applicantData.mobilePhones) : applicantData.mobilePhones;
                if (Array.isArray(phones)) {
                    const filledPhones = phones.map(p => String(p).trim()).filter(Boolean);
                    if (filledPhones.length === 0) {
                        await connection.rollback();
                        return res.status(400).json({ success: false, message: "กรุณาระบุเบอร์โทรศัพท์มือถืออย่างน้อย 1 เบอร์" });
                    }
                    for (const p of filledPhones) {
                        if (!/^0\d{8,9}$/.test(p)) {
                            await connection.rollback();
                            return res.status(400).json({ success: false, message: `เบอร์โทรศัพท์ "${p}" ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก (เฉพาะตัวเลข)` });
                        }
                    }
                    if (new Set(filledPhones).size !== filledPhones.length) {
                        await connection.rollback();
                        return res.status(400).json({ success: false, message: "เบอร์โทรศัพท์มือถือมีรายการซ้ำกัน กรุณาตรวจสอบ" });
                    }
                }
            } catch (e) {
                console.warn("Parse mobilePhones error:", e);
            }
        }

        // ตรวจสอบภาระผูกพัน
        if (applicantData.obligation === 'มี') {
            if (!applicantData.contractAgency || !applicantData.contractAgency.trim() || !applicantData.contractName || !applicantData.contractName.trim()) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: "กรณีมีภาระผูกพัน กรุณาระบุหน่วยงานที่ชดใช้ทุนและชื่อสัญญารับทุน" });
            }
        }

        // ตรวจสอบวุฒิการศึกษา (วันที่อนุมัติไม่เกินวันก่อนหน้าวันสมัคร, เกรดไม่เกิน 4.00, ห้ามซ้ำ)
        if (applicantData.educations) {
            try {
                const edus = typeof applicantData.educations === 'string' ? JSON.parse(applicantData.educations) : applicantData.educations;
                if (Array.isArray(edus)) {
                    const yesterdayStr = getYesterdayDateYMD();
                    const seenEdus = new Set();
                    for (const edu of edus) {
                        if (edu.approvalDate && formatDateYMD(edu.approvalDate) > yesterdayStr) {
                            await connection.rollback();
                            return res.status(400).json({ success: false, message: "วันที่ได้รับอนุมัติผลการศึกษาต้องเป็นวันที่ก่อนหน้าวันสมัครอย่างน้อย 1 วัน" });
                        }
                        if (edu.gpa) {
                            const gpaVal = parseFloat(edu.gpa);
                            if (isNaN(gpaVal) || gpaVal < 0 || gpaVal > 4.0) {
                                await connection.rollback();
                                return res.status(400).json({ success: false, message: "เกรดเฉลี่ยสะสม (GPA) ต้องอยู่ระหว่าง 0.00 ถึง 4.00" });
                            }
                        }
                        if (edu.degree && edu.major) {
                            const key = `${edu.degree.trim()}_${edu.major.trim()}_${(edu.university || '').trim()}`;
                            if (seenEdus.has(key)) {
                                await connection.rollback();
                                return res.status(400).json({ success: false, message: "ข้อมูลวุฒิการศึกษามีรายการซ้ำกัน กรุณาตรวจสอบ" });
                            }
                            seenEdus.add(key);
                        }
                    }
                }
            } catch (e) {
                console.warn("Parse educations error:", e);
            }
        }

        // ตรวจสอบการสอบภาษาอังกฤษ (วันที่สอบไม่เกินวันก่อนหน้าวันสมัคร, ห้ามประเภทซ้ำ)
        if (applicantData.engTests) {
            try {
                const tests = typeof applicantData.engTests === 'string' ? JSON.parse(applicantData.engTests) : applicantData.engTests;
                if (Array.isArray(tests)) {
                    const yesterdayStr = getYesterdayDateYMD();
                    const seenTests = new Set();
                    for (const test of tests) {
                        if (test.examDate && formatDateYMD(test.examDate) > yesterdayStr) {
                            await connection.rollback();
                            return res.status(400).json({ success: false, message: "วันที่สอบภาษาอังกฤษต้องเป็นวันที่ก่อนหน้าวันสมัครอย่างน้อย 1 วัน" });
                        }
                        if (test.testName && test.testName.trim()) {
                            if (seenTests.has(test.testName.trim())) {
                                await connection.rollback();
                                return res.status(400).json({ success: false, message: `ประเภทการทดสอบภาษาอังกฤษ "${test.testName}" ซ้ำกัน กรุณาตรวจสอบ` });
                            }
                            seenTests.add(test.testName.trim());
                        }
                    }
                }
            } catch (e) {
                console.warn("Parse engTests error:", e);
            }
        }

        // ตรวจสอบว่าผู้สมัครคนนี้เคยสมัครตำแหน่ง/ประกาศนี้ในรอบนี้ไปแล้วหรือไม่ (ห้ามสมัครซ้ำในรอบเดียวกัน ยกเว้น Draft)
        const [existingApp] = await connection.query(`
            SELECT a.Application_id 
            FROM Application a
            JOIN Applicant ap ON a.Applicant_id = ap.Applicant_id
            WHERE TRIM(ap.Citizen_id) = ? AND a.Recruitment_id = ? AND a.Round_no = ? AND a.Status != 'Draft'
        `, [citizenId, recruitmentId, currentRound]);

        if (existingApp.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `ท่านได้ยื่นสมัครในตำแหน่งนี้ (รอบที่ ${currentRound}) เรียบร้อยแล้ว ไม่สามารถสมัครซ้ำได้`
            });
        }

        // 3. แปลงข้อมูลที่อยู่ Snapshot
        const addr = await resolveAddressDetails(
            connection,
            applicantData.subdistrictId || applicantData.Subdistrict_id,
            applicantData.selectedTambon || applicantData.tambon || applicantData.Subdistrict,
            applicantData.selectedProvince || applicantData.province || applicantData.Province,
            applicantData.zipcode || applicantData.postalCode || applicantData.Postal_code
        );
        if (applicantData.selectedAmphoe || applicantData.District) {
            addr.districtName = addr.districtName || applicantData.selectedAmphoe || applicantData.District;
        }

        // 4. จัดการข้อมูลโปรไฟล์ในตาราง Applicant
        const applicantId = await upsertApplicant(connection, citizenId, applicantEmail, applicantData, addr);

        const applyDate = formatDateYMD(new Date());
        const applyTime = new Date().toTimeString().split(' ')[0];

        // 5. จัดการตาราง Application (บันทึกพร้อม Round_no)
        const [existingDraft] = await connection.query(`
            SELECT a.Application_id 
            FROM Application a
            WHERE a.Applicant_id = ? AND a.Recruitment_id = ? AND a.Round_no = ? AND a.Status = 'Draft'
        `, [applicantId, recruitmentId, currentRound]);

        let applicationId;
        if (existingDraft.length > 0) {
            applicationId = existingDraft[0].Application_id;
            await connection.query(`
                UPDATE Application SET
                    Apply_time = ?, Apply_date = ?, Status = 'รอตรวจสอบ', Round_no = ?, Position_id = ?, Department_id = ?
                WHERE Application_id = ?
            `, [applyTime, applyDate, currentRound, positionId, departmentId, applicationId]);
        } else {
            const [insRes] = await connection.query(`
                INSERT INTO Application (
                    Applicant_id, Recruitment_id, Apply_time, Apply_date, Status, Round_no, Position_id, Department_id
                ) VALUES (?, ?, ?, ?, 'รอตรวจสอบ', ?, ?, ?)
            `, [applicantId, recruitmentId, applyTime, applyDate, currentRound, positionId, departmentId]);
            applicationId = insRes.insertId;
        }

        // 6. บันทึก Snapshot ข้อมูลลงตาราง application_history
        applicantData.roundNo = currentRound;
        const historyId = await upsertApplicationHistory(connection, citizenId, recruitmentId, positionId, departmentId, applicantEmail, applicantData, addr);

        // 7. บันทึกเบอร์โทรศัพท์ลง applicant_mobile_phone_history และ applicant_mobile_phone
        await savePhones(connection, applicantId, historyId, applicantData.mobilePhones, applicantData.mobilePhone);

        // 8. บันทึกประวัติการศึกษา (Education ผูกกับ Applicant_id)
        await saveEducations(connection, applicantId, applicantData.educations);

        // 9. บันทึกผลสอบภาษาอังกฤษ (eng_exam_result ผูกกับ Applicant_id)
        await saveEngTests(connection, applicantId, applicantData.engTests);

        // 10. บันทึกไฟล์ที่อัปโหลด (Document Storage)
        if (req.files && req.files.length > 0) {
            const docTypeSlugs = {
                1: 'photo',
                2: 'degree',
                3: 'name_change',
                4: 'other_doc',
                5: 'house_registration',
                6: 'id_card',
                7: 'military',
                8: 'medical_cert',
                9: 'reference'
            };

            const jobDir = path.join(__dirname, '../../uploads/applicants', citizenId, `job_${recruitmentId}`);
            if (!fs.existsSync(jobDir)) {
                fs.mkdirSync(jobDir, { recursive: true });
            }

            // ลบข้อมูล document_storage เดิมของใบสมัครนี้ (ถ้ามี) เพื่อแทนที่ด้วยรายการไฟล์ชุดใหม่ทั้งหมด
            await connection.query(`DELETE FROM document_storage WHERE application_id = ?`, [applicationId]);

            // เตรียม Metadata ถ้ามีการส่ง documents_meta มาจาก frontend
            let metaList = [];
            if (req.body && req.body.documents_meta) {
                try {
                    metaList = typeof req.body.documents_meta === 'string' 
                        ? JSON.parse(req.body.documents_meta) 
                        : req.body.documents_meta;
                } catch (e) {
                    console.error("Error parsing documents_meta:", e);
                }
            }

            let fileIndex = 0;
            for (const file of req.files) {
                fileIndex++;
                let docId = 4;
                let customName = null;

                // ตรวจสอบ metadata หรือชื่อ fieldname
                const foundMeta = Array.isArray(metaList) ? metaList.find(m => m.fieldname === file.fieldname) : null;
                if (foundMeta) {
                    if (foundMeta.docId) docId = Number(foundMeta.docId);
                    if (foundMeta.customName) customName = String(foundMeta.customName).trim();
                }

                if (!customName && req.body[`custom_name_${file.fieldname}`]) {
                    customName = String(req.body[`custom_name_${file.fieldname}`]).trim();
                }

                if (!foundMeta) {
                    if (file.fieldname.startsWith('doc_')) {
                        const parts = file.fieldname.replace('doc_', '').split('_');
                        const parsedId = parseInt(parts[0], 10);
                        if (!isNaN(parsedId)) docId = parsedId;
                    } else if (file.fieldname.startsWith('additional_')) {
                        docId = 4; // เอกสารอื่น
                    } else {
                        if (file.fieldname === 'profileImage') docId = 1;
                        if (file.fieldname === 'degree') docId = 2;
                        if (file.fieldname === 'nameChange') docId = 3;
                        if (file.fieldname === 'houseReg') docId = 5;
                        if (file.fieldname === 'idCard') docId = 6;
                        if (file.fieldname === 'military') docId = 7;
                        if (file.fieldname === 'medical') docId = 8;
                        if (file.fieldname === 'recommendation') docId = 9;
                    }
                }

                if (isNaN(docId)) docId = 4;

                const slug = docTypeSlugs[docId] || `doc_${docId}`;
                const ext = (path.extname(file.originalname || file.filename) || '.pdf').toLowerCase();
                const uniqueSuffix = Date.now() + '_' + fileIndex + '_' + Math.round(Math.random() * 1000);
                const targetFileName = `${slug}_${uniqueSuffix}${ext}`;
                const targetOnDisk = path.join(jobDir, targetFileName);

                if (file.path && fs.existsSync(file.path)) {
                    try {
                        fs.renameSync(file.path, targetOnDisk);
                    } catch (err) {
                        console.error('Error renaming file to targetOnDisk:', err);
                    }
                }

                const normalizedRelPath = `uploads/applicants/${citizenId}/job_${recruitmentId}/${targetFileName}`;

                await connection.query(`
                    INSERT INTO document_storage (
                        document_id, application_id, applicant_id, position_id, department_id,
                        file_name, custom_name, file_path
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        file_name = VALUES(file_name),
                        custom_name = VALUES(custom_name),
                        file_path = VALUES(file_path)
                `, [docId, applicationId, applicantId, positionId, departmentId, targetFileName, customName || null, normalizedRelPath]);
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'บันทึกใบสมัครเรียบร้อยแล้ว', applicationId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error submitting application:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกใบสมัคร: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
};

// API สำหรับบันทึกแบบร่าง (Draft)
const saveDraft = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // Recruitment_id
        const data = req.body;

        if (!data.citizenId) {
            return res.status(400).json({ success: false, message: 'ต้องระบุเลขบัตรประชาชน' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const citizenId = data.citizenId.trim();
        const applicantEmail = (data.email || '').trim().toLowerCase();

        // ดึง Position_id, Department_id และ Round_no จาก Recruitment
        const [recRow] = await connection.query(`SELECT Position_id, Department_id, Round_no FROM Recruitment WHERE Recruitment_id = ?`, [id]);
        const positionId = recRow.length > 0 ? recRow[0].Position_id : null;
        const departmentId = recRow.length > 0 ? recRow[0].Department_id : null;
        const currentRound = (recRow.length > 0 && recRow[0].Round_no) ? Number(recRow[0].Round_no) : 1;

        // 1. แปลงข้อมูลที่อยู่ Snapshot
        const addr = await resolveAddressDetails(
            connection,
            data.subdistrictId || data.Subdistrict_id,
            data.selectedTambon || data.tambon || data.Subdistrict,
            data.selectedProvince || data.province || data.Province,
            data.zipcode || data.postalCode || data.Postal_code
        );
        if (data.selectedAmphoe || data.District) {
            addr.districtName = addr.districtName || data.selectedAmphoe || data.District;
        }

        // 2. ตรวจสอบหรือสร้าง Applicant Account
        const applicantId = await upsertApplicant(connection, citizenId, applicantEmail, data, addr);

        // 3. จัดการ Application row สำหรับ Draft (ระบุ Round_no)
        const [existing] = await connection.query(
            `SELECT Application_id FROM Application WHERE Applicant_id = ? AND Recruitment_id = ? AND Round_no = ? AND Status = 'Draft'`,
            [applicantId, id, currentRound]
        );

        let applicationId;
        const applyDate = formatDateYMD(new Date());
        const applyTime = new Date().toTimeString().split(' ')[0];

        if (existing.length > 0) {
            applicationId = existing[0].Application_id;
            await connection.query(`
                UPDATE Application SET 
                    Apply_time = ?, Apply_date = ?, Status = 'Draft', Round_no = ?, Position_id = ?, Department_id = ?
                WHERE Application_id = ?
            `, [applyTime, applyDate, currentRound, positionId, departmentId, applicationId]);
        } else {
            const [insRes] = await connection.query(`
                INSERT INTO Application (
                    Applicant_id, Recruitment_id, Apply_time, Apply_date, Status, Round_no, Position_id, Department_id
                ) VALUES (?, ?, ?, ?, 'Draft', ?, ?, ?)
            `, [applicantId, id, applyTime, applyDate, currentRound, positionId, departmentId]);
            applicationId = insRes.insertId;
        }

        // 4. บันทึก Snapshot ลง application_history
        data.roundNo = currentRound;
        const historyId = await upsertApplicationHistory(connection, citizenId, id, positionId, departmentId, applicantEmail, data, addr);

        // 5. บันทึกเบอร์โทรศัพท์ลง applicant_mobile_phone_history และ applicant_mobile_phone
        await savePhones(connection, applicantId, historyId, data.mobilePhones, data.mobilePhone);

        // 6. บันทึกวุฒิการศึกษา (Education ผูกกับ Applicant_id)
        await saveEducations(connection, applicantId, data.educations);

        // 7. บันทึกผลสอบภาษาอังกฤษ (eng_exam_result ผูกกับ Applicant_id)
        await saveEngTests(connection, applicantId, data.engTests);

        await connection.commit();
        res.json({ success: true, message: 'บันทึกแบบร่างสำเร็จ', applicationId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error saving draft:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
};

// API สำหรับดึงข้อมูลแบบร่าง หรือประวัติการสมัครล่าสุด
const loadDraft = async (req, res) => {
    try {
        const { id, citizenId } = req.params;
        const email = req.query.email || req.body.email;

        if (!citizenId || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'ต้องระบุทั้งเลขประจำตัวประชาชนและอีเมลเพื่อเรียกใช้ข้อมูล' 
            });
        }

        const cleanCitizenId = citizenId.trim();
        const cleanEmail = email.trim().toLowerCase();

        // ดึงรอบปัจจุบันของประกาศ
        const [recRows] = await db.query(`SELECT Round_no FROM Recruitment WHERE Recruitment_id = ?`, [id]);
        const currentRound = (recRows.length > 0 && recRows[0].Round_no) ? Number(recRows[0].Round_no) : 1;

        // 📍 1. ดึงแบบร่างที่เคยบันทึกไว้ใน "ตำแหน่งนี้" (Recruitment_id = id AND Status = 'Draft') โดยให้ความสำคัญกับรอบปัจจุบันก่อน
        let [targetApps] = await db.query(`
            SELECT 
                app.Application_id,
                app.Applicant_id,
                app.Recruitment_id,
                app.Round_no,
                ah.Application_history_id,
                COALESCE(ah.Citizen_id, ap.Citizen_id) AS Citizen_id,
                COALESCE(ah.Email, ap.Email) AS Email,
                COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
                COALESCE(ah.First_name, ap.First_name) AS First_name,
                COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                COALESCE(ah.Nationality, ap.Nationality) AS Nationality,
                COALESCE(ah.Religion, ap.Religion) AS Religion,
                COALESCE(ah.Birth_province, ap.Birth_province) AS Birth_province,
                COALESCE(ah.House_no, ap.House_no) AS House_no,
                COALESCE(ah.Street, ap.Street) AS Street,
                COALESCE(ah.Village_no, ap.Village_no) AS Village_no,
                COALESCE(ah.Alley, ap.Alley) AS Alley,
                COALESCE(ah.Father_name, ap.Father_name) AS Father_name,
                COALESCE(ah.Father_religion, ap.Father_religion) AS Father_religion,
                COALESCE(ah.Father_nationality, ap.Father_nationality) AS Father_nationality,
                COALESCE(ah.Father_job, ap.Father_job) AS Father_job,
                COALESCE(ah.Mother_name, ap.Mother_name) AS Mother_name,
                COALESCE(ah.Mother_religion, ap.Mother_religion) AS Mother_religion,
                COALESCE(ah.Mother_nationality, ap.Mother_nationality) AS Mother_nationality,
                COALESCE(ah.Mother_job, ap.Mother_job) AS Mother_job,
                COALESCE(ah.Spouse_name, ap.Spouse_name) AS Spouse_name,
                COALESCE(ah.Spouse_religion, ap.Spouse_religion) AS Spouse_religion,
                COALESCE(ah.Spouse_nationality, ap.Spouse_nationality) AS Spouse_nationality,
                COALESCE(ah.Spouse_job, ap.Spouse_job) AS Spouse_job,
                COALESCE(ah.Age_year, ap.Age_year) AS Age_year,
                COALESCE(ah.Age_month, ap.Age_month) AS Age_month,
                COALESCE(ah.Current_job, ap.Current_job) AS Current_job,
                COALESCE(ah.Workplace, ap.Workplace) AS Workplace,
                COALESCE(ah.Special_skill, ap.Special_skill) AS Special_skill,
                ah.Work_experience,
                COALESCE(ah.Foreign_language, ap.Foreign_language) AS Foreign_language,
                COALESCE(ah.Has_contract_obligation, ap.Has_contract_obligation) AS Has_contract_obligation,
                COALESCE(ah.Contract_agency, ap.Contract_agency) AS Contract_agency,
                COALESCE(ah.Contract_name, ap.Contract_name) AS Contract_name,
                COALESCE(ah.Has_staff_contract_obligation, ap.Has_staff_contract_obligation) AS Has_staff_contract_obligation,
                COALESCE(ah.University_staff_affiliation, ap.University_staff_affiliation) AS University_staff_affiliation,
                COALESCE(ah.University_staff_affiliation_income, ap.University_staff_affiliation_income) AS University_staff_affiliation_income,
                COALESCE(ah.Staff_type, ap.Staff_type) AS Staff_type,
                ah.Birth_day AS ah_birth_day,
                ah.Birth_month AS ah_birth_month,
                ah.Birth_year_be AS ah_birth_year_be,
                ap.Birth_day AS ap_birth_day,
                ap.Subdistrict_id AS Subdistrict_id,
                COALESCE(ah.Subdistrict, s.Subdistrict_name) AS Subdistrict,
                COALESCE(ah.District, d.District_name) AS District,
                COALESCE(ah.Province, p.Province_name) AS Province,
                COALESCE(ah.Postal_code, d.Postal_code) AS Postal_code,
                COALESCE(ah.Subdistrict, s.Subdistrict_name) AS Subdistrict_name,
                COALESCE(ah.District, d.District_name) AS District_name,
                COALESCE(ah.Province, p.Province_name) AS Province_name
            FROM Application app
            JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
            LEFT JOIN application_history ah ON (TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id) AND app.Recruitment_id = ah.Recruitment_id)
            LEFT JOIN subdistrict s ON s.Subdistrict_id = ap.Subdistrict_id
            LEFT JOIN district d ON s.District_id = d.District_id
            LEFT JOIN province p ON d.Province_id = p.Province_id
            WHERE TRIM(ap.Citizen_id) = ? AND LOWER(TRIM(ap.Email)) = ? AND app.Recruitment_id = ? AND app.Status = 'Draft'
            ORDER BY (app.Round_no = ${currentRound}) DESC, app.Application_id DESC LIMIT 1
        `, [cleanCitizenId, cleanEmail, id]);

        let source = 'draft';
        let message = 'ดึงข้อมูลจากแบบร่างที่เคยบันทึกไว้ในตำแหน่งนี้สำเร็จ';

        // 📍 1.1 ถ้าใน Application ไม่มี Draft ให้ลองเช็คตรงจาก application_history สำหรับตำแหน่งนี้
        if (targetApps.length === 0) {
            const [histDrafts] = await db.query(`
                SELECT 
                    ah.*,
                    ah.Birth_day AS ah_birth_day,
                    ah.Birth_month AS ah_birth_month,
                    ah.Birth_year_be AS ah_birth_year_be,
                    ap.Subdistrict_id AS Subdistrict_id,
                    COALESCE(ah.Subdistrict, s.Subdistrict_name) AS Subdistrict,
                    COALESCE(ah.District, d.District_name) AS District,
                    COALESCE(ah.Province, p.Province_name) AS Province,
                    COALESCE(ah.Postal_code, d.Postal_code) AS Postal_code,
                    COALESCE(ah.Subdistrict, s.Subdistrict_name) AS Subdistrict_name,
                    COALESCE(ah.District, d.District_name) AS District_name,
                    COALESCE(ah.Province, p.Province_name) AS Province_name
                FROM application_history ah
                LEFT JOIN Applicant ap ON TRIM(ah.Citizen_id) = TRIM(ap.Citizen_id)
                LEFT JOIN subdistrict s ON s.Subdistrict_id = ap.Subdistrict_id
                LEFT JOIN district d ON s.District_id = d.District_id
                LEFT JOIN province p ON d.Province_id = p.Province_id
                WHERE TRIM(ah.Citizen_id) = ? AND LOWER(TRIM(ah.Email)) = ? AND ah.Recruitment_id = ?
                ORDER BY ah.Application_history_id DESC LIMIT 1
            `, [cleanCitizenId, cleanEmail, id]);

            if (histDrafts.length > 0) {
                targetApps = histDrafts;
            }
        }

        // 📍 2. ถ้าไม่มีแบบร่างในตำแหน่งนี้ ให้ดึงข้อมูลประวัติการสมัครงานล่าสุดที่เคยยื่นสำเร็จ (Status != 'Draft')
        if (targetApps.length === 0) {
            const [submittedApps] = await db.query(`
                SELECT 
                    app.Application_id,
                    app.Applicant_id,
                    app.Recruitment_id,
                    ah.Application_history_id,
                    COALESCE(ah.Citizen_id, ap.Citizen_id) AS Citizen_id,
                    COALESCE(ah.Email, ap.Email) AS Email,
                    COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
                    COALESCE(ah.First_name, ap.First_name) AS First_name,
                    COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                    COALESCE(ah.Nationality, ap.Nationality) AS Nationality,
                    COALESCE(ah.Religion, ap.Religion) AS Religion,
                    COALESCE(ah.Birth_province, ap.Birth_province) AS Birth_province,
                    COALESCE(ah.House_no, ap.House_no) AS House_no,
                    COALESCE(ah.Street, ap.Street) AS Street,
                    COALESCE(ah.Village_no, ap.Village_no) AS Village_no,
                    COALESCE(ah.Alley, ap.Alley) AS Alley,
                    COALESCE(ah.Father_name, ap.Father_name) AS Father_name,
                    COALESCE(ah.Father_religion, ap.Father_religion) AS Father_religion,
                    COALESCE(ah.Father_nationality, ap.Father_nationality) AS Father_nationality,
                    COALESCE(ah.Father_job, ap.Father_job) AS Father_job,
                    COALESCE(ah.Mother_name, ap.Mother_name) AS Mother_name,
                    COALESCE(ah.Mother_religion, ap.Mother_religion) AS Mother_religion,
                    COALESCE(ah.Mother_nationality, ap.Mother_nationality) AS Mother_nationality,
                    COALESCE(ah.Mother_job, ap.Mother_job) AS Mother_job,
                    COALESCE(ah.Spouse_name, ap.Spouse_name) AS Spouse_name,
                    COALESCE(ah.Spouse_religion, ap.Spouse_religion) AS Spouse_religion,
                    COALESCE(ah.Spouse_nationality, ap.Spouse_nationality) AS Spouse_nationality,
                    COALESCE(ah.Spouse_job, ap.Spouse_job) AS Spouse_job,
                    COALESCE(ah.Age_year, ap.Age_year) AS Age_year,
                    COALESCE(ah.Age_month, ap.Age_month) AS Age_month,
                    COALESCE(ah.Current_job, ap.Current_job) AS Current_job,
                    COALESCE(ah.Workplace, ap.Workplace) AS Workplace,
                    COALESCE(ah.Special_skill, ap.Special_skill) AS Special_skill,
                    ah.Work_experience,
                    COALESCE(ah.Foreign_language, ap.Foreign_language) AS Foreign_language,
                    COALESCE(ah.Has_contract_obligation, ap.Has_contract_obligation) AS Has_contract_obligation,
                    COALESCE(ah.Contract_agency, ap.Contract_agency) AS Contract_agency,
                    COALESCE(ah.Contract_name, ap.Contract_name) AS Contract_name,
                    COALESCE(ah.Has_staff_contract_obligation, ap.Has_staff_contract_obligation) AS Has_staff_contract_obligation,
                    COALESCE(ah.University_staff_affiliation, ap.University_staff_affiliation) AS University_staff_affiliation,
                    COALESCE(ah.University_staff_affiliation_income, ap.University_staff_affiliation_income) AS University_staff_affiliation_income,
                    COALESCE(ah.Staff_type, ap.Staff_type) AS Staff_type,
                    ah.Birth_day AS ah_birth_day,
                    ah.Birth_month AS ah_birth_month,
                    ah.Birth_year_be AS ah_birth_year_be,
                    ap.Birth_day AS ap_birth_day,
                    ap.Subdistrict_id AS Subdistrict_id,
                    COALESCE(ah.Subdistrict, s.Subdistrict_name) AS Subdistrict,
                    COALESCE(ah.District, d.District_name) AS District,
                    COALESCE(ah.Province, p.Province_name) AS Province,
                    COALESCE(ah.Postal_code, d.Postal_code) AS Postal_code,
                    COALESCE(ah.Subdistrict, s.Subdistrict_name) AS Subdistrict_name,
                    COALESCE(ah.District, d.District_name) AS District_name,
                    COALESCE(ah.Province, p.Province_name) AS Province_name
                FROM Application app
                JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
                LEFT JOIN application_history ah ON (TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id) AND app.Recruitment_id = ah.Recruitment_id)
                LEFT JOIN subdistrict s ON s.Subdistrict_id = ap.Subdistrict_id
                LEFT JOIN district d ON s.District_id = d.District_id
                LEFT JOIN province p ON d.Province_id = p.Province_id
                WHERE TRIM(ap.Citizen_id) = ? AND LOWER(TRIM(ap.Email)) = ? AND app.Status != 'Draft'
                ORDER BY app.Apply_date DESC, app.Application_id DESC LIMIT 1
            `, [cleanCitizenId, cleanEmail]);

            if (submittedApps.length > 0) {
                targetApps = submittedApps;
                source = 'latest_application';
                message = 'ดึงข้อมูลประวัติการสมัครงานล่าสุดของคุณสำเร็จ';
            }
        }

        // 📍 3. ถ้าไม่มีใบสมัครเลย ให้ดึงจากข้อมูลในตาราง Applicant
        if (targetApps.length === 0) {
            const [profileApps] = await db.query(`
                SELECT 
                    ap.*,
                    ap.Applicant_id,
                    ap.Birth_day AS ap_birth_day,
                    s.Subdistrict_name AS Subdistrict,
                    d.District_name AS District,
                    p.Province_name AS Province,
                    d.Postal_code AS Postal_code,
                    s.Subdistrict_name AS Subdistrict_name,
                    d.District_name AS District_name,
                    p.Province_name AS Province_name
                FROM Applicant ap
                LEFT JOIN subdistrict s ON s.Subdistrict_id = ap.Subdistrict_id
                LEFT JOIN district d ON s.District_id = d.District_id
                LEFT JOIN province p ON d.Province_id = p.Province_id
                WHERE TRIM(ap.Citizen_id) = ? AND LOWER(TRIM(ap.Email)) = ?
                LIMIT 1
            `, [cleanCitizenId, cleanEmail]);

            if (profileApps.length > 0) {
                targetApps = profileApps;
                source = 'latest_application';
                message = 'ดึงข้อมูลประวัติโปรไฟล์ของคุณสำเร็จ';
            }
        }

        if (targetApps.length === 0) {
            return res.json({ 
                success: false, 
                message: 'ไม่พบแบบร่างในตำแหน่งนี้หรือประวัติการสมัครเดิมที่ตรงกับเลขประจำตัวประชาชนและอีเมลนี้' 
            });
        }

        const appData = targetApps[0];
        const appId = appData.Application_id || null;
        const applicantId = appData.Applicant_id || null;

        // ดึงวุฒิการศึกษา (ดึงจากตารางหลัก Education ตาม Application_id หรือ Applicant_id)
        let educations = [];
        if (applicantId) {
            const [eRows] = await db.query(`
                SELECT * FROM Education 
                WHERE Applicant_id = ?
            `, [applicantId]);
            educations = eRows.map(e => ({
                degree: e.Applied_degree || '',
                major: e.Major || '',
                university: e.Institute_name || '',
                country: e.Country_name || 'ไทย',
                approvalDate: e.Approve_date ? formatDateYMD(e.Approve_date) : '',
                gpa: e.Gpa !== null && e.Gpa !== undefined ? String(e.Gpa) : ''
            }));
        }

        // ดึงผลสอบภาษาอังกฤษ (ดึงจากตารางหลัก eng_exam_result ตาม Applicant_id)
        let engTests = [];
        if (applicantId) {
            const [tRows] = await db.query(`
                SELECT eer.Eng_score as score, eer.Exam_date as examDate, eet.Eng_exam_type_name as testName
                FROM eng_exam_result eer
                LEFT JOIN eng_exam_type eet ON eer.Eng_exam_type_id = eet.Eng_exam_type_id
                WHERE eer.Applicant_id = ?
            `, [applicantId]);
            engTests = tRows.map(t => ({
                name: t.testName || 'การสอบ',
                testName: t.testName || 'การสอบ',
                score: (t.score !== null && t.score !== undefined) ? String(t.score) : '',
                examDate: t.examDate ? formatDateYMD(t.examDate) : ''
            }));
        }

        // ดึงเบอร์โทรศัพท์
        let phones = [];
        const historyId = appData.Application_history_id || null;
        if (historyId) {
            const [pRows] = await db.query(`SELECT Mobile_phone_history FROM applicant_mobile_phone_history WHERE Application_history_id = ?`, [historyId]);
            phones = pRows.map(p => p.Mobile_phone_history);
        }
        if (phones.length === 0 && applicantId) {
            const [pRows] = await db.query(`SELECT Mobile_phone FROM applicant_mobile_phone WHERE Applicant_id = ?`, [applicantId]);
            phones = pRows.map(p => p.Mobile_phone);
        }

        // แปลงวันเกิดให้เป็น YYYY-MM-DD
        let birthDateStr = null;
        if (appData.ap_birth_day) {
            birthDateStr = formatDateYMD(appData.ap_birth_day);
        } else if (appData.Birth_day && String(appData.Birth_day).includes('-')) {
            birthDateStr = formatDateYMD(appData.Birth_day);
        } else if (appData.ah_birth_day && appData.ah_birth_month && appData.ah_birth_year_be) {
            const yCe = parseInt(appData.ah_birth_year_be, 10) - 543;
            const m = String(appData.ah_birth_month).padStart(2, '0');
            const d = String(appData.ah_birth_day).padStart(2, '0');
            birthDateStr = `${yCe}-${m}-${d}`;
        }

        res.json({
            success: true,
            source,
            message,
            draft: {
                Citizen_id: appData.Citizen_id,
                Email: appData.Email,
                Prefix: appData.Prefix,
                First_name: appData.First_name,
                Last_name: appData.Last_name,
                Religion: appData.Religion,
                Nationality: appData.Nationality,
                Birth_day: birthDateStr,
                Age_year: appData.Age_year,
                Age_month: appData.Age_month,
                Birth_province: appData.Birth_province,
                House_no: appData.House_no,
                Village_no: appData.Village_no,
                Alley: appData.Alley,
                Street: appData.Street,
                Subdistrict_id: appData.Subdistrict_id,
                Subdistrict: appData.Subdistrict || appData.Subdistrict_name || '',
                District: appData.District || appData.District_name || '',
                Province: appData.Province || appData.Province_name || '',
                Postal_code: appData.Postal_code || '',
                Subdistrict_name: appData.Subdistrict || appData.Subdistrict_name || '',
                District_name: appData.District || appData.District_name || '',
                Province_name: appData.Province || appData.Province_name || '',
                selectedProvince: appData.Province || appData.Province_name || appData.Birth_province || '',
                selectedAmphoe: appData.District || appData.District_name || '',
                selectedTambon: appData.Subdistrict || appData.Subdistrict_name || '',
                zipcode: appData.Postal_code || '',
                Current_job: appData.Current_job,
                Workplace: appData.Workplace,
                Special_skill: appData.Special_skill,
                Work_experience: appData.Work_experience,
                workExperience: appData.Work_experience,
                Foreign_language: appData.Foreign_language,
                Father_name: appData.Father_name,
                Father_religion: appData.Father_religion,
                Father_nationality: appData.Father_nationality,
                Father_job: appData.Father_job,
                Mother_name: appData.Mother_name,
                Mother_religion: appData.Mother_religion,
                Mother_nationality: appData.Mother_nationality,
                Mother_job: appData.Mother_job,
                Spouse_name: appData.Spouse_name,
                Spouse_religion: appData.Spouse_religion,
                Spouse_nationality: appData.Spouse_nationality,
                Spouse_job: appData.Spouse_job,
                Has_contract_obligation: appData.Has_contract_obligation,
                Contract_agency: appData.Contract_agency,
                Contract_name: appData.Contract_name,
                University_staff_affiliation: appData.University_staff_affiliation,
                University_staff_affiliation_income: appData.University_staff_affiliation_income,
                Staff_type: appData.Staff_type,
                mobilePhones: phones,
                educations: educations.map(e => ({
                    degree: e.degree || e.Applied_degree || '',
                    major: e.major || e.Major || '',
                    university: e.university || e.Institute_name || '',
                    country: e.country || e.Country_name || 'ไทย',
                    approvalDate: e.approvalDate ? (typeof e.approvalDate === 'string' ? e.approvalDate.split('T')[0].split(' ')[0] : formatDateYMD(e.approvalDate)) : (e.Approve_date ? formatDateYMD(e.Approve_date) : ''),
                    gpa: (e.gpa !== undefined && e.gpa !== null && e.gpa !== '') ? String(e.gpa) : (e.Gpa !== null && e.Gpa !== undefined ? String(e.Gpa) : '')
                })),
                engTests: engTests.map(t => ({
                    testName: t.testName || t.name || '',
                    score: (t.score !== undefined && t.score !== null && t.score !== '') ? String(t.score) : (t.Eng_score !== null && t.Eng_score !== undefined ? String(t.Eng_score) : ''),
                    examDate: t.examDate ? (typeof t.examDate === 'string' ? t.examDate.split('T')[0].split(' ')[0] : formatDateYMD(t.examDate)) : (t.Exam_date ? formatDateYMD(t.Exam_date) : '')
                }))
            }
        });

    } catch (error) {
        console.error('Error loading draft/latest profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getMyApplications = async (req, res) => {
    try {
        const { citizenId, applicantId, email } = req.query;
        if (!citizenId && !applicantId && !email) {
            return res.status(400).json({ success: false, message: 'Applicant identifier is required' });
        }

        let whereConditions = [];
        let params = [];

        if (email) {
            whereConditions.push("LOWER(TRIM(ap.Email)) = ?");
            params.push(email.trim().toLowerCase());
            if (citizenId) {
                whereConditions.push("TRIM(ap.Citizen_id) = ?");
                params.push(citizenId.trim());
            }
        } else if (applicantId) {
            whereConditions.push("app.Applicant_id = ?");
            params.push(applicantId);
        } else {
            whereConditions.push("TRIM(ap.Citizen_id) = ?");
            params.push(citizenId.trim());
        }

        const whereClause = whereConditions.join(" AND ");

        const query = `
            SELECT 
                app.Application_id as id,
                app.Recruitment_id as recruitmentId,
                app.Round_no as roundNo,
                app.Apply_date as appliedDateRaw,
                app.Apply_time as appliedTimeRaw,
                app.Status as currentStatus,
                p.Position_name as jobTitle,
                d.Department_name,
                f.Faculty_name,
                (SELECT COUNT(*) FROM exam_position_type ept WHERE ept.Recruitment_id = app.Recruitment_id) as totalExams,
                (SELECT COUNT(*) FROM exam_position_type ept 
                 JOIN has_exam_result her ON ept.Exam_position_type_id = her.Exam_position_type_id AND her.Application_id = app.Application_id
                 WHERE ept.Recruitment_id = app.Recruitment_id AND her.Exam_result IN ('ผ่าน', 'ผ่านการสอบ')
                ) as passedExams,
                (SELECT COUNT(*) FROM exam_position_type ept 
                 JOIN has_exam_result her ON ept.Exam_position_type_id = her.Exam_position_type_id AND her.Application_id = app.Application_id
                 WHERE ept.Recruitment_id = app.Recruitment_id AND her.Exam_result IN ('ไม่ผ่าน', 'ไม่ผ่านการสอบ')
                ) as failedExams
            FROM Application app
            JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
            LEFT JOIN Recruitment r ON app.Recruitment_id = r.Recruitment_id
            LEFT JOIN Position p ON r.Position_id = p.Position_id
            LEFT JOIN Department d ON r.Department_id = d.Department_id
            LEFT JOIN Faculty f ON d.Faculty_id = f.Faculty_id
            WHERE ${whereClause} AND app.Status != 'Draft'
            ORDER BY app.Apply_date DESC, app.Application_id DESC
        `;

        const [rows] = await db.query(query, params);

        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

        const formatted = rows.map(r => {
            const appliedDate = formatThaiDate(r.appliedDateRaw);

            let currentStatus = "รอคณะ/หน่วยงานพิจารณา";
            let statusColor = "info";
            const rawStatus = r.currentStatus || "";
            const totalExams = Number(r.totalExams || 0);
            const passedExams = Number(r.passedExams || 0);
            const failedExams = Number(r.failedExams || 0);

            const isDirectPassed = rawStatus === 'ผ่าน' || rawStatus === 'ผ่านการคัดเลือก' || rawStatus === 'ได้งาน';
            const isDirectFailed = rawStatus === 'ไม่ผ่าน' || rawStatus === 'ไม่ผ่านการคัดเลือก' || rawStatus.includes('ไม่ผ่าน');
            const allExamsPassed = totalExams > 0 && passedExams === totalExams;
            const anyExamFailed = failedExams > 0;

            if (isDirectPassed || allExamsPassed) {
                currentStatus = 'ผ่านการคัดเลือก';
                statusColor = 'success';
            } else if (isDirectFailed || anyExamFailed) {
                currentStatus = 'ไม่ผ่านการคัดเลือก';
                statusColor = 'danger';
            } else if (rawStatus === 'รอพิจารณา' || rawStatus === 'ผ่านการคัดเลือกเบื้องต้น' || rawStatus === 'ตรวจสอบแล้ว') {
                currentStatus = 'รอพิจารณา';
                statusColor = 'warning';
            } else {
                currentStatus = 'รอคณะ/หน่วยงานพิจารณา';
                statusColor = 'info';
            }

            return {
                id: r.id,
                rawId: r.id,
                recruitmentId: r.recruitmentId,
                jobTitle: r.jobTitle,
                roundNo: r.roundNo || 1,
                department: `${r.Faculty_name || ''} ${r.Department_name && r.Department_name !== '-' ? 'ภาควิชา/หน่วยงาน: ' + r.Department_name : ''}`.trim(),
                appliedDate,
                appliedTime: r.appliedTimeRaw ? String(r.appliedTimeRaw).substring(0, 5) : "-",
                currentStatus,
                statusColor
            };
        });

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getApplicantsByRecruitment = async (req, res) => {
    try {
        const { id } = req.params; // Recruitment_id or 'all'
        const isAll = !id || id === 'all';

        const query = `
            SELECT 
                app.Application_id AS id,
                app.Recruitment_id AS recruitmentId,
                app.Round_no AS roundNo,
                r.Announcement_name AS announcementName,
                p.Position_name AS positionName,
                d.Department_name AS departmentName,
                f.Faculty_name AS facultyName,
                app.Apply_date AS appliedDateRaw,
                app.Status AS qualStatus,
                COALESCE(ah.First_name, ap.First_name) AS First_name,
                COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
                COALESCE(ah.Email, ap.Email) AS Email,
                (SELECT GROUP_CONCAT(Applied_degree SEPARATOR ', ') FROM Education WHERE Applicant_id = app.Applicant_id) AS edu_fallback
            FROM Application app
            JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
            LEFT JOIN application_history ah ON (TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id) AND app.Recruitment_id = ah.Recruitment_id)
            LEFT JOIN recruitment r ON app.Recruitment_id = r.Recruitment_id
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            WHERE ${isAll ? "app.Status != 'Draft'" : "app.Recruitment_id = ? AND app.Status != 'Draft'"}
            ORDER BY app.Apply_date DESC, app.Application_id DESC
        `;

        const [rows] = await db.query(query, isAll ? [] : [id]);

        const formatDate = (dateRaw) => formatThaiDate(dateRaw);

        // Fetch all positions/recruitments for switching or filtering
        const [allPositionsRows] = await db.query(`
            SELECT 
                r.Recruitment_id AS id,
                p.Position_name AS jobTitle,
                d.Department_name AS departmentName,
                f.Faculty_name AS facultyName,
                r.Open_date AS openDate,
                r.Close_date AS closeDate
            FROM recruitment r
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            ORDER BY r.Open_date DESC, r.Recruitment_id DESC
        `);

        const allPositions = allPositionsRows.map(p => ({
            id: p.id,
            jobTitle: p.jobTitle || 'ไม่ระบุตำแหน่ง',
            departmentName: p.departmentName || '-',
            facultyName: p.facultyName || '-',
            openDate: formatDate(p.openDate),
            closeDate: formatDate(p.closeDate)
        }));

        let jobDetails = {
            jobTitle: isAll ? 'ผู้สมัครทุกตำแหน่ง' : 'ไม่ระบุตำแหน่ง',
            departmentName: '-',
            facultyName: '-',
            openDate: '-',
            closeDate: '-'
        };

        if (!isAll) {
            const [recruitmentDetails] = await db.query(`
                SELECT 
                    p.Position_name AS jobTitle,
                    d.Department_name AS departmentName,
                    f.Faculty_name AS facultyName,
                    r.Open_date AS openDate,
                    r.Close_date AS closeDate,
                    r.Round_no AS roundNo,
                    r.Total_position AS totalPosition,
                    r.Is_initial_announced AS isInitialAnnounced,
                    r.Is_final_announced AS isFinalAnnounced,
                    r.Initial_announcement_file AS initialAnnouncementFile,
                    r.Final_announcement_file AS finalAnnouncementFile
                FROM recruitment r
                LEFT JOIN position p ON r.Position_id = p.Position_id
                LEFT JOIN department d ON r.Department_id = d.Department_id
                LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
                WHERE r.Recruitment_id = ?
            `, [id]);
            
            const toBool = (v) => v === true || v === 1 || String(v).toLowerCase() === 'true';

            if (recruitmentDetails.length > 0) {
                jobDetails = {
                    jobTitle: recruitmentDetails[0].jobTitle || 'ไม่ระบุตำแหน่ง',
                    departmentName: recruitmentDetails[0].departmentName || '-',
                    facultyName: recruitmentDetails[0].facultyName || '-',
                    openDate: formatDate(recruitmentDetails[0].openDate),
                    closeDate: formatDate(recruitmentDetails[0].closeDate),
                    roundNo: recruitmentDetails[0].roundNo ? Number(recruitmentDetails[0].roundNo) : 1,
                    totalPosition: recruitmentDetails[0].totalPosition ? Number(recruitmentDetails[0].totalPosition) : 1,
                    isInitialAnnounced: toBool(recruitmentDetails[0].isInitialAnnounced),
                    isFinalAnnounced: toBool(recruitmentDetails[0].isFinalAnnounced),
                    initialAnnouncementFile: recruitmentDetails[0].initialAnnouncementFile || null,
                    finalAnnouncementFile: recruitmentDetails[0].finalAnnouncementFile || null,
                    initialFileUrl: getExamAnnouncementFileUrl(recruitmentDetails[0].initialAnnouncementFile),
                    finalFileUrl: getExamAnnouncementFileUrl(recruitmentDetails[0].finalAnnouncementFile)
                };
            }
        }

        const [examRows] = await db.query(`
            SELECT 
                ept.Exam_position_type_id,
                ept.Recruitment_id,
                et.Exam_type_name as name,
                ept.Is_announced,
                ept.Announcement_file as announcementFile
            FROM exam_position_type ept
            LEFT JOIN exam_type et ON ept.Exam_type_id = et.Exam_type_id
            ${isAll ? '' : 'WHERE ept.Recruitment_id = ?'}
        `, isAll ? [] : [id]);

        const [resultRows] = await db.query(`
            SELECT 
                Exam_position_type_id,
                Application_id,
                Recruitment_id,
                Exam_result as status,
                Exam_score as score,
                Exam_date as examDate,
                Exam_time as examTime,
                Exam_location as examLocation
            FROM has_exam_result
            ${isAll ? '' : 'WHERE Recruitment_id = ?'}
        `, isAll ? [] : [id]);

        const toBool = (v) => v === true || v === 1 || String(v).toLowerCase() === 'true';

        const formatted = rows.map(r => {
            const appliedDate = formatThaiDate(r.appliedDateRaw);

            // Match exams for this applicant's recruitment
            const applicantRecruitmentExams = examRows.filter(e => e.Recruitment_id === r.recruitmentId);
            const applicantExams = applicantRecruitmentExams.map(exam => {
                const result = resultRows.find(res => res.Exam_position_type_id === exam.Exam_position_type_id && res.Application_id === r.id);
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

                const isValidDateVal = (d) => {
                    if (!d) return false;
                    const s = String(d).trim();
                    if (s.startsWith('0000-00-00') || s.startsWith('1899') || s.startsWith('1900') || s === 'รอกำหนดการ' || s === '-') return false;
                    const parsed = new Date(d);
                    return !isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000;
                };

                const effectiveDate = isValidDateVal(result?.examDate) ? result.examDate : null;
                const effectiveTime = (result?.examTime && result.examTime !== '00:00:00' && result.examTime !== 'รอกำหนดการ') ? result.examTime : 'รอกำหนดการ';
                const effectiveLocation = (result?.examLocation && result.examLocation !== 'รอกำหนดการ') ? result.examLocation : 'รอกำหนดการ';

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

                const formatIsoDate = (dateRaw) => {
                    if (!isValidDateVal(dateRaw)) return '';
                    const d = new Date(dateRaw);
                    if (isNaN(d.getTime())) return '';
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                return {
                    Exam_position_type_id: exam.Exam_position_type_id,
                    name: exam.name || 'สอบ',
                    date: formatDate(effectiveDate),
                    rawDate: formatIsoDate(effectiveDate),
                    isoDate: formatIsoDate(effectiveDate),
                    time: effectiveTime,
                    location: effectiveLocation,
                    status: normalizedStatus,
                    score,
                    isAnnounced: toBool(exam.Is_announced)
                };
            });

            return {
                id: `APP-${String(r.id).padStart(5, '0')}`,
                rawId: r.id,
                recruitmentId: r.recruitmentId,
                roundNo: r.roundNo || 1,
                positionName: r.positionName || 'ไม่ระบุตำแหน่ง',
                departmentName: r.departmentName || '-',
                facultyName: r.facultyName || '-',
                name: `${r.Prefix || ''}${r.First_name || ''} ${r.Last_name || ''}`.trim(),
                email: r.Email || '-',
                edu: r.edu_fallback || '-',
                appliedDate,
                qualStatus: r.qualStatus || 'รอตรวจสอบ',
                qualComment: '',
                finalStatus: r.qualStatus === "ได้งาน" || r.qualStatus === "ไม่ผ่านการคัดเลือก" ? r.qualStatus : "รอพิจารณา",
                exams: applicantExams
            };
        });

        const positionExams = (!isAll ? examRows : []).map(e => ({
            id: e.Exam_position_type_id,
            name: e.name || 'สอบ',
            isAnnounced: toBool(e.Is_announced),
            announcementFile: e.announcementFile || null,
            fileUrl: getExamAnnouncementFileUrl(e.announcementFile)
        }));

        res.json({ 
            success: true, 
            jobTitle: jobDetails.jobTitle, 
            jobDetails, 
            positionExams, 
            allPositions,
            data: formatted 
        });
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params; // Application_id (rawId)
        const { status, comment, emailSubject, emailBody, sendEmail } = req.body;
        const emailService = require('../../services/emailService');

        // ตรวจสอบว่าใบสมัครนี้เคยได้รับการประเมินและส่งผลทางอีเมลแล้วหรือไม่
        const [existingStatusRows] = await db.query(`SELECT Status FROM Application WHERE Application_id = ?`, [id]);
        if (existingStatusRows.length > 0) {
            const currentStatus = existingStatusRows[0].Status;
            if (currentStatus === 'ผ่านการคัดเลือกเบื้องต้น' || currentStatus === 'ไม่ผ่านการคัดเลือกเบื้องต้น') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ผลการคัดเลือกเบื้องต้นนี้ได้รับการส่งอีเมลแจ้งผู้สมัครแล้ว ไม่สามารถแก้ไขได้' 
                });
            }
        }

        await db.query(`
            UPDATE Application 
            SET Status = ? 
            WHERE Application_id = ?
        `, [status, id]);

        if (sendEmail !== false && status && status !== 'รอตรวจสอบ') {
            try {
                const [appRows] = await db.query(`
                    SELECT 
                        COALESCE(ah.Email, ap.Email) AS Email,
                        COALESCE(ah.First_name, ap.First_name) AS First_name,
                        COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                        COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
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
                `, [id]);

                if (appRows.length > 0) {
                    const row = appRows[0];
                    const fullName = `${row.Prefix || ''}${row.First_name || ''} ${row.Last_name || ''}`.trim();
                    const facultyName = `${row.Faculty_name || ''} ${row.Department_name && row.Department_name !== '-' ? '(' + row.Department_name + ')' : ''}`.trim();

                    emailService.sendFacultyReviewEmail({
                        to: row.Email,
                        applicantName: fullName,
                        positionTitle: row.Position_name || 'ตำแหน่งงาน',
                        facultyName: facultyName,
                        status: status,
                        comment: comment || '',
                        emailSubject: emailSubject,
                        emailBody: emailBody
                    }).catch(e => console.error("Error sending faculty review email in background:", e));
                }
            } catch (emailErr) {
                console.error("Error preparing faculty email:", emailErr);
            }
        }

        res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
};

const batchUpdateApplicationStatus = async (req, res) => {
    try {
        const { applicationIds, status, comment, emailSubject, emailBodyTemplate, sendEmail } = req.body;
        const emailService = require('../../services/emailService');

        if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุรายชื่อใบสมัครที่ต้องการประเมิน' });
        }

        if (!status) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุผลการคัดเลือกเบื้องต้น' });
        }

        // ดึงข้อมูลผู้สมัครตาม applicationIds
        const placeholders = applicationIds.map(() => '?').join(',');
        const [appRows] = await db.query(`
            SELECT 
                app.Application_id,
                app.Status,
                COALESCE(ah.Email, ap.Email) AS Email,
                COALESCE(ah.First_name, ap.First_name) AS First_name,
                COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
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

        // กรองเฉพาะใบสมัครที่ยังรอการตรวจสอบ (หรือไม่อยู่ในสถานะที่ส่งผลเรียบร้อยแล้ว)
        const validApps = appRows.filter(app => {
            const cur = (app.Status || '').trim();
            return cur !== 'ผ่านการคัดเลือกเบื้องต้น' && cur !== 'ไม่ผ่านการคัดเลือกเบื้องต้น';
        });

        if (validApps.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'ใบสมัครที่เลือกได้รับการประเมินและส่งผลเรียบร้อยแล้วทั้งหมด จึงไม่สามารถแก้ไขได้' 
            });
        }

        const validIds = validApps.map(a => a.Application_id);
        const validPlaceholders = validIds.map(() => '?').join(',');

        // 1. อัปเดตสถานะในตาราง Application
        await db.query(`
            UPDATE Application 
            SET Status = ? 
            WHERE Application_id IN (${validPlaceholders})
        `, [status, ...validIds]);

        // 2. ส่งอีเมลแจ้งผลรายบุคคล
        let sentCount = 0;
        let errors = [];

        if (sendEmail !== false && status && status !== 'รอตรวจสอบ') {
            for (const row of validApps) {
                if (!row.Email) {
                    errors.push(`ผู้สมัคร ID ${row.Application_id} ไม่มีอีเมลในระบบ`);
                    continue;
                }

                const prefix = (row.Prefix || '').trim();
                const fullName = `${prefix}${row.First_name || ''} ${row.Last_name || ''}`.trim();
                const facultyName = `${row.Faculty_name || ''} ${row.Department_name && row.Department_name !== '-' ? '(' + row.Department_name + ')' : ''}`.trim();
                const posTitle = row.Position_name || 'ตำแหน่งงาน';

                // กำหนดคำขึ้นต้นจดหมายด้วยชื่อจริงและคำนำหน้าของผู้สมัคร
                // เช่น "เรียน นายสมชาย ใจดี," หรือ "เรียน คุณ..."
                const salutation = (prefix && ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'].some(p => prefix.startsWith(p)))
                    ? fullName 
                    : `คุณ${fullName}`;

                let personalizedBody = emailBodyTemplate || '';
                if (/^เรียน\s+[^,\n]+,/m.test(personalizedBody)) {
                    personalizedBody = personalizedBody.replace(/^เรียน\s+[^,\n]+,/m, `เรียน ${salutation},`);
                } else if (personalizedBody.trim()) {
                    personalizedBody = `เรียน ${salutation},\n\n` + personalizedBody;
                }

                try {
                    const emailRes = await emailService.sendFacultyReviewEmail({
                        to: row.Email,
                        applicantName: salutation,
                        positionTitle: posTitle,
                        facultyName: facultyName,
                        status: status,
                        comment: comment || '',
                        emailSubject: emailSubject || `แจ้งผลการพิจารณาคุณสมบัติเบื้องต้น: ตำแหน่ง ${posTitle} - มหาวิทยาลัยเกษตรศาสตร์`,
                        emailBody: personalizedBody
                    });

                    if (emailRes && emailRes.success) {
                        sentCount++;
                    } else {
                        errors.push(`ส่งอีเมลให้ ${salutation} ไม่สำเร็จ: ${emailRes?.error || 'Unknown error'}`);
                    }
                } catch (err) {
                    errors.push(`ส่งอีเมลให้ ${salutation} ไม่สำเร็จ: ${err.message}`);
                }
            }
        }

        res.json({
            success: true,
            message: `บันทึกผลการคัดเลือกเบื้องต้นสำเร็จ ${validIds.length} รายการ${sentCount > 0 ? ` และส่งอีเมลแจ้งผลสำเร็จ ${sentCount} ท่าน` : ''}`,
            updatedCount: validIds.length,
            sentCount,
            errors: errors.length > 0 ? errors : null
        });
    } catch (error) {
        console.error('Error in batchUpdateApplicationStatus:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกผลแบบกลุ่ม: ' + error.message });
    }
};

const getApplicationDetailsById = async (req, res) => {
    try {
        let { id } = req.params;
        let appId = id;
        if (typeof appId === 'string' && appId.startsWith('APP-')) {
            appId = parseInt(appId.replace(/^APP-0*/i, ''), 10) || appId;
        }

        // 1. ดึงข้อมูลใบสมัครแบบ Snapshot จาก Application JOIN Applicant และ application_history
        const query = `
            SELECT 
                app.Application_id AS appId,
                app.Applicant_id,
                app.Recruitment_id,
                ah.Application_history_id,
                app.Apply_date AS applyDate,
                app.Apply_time AS applyTime,
                app.Status AS status,
                COALESCE(ah.Citizen_id, ap.Citizen_id) AS Citizen_id,
                COALESCE(ah.Email, ap.Email) AS Email,
                COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
                COALESCE(ah.First_name, ap.First_name) AS First_name,
                COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                COALESCE(ah.Nationality, ap.Nationality) AS Nationality,
                COALESCE(ah.Religion, ap.Religion) AS Religion,
                COALESCE(ah.Birth_province, ap.Birth_province) AS Birth_province,
                COALESCE(ah.House_no, ap.House_no) AS House_no,
                COALESCE(ah.Street, ap.Street) AS Street,
                COALESCE(ah.Village_no, ap.Village_no) AS Village_no,
                COALESCE(ah.Alley, ap.Alley) AS Alley,
                COALESCE(ah.Father_name, ap.Father_name) AS Father_name,
                COALESCE(ah.Father_religion, ap.Father_religion) AS Father_religion,
                COALESCE(ah.Father_nationality, ap.Father_nationality) AS Father_nationality,
                COALESCE(ah.Father_job, ap.Father_job) AS Father_job,
                COALESCE(ah.Mother_name, ap.Mother_name) AS Mother_name,
                COALESCE(ah.Mother_religion, ap.Mother_religion) AS Mother_religion,
                COALESCE(ah.Mother_nationality, ap.Mother_nationality) AS Mother_nationality,
                COALESCE(ah.Mother_job, ap.Mother_job) AS Mother_job,
                COALESCE(ah.Spouse_name, ap.Spouse_name) AS Spouse_name,
                COALESCE(ah.Spouse_religion, ap.Spouse_religion) AS Spouse_religion,
                COALESCE(ah.Spouse_nationality, ap.Spouse_nationality) AS Spouse_nationality,
                COALESCE(ah.Spouse_job, ap.Spouse_job) AS Spouse_job,
                COALESCE(ah.Age_year, ap.Age_year) AS Age_year,
                COALESCE(ah.Age_month, ap.Age_month) AS Age_month,
                COALESCE(ah.Current_job, ap.Current_job) AS Current_job,
                COALESCE(ah.Workplace, ap.Workplace) AS Workplace,
                COALESCE(ah.Foreign_language, ap.Foreign_language) AS Foreign_language,
                COALESCE(ah.Special_skill, ap.Special_skill) AS Special_skill,
                ah.Work_experience,
                COALESCE(ah.Has_contract_obligation, ap.Has_contract_obligation) AS Has_contract_obligation,
                COALESCE(ah.Contract_agency, ap.Contract_agency) AS Contract_agency,
                COALESCE(ah.Contract_name, ap.Contract_name) AS Contract_name,
                COALESCE(ah.Has_staff_contract_obligation, ap.Has_staff_contract_obligation) AS Has_staff_contract_obligation,
                COALESCE(ah.University_staff_affiliation, ap.University_staff_affiliation) AS University_staff_affiliation,
                COALESCE(ah.University_staff_affiliation_income, ap.University_staff_affiliation_income) AS University_staff_affiliation_income,
                COALESCE(ah.Staff_type, ap.Staff_type) AS Staff_type,
                ah.Birth_day AS ah_birth_day,
                ah.Birth_month AS ah_birth_month,
                ah.Birth_year_be AS ah_birth_year_be,
                ap.Birth_day AS ap_birth_day,
                sub.Subdistrict_id,
                COALESCE(ah.Subdistrict, sub.Subdistrict_name) AS Subdistrict,
                COALESCE(ah.District, dist.District_name) AS District,
                COALESCE(ah.Province, prov.Province_name) AS Province,
                COALESCE(ah.Postal_code, dist.Postal_code) AS Postal_code,
                COALESCE(ah.Subdistrict, sub.Subdistrict_name) AS Subdistrict_name,
                COALESCE(ah.District, dist.District_name) AS District_name,
                COALESCE(ah.Province, prov.Province_name) AS Province_name,
                r.Announcement_name AS jobTitle,
                p.Position_name AS positionName,
                d.Department_name AS deptName,
                f.Faculty_name AS facultyName
            FROM Application app
            JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
            LEFT JOIN application_history ah ON (TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id) AND app.Recruitment_id = ah.Recruitment_id)
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
        if (appRows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลใบสมัคร' });
        }

        const appData = appRows[0];

        // คำนวณลำดับการสมัครตามลำดับที่แสดงในตาราง (เรียงจากใหม่ไปเก่า)
        const [seqRows] = await db.query(`
            SELECT COUNT(*) AS seqNo
            FROM Application
            WHERE Recruitment_id = ?
              AND Status != 'Draft'
              AND (Apply_date > ? OR (Apply_date = ? AND Application_id >= ?))
        `, [appData.Recruitment_id, appData.applyDate, appData.applyDate, appData.appId]);
        const seqNo = seqRows[0]?.seqNo || 1;

        // 2. ดึงข้อมูลประวัติการศึกษา (ดึงจากตารางหลัก Education ตาม Applicant_id)
        let eduRows = [];
        if (appData.Applicant_id) {
            const [rows] = await db.query(`
                SELECT * FROM Education 
                WHERE Applicant_id = ?
            `, [appData.Applicant_id]);
            eduRows = rows;
        }

        // 3. ดึงข้อมูลผลสอบภาษาอังกฤษ (ดึงจากตารางหลัก eng_exam_result ตาม Applicant_id)
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

        // 4. ดึงข้อมูลเบอร์โทรศัพท์
        let phoneRows = [];
        if (appData.Application_history_id) {
            const [histMobile] = await db.query(`SELECT Mobile_phone_history AS Mobile_phone FROM applicant_mobile_phone_history WHERE Application_history_id = ?`, [appData.Application_history_id]);
            phoneRows = histMobile;
        }
        if (phoneRows.length === 0 && appData.Applicant_id) {
            const [appMobile] = await db.query(`SELECT Mobile_phone FROM applicant_mobile_phone WHERE Applicant_id = ?`, [appData.Applicant_id]);
            phoneRows = appMobile;
        }

        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const formatDate = (dateStr) => formatThaiDate(dateStr);

        const formatBirthDate = () => {
            if (appData.ah_birth_day && appData.ah_birth_month && appData.ah_birth_year_be) {
                const mIdx = parseInt(appData.ah_birth_month, 10) - 1;
                const mName = thaiMonths[mIdx] || appData.ah_birth_month;
                return `${appData.ah_birth_day} ${mName} ${appData.ah_birth_year_be}`;
            }
            if (appData.ap_birth_day) {
                return formatThaiDate(appData.ap_birth_day);
            }
            return "-";
        };

        // 5. ดึงข้อมูลเอกสารแนบ
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
        `, [appData.appId]);

        const getDocGroup = (docId) => {
            if ([1, 2, 3, 5, 6, 7].includes(Number(docId))) return 'เอกสารส่วนบุคคล';
            if (Number(docId) === 8) return 'เอกสารการแพทย์';
            return 'เอกสารประกอบการสมัคร';
        };

        const getDocType = (fileName, filePath) => {
            const str = (fileName || filePath || '').toLowerCase();
            if (str.endsWith('.pdf')) return 'pdf';
            if (str.endsWith('.jpg') || str.endsWith('.jpeg') || str.endsWith('.png') || str.endsWith('.webp')) return 'image';
            if (str.endsWith('.doc') || str.endsWith('.docx')) return 'word';
            return 'file';
        };

        const documents = docRows.map((doc, idx) => {
            const rawPath = doc.file_path || '';
            const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\//, '');
            const fileUrl = normalizedPath ? `http://localhost:3000/${normalizedPath}` : null;

            return {
                id: doc.document_id || idx + 1,
                docId: doc.document_id,
                group: getDocGroup(doc.document_id),
                name: doc.custom_name || doc.Document_name || 'เอกสารแนบ',
                fileName: doc.file_name || (normalizedPath ? normalizedPath.split('/').pop() : 'เอกสารแนบ'),
                filePath: normalizedPath,
                url: fileUrl,
                type: getDocType(doc.file_name, doc.file_path)
            };
        });

        // จัดรูปแบบข้อมูลสำหรับ Frontend (ApplicantDetails.jsx)
        const formattedData = {
            id: `ลำดับที่ ${seqNo}`,
            seqNo: seqNo,
            jobTitle: appData.jobTitle || appData.positionName || 'ไม่ระบุตำแหน่ง',
            appliedDate: formatDate(appData.applyDate),
            status: appData.status || 'รอตรวจสอบคุณสมบัติ',
            
            idCard: appData.Citizen_id || '-',
            email: appData.Email || '-',
            
            personal: {
                title: appData.Prefix || '',
                firstName: appData.First_name || '',
                lastName: appData.Last_name || '',
                dob: formatBirthDate(),
                ageYears: appData.Age_year || '-',
                ageMonths: appData.Age_month || '-',
                nationality: appData.Nationality || '-',
                religion: appData.Religion || '-',
                birthplace: appData.Birth_province || '-'
            },
            
            address: {
                province: appData.Province || appData.Province_name || appData.Birth_province || '-',
                amphoe: appData.District || appData.District_name || '-',
                tambon: appData.Subdistrict || appData.Subdistrict_name || '-',
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
                kuStaffStatus: appData.Staff_type || appData.University_staff_affiliation || '-',
                scholarshipObligation: appData.Has_contract_obligation || '-',
                scholarshipAgency: appData.Contract_agency || '-',
                scholarshipName: appData.Contract_name || '-',
                kuObligationUniv: appData.University_staff_affiliation || '-',
                kuObligationIncome: appData.University_staff_affiliation_income || '-'
            },

            documents: documents
        };

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error('Error fetching application details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// API ตรวจสอบว่าผู้สมัคร (ผ่าน citizenId และ optional email) เคยสมัครประกาศนี้แล้วหรือยังในรอบปัจจุบัน (ไม่นับ Draft)
const checkApplicationStatus = async (req, res) => {
    try {
        const { recruitmentId, citizenId } = req.params;
        const email = req.query.email;

        if (!recruitmentId || !citizenId) {
            return res.json({ success: true, hasApplied: false });
        }

        // ดึงรอบการรับสมัครปัจจุบันของประกาศนี้
        const [recRows] = await db.query(`SELECT Round_no FROM Recruitment WHERE Recruitment_id = ?`, [recruitmentId]);
        const currentRound = (recRows.length > 0 && recRows[0].Round_no) ? Number(recRows[0].Round_no) : 1;

        const cleanCitizenId = citizenId.trim();
        let query = `
            SELECT a.Application_id, a.Status, a.Apply_date, a.Apply_time, a.Round_no
            FROM Application a
            JOIN Applicant ap ON a.Applicant_id = ap.Applicant_id
            WHERE TRIM(ap.Citizen_id) = ? AND a.Recruitment_id = ? AND a.Round_no = ? AND a.Status != 'Draft'
        `;
        let params = [cleanCitizenId, recruitmentId, currentRound];

        if (email) {
            query += ` AND LOWER(TRIM(ap.Email)) = ?`;
            params.push(email.trim().toLowerCase());
        }

        const [rows] = await db.query(query, params);

        if (rows.length > 0) {
            return res.json({
                success: true,
                hasApplied: true,
                currentRound,
                application: rows[0]
            });
        }

        return res.json({
            success: true,
            hasApplied: false,
            currentRound
        });
    } catch (error) {
        console.error("Error checking application status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ค้นหาข้อมูลผู้สมัครและประวัติการสมัครงานทั้งหมดตามเลขประจำตัวประชาชน (สำหรับ HR ในหน้า manage-jobs)
const searchApplicantByCitizenId = async (req, res) => {
    try {
        const rawQuery = req.params.citizenId || req.query.q || req.query.keyword || '';
        const cleanQuery = rawQuery.trim();
        const selectedApplicantId = req.query.applicantId ? parseInt(req.query.applicantId, 10) : null;

        if (!cleanQuery && !selectedApplicantId) {
            return res.status(400).json({ success: false, message: "กรุณาระบุเลขประจำตัวประชาชน หรือชื่อ-นามสกุลผู้สมัคร" });
        }

        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const formatThaiDate = (dateStr) => {
            if (!dateStr) return '-';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
        };

        let applicantRows = [];
        if (selectedApplicantId) {
            [applicantRows] = await db.query(`
                SELECT 
                    ap.Applicant_id,
                    ap.Citizen_id,
                    COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
                    COALESCE(ah.First_name, ap.First_name) AS First_name,
                    COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                    COALESCE(ah.Email, ap.Email) AS Email
                FROM Applicant ap
                LEFT JOIN application_history ah ON TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id)
                WHERE ap.Applicant_id = ?
                LIMIT 1
            `, [selectedApplicantId]);
        } else {
            const likeParam = `%${cleanQuery}%`;
            [applicantRows] = await db.query(`
                SELECT DISTINCT
                    ap.Applicant_id,
                    ap.Citizen_id,
                    COALESCE(ah.Prefix, ap.Prefix) AS Prefix,
                    COALESCE(ah.First_name, ap.First_name) AS First_name,
                    COALESCE(ah.Last_name, ap.Last_name) AS Last_name,
                    COALESCE(ah.Email, ap.Email) AS Email
                FROM Applicant ap
                LEFT JOIN application_history ah ON TRIM(ap.Citizen_id) = TRIM(ah.Citizen_id)
                WHERE TRIM(ap.Citizen_id) = ? 
                   OR TRIM(ap.Citizen_id) LIKE ?
                   OR CONCAT(COALESCE(ah.Prefix, ap.Prefix, ''), COALESCE(ah.First_name, ap.First_name, ''), ' ', COALESCE(ah.Last_name, ap.Last_name, '')) LIKE ?
                   OR CONCAT(COALESCE(ah.First_name, ap.First_name, ''), ' ', COALESCE(ah.Last_name, ap.Last_name, '')) LIKE ?
                   OR ap.First_name LIKE ?
                   OR ap.Last_name LIKE ?
                   OR ah.First_name LIKE ?
                   OR ah.Last_name LIKE ?
                ORDER BY ap.Applicant_id DESC
                LIMIT 10
            `, [cleanQuery, likeParam, likeParam, likeParam, likeParam, likeParam, likeParam, likeParam]);
        }

        // หากยังไม่พบใน Applicant ให้ลองค้นหาจาก application_history โดยตรง
        if (applicantRows.length === 0 && !selectedApplicantId) {
            const likeParam = `%${cleanQuery}%`;
            const [histRows] = await db.query(`
                SELECT DISTINCT
                    NULL AS Applicant_id,
                    ah.Citizen_id,
                    ah.Prefix,
                    ah.First_name,
                    ah.Last_name,
                    ah.Email,
                    ah.Application_history_id
                FROM application_history ah
                WHERE TRIM(ah.Citizen_id) = ? 
                   OR TRIM(ah.Citizen_id) LIKE ?
                   OR CONCAT(COALESCE(ah.Prefix, ''), ah.First_name, ' ', ah.Last_name) LIKE ?
                   OR CONCAT(ah.First_name, ' ', ah.Last_name) LIKE ?
                   OR ah.First_name LIKE ?
                   OR ah.Last_name LIKE ?
                ORDER BY ah.Application_history_id DESC
                LIMIT 10
            `, [cleanQuery, likeParam, likeParam, likeParam, likeParam, likeParam, likeParam, likeParam]);

            if (histRows.length > 0) {
                applicantRows = histRows;
            }
        }

        if (applicantRows.length === 0) {
            return res.json({
                success: true,
                found: false,
                message: "ไม่พบข้อมูลผู้สมัครที่ตรงกับเลขบัตร ปชช หรือชื่อ-นามสกุลนี้ในระบบ",
                data: null
            });
        }

        // สร้างรายการผู้สมัครที่ตรงกับคำค้นหา
        const matchedList = [];
        for (const row of applicantRows) {
            let phone = '-';
            if (row.Applicant_id) {
                const [phones] = await db.query(`
                    SELECT Mobile_phone FROM applicant_mobile_phone WHERE Applicant_id = ?
                `, [row.Applicant_id]);
                phone = phones.map(p => p.Mobile_phone).filter(Boolean).join(', ') || '-';
            } else if (row.Application_history_id) {
                const [phones] = await db.query(`
                    SELECT Mobile_phone_history FROM applicant_mobile_phone_history WHERE Application_history_id = ?
                `, [row.Application_history_id]);
                phone = phones.map(p => p.Mobile_phone_history).filter(Boolean).join(', ') || '-';
            }

            matchedList.push({
                id: row.Applicant_id,
                citizenId: row.Citizen_id,
                prefix: row.Prefix || '',
                firstName: row.First_name || '',
                lastName: row.Last_name || '',
                fullName: `${row.Prefix || ''}${row.First_name || ''} ${row.Last_name || ''}`.trim() || 'ไม่ระบุชื่อ',
                email: row.Email || '-',
                phone
            });
        }

        // เลือกผู้สมัครคนแรก (หรือคนที่ระบุ id มา) เพื่อดึงข้อมูลใบสมัคร
        const targetApplicant = matchedList[0];

        // ดึงรายการใบสมัครทั้งหมดของผู้สมัครคนนี้ (ไม่นับ Draft)
        const [appRows] = await db.query(`
            SELECT 
                app.Application_id AS applicationId,
                app.Recruitment_id AS recruitmentId,
                app.Apply_date AS appliedDateRaw,
                app.Apply_time AS appliedTime,
                app.Status AS status,
                p.Position_name AS jobTitle,
                r.Announcement_name AS announcementName,
                COALESCE(app.Round_no, r.Round_no, 1) AS roundNo,
                d.Department_name AS departmentName,
                f.Faculty_name AS facultyName
            FROM Application app
            JOIN Applicant ap ON app.Applicant_id = ap.Applicant_id
            LEFT JOIN Recruitment r ON app.Recruitment_id = r.Recruitment_id
            LEFT JOIN Position p ON r.Position_id = p.Position_id
            LEFT JOIN Department d ON r.Department_id = d.Department_id
            LEFT JOIN Faculty f ON d.Faculty_id = f.Faculty_id
            WHERE TRIM(ap.Citizen_id) = ? AND app.Status != 'Draft'
            ORDER BY app.Apply_date DESC, app.Application_id DESC
        `, [targetApplicant.citizenId]);

        const applications = appRows.map(app => ({
            applicationId: app.applicationId,
            recruitmentId: app.recruitmentId,
            jobTitle: app.jobTitle || 'ไม่ระบุตำแหน่ง',
            announcementName: app.announcementName || '-',
            roundNo: app.roundNo || 1,
            department: `${app.facultyName || ''} ${app.departmentName && app.departmentName !== '-' ? app.departmentName : ''}`.trim(),
            appliedDate: formatThaiDate(app.appliedDateRaw),
            status: app.status || 'รอตรวจสอบ'
        }));

        res.json({
            success: true,
            found: true,
            multiple: matchedList.length > 1,
            matchedApplicants: matchedList,
            data: {
                applicant: targetApplicant,
                applications: applications,
                totalApplications: applications.length
            }
        });

    } catch (error) {
        console.error("Error searching applicant:", error);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};


module.exports = {
    submitApplication,
    saveDraft,
    loadDraft,
    getMyApplications,
    getApplicantsByRecruitment,
    updateApplicationStatus,
    batchUpdateApplicationStatus,
    getApplicationDetailsById,
    checkApplicationStatus,
    searchApplicantByCitizenId
};
