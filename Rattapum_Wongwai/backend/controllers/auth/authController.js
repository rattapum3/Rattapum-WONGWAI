const db = require('../../config/db');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
    const { loginType } = req.body;

    try {
        // ==========================================
        // 🧑‍🎓 1. กรณีผู้ใช้งานเป็น "ผู้สมัคร" (Applicant)
        // ==========================================
        if (loginType === 'applicant') {
            const { applicantId, applicantEmail } = req.body;
            const cleanCitizenId = String(applicantId || '').trim();
            const cleanEmail = String(applicantEmail || '').trim().toLowerCase();

            // ค้นหาผู้สมัครด้วย เลขบัตรประชาชน และ อีเมล
            const [applicants] = await db.query(
                'SELECT * FROM Applicant WHERE TRIM(Citizen_id) = ? AND LOWER(TRIM(Email)) = ?',
                [cleanCitizenId, cleanEmail]
            );

            if (applicants.length === 0) {
                return res.status(401).json({ success: false, message: 'เลขประจำตัวประชาชน หรือ อีเมลไม่ถูกต้อง' });
            }

            const user = applicants[0];

            // 📍 ตรวจสอบสถานะการสมัครงาน:
            // ผู้ใช้ที่มีสถานะเป็นแบบร่าง (Draft) แต่ไม่เคยยื่นสมัครจริง หรือยังไม่เคยยื่นสมัคร จะไม่สามารถเข้าสู่ระบบได้
            const [appRows] = await db.query(`
                SELECT 
                    COUNT(*) AS totalApps,
                    SUM(CASE WHEN LOWER(TRIM(a.Status)) != 'draft' AND a.Status IS NOT NULL AND TRIM(a.Status) != '' THEN 1 ELSE 0 END) AS submittedApps,
                    SUM(CASE WHEN LOWER(TRIM(a.Status)) = 'draft' THEN 1 ELSE 0 END) AS draftApps
                FROM Application a
                JOIN Applicant ap ON a.Applicant_id = ap.Applicant_id
                WHERE a.Applicant_id = ? OR (ap.Citizen_id IS NOT NULL AND ap.Citizen_id = ?)
            `, [user.Applicant_id, user.Citizen_id]);

            const submittedCount = Number(appRows[0]?.submittedApps || 0);
            const draftCount = Number(appRows[0]?.draftApps || 0);

            if (submittedCount === 0) {
                if (draftCount > 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'เลขประจำตัวประชาชน หรือ อีเมลไม่ถูกต้อง'
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ',
                user: {
                    id: user.Applicant_id,
                    name: `${user.Prefix || ''}${user.First_name} ${user.Last_name}`,
                    role: 'ผู้สมัคร',
                    citizenId: user.Citizen_id,
                    email: user.Email
                }
            });
        }

        // ==========================================
        // 🏢 2. กรณีผู้ใช้งานเป็น "บุคลากร" (Staff)
        // ==========================================

        else if (loginType === 'staff') {
            const { email, password } = req.body;

            const query = `
                SELECT u.*, f.Faculty_name 
                FROM System_User u 
                LEFT JOIN Faculty f ON u.Faculty_id = f.Faculty_id 
                WHERE u.Email_user = ?
            `;
            const [users] = await db.query(query, [email]);

            if (users.length === 0) {
                return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            }

            const user = users[0];

            // 📍 ตรวจสอบรหัสผ่าน
            const isMatch = await bcrypt.compare(password, user.Password);

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            }

            // 📍 ตรวจสอบสถานะการใช้งานบัญชี (หากถูกพักการใช้งานจะไม่อนุญาตให้เข้าระบบ)
            if (user.User_status === 'พักการใช้งาน') {
                return res.status(403).json({
                    success: false,
                    message: 'บัญชีผู้ใช้นี้ถูกพักการใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
                });
            }

            // แยก Role ว่าเป็น "หน่วยทรัพยากรมนุษย์และสวัสดิการ" หรือ "คณะ/หน่วยงาน"
            let userRole = 'คณะ/หน่วยงาน';
            if (user.Faculty_name && user.Faculty_name.includes('หน่วยทรัพยากรมนุษย์')) {
                userRole = 'หน่วยทรัพยากรมนุษย์และสวัสดิการ';
            }

            return res.status(200).json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ',
                user: {
                    id: user.User_id,
                    name: `${user.Prefix || ''}${user.First_name} ${user.Last_name}`,
                    role: userRole,
                    dept: user.Faculty_name || 'ไม่ระบุหน่วยงาน',
                    facultyId: user.Faculty_id
                }
            });
        }

    } catch (error) {
        console.error(' [Error] Login:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
    }
};

module.exports = { login };