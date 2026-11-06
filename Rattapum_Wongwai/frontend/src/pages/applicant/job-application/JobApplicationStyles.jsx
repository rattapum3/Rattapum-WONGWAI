import React from 'react';

export default function JobApplicationStyles() {
  return (
    <>
      {/* 📍 Datalists สำหรับตัวเลือกที่พิมพ์เองหรือเลือกได้ (คำนำหน้า, สัญชาติ, ศาสนา) */}
      <datalist id="prefixOptions">
        <option value="นาย" />
        <option value="นาง" />
        <option value="นางสาว" />
        <option value="ดร." />
        <option value="ผศ.ดร." />
        <option value="รศ.ดร." />
        <option value="ศ.ดร." />
        <option value="อาจารย์" />
        <option value="ว่าที่ ร.ต." />
        <option value="ว่าที่ ร.ท." />
        <option value="ว่าที่ ร.อ." />
      </datalist>

      <datalist id="nationalityOptions">
        <option value="ไทย" />
        <option value="ลาว" />
        <option value="พม่า" />
        <option value="กัมพูชา" />
        <option value="จีน" />
        <option value="ญี่ปุ่น" />
        <option value="เกาหลีใต้" />
        <option value="อเมริกัน" />
        <option value="อังกฤษ" />
        <option value="เยอรมัน" />
        <option value="ฝรั่งเศส" />
        <option value="ออสเตรเลีย" />
        <option value="อื่นๆ" />
      </datalist>

      <datalist id="religionOptions">
        <option value="พุทธ" />
        <option value="คริสต์" />
        <option value="อิสลาม" />
        <option value="ฮินดู" />
        <option value="ซิกข์" />
        <option value="ไม่ระบุ" />
        <option value="อื่นๆ" />
      </datalist>

      <datalist id="degree-custom-suggestions">
        <option value="ประกาศนียบัตรบัณฑิต" />
        <option value="ประกาศนียบัตรบัณฑิตชั้นสูง" />
        <option value="แพทยศาสตรบัณฑิต" />
        <option value="ทันตแพทยศาสตรบัณฑิต" />
        <option value="เภสัชศาสตรบัณฑิต" />
        <option value="สัตวแพทยศาสตรบัณฑิต" />
        <option value="วุฒิบัตรแสดงความรู้ความชำนาญเฉพาะทาง" />
        <option value="หนังสืออนุมัติแสดงความรู้ความชำนาญเฉพาะทาง" />
      </datalist>

      <style dangerouslySetInnerHTML={{
        __html: `
        .animate__animated { animation-duration: 0.3s; }
        .animate__fadeIn { animation-name: fadeIn; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* 1) ช่องที่ยังไม่ได้กรอก (Empty Required) -> กรอบสีเขียวอ่อน สบายตา เท่ากับกรอบสีเทา */
        .border-ku-required,
        select.border-ku-required,
        input.border-ku-required:placeholder-shown,
        textarea.border-ku-required:placeholder-shown {
          border: 1.5px solid #86efac !important;
          background-color: #f8fdfa !important;
          transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }

        /* 2) ช่องที่กรอกแล้ว (Filled Required) -> กรอบสีเทาสุภาพ สะอาดตา */
        .border-ku-filled,
        select.border-ku-filled,
        input.border-ku-filled,
        textarea.border-ku-filled,
        input.border-ku-required:not(:placeholder-shown),
        textarea.border-ku-required:not(:placeholder-shown) {
          border: 1.5px solid #e2e8f0 !important;
          background-color: #ffffff !important;
          transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }

        /* 3) ช่องที่มีข้อผิดพลาด (Invalid) -> กรอบสีแดงและเงาสีแดง */
        .border-ku-invalid,
        .is-invalid,
        input.border-ku-invalid,
        select.border-ku-invalid,
        textarea.border-ku-invalid {
          border: 1.5px solid #ef4444 !important;
          background-color: #fef2f2 !important;
          box-shadow: 0 0 0 0.15rem rgba(239, 68, 68, 0.15) !important;
          transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }

        .border-ku-invalid:focus,
        .is-invalid:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 0.2rem rgba(220, 38, 38, 0.2) !important;
        }

        /* เมื่อคลิกกรอก (Focus) */
        .border-ku-required:focus,
        .border-ku-filled:focus,
        input.border-ku-required:focus,
        input.border-ku-filled:focus,
        select.border-ku-required:focus,
        select.border-ku-filled:focus,
        textarea.border-ku-required:focus,
        textarea.border-ku-filled:focus {
          border-color: #03A96B !important;
          box-shadow: 0 0 0 0.2rem rgba(3, 169, 107, 0.15) !important;
          background-color: #ffffff !important;
        }
      `}} />
    </>
  );
}
