// ==========================================
// 🛡️ Helper Functions: Sanitization & Validation for ManageUsers
// ==========================================

export const sanitizeFieldValue = (name, rawValue) => {
  if (typeof rawValue !== 'string') return rawValue;

  switch (name) {
    case 'firstName':
    case 'lastName':
      // อนุญาตเฉพาะตัวอักษรไทย อังกฤษ และเว้นวรรค ตัดตัวเลขและอักขระพิเศษออกทั้งหมด จำกัด 50 ตัวอักษร
      return rawValue.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 50);

    case 'prefixCustom':
      // คำนำหน้ากำหนดเอง: ตัวอักษรไทย อังกฤษ จุด (.) และเว้นวรรคเท่านั้น จำกัด 20 ตัวอักษร
      return rawValue.replace(/[^a-zA-Z\u0E00-\u0E7F\.\s]/g, '').slice(0, 20);

    case 'username':
      // อีเมล: ตัดภาษาไทย ช่องว่าง และสัญลักษณ์ต้องห้ามออก จำกัด 50 ตัวอักษร (ตามฐานข้อมูล varchar(50))
      return rawValue.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 50).toLowerCase();

    case 'password':
    case 'confirmPassword':
      // รหัสผ่าน: ตัดช่องว่างรอบข้าง จำกัด 32 ตัวอักษร
      return rawValue.slice(0, 32);

    default:
      return rawValue;
  }
};

export const validateField = (name, value, currentForm = {}, currentEditId = null) => {
  let err = '';
  const trimmed = typeof value === 'string' ? value.trim() : value;

  switch (name) {
    case 'prefix':
      if (!trimmed) {
        err = 'กรุณาระบุคำนำหน้าชื่อ';
      } else if (trimmed.length > 20) {
        err = 'คำนำหน้าชื่อต้องมีความยาวไม่เกิน 20 ตัวอักษร';
      } else if (!/^[\u0E00-\u0E7Fa-zA-Z\.\s]+$/.test(trimmed)) {
        err = 'คำนำหน้าชื่อต้องเป็นตัวอักษรหรือจุดเท่านั้น (ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ)';
      }
      break;

    case 'firstName':
      if (!trimmed) {
        err = 'กรุณากรอกชื่อจริง';
      } else if (trimmed.length < 2) {
        err = `ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${trimmed.length} ตัวอักษร)`;
      } else if (!/^[\u0E00-\u0E7Fa-zA-Z\s]+$/.test(trimmed)) {
        err = 'ชื่อจริงต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น (ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ)';
      }
      break;

    case 'lastName':
      if (!trimmed) {
        err = 'กรุณากรอกนามสกุล';
      } else if (trimmed.length < 2) {
        err = `นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${trimmed.length} ตัวอักษร)`;
      } else if (!/^[\u0E00-\u0E7Fa-zA-Z\s]+$/.test(trimmed)) {
        err = 'นามสกุลต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น (ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ)';
      }
      break;

    case 'department':
      if (!trimmed) {
        err = 'กรุณาเลือกสังกัดคณะ/หน่วยงาน';
      }
      break;

    case 'username':
      if (!trimmed) {
        err = 'กรุณากรอกชื่อผู้ใช้ (อีเมล)';
      } else if (trimmed.length > 50) {
        err = 'อีเมลผู้ใช้งานต้องมีความยาวไม่เกิน 50 ตัวอักษร';
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
        err = 'รูปแบบอีเมลไม่ถูกต้อง (ตัวอย่าง: name@ku.th)';
      }
      break;

    case 'password':
      if (!currentEditId) {
        // เพิ่มผู้ใช้ใหม่: บังคับต้องมีรหัสผ่านขั้นต่ำ 8 ตัวอักษร
        if (!trimmed) {
          err = 'กรุณาตั้งรหัสผ่านสำหรับผู้ใช้งานใหม่';
        } else if (trimmed.length < 8) {
          err = `รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร (ปัจจุบัน ${trimmed.length} ตัวอักษร)`;
        }
      } else {
        // แก้ไขผู้ใช้เดิม: หากไม่กรอกคือไม่เปลี่ยนรหัสผ่าน แต่หากกรอกต้อง >= 8 ตัวอักษร
        if (trimmed && trimmed.length < 8) {
          err = `รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร (ปัจจุบัน ${trimmed.length} ตัวอักษร)`;
        }
      }
      break;

    case 'confirmPassword': {
      const targetPass = currentForm.password || '';
      if (!currentEditId) {
        // ผู้ใช้ใหม่
        if (!trimmed) {
          err = 'กรุณากรอกยืนยันรหัสผ่าน';
        } else if (trimmed !== targetPass) {
          err = 'รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านด้านบน';
        }
      } else {
        // แก้ไขผู้ใช้
        if (targetPass && !trimmed) {
          err = 'กรุณากรอกยืนยันรหัสผ่านใหม่';
        } else if (targetPass && trimmed !== targetPass) {
          err = 'รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านใหม่';
        }
      }
      break;
    }

    default:
      break;
  }

  return err;
};

export const validatePhonesList = (phonesList) => {
  const errs = phonesList.map(() => '');
  const counts = {};

  phonesList.forEach(phone => {
    const clean = String(phone || '').trim();
    if (clean) counts[clean] = (counts[clean] || 0) + 1;
  });

  phonesList.forEach((phone, idx) => {
    const clean = String(phone || '').trim();
    if (!clean) return; // เบอร์ว่างยอมรับได้ถ้าไม่ต้องการกรอก

    if (!clean.startsWith('0')) {
      errs[idx] = 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0';
    } else if (clean.length < 9 || clean.length > 10) {
      errs[idx] = `เบอร์โทรศัพท์ต้องมี 9-10 หลัก (ปัจจุบันมี ${clean.length} หลัก)`;
    } else if (counts[clean] > 1) {
      errs[idx] = 'เบอร์โทรศัพท์นี้ซ้ำกับรายการอื่นในแบบฟอร์ม';
    }
  });

  return errs;
};

export const scrollToFirstError = (errorsObj, pErrors = []) => {
  const fieldOrder = ['prefix', 'firstName', 'lastName', 'department', 'username', 'password', 'confirmPassword'];
  for (const field of fieldOrder) {
    if (errorsObj[field]) {
      const el = document.getElementById(`field-${field}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
        return;
      }
    }
  }

  const firstPhoneErrIdx = pErrors.findIndex(err => !!err);
  if (firstPhoneErrIdx !== -1) {
    const el = document.getElementById(`field-phone-${firstPhoneErrIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }
};
