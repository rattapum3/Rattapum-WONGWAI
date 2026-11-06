import React from 'react';
import { Link } from 'react-router-dom';

export default function AnnouncementDocSection({
  openAccordion,
  toggleAccordion,
  handleGenerateWord,
  isGeneratingWord,
  handleGeneratePDF,
  isGeneratingPdf,
  existingAnnouncementFile,
  showNotification,
  setUploadedFile,
  backUrl,
  isSubmitting,
  handleSaveJobPosting,
  isDraftSaved = false
}) {
  return (
    <div className="accordion-item border">
      <h2 className="accordion-header">
        <button
          className={`accordion-button fw-bold ${openAccordion === 5 ? 'text-success' : 'collapsed'}`}
          type="button"
          onClick={() => toggleAccordion(5)}
        >
          <i className="bi bi-file-earmark-pdf-fill me-2" style={{ color: '#03A96B' }}></i>
          5. การออกเอกสารประกาศ / แนบไฟล์ทางการ และเผยแพร่
        </button>
      </h2>
      <div className={`accordion-collapse collapse ${openAccordion === 5 ? 'show' : ''}`}>
        <div className="accordion-body bg-white pb-4">

          {/* ส่วนการสร้างเอกสารและดาวน์โหลด Template */}
          <div className="p-3 bg-light rounded border mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-dark mb-0">
                <i className="bi bi-printer me-2 text-primary"></i>สร้างร่างประกาศและตรวจสอบความถูกต้อง
              </h6>
              {isDraftSaved ? (
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                  <i className="bi bi-check-circle-fill me-1"></i>บันทึกแบบร่างแล้ว
                </span>
              ) : (
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>ยังไม่ได้บันทึกแบบร่าง
                </span>
              )}
            </div>
            <p className="text-muted small mb-3">
              คุณสามารถสร้างเอกสารประกาศฉบับร่างเป็นไฟล์ Word (.docx) เพื่อนำไปจัดตกแต่ง ปรับฟอนต์ หรือสร้างเป็น PDF สำหรับตรวจทานก่อนนำไปให้ผู้บริหารลงนาม
            </p>

            {!isDraftSaved && (
              <div className="alert alert-warning d-flex align-items-center py-2 px-3 mb-3 small" style={{ borderRadius: '8px' }}>
                <i className="bi bi-exclamation-triangle-fill me-2 fs-6 text-warning flex-shrink-0"></i>
                <div>
                  <strong>ยังไม่ได้บันทึกแบบร่าง:</strong> กรุณากดปุ่ม <strong>"บันทึกแบบร่าง"</strong> ด้านล่างก่อน จึงจะสามารถดาวน์โหลดเอกสารหรือเผยแพร่ประกาศได้
                </div>
              </div>
            )}
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={handleGenerateWord}
                disabled={isGeneratingWord}
                style={{ borderRadius: '8px' }}
              >
                {isGeneratingWord ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    กำลังสร้างไฟล์ Word...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-word-fill me-2 fs-5 text-primary"></i>
                    ดาวน์โหลดร่างประกาศ (.docx)
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-danger d-flex align-items-center"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPdf}
                style={{ borderRadius: '8px' }}
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    กำลังสร้างไฟล์ PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf-fill me-2 fs-5 text-danger"></i>
                    ดาวน์โหลดร่างประกาศ (.pdf)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* แสดงไฟล์เดิมถ้ามี (เฉพาะโหมดแก้ไข) */}
          {existingAnnouncementFile && (
            <div className="alert alert-info d-flex align-items-center justify-content-between mb-4" style={{ borderRadius: '10px' }}>
              <div>
                <i className="bi bi-file-earmark-text-fill me-2 fs-5"></i>
                <strong>ไฟล์ประกาศทางการปัจจุบัน:</strong> {existingAnnouncementFile}
              </div>
              <a
                href={`http://localhost:3000/uploads/announcements/${existingAnnouncementFile}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-primary"
              >
                <i className="bi bi-box-arrow-up-right me-1"></i>เปิดดูไฟล์เดิม
              </a>
            </div>
          )}

          {/* อัปโหลดไฟล์ประกาศที่ลงนามแล้ว */}
          <div className="mb-4">
            <label className="form-label fw-bold text-dark">
              แนบไฟล์ประกาศรับสมัครงานฉบับทางการ (PDF ที่ลงนามแล้ว)
            </label>
            <input
              type="file"
              className="form-control"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                    showNotification('กรุณาแนบไฟล์ประเภท PDF เท่านั้น', 'danger');
                    e.target.value = '';
                    return;
                  }
                  if (file.size > 20 * 1024 * 1024) {
                    showNotification('ขนาดไฟล์ต้องไม่เกิน 20 MB', 'danger');
                    e.target.value = '';
                    return;
                  }
                  setUploadedFile(file);
                }
              }}
            />
            <div className="form-text text-muted">
              แนบไฟล์ PDF ที่ผ่านการลงนามเรียบร้อยแล้ว เพื่อให้ผู้สมัครสามารถดาวน์โหลดได้จากหน้าเว็บไซต์
            </div>
          </div>

          {/* ปุ่มบันทึกและเผยแพร่ */}
          <div className="d-flex flex-wrap justify-content-between align-items-center pt-3 border-top gap-3">
            <Link to={backUrl} className="btn btn-outline-secondary px-4 py-2" style={{ borderRadius: '8px' }}>
              <i className="bi bi-arrow-left me-1"></i>ย้อนกลับ
            </Link>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-success px-4 py-2 fw-medium shadow-sm"
                disabled={isSubmitting}
                onClick={() => handleSaveJobPosting('HR_Draft')}
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-save me-1"></i>บันทึกแบบร่าง
              </button>
              <button
                type="button"
                className={`btn text-white px-4 py-2 fw-bold shadow-sm d-flex align-items-center ${!isDraftSaved ? 'opacity-75' : ''}`}
                style={{ backgroundColor: '#006664', borderRadius: '8px' }}
                disabled={isSubmitting}
                onClick={() => handleSaveJobPosting('Processed')}
                title={!isDraftSaved ? 'กรุณากดบันทึกแบบร่างก่อนทำการเผยแพร่ประกาศ' : 'เผยแพร่ประกาศรับสมัครงานทันที'}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill me-2"></i>เผยแพร่ประกาศทันที
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
