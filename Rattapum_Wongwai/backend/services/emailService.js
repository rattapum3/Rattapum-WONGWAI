const nodemailer = require('nodemailer');

// สร้าง Transporter สำหรับส่งอีเมลผ่าน Gmail SMTP
const getTransporter = () => {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.warn("⚠️ GMAIL_USER หรือ GMAIL_APP_PASSWORD ยังไม่ได้ตั้งค่าใน .env");
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        }
    });
};

// ฟังก์ชันสร้าง Layout Template อีเมลสไตล์ มก. ฉกส. (KU CSC Green Theme)
const wrapEmailTemplate = (title, contentHtml) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #006664, #03A96B); padding: 25px 20px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
            .header p { margin: 5px 0 0 0; font-size: 13px; opacity: 0.9; }
            .content { padding: 30px 25px; line-height: 1.6; }
            .status-box { padding: 15px 20px; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .status-pass { background-color: #e8f5e9; color: #2e7d32; border-left: 5px solid #2e7d32; }
            .status-fail { background-color: #ffebee; color: #c62828; border-left: 5px solid #c62828; }
            .status-info { background-color: #e0f2f1; color: #00695c; border-left: 5px solid #00695c; }
            .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .details-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .details-table td.label { width: 35%; color: #666; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eaeaea; }
            .btn { display: inline-block; padding: 12px 28px; background-color: #03A96B; color: #ffffff !important; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>ระบบรับสมัครงานบุคลากร</h1>
                <p>มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร</p>
            </div>
            <div class="content">
                <h3 style="color: #006664; margin-top: 0;">${title}</h3>
                ${contentHtml}
            </div>
            <div class="footer">
                <p style="margin: 0 0 5px 0;">อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบรับสมัครงาน มก. ฉกส.</p>
                <p style="margin: 0;">หากมีข้อสงสัย โปรดติดต่อหน่วยทรัพยากรมนุษย์และสวัสดิการ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * 1. ส่งอีเมลแจ้งผลการพิจารณาคุณสมบัติเบื้องต้น (จากฝั่งคณะ)
 */
const sendFacultyReviewEmail = async ({ to, applicantName, positionTitle, facultyName, status, comment, emailSubject, emailBody }) => {
    try {
        const transporter = getTransporter();
        if (!transporter) return { success: false, message: 'SMTP not configured' };
        if (!to) return { success: false, message: 'No recipient email' };

        const isFail = status.includes('ไม่ผ่าน');
        const isPass = !isFail && status.includes('ผ่าน');
        const subject = emailSubject || `[KU CSC Recruitment] แจ้งผลการพิจารณาคุณสมบัติเบื้องต้น: ตำแหน่ง ${positionTitle}`;

        const statusClass = isPass ? 'status-pass' : 'status-fail';
        const statusIcon = isPass ? '✅' : '❌';

        let contentHtml = '';

        if (emailBody && emailBody.trim()) {
            // หากผู้ใช้พิมพ์ข้อความแบบกำหนดเอง ให้ใช้ข้อความที่แก้ไข
            const formattedBody = emailBody.replace(/\n/g, '<br/>');
            contentHtml = `
                <div class="status-box ${statusClass}">
                    ${statusIcon} ผลการพิจารณาคุณสมบัติเบื้องต้น: <strong>${status}</strong>
                </div>
                <div style="background-color: #ffffff; padding: 10px 0; font-size: 15px; line-height: 1.8;">
                    ${formattedBody}
                </div>
            `;
        } else {
            contentHtml = `
                <p>เรียน <strong>${applicantName || 'ผู้สมัคร'}</strong>,</p>
                <p>ตามที่ท่านได้ยื่นใบสมัครเข้ารับการคัดเลือกเป็นบุคลากรของมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร นั้น</p>
                
                <div class="status-box ${statusClass}">
                    ${statusIcon} ผลการพิจารณาคุณสมบัติเบื้องต้น: <strong>${status}</strong>
                </div>

                <table class="details-table">
                    <tr>
                        <td class="label">ตำแหน่งที่สมัคร:</td>
                        <td><strong>${positionTitle}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">หน่วยงาน/คณะ:</td>
                        <td>${facultyName || '-'}</td>
                    </tr>
                    ${comment ? `
                    <tr>
                        <td class="label">หมายเหตุ/ข้อคิดเห็น:</td>
                        <td style="color: ${isPass ? '#333' : '#c62828'}; font-weight: ${isPass ? 'normal' : 'bold'};">${comment}</td>
                    </tr>
                    ` : ''}
                </table>

                ${isPass ? `
                <p style="margin-top: 15px; color: #2e7d32;">
                    🎉 <strong>ขอแสดงความยินดี!</strong> เอกสารและคุณสมบัติเบื้องต้นของท่านครบถ้วนสมบูรณ์ โปรดรอรับการแจ้งกำหนดการและรายละเอียดการทดสอบ/สัมภาษณ์จากหน่วยทรัพยากรมนุษย์ (HR) ในลำดับถัดไป
                </p>
                ` : `
                <p style="margin-top: 15px; color: #c62828;">
                    ทางคณะกรรมการขอขอบคุณท่านที่ให้ความสนใจสมัครงานกับทางมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร และขอแสดงความเสียใจที่ท่านไม่ผ่านการคัดเลือกเบื้องต้นในครั้งนี้
                </p>
                `}
            `;
        }

        const mailOptions = {
            from: `"ระบบรับสมัครงาน มก. ฉกส." <${process.env.GMAIL_USER}>`,
            to: to,
            subject: subject,
            html: wrapEmailTemplate(
                isPass ? 'แจ้งผลการพิจารณาคุณสมบัติเบื้องต้น' : 'แจ้งผลการพิจารณาคุณสมบัติเบื้องต้น (ไม่ผ่านการคัดเลือก)',
                contentHtml
            ),
            text: emailBody || `เรียน ${applicantName}\n\nผลการพิจารณาคุณสมบัติเบื้องต้นในตำแหน่ง ${positionTitle}: ${status}\n${comment ? `หมายเหตุ: ${comment}\n` : ''}\nมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ ส่งอีเมลแจ้งผลคุณสมบัติเบื้องต้นสำเร็จไปยัง ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการส่งอีเมลแจ้งผลคุณสมบัติเบื้องต้นไปยัง ${to}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * 2. ส่งอีเมลแจ้งกำหนดการสอบ / ผลคะแนน / ผลการคัดเลือก (จากฝั่ง HR)
 */
const sendHrEvaluationEmail = async ({ to, applicantName, positionTitle, subject, emailBody }) => {
    try {
        const transporter = getTransporter();
        if (!transporter) return { success: false, message: 'SMTP not configured' };
        if (!to) return { success: false, message: 'No recipient email' };

        const emailSubject = subject || `[KU CSC Recruitment] แจ้งผลการประเมินและการจัดสอบ: ตำแหน่ง ${positionTitle}`;

        // แปลงข้อความ Plain text ที่ HR พิมพ์ ให้เป็น HTML Paragraphs
        const formattedBody = (emailBody || '')
            .replace(/\n/g, '<br/>');

        const contentHtml = `
            <div style="background-color: #ffffff; padding: 15px 0; font-size: 15px; line-height: 1.8;">
                ${formattedBody}
            </div>
        `;

        const mailOptions = {
            from: `"หน่วยทรัพยากรมนุษย์ มก. ฉกส." <${process.env.GMAIL_USER}>`,
            to: to,
            subject: emailSubject,
            html: wrapEmailTemplate('แจ้งผลการประเมิน / กำหนดการจัดสอบ', contentHtml),
            text: emailBody || emailSubject
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ ส่งอีเมลแจ้งผล HR สำเร็จไปยัง ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการส่งอีเมล HR ไปยัง ${to}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * 3. ส่งอีเมลทดสอบระบบ (Test Email)
 */
const sendTestEmail = async (toEmail) => {
    try {
        const transporter = getTransporter();
        if (!transporter) return { success: false, message: 'SMTP not configured' };

        const mailOptions = {
            from: `"KU CSC Recruitment System" <${process.env.GMAIL_USER}>`,
            to: toEmail || process.env.GMAIL_USER,
            subject: '🧪 [Test] ทดสอบการเชื่อมต่อระบบส่งอีเมล KU CSC Recruitment',
            html: wrapEmailTemplate(
                'ทดสอบการเชื่อมต่อระบบส่งอีเมลสำเร็จ',
                `<p>ยินดีด้วย! การตั้งค่า <strong>Gmail SMTP (Nodemailer)</strong> ของคุณถูกต้องและพร้อมใช้งานในระบบรับสมัครงาน มก. ฉกส. แล้ว</p>
                 <div class="status-box status-pass">ระบบส่งอีเมลพร้อมทำงาน 100%</div>`
            ),
            text: 'ยินดีด้วย! การตั้งค่า Gmail SMTP ของคุณถูกต้องและพร้อมใช้งานแล้ว'
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending test email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendFacultyReviewEmail,
    sendHrEvaluationEmail,
    sendTestEmail
};
