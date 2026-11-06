import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // ดึง citizenId จาก LocalStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const citizenId = currentUser.citizenId;
    const applicantId = currentUser.id;
    const email = currentUser.email;

    if (!citizenId && !applicantId) {
      alert("กรุณาเข้าสู่ระบบก่อนดูประวัติการสมัคร");
      setIsLoading(false);
      return;
    }

    const queryParams = new URLSearchParams();
    if (applicantId) queryParams.append('applicantId', applicantId);
    if (email) queryParams.append('email', email);
    if (citizenId) queryParams.append('citizenId', citizenId);

    fetch(`http://localhost:3000/api/applications/my-applications?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApplications(data.data);
        }
      })
      .catch(err => console.error("Error fetching applications:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // ฟังก์ชันช่วยกำหนดสีของ Badge สถานะ
  const getBadgeStyle = (colorCode) => {
    switch(colorCode) {
      case 'success': return 'bg-success text-white';
      case 'warning': return 'bg-warning text-dark';
      case 'danger': return 'bg-danger text-white';
      case 'info': return 'bg-info text-dark';
      default: return 'bg-secondary text-white';
    }
  };



  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        
        {/* ส่วนหัวหน้าจอ */}
        <div className="mb-4 d-flex align-items-center gap-3">
          <Link to="/" className="btn btn-outline-secondary btn-sm rounded-circle px-2 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
            <i className="bi bi-house-door-fill fs-5"></i>
          </Link>
          <div>
            <h2 className="mb-1 fw-bold" style={{ color: '#006664' }}>
              <i className="bi bi-folder-fill me-2"></i>สถานะใบสมัครของฉัน
            </h2>
            <p className="text-muted fs-6 mb-0">รายการตำแหน่งงานที่คุณเคยยื่นสมัครทั้งหมด</p>
          </div>
        </div>

        {/* รายการใบสมัคร (แสดงเป็นการ์ดเรียงต่อกัน) */}
        <div className="row g-4">
          {isLoading ? (
            <div className="text-center py-5">กำลังโหลดข้อมูล...</div>
          ) : applications.length > 0 ? (
            applications.map((app, index) => (
              <div className="col-12" key={index}>
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: `6px solid var(--bs-${app.statusColor})` }}>
                  <div className="card-body p-4">
                    <div className="row align-items-center">
                      
                      {/* ข้อมูลตำแหน่ง (ฝั่งซ้าย) */}
                      <div className="col-md-7 mb-4 mb-md-0">
                        <div className="d-flex align-items-center mb-2">
                          <span className="badge bg-light text-secondary border me-2">ลำดับ: {index + 1}</span>
                          <span className="text-muted small"><i className="bi bi-calendar3 me-1"></i>วันที่สมัคร: {app.appliedDate} {app.appliedTime !== '-' ? `เวลา ${app.appliedTime}` : ''}</span>
                        </div>
                        <h4 className="fw-bold text-dark mb-2">
                          {app.jobTitle}
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 ms-2 fs-6 fw-normal">
                            รอบที่ {app.roundNo || 1}
                          </span>
                        </h4>
                        <div className="mb-2">
                          <span className={`badge ${getBadgeStyle(app.statusColor)} px-3 py-2 rounded-pill shadow-sm`}>
                            สถานะ: {app.currentStatus}
                          </span>
                        </div>
                        <div className="text-muted mb-2"><i className="bi bi-building me-2"></i>{app.department}</div>
                      </div>

                      {/* ปุ่มจัดการ (ฝั่งขวา) */}
                      <div className="col-md-5 d-flex flex-column align-items-md-end justify-content-center gap-2">
                        
                        {/* 1. ปุ่มดูสถานะ (ไปหน้า Progress Bar) */}
                        <Link 
                          to={`/my-status/${app.rawId}`} 
                          className="btn fw-bold shadow-sm px-4 w-100 text-white d-flex align-items-center justify-content-center" 
                          style={{ backgroundColor: '#03A96B', maxWidth: '220px', borderRadius: '8px' }}
                        >
                          <i className="bi bi-eye-fill me-2"></i> ดูสถานะการสอบ
                        </Link>

                        {/* 2. ปุ่มบันทึกเป็น PDF */}
                        <a 
                          href={`http://localhost:3000/api/export/application/${app.rawId || app.id}/pdf`}
                          download={`ใบสมัคร_${app.jobTitle || 'ตำแหน่ง'}_${app.rawId || app.id}.pdf`}
                          className="btn btn-outline-danger fw-bold shadow-sm px-4 w-100 d-flex align-items-center justify-content-center bg-white" 
                          style={{ maxWidth: '220px', borderRadius: '8px' }}
                          title="ดาวน์โหลดใบสมัครเป็นไฟล์ PDF"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="bi bi-file-earmark-pdf-fill me-2"></i> บันทึกเป็น PDF
                        </a>

                      </div>

                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5 bg-white shadow-sm rounded-4">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
              <h4 className="text-muted mt-3">ยังไม่มีประวัติการสมัครงาน</h4>
              <Link to="/jobs" className="btn btn-outline-success mt-3 px-4 rounded-pill">ค้นหาตำแหน่งงานที่เปิดรับ</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}