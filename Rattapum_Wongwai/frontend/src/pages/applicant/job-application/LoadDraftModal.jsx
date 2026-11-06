import React from 'react';

export default function LoadDraftModal({
  isOpen,
  onClose,
  inputCitizenId,
  setInputCitizenId,
  inputEmail,
  setInputEmail,
  handleLoadDraft,
  isLoadingDraft
}) {
  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="modal-header border-0 pb-0" style={{ backgroundColor: '#f8f9fa' }}>
            <h5 className="modal-title fw-bold text-dark mb-0">
              <i className="bi bi-person-badge-fill me-2 text-success"></i>เรียกใช้ข้อมูลแบบร่าง / ประวัติเดิม
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <p className="small text-muted mb-3">
              กรุณากรอก <strong>เลขประจำตัวประชาชน (13 หลัก)</strong> และ <strong>อีเมลที่เคยใช้อย่างเป็นทางการ</strong> เพื่อยืนยันตัวตนและดึงข้อมูลมาเติมในฟอร์มอัตโนมัติ
            </p>
            <div className="mb-3">
              <label className="form-label fw-bold text-dark">เลขประจำตัวประชาชน <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="กรอกเลขประจำตัวประชาชน 13 หลัก"
                maxLength={13}
                value={inputCitizenId}
                onChange={(e) => setInputCitizenId(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold text-dark">อีเมลที่เคยใช้อย่างเป็นทางการ <span className="text-danger">*</span></label>
              <input
                type="email"
                className="form-control form-control-lg"
                placeholder="example@email.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer border-0 pt-0 bg-light rounded-bottom">
            <button type="button" className="btn btn-secondary px-4 rounded-pill" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn text-white px-4 rounded-pill fw-bold shadow-sm"
              style={{ backgroundColor: '#03A96B' }}
              onClick={handleLoadDraft}
              disabled={isLoadingDraft}
            >
              {isLoadingDraft ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>กำลังตรวจสอบ...</>
              ) : (
                <><i className="bi bi-search me-2"></i>ตรวจสอบและเรียกใช้ข้อมูล</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
