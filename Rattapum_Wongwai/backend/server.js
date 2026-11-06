const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); 

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 📍 นำเข้า Routes (จัดกลุ่มตาม Role / Feature)
// ==========================================
const authRoutes = require('./routes/auth/authRoutes');
const facultyRoutes = require('./routes/common/facultyRoutes');
const provinceRoutes = require('./routes/common/provinceRoutes');
const jobSearchRoutes = require('./routes/common/jobSearchRoutes');
const emailRoutes = require('./routes/common/emailRoutes');
const applicationRoutes = require('./routes/applicant/applicationRoutes');
const requestJobRoutes = require('./routes/faculty/requestJobRoutes');
const jobPostingRoutes = require('./routes/hr/jobPostingRoutes');
const jobRequestRoutes = require('./routes/hr/jobRequestRoutes');
const userRoutes = require('./routes/hr/userRoutes');
const reportRoutes = require('./routes/reports/reportRoutes');
const exportRoutes = require('./routes/reports/exportRoutes');
const path = require('path');

// กำหนด Base URL
app.use('/api/auth', authRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job-requests', jobRequestRoutes);
app.use('/api/job-posting', jobPostingRoutes);
app.use('/api/request-job', requestJobRoutes);
app.use('/api/job-search', jobSearchRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/export', exportRoutes);

// เปิดให้เข้าถึงโฟลเดอร์ uploads ได้ผ่าน URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์รันบนพอร์ต ${PORT}`);
});