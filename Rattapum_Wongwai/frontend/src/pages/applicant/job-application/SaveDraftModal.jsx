import React from 'react';

export default function SaveDraftModal({
  isOpen,
  onClose,
  onConfirm,
  saveStatus = 'confirm',
  statusMessage = '',
  warningType = null,
  jobTitle = '',
  prefixVal = '',
  firstName = '',
  lastName = '',
  citizenId = '',
  email = '',
  onGoToStep1 = null
}) {
  if (!isOpen) return null;

  const fullName = [prefixVal, firstName, lastName].filter(Boolean).join(' ');
  const isSaving = saveStatus === 'saving';
  const cidStr = String(citizenId || '').trim();
  const emailStr = String(email || '').trim();
  const isCidComplete = cidStr.length === 13 && /^\d{13}$/.test(cidStr);
  const isEmailComplete = emailStr.length > 0 && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailStr);

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        zIndex: 1060,
        backdropFilter: 'blur(2px)'
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div
          className="modal-content border-0 shadow-lg"
          style={{
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            className="modal-header text-white px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, #03A96B 0%, #028a57 100%)'
            }}
          >
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0 fs-5">
              <i className="bi bi-floppy2-fill"></i>
              บันทึกแบบร่างข้อมูลการสมัคร
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Mode 1: Confirm / Saving */}
            {(saveStatus === 'confirm' || saveStatus === 'saving') && (
              <div>
                <div className="text-center mb-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle shadow-sm"
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: '#e8f5e9',
                      color: '#03A96B'
                    }}
                  >
                    <i className="bi bi-cloud-arrow-up fs-2"></i>
                  </div>
                  <h5 className="fw-bold text-dark mt-3 mb-1">ยืนยันการบันทึกแบบร่าง</h5>
                  <p className="text-muted small mb-0">
                    คุณต้องการบันทึกข้อมูลการสมัครนี้ไว้เป็นแบบร่างใช่หรือไม่?
                  </p>
                </div>

                {/* Summary Card */}
                <div className="card border-0 bg-light p-3 mb-3 shadow-none" style={{ borderRadius: '12px' }}>
                  <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                    <i className="bi bi-file-earmark-person-fill text-success"></i>
                    <span className="fw-bold small text-dark">สรุปข้อมูลที่จะบันทึก</span>
                  </div>
                  <div className="row g-2 small">
                    <div className="col-4 text-muted">ตำแหน่งที่สมัคร:</div>
                    <div className="col-8 fw-semibold text-dark text-truncate" title={jobTitle}>
                      {jobTitle || "-"}
                    </div>

                    <div className="col-4 text-muted">ผู้สมัคร:</div>
                    <div className="col-8 fw-semibold text-dark">
                      {fullName || <span className="text-muted fst-italic">ยังไม่ได้ระบุชื่อ-นามสกุล</span>}
                    </div>

                    <div className="col-4 text-muted">เลขบัตรประชาชน:</div>
                    <div className="col-8 fw-bold text-primary">
                      {citizenId || <span className="text-danger">ยังไม่ได้ระบุ</span>}
                    </div>

                    <div className="col-4 text-muted">อีเมล:</div>
                    <div className="col-8 fw-semibold text-dark">
                      {email || <span className="text-muted fst-italic">ยังไม่ได้ระบุ</span>}
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div
                  className="alert border-0 py-2 px-3 small d-flex align-items-start gap-2 mb-0"
                  style={{ backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '10px' }}
                >
                  <i className="bi bi-info-circle-fill text-success fs-5 mt-n1 flex-shrink-0"></i>
                  <div>
                    ระบบจะบันทึกข้อมูลทุกส่วนที่คุณกรอกไว้ ท่านสามารถกดปุ่ม <strong>"เรียกใช้ข้อมูลแบบร่าง"</strong> ที่หน้าแรกของการสมัคร เพื่อดึงข้อมูลเดิมกลับมาทำต่อได้ตลอดเวลา
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Success */}
            {saveStatus === 'success' && (
              <div className="text-center py-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                  style={{
                    width: '72px',
                    height: '72px',
                    backgroundColor: '#d1fae5',
                    color: '#059669'
                  }}
                >
                  <i className="bi bi-check-lg" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h5 className="fw-bold text-success mb-2">บันทึกแบบร่างเรียบร้อยแล้ว!</h5>
                <p className="text-secondary small mb-3 px-2">
                  {statusMessage || "ข้อมูลการสมัครของคุณถูกบันทึกไว้ในระบบเรียบร้อยแล้ว ท่านสามารถกลับมากรอกข้อมูลต่อได้ทุกเมื่อ"}
                </p>
                {citizenId && (
                  <div
                    className="card border-0 bg-light p-3 mx-1 text-start small mb-1"
                    style={{ borderRadius: '10px' }}
                  >
                    <div className="d-flex align-items-center gap-2 text-muted mb-1">
                      <i className="bi bi-key-fill text-warning"></i>
                      <span>ข้อมูลสำหรับเรียกดูแบบร่างในภายหลัง:</span>
                    </div>
                    <div className="fw-bold text-dark ms-3">
                      เลขประจำตัวประชาชน: <span className="text-primary">{citizenId}</span>
                    </div>
                    {email && (
                      <div className="fw-semibold text-dark ms-3 mt-1">
                        อีเมล: <span>{email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: Error */}
            {saveStatus === 'error' && (
              <div className="text-center py-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                  style={{
                    width: '72px',
                    height: '72px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626'
                  }}
                >
                  <i className="bi bi-x-lg" style={{ fontSize: '2.2rem' }}></i>
                </div>
                <h5 className="fw-bold text-danger mb-2">ไม่สามารถบันทึกแบบร่างได้</h5>
                <p className="text-secondary small mb-1 px-2">
                  {statusMessage || "เกิดข้อผิดพลาดในการบันทึกแบบร่าง กรุณาลองใหม่อีกครั้ง"}
                </p>
              </div>
            )}

            {/* Mode 4: Warning */}
            {saveStatus === 'warning' && (
              <div className="text-center py-2">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm"
                  style={{
                    width: '68px',
                    height: '68px',
                    backgroundColor: '#fef3c7',
                    color: '#d97706'
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill fs-2"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2 px-1">
                  {warningType === 'credentials'
                    ? 'ต้องกรอกบัตรประชาชนและอีเมลให้ครบก่อน จึงบันทึกแบบร่างได้'
                    : 'กรุณาตรวจสอบข้อมูล'}
                </h5>
                <p className="text-secondary small mb-3 px-2">
                  {warningType === 'credentials'
                    ? 'ระบบจำเป็นต้องใช้เลขประจำตัวประชาชน (13 หลัก) และอีเมล เพื่อใช้ยืนยันตัวตนในการดึงข้อมูลแบบร่างกลับมาใช้งาน'
                    : statusMessage}
                </p>

                {warningType === 'credentials' && (
                  <div
                    className="card border-0 bg-light p-3 mx-1 text-start small mb-1 shadow-none"
                    style={{ borderRadius: '12px' }}
                  >
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <span className="text-muted">
                        <i className="bi bi-person-badge me-1"></i>เลขประจำตัวประชาชน:
                      </span>
                      <span>
                        {isCidComplete ? (
                          <span className="text-success fw-bold">
                            <i className="bi bi-check-circle-fill me-1"></i>ครบถ้วน ({cidStr})
                          </span>
                        ) : (
                          <span className="text-danger fw-bold">
                            <i className="bi bi-x-circle-fill me-1"></i>
                            {cidStr ? `ไม่ครบ 13 หลัก (${cidStr.length}/13)` : 'ยังไม่ได้ระบุ'}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2">
                      <span className="text-muted">
                        <i className="bi bi-envelope me-1"></i>อีเมล:
                      </span>
                      <span>
                        {isEmailComplete ? (
                          <span className="text-success fw-bold">
                            <i className="bi bi-check-circle-fill me-1"></i>ครบถ้วน ({emailStr})
                          </span>
                        ) : (
                          <span className="text-danger fw-bold">
                            <i className="bi bi-x-circle-fill me-1"></i>
                            {emailStr ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'ยังไม่ได้ระบุ'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light px-4 py-3 border-0 d-flex justify-content-end gap-2">
            {(saveStatus === 'confirm' || saveStatus === 'saving') && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-medium"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="btn text-white px-4 py-2 rounded-pill fw-bold shadow-sm"
                  style={{ backgroundColor: '#03A96B' }}
                  onClick={onConfirm}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      กำลังบันทึกแบบร่าง...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up-fill me-1"></i>
                      ยืนยันบันทึกแบบร่าง
                    </>
                  )}
                </button>
              </>
            )}

            {saveStatus === 'success' && (
              <button
                type="button"
                className="btn text-white px-4 py-2 rounded-pill fw-bold shadow-sm w-100"
                style={{ backgroundColor: '#03A96B' }}
                onClick={onClose}
              >
                <i className="bi bi-check2 me-1"></i> เข้าใจแล้ว / ปิด
              </button>
            )}

            {saveStatus === 'error' && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-medium"
                  onClick={onClose}
                >
                  ปิด
                </button>
                <button
                  type="button"
                  className="btn text-white px-4 py-2 rounded-pill fw-bold shadow-sm"
                  style={{ backgroundColor: '#03A96B' }}
                  onClick={onConfirm}
                >
                  <i className="bi bi-arrow-repeat me-1"></i> ลองใหม่อีกครั้ง
                </button>
              </>
            )}

            {saveStatus === 'warning' && (
              <button
                type="button"
                className="btn text-white px-4 py-2 rounded-pill fw-bold shadow-sm w-100"
                style={{ backgroundColor: '#03A96B' }}
                onClick={onGoToStep1 || onClose}
              >
                {warningType === 'credentials' ? (
                  <><i className="bi bi-pencil-square me-1"></i> รับทราบและกลับไปกรอกข้อมูล</>
                ) : (
                  'เข้าใจแล้ว'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
