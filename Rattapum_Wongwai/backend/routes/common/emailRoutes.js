const express = require('express');
const router = express.Router();
const emailService = require('../../services/emailService');

// POST /api/email/test
router.post('/test', async (req, res) => {
    try {
        const { to } = req.body;
        const targetEmail = to || process.env.GMAIL_USER;
        
        if (!targetEmail) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุอีเมลปลายทาง หรือตั้งค่า GMAIL_USER ใน .env'
            });
        }

        const result = await emailService.sendTestEmail(targetEmail);
        if (result.success) {
            return res.json({
                success: true,
                message: `ส่งอีเมลทดสอบไปยัง ${targetEmail} เรียบร้อยแล้ว!`,
                messageId: result.messageId
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'ส่งอีเมลไม่สำเร็จ: ' + (result.error || result.message)
            });
        }
    } catch (error) {
        console.error('Error in test email route:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
