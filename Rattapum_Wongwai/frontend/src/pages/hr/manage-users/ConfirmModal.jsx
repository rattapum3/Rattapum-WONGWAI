import React from 'react';

export default function ConfirmModal({ modalState, onClose }) {
  if (!modalState || !modalState.show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="modal-header bg-light border-0 py-3">
            <h5 className="modal-title fw-bold text-dark">
              <i className="bi bi-question-circle-fill text-primary me-2"></i>
              {modalState.title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body py-4 px-4 text-secondary" style={{ whiteSpace: 'pre-line' }}>
            {modalState.message}
          </div>
          <div className="modal-footer border-0 bg-light py-3">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 fw-medium"
              style={{ borderRadius: '8px' }}
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className={`btn btn-${modalState.confirmVariant || 'primary'} px-4 fw-bold shadow-sm text-white`}
              style={{ borderRadius: '8px' }}
              onClick={modalState.onConfirm}
            >
              {modalState.confirmText || 'ยืนยัน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
