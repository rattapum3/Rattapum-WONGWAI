# ระบบรับสมัครงานและคัดเลือกบุคลากรออนไลน์ (Online Recruitment and Selection System)
### มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร (KU CSC)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)
```text
Rattapum-WONGWAI/
├── Rattapum_Wongwai/          # โฟลเดอร์จัดเก็บ Source Code ทั้งหมดของโปรเจกต์
│   ├── backend/               # ระบบ Backend (Node.js, Express, MySQL)
│   └── frontend/              # ระบบ Frontend (React 19, Vite, Bootstrap 5)
├── .gitignore                 # การตั้งค่า Ignore ไฟล์ความลับและไฟล์ระบบ
└── README.md                  # เอกสารแนะนำและคู่มือการติดตั้งโปรเจกต์
```

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
* **Core:** React 19, Vite
* **UI & Styling:** Bootstrap 5, Bootstrap Icons
* **Routing:** React Router DOM (v7)
* **Visualization:** Recharts (สำหรับรายงานและสถิติ HR)

### Backend
* **Environment:** Node.js
* **Framework:** Express.js (v5)
* **Database Driver:** MySQL2 (รองรับ MariaDB / MySQL)
* **Document Processing:** Docxtemplater, Pizzip, Docx, Puppeteer (สำหรับสร้างเอกสาร DOCX และ PDF ประกาศ/ใบสมัคร)
* **File Upload:** Multer
* **Email Notification:** Nodemailer (Gmail SMTP Service)
* **Authentication Security:** bcryptjs

---

## 👥 บทบาทผู้ใช้งานในระบบ (System Roles)
1. **ผู้สมัครงาน (Applicant):** ค้นหาตำแหน่งงาน, กรอกใบสมัครออนไลน์พร้อมอัปโหลดเอกสาร, บันทึกแบบร่าง (Draft), ติดตามสถานะผลการสอบและประกาศผล
2. **เจ้าหน้าที่งานบุคคล (HR Admin):** จัดการคำร้องขอเปิดรับสมัครจากคณะ, สร้างและจัดการประกาศรับสมัคร, กำหนดขั้นตอนการสอบ, ตรวจสอบเอกสารผู้สมัคร, จัดการผลการคัดเลือก, ออกเอกสารประกาศทางการ และดูรายงานสถิติ
3. **คณะ/หน่วยงาน (Faculty/Department):** ยื่นคำร้องขอเปิดรับสมัครงานตามความต้องการของหน่วยงาน และร่วมประเมินผู้สมัคร

---

## 🚀 ขั้นตอนการติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. การตั้งค่าฐานข้อมูล (Database Setup)
1. เปิดโปรแกรมจำลองฐานข้อมูล เช่น XAMPP หรือ MySQL Server
2. สร้างฐานข้อมูลชื่อ `kucsc_real`
3. ตั้งค่าการเชื่อมต่อฐานข้อมูลในไฟล์ `Rattapum_Wongwai/backend/.env` โดยคัดลอกรูปแบบจาก `Rattapum_Wongwai/backend/.env.example`

### 2. รันระบบ Backend
```bash
cd Rattapum_Wongwai/backend
npm install
npm run dev
```
> เซิร์ฟเวอร์ Backend จะทำงานที่: `http://localhost:3000`

### 3. รันระบบ Frontend
```bash
cd Rattapum_Wongwai/frontend
npm install
npm run dev
```
> เว็บแอปพลิเคชันจะเปิดที่: `http://localhost:5173`

---

## 👨‍💻 ข้อมูลผู้จัดทำ
* **ชื่อ-นามสกุล:** นายรัฐภูมิ วงศ์ไว (Rattapum Wongwai)
* **สถาบัน:** มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
* **อีเมล:** rattapum.w@ku.th
