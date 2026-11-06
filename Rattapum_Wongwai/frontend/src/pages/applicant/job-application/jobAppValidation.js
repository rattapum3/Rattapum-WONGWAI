// Helper สำหรับดึงวันที่ก่อนหน้าวันสมัคร 1 วัน (YYYY-MM-DD) ตามเวลาท้องถิ่น
export const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper สำหรับดึงวันเกิดสูงสุดที่อนุญาต (ต้องอายุอย่างน้อย 18 ปีบริบูรณ์ และไม่ใช่วันในอนาคต)
export const getMaxDobStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ฟังก์ชันกรองอักขระที่ไม่พึงประสงค์แบบทันที (Real-Time Input Sanitizer)
export const sanitizeField = (name, rawVal) => {
  if (rawVal === null || rawVal === undefined) return "";
  let val = String(rawVal);

  switch (name) {
    case 'citizenId':
      // เฉพาะตัวเลข 13 หลักเท่านั้น (ห้ามตัวอักษรและสัญลักษณ์ทุกชนิด)
      return val.replace(/\D/g, '').slice(0, 13);

    case 'email':
      // อีเมล: ห้ามอักษรไทยและช่องว่าง, สูงสุด 100 ตัวอักษร
      return val.replace(/[\u0E00-\u0E7F\s]/g, '').slice(0, 100);

    case 'firstName':
    case 'lastName':
      // ชื่อ - นามสกุล: ตัวอักษรไทยและอังกฤษเท่านั้น (ห้ามตัวเลขและสัญลักษณ์พิเศษ), สูงสุด 50 ตัวอักษร
      return val.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 50);

    case 'houseNo':
      // ที่อยู่เลขที่: อนุญาตตัวเลข, ตัวอักษร, /, -, จุด, ช่องว่าง, ตัดอักขระอันตราย < > " ' ; % ออก, สูงสุด 30 ตัวอักษร
      return val.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s\/\-.]/g, '').slice(0, 30);

    case 'villageNo':
      // หมู่ที่: อนุญาตตัวเลข, ตัวอักษร, /, - สูงสุด 10 ตัวอักษร
      return val.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\/\-]/g, '').slice(0, 10);

    case 'alley':
    case 'street':
      // ตรอก/ซอย, ถนน: ตัดแท็กอันตราย, สูงสุด 80 ตัวอักษร
      return val.replace(/[<>]/g, '').slice(0, 80);

    case 'fatherName':
    case 'motherName':
    case 'spouseName':
      // ชื่อคนในครอบครัว: ตัวอักษรเท่านั้น (ห้ามตัวเลขและสัญลักษณ์พิเศษ), สูงสุด 80 ตัวอักษร
      return val.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 80);

    case 'fatherJob':
    case 'motherJob':
    case 'spouseJob':
    case 'currentJob':
      // อาชีพ: ตัดแท็กอันตราย, สูงสุด 100 ตัวอักษร
      return val.replace(/[<>]/g, '').slice(0, 100);

    case 'workplace':
    case 'contractAgency':
    case 'contractName':
    case 'staffAffiliation':
    case 'staffAffiliationIncome':
      // หน่วยงานและสัญญา: ตัดแท็กอันตราย, สูงสุด 150 ตัวอักษร
      return val.replace(/[<>]/g, '').slice(0, 150);

    case 'specialSkill':
    case 'foreignLanguage':
      // ทักษะและความสามารถ: ตัดแท็กอันตราย, สูงสุด 500 ตัวอักษร
      return val.replace(/[<>]/g, '').slice(0, 500);

    default:
      return val.replace(/[<>]/g, '');
  }
};

// ฟังก์ชันตรวจสอบความถูกต้องของฟิลด์เดี่ยว (Single Field Validator)
export const validateSingleField = (name, cleanVal, obligation = 'ไม่มี') => {
  const val = String(cleanVal || '').trim();

  switch (name) {
    case 'citizenId':
      if (!val) return 'กรุณาระบุเลขประจำตัวประชาชน 13 หลัก';
      if (val.length < 13) return `เลขประจำตัวประชาชนต้องครบ 13 หลัก (ปัจจุบันกรอก ${val.length}/13 หลัก)`;
      if (!/^\d{13}$/.test(val)) return 'เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น';
      return '';

    case 'email':
      if (!val) return 'กรุณาระบุอีเมล';
      if (/[\u0E00-\u0E7F\s]/.test(val)) return 'อีเมลต้องไม่มีตัวอักษรภาษาไทยหรือช่องว่าง';
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
        return 'รูปแบบอีเมลไม่ถูกต้อง (เช่น user@gmail.com หรือ example@ku.th)';
      }
      return '';

    case 'firstName':
      if (!val) return 'กรุณากรอกชื่อจริง';
      if (val.length < 2) return 'ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
      if (/[0-9]/.test(val)) return 'ชื่อต้องเป็นตัวอักษรเท่านั้น ห้ามมีตัวเลข';
      if (/[^a-zA-Z\u0E00-\u0E7F\s]/.test(val)) return 'ชื่อต้องเป็นตัวอักษรเท่านั้น ห้ามมีสัญลักษณ์พิเศษ';
      return '';

    case 'lastName':
      if (!val) return 'กรุณากรอกนามสกุล';
      if (val.length < 2) return 'นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
      if (/[0-9]/.test(val)) return 'นามสกุลต้องเป็นตัวอักษรเท่านั้น ห้ามมีตัวเลข';
      if (/[^a-zA-Z\u0E00-\u0E7F\s]/.test(val)) return 'นามสกุลต้องเป็นตัวอักษรเท่านั้น ห้ามมีสัญลักษณ์พิเศษ';
      return '';

    case 'houseNo':
      if (!val) return 'กรุณากรอกที่อยู่ปัจจุบันเลขที่';
      if (val.length > 30) return 'ที่อยู่เลขที่ต้องไม่เกิน 30 ตัวอักษร';
      return '';

    case 'fatherName':
      if (!val) return 'กรุณากรอกชื่อบิดา';
      if (val.length < 2) return 'ชื่อบิดาต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
      if (/[0-9]/.test(val)) return 'ชื่อบิดาต้องเป็นตัวอักษรเท่านั้น ห้ามมีตัวเลข';
      if (/[^a-zA-Z\u0E00-\u0E7F\s]/.test(val)) return 'ชื่อบิดาห้ามมีสัญลักษณ์พิเศษ';
      return '';

    case 'motherName':
      if (!val) return 'กรุณากรอกชื่อมารดา';
      if (val.length < 2) return 'ชื่อมารดาต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
      if (/[0-9]/.test(val)) return 'ชื่อมารดาต้องเป็นตัวอักษรเท่านั้น ห้ามมีตัวเลข';
      if (/[^a-zA-Z\u0E00-\u0E7F\s]/.test(val)) return 'ชื่อมารดาห้ามมีสัญลักษณ์พิเศษ';
      return '';

    case 'spouseName':
      if (val) {
        if (val.length < 2) return 'ชื่อคู่สมรสต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
        if (/[0-9]/.test(val)) return 'ชื่อคู่สมรสต้องเป็นตัวอักษรเท่านั้น ห้ามมีตัวเลข';
        if (/[^a-zA-Z\u0E00-\u0E7F\s]/.test(val)) return 'ชื่อคู่สมรสห้ามมีสัญลักษณ์พิเศษ';
      }
      return '';

    case 'contractAgency':
      if (obligation === 'มี' && !val) return 'กรุณาระบุหน่วยงานที่ชดใช้ทุน';
      return '';

    case 'contractName':
      if (obligation === 'มี' && !val) return 'กรุณาระบุชื่อสัญญารับทุน';
      return '';

    default:
      return '';
  }
};

// ตรวจสอบความถูกต้องของเบอร์โทรศัพท์แบบ Real-Time
export const validatePhonesList = (phones) => {
  const pErrors = {};
  const filled = [];
  phones.forEach((phone, idx) => {
    const p = String(phone || '').trim();
    if (idx === 0 && !p) {
      pErrors[idx] = 'กรุณาระบุเบอร์โทรศัพท์มือถือหลัก (9-10 หลัก)';
    } else if (p) {
      if (!p.startsWith('0')) {
        pErrors[idx] = 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0 (เช่น 08x, 09x, 06x)';
      } else if (p.length < 9 || p.length > 10) {
        pErrors[idx] = `เบอร์โทรศัพท์ต้องมี 9-10 หลัก (ปัจจุบันกรอก ${p.length} หลัก)`;
      } else if (!/^\d{9,10}$/.test(p)) {
        pErrors[idx] = 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น (ห้ามมีตัวอักษรหรือสัญลักษณ์)';
      } else if (filled.some(f => f.val === p)) {
        pErrors[idx] = 'เบอร์โทรศัพท์นี้ซ้ำกับรายการอื่นที่ระบุไว้';
      }
      filled.push({ idx, val: p });
    }
  });
  return pErrors;
};

// ตรวจสอบความถูกต้องของวุฒิการศึกษาแบบ Real-Time
export const validateEdusList = (edus, maxAllowedDateStr, dob) => {
  const errors = {};
  const seen = new Set();
  edus.forEach((edu, idx) => {
    const itemErr = {};
    if (!edu.degree?.trim()) {
      itemErr.degree = edu.degreeType === 'อื่นๆ' ? 'กรุณาพิมพ์ระบุระดับวุฒิการศึกษา' : 'กรุณาเลือกระดับวุฒิการศึกษา';
    }
    if (!edu.major?.trim()) itemErr.major = 'กรุณาระบุสาขาวิชาเอก';
    if (!edu.gpa?.trim()) {
      itemErr.gpa = 'กรุณาระบุเกรดเฉลี่ยสะสม';
    } else {
      const gNum = parseFloat(edu.gpa);
      if (isNaN(gNum) || gNum < 0 || gNum > 4.0) {
        itemErr.gpa = 'เกรดเฉลี่ยต้องอยู่ระหว่าง 0.00 ถึง 4.00';
      }
    }
    if (!edu.university?.trim()) itemErr.university = 'กรุณาระบุชื่อสถานศึกษา';
    if (!edu.country?.trim()) itemErr.country = 'กรุณาระบุประเทศ';
    if (!edu.approvalDate) {
      itemErr.approvalDate = 'กรุณาระบุวันที่ได้รับอนุมัติผลการศึกษา';
    } else {
      if (edu.approvalDate > maxAllowedDateStr) {
        itemErr.approvalDate = 'ต้องเป็นวันที่ก่อนหน้าวันสมัครอย่างน้อย 1 วัน';
      }
      if (dob && edu.approvalDate <= dob) {
        itemErr.approvalDate = 'ต้องอยู่หลังจากวันเกิด';
      }
    }
    if (edu.degree?.trim() && edu.major?.trim() && edu.university?.trim()) {
      const key = `${edu.degree.trim()}_${edu.major.trim()}_${edu.university.trim()}`;
      if (seen.has(key)) {
        itemErr.duplicate = 'ข้อมูลวุฒิการศึกษานี้ซ้ำกับรายการอื่น';
      }
      seen.add(key);
    }
    if (Object.keys(itemErr).length > 0) {
      errors[idx] = itemErr;
    }
  });
  return errors;
};

// ตรวจสอบความถูกต้องของผลสอบภาษาอังกฤษแบบ Real-Time
export const validateEngList = (tests, maxAllowedDateStr, dob) => {
  const errors = {};
  const seen = new Set();
  tests.forEach((test, idx) => {
    const itemErr = {};
    if (test.testName) {
      if (seen.has(test.testName)) {
        itemErr.testName = `ประเภทการสอบ "${test.testName}" ซ้ำกัน`;
      }
      seen.add(test.testName);
    }
    if (test.examDate) {
      if (test.examDate > maxAllowedDateStr) {
        itemErr.examDate = 'ต้องเป็นวันที่ก่อนหน้าวันสมัครอย่างน้อย 1 วัน';
      }
      if (dob && test.examDate <= dob) {
        itemErr.examDate = 'ต้องอยู่หลังจากวันเกิด';
      }
    }
    if (Object.keys(itemErr).length > 0) {
      errors[idx] = itemErr;
    }
  });
  return errors;
};
