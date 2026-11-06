const db = require('../../config/db');

const getAllRequests = async (req, res) => {
    try {
        const { facultyName } = req.query;

        let query = `
            SELECT 
                r.Recruitment_id AS id,
                r.Request_date AS rawDate,
                f.Faculty_name AS faculty,
                d.Department_name AS department,
                p.Position_name AS jobTitle,
                r.Total_position AS amount,
                r.Min_education AS minEducation,
                r.Request_status AS status,
                (SELECT GROUP_CONCAT(Major_name SEPARATOR ', ') FROM recruitment_major WHERE Recruitment_id = r.Recruitment_id) AS major,
                (SELECT GROUP_CONCAT(Additional_skill SEPARATOR ', ') FROM additional_skill WHERE Recruitment_id = r.Recruitment_id) AS additionalSkills,
                CONCAT(
                    'วุฒิ: ', 
                    IFNULL(r.Min_education, '-'), 
                    ' | สาขา: ', 
                    IFNULL((SELECT GROUP_CONCAT(Major_name SEPARATOR ', ') FROM recruitment_major WHERE Recruitment_id = r.Recruitment_id), '-')
                ) AS details
            FROM recruitment r
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            LEFT JOIN position p ON r.Position_id = p.Position_id
        `;

        const queryParams = [];
        if (facultyName) {
            query += ` WHERE f.Faculty_name = ?`;
            queryParams.push(facultyName);
        }

        query += ` ORDER BY r.Request_date DESC, r.Recruitment_id DESC`;

        const [rows] = await db.query(query, queryParams);

        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

        const formattedRows = rows.map(row => {
            let requestDate = "";
            if (row.rawDate) {
                const d = new Date(row.rawDate);
                requestDate = `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
            }
            // Remove rawDate from final output
            const { rawDate, ...rest } = row;
            return {
                ...rest,
                requestDate
            };
        });

        res.json({ success: true, data: formattedRows });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // ลบข้อมูลตารางลูก (recruitment_major และ additional_skill) ก่อน
        await db.query('DELETE FROM recruitment_major WHERE Recruitment_id = ?', [id]);
        await db.query('DELETE FROM additional_skill WHERE Recruitment_id = ?', [id]);

        // ลบข้อมูลตารางหลัก (recruitment)
        const [result] = await db.query('DELETE FROM recruitment WHERE Recruitment_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลคำขอ หรือถูกลบไปแล้ว' });
        }

        res.status(200).json({ success: true, message: 'ยกเลิกคำขอสำเร็จ' });
    } catch (error) {
        console.error('Error deleting job request:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกคำขอ' });
    }
};

const getApprovedJobsByFaculty = async (req, res) => {
    try {
        const { facultyName } = req.query;

        let query = `
            SELECT 
                r.Recruitment_id AS id,
                p.Position_name AS title,
                r.Announcement_name AS announcementName,
                f.Faculty_name AS facultyName,
                d.Department_name AS deptName,
                r.Total_position AS quantity,
                r.Open_date AS openDateRaw,
                r.Close_date AS closeDateRaw,
                (SELECT COUNT(*) FROM Application a WHERE a.Recruitment_id = r.Recruitment_id AND a.Status != 'Draft') AS totalApplicants,
                (SELECT COUNT(*) FROM Application a WHERE a.Recruitment_id = r.Recruitment_id AND a.Status != 'Draft' AND (a.Status = 'รอตรวจสอบ' OR a.Status IS NULL OR a.Status = '')) AS pendingReview
            FROM recruitment r
            LEFT JOIN position p ON r.Position_id = p.Position_id
            LEFT JOIN department d ON r.Department_id = d.Department_id
            LEFT JOIN faculty f ON d.Faculty_id = f.Faculty_id
            WHERE r.Request_status = 'Processed'
        `;

        const queryParams = [];
        if (facultyName && facultyName.trim() && facultyName.trim() !== 'ไม่ระบุหน่วยงาน') {
            query += ` AND f.Faculty_name = ?`;
            queryParams.push(facultyName.trim());
        }

        query += ` ORDER BY r.Recruitment_id DESC`;

        const [rows] = await db.query(query, queryParams);

        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const formatDate = (dateString) => {
            if (!dateString) return "-";
            const date = new Date(dateString);
            return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
        };

        const _determineJobStatus = (open, close) => {
            if (!open || !close) return "รอเปิดรับสมัคร";
            const now = new Date();
            const openDate = new Date(open);
            const closeDate = new Date(close);
            closeDate.setHours(23, 59, 59, 999);

            if (now < openDate) return "รอเปิดรับสมัคร";
            if (now > closeDate) return "ปิดรับสมัครแล้ว";
            return "เปิดรับสมัคร";
        };

        const formatted = rows.map(r => ({
            id: r.id,
            rawId: r.id,
            title: r.title || 'ไม่ระบุตำแหน่ง',
            announcementName: r.announcementName || '-',
            facultyName: r.facultyName || '-',
            deptName: r.deptName || '-',
            quantity: r.quantity || 0,
            openDate: formatDate(r.openDateRaw),
            closeDate: formatDate(r.closeDateRaw),
            closeDateRaw: r.closeDateRaw,
            status: _determineJobStatus(r.openDateRaw, r.closeDateRaw),
            totalApplicants: r.totalApplicants || 0,
            pendingReview: r.pendingReview || 0
        }));

        // เรียงลำดับ: ประกาศที่เปิดรับสมัครมาก่อน และเรียงตามวันปิดรับสมัครที่ใกล้ที่สุดก่อน (Close Date ASC)
        formatted.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'เปิดรับสมัคร' ? -1 : 1;
            }
            const timeA = a.closeDateRaw ? new Date(a.closeDateRaw).getTime() : Infinity;
            const timeB = b.closeDateRaw ? new Date(b.closeDateRaw).getTime() : Infinity;
            return timeA - timeB;
        });

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching approved jobs for faculty:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getAllRequests,
    deleteRequest,
    getApprovedJobsByFaculty
};
