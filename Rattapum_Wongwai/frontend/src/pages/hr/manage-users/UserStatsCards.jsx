import React from 'react';

export default function UserStatsCards({ totalCount, activeCount, suspendedCount }) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-4">
        <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '5px solid #006664' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted small fw-medium">ผู้ใช้งานทั้งหมด</span>
              <h3 className="fw-bold mb-0 text-dark mt-1">{totalCount} <span className="fs-6 fw-normal text-muted">บัญชี</span></h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#e6f3f2', color: '#006664', width: '50px', height: '50px' }}>
              <i className="bi bi-person-badge fs-4"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '5px solid #03A96B' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted small fw-medium">สถานะปกติ (ใช้งาน)</span>
              <h3 className="fw-bold mb-0 text-success mt-1">{activeCount} <span className="fs-6 fw-normal text-muted">บัญชี</span></h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#e8f8f2', color: '#03A96B', width: '50px', height: '50px' }}>
              <i className="bi bi-check-circle-fill fs-4"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: '12px', borderLeft: '5px solid #f39c12' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted small fw-medium">ระงับชั่วคราว (พักใช้งาน)</span>
              <h3 className="fw-bold mb-0 text-warning mt-1">{suspendedCount} <span className="fs-6 fw-normal text-muted">บัญชี</span></h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fef5e7', color: '#f39c12', width: '50px', height: '50px' }}>
              <i className="bi bi-pause-circle-fill fs-4"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
