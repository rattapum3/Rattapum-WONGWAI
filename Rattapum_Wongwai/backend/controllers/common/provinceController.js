const db = require('../../config/db');

// ดึงรายชื่อจังหวัดทั้งหมดจากตาราง province ใน DB
const getProvinces = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT Province_id, Province_name FROM province ORDER BY Province_name ASC');
        const provinces = (rows || []).map(r => r.Province_name).filter(Boolean);
        res.json({ success: true, data: provinces });
    } catch (error) {
        console.error('Error fetching provinces from DB:', error);
        res.status(500).json({ success: false, message: 'Server error', data: [] });
    }
};

// ดึงข้อมูลอำเภอ ตำบล และรหัสไปรษณีย์ทั้งหมดของจังหวัดที่ระบุจาก DB
const getProvinceHierarchy = async (req, res) => {
    try {
        const { provinceName } = req.params;

        const query = `
            SELECT 
                p.Province_name,
                d.District_name,
                d.Postal_code,
                s.Subdistrict_id,
                s.Subdistrict_name
            FROM province p
            JOIN district d ON p.Province_id = d.Province_id
            JOIN subdistrict s ON d.District_id = s.District_id
            WHERE p.Province_name = ?
            ORDER BY d.District_name ASC, s.Subdistrict_name ASC
        `;
        const [rows] = await db.query(query, [provinceName]);

        // จัดโครงสร้าง: { "เมืองสกลนคร": [{ id: 1, name: "ธาตุเชิงชุม", zip: "47000" }, ...] }
        const hierarchy = {};
        rows.forEach(r => {
            if (!hierarchy[r.District_name]) {
                hierarchy[r.District_name] = [];
            }
            hierarchy[r.District_name].push({
                id: r.Subdistrict_id,
                name: r.Subdistrict_name,
                zip: r.Postal_code || ''
            });
        });

        res.json({ success: true, data: hierarchy });
    } catch (error) {
        console.error('Error fetching hierarchy from DB:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ดึงรายชื่ออำเภอในจังหวัดจาก DB
const getDistrictsByProvince = async (req, res) => {
    try {
        const { provinceName } = req.params;
        const [rows] = await db.query(`
            SELECT d.District_id, d.District_name, d.Postal_code
            FROM district d
            JOIN province p ON d.Province_id = p.Province_id
            WHERE p.Province_name = ?
            ORDER BY d.District_name ASC
        `, [provinceName]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching districts from DB:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ดึงรายชื่อตำบลในอำเภอจาก DB
const getSubdistrictsByDistrict = async (req, res) => {
    try {
        const { districtName } = req.params;
        const { provinceName } = req.query;
        let query = `
            SELECT s.Subdistrict_id, s.Subdistrict_name, d.Postal_code
            FROM subdistrict s
            JOIN district d ON s.District_id = d.District_id
            JOIN province p ON d.Province_id = p.Province_id
            WHERE d.District_name = ?
        `;
        const params = [districtName];
        if (provinceName) {
            query += ` AND p.Province_name = ?`;
            params.push(provinceName);
        }
        query += ` ORDER BY s.Subdistrict_name ASC`;
        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching subdistricts from DB:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getProvinces,
    getProvinceHierarchy,
    getDistrictsByProvince,
    getSubdistrictsByDistrict
};
