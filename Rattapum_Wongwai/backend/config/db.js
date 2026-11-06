const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // ปรับเพิ่ม/ลดจำนวน connection สูงสุดได้ตามความเหมาะสม
    queueLimit: 0,
    dateStrings: true // คืนค่า DATE และ DATETIME เป็นสตริงจริงจาก DB ป้องกัน Timezone Offset ย้อนหลัง 1 วัน
});

// ฟังก์ชันสำหรับทดสอบการเชื่อมต่อ (IIFE)
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('เชื่อมต่อกับ MySQLสำเร็จ');
        connection.release(); // คืนการเชื่อมต่อกลับเข้า Pool
    } catch (error) {
        console.error('ไม่สามารถเชื่อมต่อ MySQL ได้:', error.message);
    }
})();

module.exports = pool;