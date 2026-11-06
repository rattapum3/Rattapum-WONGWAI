import React from 'react';
import { Link } from 'react-router-dom';

export default function StepActionFooter({
  id,
  currentStep,
  setCurrentStep,
  handleSaveDraft,
  validateCitizenAndProceed,
  handleInitiateSubmit,
  isSubmitting
}) {
  return (
    <div className="card shadow-sm border-0 p-3 mb-5" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">

        {/* ปุ่มฝั่งซ้าย: ยกเลิก / ย้อนกลับ */}
        <div className="d-flex gap-2 w-100 w-sm-auto">
          <Link to={`/jobs/${id}`} className="btn btn-outline-secondary px-3 py-2 fw-medium shadow-sm">
            <i className="bi bi-x-circle me-1"></i> ยกเลิก
          </Link>

          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-secondary px-4 py-2 fw-medium shadow-sm"
              onClick={() => {
                setCurrentStep(prev => prev - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <i className="bi bi-arrow-left me-1"></i> ย้อนกลับ
            </button>
          )}
        </div>

        {/* ปุ่มฝั่งขวา: บันทึกแบบร่าง / ถัดไป / ยืนยันการสมัคร */}
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-end">
          <button
            type="button"
            className="btn px-3 py-2 fw-medium shadow-sm text-white"
            style={{ backgroundColor: '#6bac61' }}
            onClick={handleSaveDraft}
          >
            <i className="bi bi-cloud-download me-1"></i> บันทึกแบบร่าง
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              className="btn px-4 py-2 fw-bold text-white shadow-sm"
              style={{ backgroundColor: '#03A96B' }}
              onClick={() => validateCitizenAndProceed(currentStep + 1)}
            >
              ถัดไป <i className="bi bi-arrow-right ms-1"></i>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInitiateSubmit}
              disabled={isSubmitting}
              className="btn px-5 py-2 fw-bold text-white shadow-sm"
              style={{ backgroundColor: '#03A96B' }}
            >
              {isSubmitting ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>กำลังส่ง...</>
              ) : (
                <><i className="bi bi-send-check me-2"></i>ยืนยันการสมัคร</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
