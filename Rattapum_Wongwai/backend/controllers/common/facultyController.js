// ดึง connection pool ที่เราสร้างไว้เมื่อกี้มาใช้
const db = require('../../config/db');

// ฟังก์ชันสำหรับดึงข้อมูลคณะ/หน่วยงานทั้งหมด
const getAllFaculties = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT Faculty_id AS id, Faculty_name AS name, Faculty_id, Faculty_name FROM faculty ORDER BY Faculty_id');
        
        // ส่ง response กลับไปให้ Frontend
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('❌ [Error] getAllFaculties:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคณะ/หน่วยงาน'
        });
    }
};

module.exports = {
    getAllFaculties
};