const db = require('../../config/db');
const bcrypt = require('bcryptjs'); // 📍 เพิ่มบรรทัดนี้เข้าไปเลยเพื่อน!

// ... โค้ดฟังก์ชัน getAllUsers และ createUser ของนายจะอยู่ต่อจากตรงนี้ ...
const getAllUsers = async (req, res) => {
    try {
        // ดึงข้อมูลผู้ใช้งาน พร้อม JOIN เอาชื่อคณะ และเบอร์โทรศัพท์มาแสดงด้วย
        const query = `
            SELECT 
                u.User_id AS id, 
                CONCAT(IFNULL(u.Prefix, ''), u.First_name, ' ', u.Last_name) AS name, 
                u.Email_user AS email, 
                f.Faculty_name AS department,
                (SELECT GROUP_CONCAT(Phone_number SEPARATOR ', ') FROM user_phone_number WHERE User_id = u.User_id) AS phone,
                u.User_status AS status
            FROM System_User u
            LEFT JOIN Faculty f ON u.Faculty_id = f.Faculty_id
            ORDER BY u.User_id ASC
        `;
        
        const [rows] = await db.query(query);
        
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('❌ [Error] getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน'
        });
    }
};

// ==========================================
// 🛡️ Helper สำหรับตรวจสอบความถูกต้องและดักกรองข้อมูลผู้ใช้งาน (Validation & Sanitization)
// ==========================================
const validateAndSanitizeUserData = async (data, isUpdate = false, currentUserId = null) => {
    const { prefix, firstName, lastName, phones, department, username, password, status } = data;

    // 1. คำนำหน้าชื่อ (Prefix)
    const cleanPrefix = String(prefix || '').trim();
    if (!cleanPrefix) {
        return { isValid: false, message: 'กรุณาระบุคำนำหน้าชื่อ' };
    }
    if (cleanPrefix.length > 20) {
        return { isValid: false, message: 'คำนำหน้าชื่อต้องมีความยาวไม่เกิน 20 ตัวอักษร' };
    }
    if (!/^[\u0E00-\u0E7Fa-zA-Z\.\s]+$/.test(cleanPrefix)) {
        return { isValid: false, message: 'คำนำหน้าชื่อต้องเป็นตัวอักษรหรือจุดเท่านั้น (ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ)' };
    }

    // 2. ชื่อจริง (First name)
    const cleanFirstName = String(firstName || '').trim();
    if (!cleanFirstName) {
        return { isValid: false, message: 'กรุณากรอกชื่อจริง' };
    }
    if (cleanFirstName.length < 2 || cleanFirstName.length > 50) {
        return { isValid: false, message: 'ชื่อจริงต้องมีความยาวระหว่าง 2 ถึง 50 ตัวอักษร' };
    }
    if (!/^[\u0E00-\u0E7Fa-zA-Z\s]+$/.test(cleanFirstName)) {
        return { isValid: false, message: 'ชื่อจริงต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น (ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ)' };
    }

    // 3. นามสกุล (Last name)
    const cleanLastName = String(lastName || '').trim();
    if (!cleanLastName) {
        return { isValid: false, message: 'กรุณากรอกนามสกุล' };
    }
    if (cleanLastName.length < 2 || cleanLastName.length > 50) {
        return { isValid: false, message: 'นามสกุลต้องมีความยาวระหว่าง 2 ถึง 50 ตัวอักษร' };
    }
    if (!/^[\u0E00-\u0E7Fa-zA-Z\s]+$/.test(cleanLastName)) {
        return { isValid: false, message: 'นามสกุลต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น (ห้ามมีตัวเลขหรือสัญลักษณ์พิเศษ)' };
    }

    // 4. สังกัดคณะ / หน่วยงาน (Department)
    const cleanDepartment = String(department || '').trim();
    if (!cleanDepartment) {
        return { isValid: false, message: 'กรุณาเลือกสังกัดคณะ/หน่วยงาน' };
    }
    const [faculty] = await db.query('SELECT Faculty_id FROM Faculty WHERE Faculty_name = ?', [cleanDepartment]);
    if (faculty.length === 0) {
        return { isValid: false, message: 'ไม่พบข้อมูลคณะ/หน่วยงานนี้ในระบบ' };
    }
    const facultyId = faculty[0].Faculty_id;

    // 5. ชื่อผู้ใช้งาน / อีเมล (Username / Email_user)
    const cleanEmail = String(username || '').trim().toLowerCase();
    if (!cleanEmail) {
        return { isValid: false, message: 'กรุณากรอกชื่อผู้ใช้ (อีเมล)' };
    }
    if (cleanEmail.length > 50) {
        return { isValid: false, message: 'อีเมลผู้ใช้งานต้องมีความยาวไม่เกิน 50 ตัวอักษร' };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
        return { isValid: false, message: 'รูปแบบอีเมลไม่ถูกต้อง (ตัวอย่าง: user@ku.th)' };
    }

    // ตรวจสอบอีเมลซ้ำในระบบ
    if (isUpdate && currentUserId) {
        const [existing] = await db.query('SELECT User_id FROM System_User WHERE Email_user = ? AND User_id != ?', [cleanEmail, currentUserId]);
        if (existing.length > 0) {
            return { isValid: false, message: 'อีเมลนี้ถูกใช้งานโดยผู้ใช้อื่นในระบบแล้ว ไม่สามารถใช้ซ้ำได้' };
        }
    } else {
        const [existing] = await db.query('SELECT User_id FROM System_User WHERE Email_user = ?', [cleanEmail]);
        if (existing.length > 0) {
            return { isValid: false, message: 'อีเมลนี้มีในระบบแล้ว ไม่สามารถใช้ซ้ำได้' };
        }
    }

    // 6. รหัสผ่าน (Password)
    if (!isUpdate) {
        if (!password || String(password).length < 8) {
            return { isValid: false, message: 'รหัสผ่านสำหรับผู้ใช้ใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร' };
        }
        if (String(password).length > 50) {
            return { isValid: false, message: 'รหัสผ่านต้องมีความยาวไม่เกิน 50 ตัวอักษร' };
        }
    } else {
        if (password) {
            if (String(password).length < 8) {
                return { isValid: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร' };
            }
            if (String(password).length > 50) {
                return { isValid: false, message: 'รหัสผ่านต้องมีความยาวไม่เกิน 50 ตัวอักษร' };
            }
        }
    }

    // 7. เบอร์โทรศัพท์ (Phones)
    const validCleanPhones = [];
    if (phones && Array.isArray(phones)) {
        const seenPhones = new Set();
        for (const phone of phones) {
            const raw = String(phone || '').trim();
            if (!raw) continue;
            const cleanPhone = raw.replace(/\D/g, '');
            if (!cleanPhone.startsWith('0')) {
                return { isValid: false, message: `เบอร์โทรศัพท์ "${raw}" ไม่ถูกต้อง ต้องขึ้นต้นด้วยเลข 0` };
            }
            if (cleanPhone.length < 9 || cleanPhone.length > 10) {
                return { isValid: false, message: `เบอร์โทรศัพท์ "${raw}" ต้องเป็นตัวเลข 9-10 หลัก (ปัจจุบันมี ${cleanPhone.length} หลัก)` };
            }
            if (seenPhones.has(cleanPhone)) {
                return { isValid: false, message: `เบอร์โทรศัพท์ "${cleanPhone}" ซ้ำกันในรายการ` };
            }
            seenPhones.add(cleanPhone);
            validCleanPhones.push(cleanPhone);
        }
    }

    return {
        isValid: true,
        sanitizedData: {
            prefix: cleanPrefix,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            facultyId,
            username: cleanEmail,
            phones: validCleanPhones,
            status: (status === 'พักการใช้งาน') ? 'พักการใช้งาน' : 'ใช้งาน'
        }
    };
};

// ==========================================
// 📍 ฟังก์ชันสร้างบัญชีผู้ใช้งานใหม่
// ==========================================
const createUser = async (req, res) => {
    try {
        // ตรวจสอบความถูกต้องและดักกรองข้อมูลทุกช่อง
        const validation = await validateAndSanitizeUserData(req.body, false);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const { prefix, firstName, lastName, facultyId, username, phones, status } = validation.sanitizedData;
        const { password } = req.body;

        // เข้ารหัสผ่าน (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // บันทึกข้อมูลลงตาราง System_User
        const insertUserQuery = `
            INSERT INTO System_User (First_name, Last_name, Prefix, Password, Email_user, Faculty_id, User_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [userResult] = await db.query(insertUserQuery, [
            firstName, 
            lastName, 
            prefix, 
            hashedPassword, 
            username, 
            facultyId, 
            status
        ]);
        
        const newUserId = userResult.insertId;

        // บันทึกเบอร์โทรศัพท์ลงตาราง user_phone_number
        if (phones && phones.length > 0) {
            for (const cleanPhone of phones) {
                await db.query('INSERT INTO user_phone_number (Phone_number, User_id) VALUES (?, ?)', [cleanPhone, newUserId]);
            }
        }

        res.status(201).json({ success: true, message: 'เพิ่มบัญชีผู้ใช้งานใหม่สำเร็จ!' });

    } catch (error) {
        console.error('❌ [Error] createUser:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
    }
};

// ==========================================
// 📍 ฟังก์ชันดึงข้อมูลผู้ใช้งานตาม ID
// ==========================================
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query(`
            SELECT 
                u.User_id AS id, 
                u.First_name, 
                u.Last_name, 
                u.Prefix, 
                u.Email_user AS username, 
                f.Faculty_name AS department,
                u.User_status AS status
            FROM System_User u
            LEFT JOIN Faculty f ON u.Faculty_id = f.Faculty_id
            WHERE u.User_id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        const [phones] = await db.query('SELECT Phone_number FROM user_phone_number WHERE User_id = ?', [id]);
        
        const rawPhones = phones.map(p => p.Phone_number || p.phone_number).filter(Boolean);
        const userData = {
            ...users[0],
            phones: rawPhones.length > 0 ? rawPhones : ['']
        };

        res.status(200).json({ success: true, data: userData });
    } catch (error) {
        console.error('❌ [Error] getUserById:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน' });
    }
};

// ==========================================
// 📍 ฟังก์ชันแก้ไขข้อมูลผู้ใช้งาน
// ==========================================
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบความถูกต้องและดักกรองข้อมูลทุกช่อง
        const validation = await validateAndSanitizeUserData(req.body, true, id);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const { prefix, firstName, lastName, facultyId, username, phones, status } = validation.sanitizedData;
        const { password } = req.body;

        // อัปเดตข้อมูลตาราง System_User
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await db.query(`
                UPDATE System_User 
                SET First_name = ?, Last_name = ?, Prefix = ?, Password = ?, Email_user = ?, Faculty_id = ?, User_status = ?
                WHERE User_id = ?
            `, [firstName, lastName, prefix, hashedPassword, username, facultyId, status, id]);
        } else {
            await db.query(`
                UPDATE System_User 
                SET First_name = ?, Last_name = ?, Prefix = ?, Email_user = ?, Faculty_id = ?, User_status = ?
                WHERE User_id = ?
            `, [firstName, lastName, prefix, username, facultyId, status, id]);
        }

        // อัปเดตเบอร์โทรศัพท์ (ลบของเก่าทิ้ง แล้วเพิ่มใหม่)
        await db.query('DELETE FROM user_phone_number WHERE User_id = ?', [id]);
        if (phones && phones.length > 0) {
            for (const cleanPhone of phones) {
                await db.query('INSERT INTO user_phone_number (Phone_number, User_id) VALUES (?, ?)', [cleanPhone, id]);
            }
        }

        res.status(200).json({ success: true, message: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ!' });
    } catch (error) {
        console.error('❌ [Error] updateUser:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
};

// ==========================================
// 📍 ฟังก์ชันปรับสถานะผู้ใช้งาน (ใช้งาน / พักการใช้งาน)
// ==========================================
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['ใช้งาน', 'พักการใช้งาน'].includes(status)) {
            return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง (ต้องเป็น "ใช้งาน" หรือ "พักการใช้งาน")' });
        }

        const [result] = await db.query('UPDATE System_User SET User_status = ? WHERE User_id = ?', [status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        res.status(200).json({ 
            success: true, 
            message: `ปรับสถานะผู้ใช้งานเป็น "${status}" เรียบร้อยแล้ว`,
            status
        });
    } catch (error) {
        console.error('❌ [Error] updateUserStatus:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการปรับสถานะผู้ใช้งาน' });
    }
};

// ==========================================
// 📍 ฟังก์ชันพักการใช้งานผู้ใช้งาน (แทนการลบออกจากระบบจริง)
// ==========================================
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // คงข้อมูลผู้ใช้และเบอร์โทรศัพท์ไว้ โดยเปลี่ยนสถานะเป็น 'พักการใช้งาน' แทนการลบ
        const [result] = await db.query("UPDATE System_User SET User_status = 'พักการใช้งาน' WHERE User_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        res.status(200).json({ success: true, message: 'พักการใช้งานบัญชีผู้ใช้งานเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('❌ [Error] deleteUser:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการพักการใช้งานผู้ใช้งาน' });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    updateUserStatus,
    deleteUser
};