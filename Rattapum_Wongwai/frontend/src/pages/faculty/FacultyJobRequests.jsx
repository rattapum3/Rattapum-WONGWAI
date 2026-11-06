import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FacultyJobRequests() {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้งานจาก LocalStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const facultyName = currentUser.dept || '';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/job-requests?facultyName=${encodeURIComponent(facultyName)}`);
      const data = await response.json();
      if (data.success) {
        setMyRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching job requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. ฟังก์ชันแสดง Badge สถานะ (มี 3 แบบ RequestDraft, Pending, Processed)
  const getStatusBadge = (status, reqId) => {
    if (status === "RequestDraft" || status === "Draft") {
      return (
        <Link to={`/request-job?id=${reqId}`} className="text-decoration-none">
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm" style={{ cursor: 'pointer' }}>
            <i className="bi bi-pencil-square me-1"></i>แบบร่าง
          </span>
        </Link>
      );
    }
    if (status === "Pending") {
      return (
        <Link to={`/request-job?id=${reqId}`} className="text-decoration-none">
          <span className="badge bg-secondary px-3 py-2 rounded-pill shadow-sm" style={{ cursor: 'pointer' }}>
            <i className="bi bi-clock me-1"></i>รอรับเรื่อง (ส่งแล้ว)
          </span>
        </Link>
      );
    }
    return (
      <Link to={`/request-job?id=${reqId}`} className="text-decoration-none">
        <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm" style={{ cursor: 'pointer' }}>
          <i className="bi bi-check-lg me-1"></i>รับเรื่องแล้ว
        </span>
      </Link>
    );
  };


  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>

      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="mb-1 fw-bold" style={{ color: '#006664' }}>
            <i className="bi bi-file-earmark-text me-2"></i>ติดตามสถานะคำขอ
          </h3>
          <p className="text-muted small mb-0">
            {facultyName || 'ไม่ระบุหน่วยงาน'}
          </p>
        </div>

        {/* ปรับปุ่มให้เล็กลงและไม่เต็มจอในมือถือ */}
        <Link
          to="/request-job"
          className="btn btn-sm btn-md-normal px-3 py-2 shadow-sm"
          style={{ backgroundColor: '#006664', color: 'white', fontWeight: '500', borderRadius: '8px' }}
        >
          <i className="bi bi-plus-lg me-1"></i> สร้างคำขอใหม่
        </Link>
      </div>

      <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>

        {/* ======================================================== */}
        {/* 1. มุมมองแบบตาราง (Desktop) */}
        {/* ======================================================== */}
        <div className="card-body p-0 d-none d-lg-block">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#006664', color: 'white' }}>
                <tr>
                  <th className="py-3 px-3 text-center fw-medium" style={{ width: '80px' }}>ลำดับ</th>
                  <th className="py-3 px-4 fw-medium">วันที่ส่ง</th>
                  <th className="py-3 px-4 fw-medium">ตำแหน่งที่ต้องการ</th>
                  <th className="py-3 px-4 text-center fw-medium">จำนวน</th>
                  <th className="py-3 px-4 text-center fw-medium">สถานะ</th>
                  <th className="py-3 px-4 text-center fw-medium" style={{ width: '160px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : myRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">ไม่พบข้อมูลคำขอ</td>
                  </tr>
                ) : myRequests.map((req, index) => (
                  <tr key={index}>
                    <td className="py-3 px-3 text-center fw-bold text-muted">{index + 1}</td>
                    <td className="py-3 px-4 text-nowrap">{req.requestDate}</td>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-dark">{req.jobTitle}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{req.department}</div>
                      {req.details && <div className="text-secondary small mt-1" style={{ fontSize: '0.75rem' }}><i className="bi bi-info-circle me-1"></i>{req.details}</div>}
                    </td>
                    <td className="py-3 px-4 text-center fw-bold">{req.amount}</td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(req.status, req.id)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(req.status === "RequestDraft" || req.status === "Draft") ? (
                        <Link
                          to={`/request-job?id=${req.id}`}
                          className="btn btn-sm btn-outline-primary px-3 shadow-sm fw-medium d-inline-flex align-items-center"
                          style={{ borderRadius: '6px' }}
                          title="แก้ไขแบบร่าง"
                        >
                          <i className="bi bi-pencil-square me-1"></i>แก้ไข
                        </Link>
                      ) : (
                        <Link
                          to={`/request-job?id=${req.id}`}
                          className="btn btn-sm btn-outline-secondary px-3 shadow-sm fw-medium d-inline-flex align-items-center"
                          style={{ borderRadius: '6px' }}
                          title="ดูรายละเอียดที่เราส่งให้ทางหน่วยมนุษย์และสวัสดิการ"
                        >
                          <i className="bi bi-eye me-1"></i>ดูรายละเอียด
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. มุมมองแบบการ์ด (Mobile) */}
        {/* ======================================================== */}
        <div className="card-body bg-light p-3 d-lg-none">
          <div className="d-flex flex-column gap-3">
            {loading ? (
              <div className="text-center py-4 text-muted">กำลังโหลดข้อมูล...</div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-4 text-muted">ไม่พบข้อมูลคำขอ</div>
            ) : myRequests.map((req, index) => (
              <div key={index} className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between mb-2 align-items-center">
                    <span className="fw-bold text-secondary small bg-light px-2 py-1 rounded border">ลำดับที่ {index + 1}</span>
                    {getStatusBadge(req.status, req.id)}
                  </div>
                  <h6 className="fw-bold text-dark mb-1">{req.jobTitle}</h6>
                  <p className="text-muted small mb-2">{req.department}</p>
                  {req.additionalSkills && (
                    <div className="small text-muted mb-2 p-2 bg-light rounded border" style={{ fontSize: '0.8rem' }}>
                      <span className="badge bg-light text-dark border me-1"><i className="bi bi-star-fill text-warning me-1"></i>ทักษะเฉพาะ:</span>
                      {req.additionalSkills}
                    </div>
                  )}

                  <div className="d-flex justify-content-between border-top pt-2 mt-2">
                    <div className="small">
                      <span className="text-muted">จำนวน:</span> <span className="fw-bold">{req.amount} อัตรา</span>
                    </div>
                    <div className="small text-muted">
                      {req.requestDate}
                    </div>
                  </div>

                  <div className="mt-3 text-end">
                    {(req.status === "RequestDraft" || req.status === "Draft") ? (
                      <Link
                        to={`/request-job?id=${req.id}`}
                        className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-medium d-inline-flex align-items-center"
                      >
                        <i className="bi bi-pencil-square me-1"></i>แก้ไข
                      </Link>
                    ) : (
                      <Link
                        to={`/request-job?id=${req.id}`}
                        className="btn btn-sm btn-outline-secondary px-3 rounded-pill fw-medium d-inline-flex align-items-center"
                      >
                        <i className="bi bi-eye me-1"></i>ดูรายละเอียด
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer ของ Card */}
        <div className="card-footer bg-white py-3 border-top text-muted small text-center text-md-start">
          <i className="bi bi-info-circle me-1"></i> แสดงรายการคำขอทั้งหมด เรียงตามวันที่ส่งคำขอล่าสุด
        </div>

      </div>
    </div>
  );
}