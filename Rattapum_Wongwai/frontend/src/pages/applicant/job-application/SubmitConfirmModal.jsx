import React from 'react';

export default function SubmitConfirmModal({
  isOpen,
  onClose,
  isSubmitting,
  jobTitle,
  prefixVal,
  firstName,
  lastName,
  citizenId,
  email,
  mobilePhone,
  uploadedFilesCount,
  handleExecuteSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="modal-header text-white px-4 py-3" style={{ backgroundColor: '#03A96B' }}>
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
              <i className="bi bi-shield-check fs-4"></i>
              ยืนยันการส่งใบสมัครงาน
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="alert border-0 shadow-sm mb-4" style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', color: '#92400e' }}>
              <div className="d-flex gap-3 align-items-center">
                <i className="bi bi-exclamation-triangle-fill fs-3 text-warning"></i>
                <div>
                  <div className="fw-bold mb-1" style={{ fontSize: '15px' }}>คุณแน่ใจหรือไม่ว่าต้องการยืนยันการส่งใบสมัครนี้?</div>
                  <div className="small">
                    กรุณาตรวจสอบความถูกต้องของข้อมูลและเอกสารทั้งหมดอีกครั้ง <strong>เมื่อกดยืนยันแล้วระบบจะทำการส่งใบสมัครและจะไม่สามารถแก้ไขข้อมูลได้ในภายหลัง</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 bg-light p-3 mb-2" style={{ borderRadius: '12px' }}>
              <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">
                <i className="bi bi-person-lines-fill me-2 text-success"></i>สรุปข้อมูลผู้สมัคร
              </h6>
              <div className="row g-2 small">
                <div className="col-sm-4 text-muted">ตำแหน่งที่สมัคร:</div>
                <div className="col-sm-8 fw-bold text-dark">{jobTitle}</div>

                <div className="col-sm-4 text-muted">ชื่อ - นามสกุล:</div>
                <div className="col-sm-8 fw-semibold text-dark">
                  {prefixVal} {firstName} {lastName}
                </div>

                <div className="col-sm-4 text-muted">เลขประจำตัวประชาชน:</div>
                <div className="col-sm-8 fw-semibold text-dark">{citizenId}</div>

                <div className="col-sm-4 text-muted">อีเมล:</div>
                <div className="col-sm-8 fw-semibold text-dark">{email}</div>

                <div className="col-sm-4 text-muted">เบอร์โทรศัพท์มือถือ:</div>
                <div className="col-sm-8 fw-semibold text-dark">{mobilePhone || "-"}</div>

                <div className="col-sm-4 text-muted">จำนวนเอกสารแนบ:</div>
                <div className="col-sm-8 fw-semibold text-success">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  แนบไฟล์แล้ว {uploadedFilesCount} ฉบับ
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light px-4 py-3 border-0 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-medium"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <i className="bi bi-arrow-left me-1"></i> กลับไปตรวจสอบข้อมูลอีกครั้ง
            </button>
            <button
              type="button"
              className="btn text-white fw-bold px-4 py-2 rounded-pill shadow-sm"
              style={{ backgroundColor: '#03A96B' }}
              onClick={handleExecuteSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>กำลังส่งใบสมัคร...</>
              ) : (
                <><i className="bi bi-check2-circle me-1"></i> แน่ใจ ยืนยันการส่งใบสมัคร</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
