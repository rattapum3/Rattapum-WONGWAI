import React from 'react';

export default function JobPostingStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* 1) ช่องที่ยังไม่ได้กรอก (Empty Required) -> กรอบสีเขียวอ่อน สบายตา */
      .border-ku-required,
      select.border-ku-required,
      input.border-ku-required,
      textarea.border-ku-required {
        border: 1.5px solid #86efac !important;
        background-color: #f8fdfa !important;
        transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }

      /* 2) ช่องที่กรอกแล้ว (Filled Required) -> กรอบสีเทาสุภาพ สะอาดตา */
      .border-ku-filled,
      select.border-ku-filled,
      input.border-ku-filled,
      textarea.border-ku-filled {
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

      /* 4) กำหนดให้กล่องข้อความ textarea ในฟอร์มสามารถขยายได้ (Resizable) และมีขนาดเริ่มต้นที่กว้างและสูงชัดเจน */
      textarea.form-control {
        resize: vertical !important;
        min-height: 90px;
        line-height: 1.6;
      }

      /* เมื่อมี textarea ใน input-group: ให้เลขข้อและปุ่มเลื่อน/ลบ อยู่ชิดด้านบน ไม่ยืดตามตอนกดยืด textarea */
      .input-group.input-group-textarea,
      .input-group:has(> textarea.form-control) {
        align-items: flex-start !important;
      }

      .input-group.input-group-textarea > .input-group-text,
      .input-group:has(> textarea.form-control) > .input-group-text {
        height: 38px !important;
        min-height: 38px !important;
        max-height: 38px !important;
        align-self: flex-start !important;
        border-bottom-left-radius: 0.375rem !important;
        border-top-left-radius: 0.375rem !important;
      }

      .input-group.input-group-textarea > .btn,
      .input-group:has(> textarea.form-control) > .btn {
        height: 38px !important;
        min-height: 38px !important;
        max-height: 38px !important;
        align-self: flex-start !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .input-group.input-group-textarea > .btn:last-child,
      .input-group:has(> textarea.form-control) > .btn:last-child {
        border-top-right-radius: 0.375rem !important;
        border-bottom-right-radius: 0.375rem !important;
      }

      .input-group.input-group-textarea > textarea.form-control,
      .input-group:has(> textarea.form-control) > textarea.form-control {
        min-height: 65px;
        resize: vertical !important;
      }

      .textarea-detail-large {
        min-height: 140px !important;
        resize: vertical !important;
      }

      .textarea-detail-medium {
        min-height: 100px !important;
        resize: vertical !important;
      }
    `}} />
  );
}
