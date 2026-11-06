import React from 'react';
import { Link } from 'react-router-dom';

export default function Sitemap() {
  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        
        {/* ส่วนหัวหน้าจอ */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-3" style={{ width: '80px', height: '80px' }}>
            <i className="bi bi-diagram-3-fill" style={{ fontSize: '2.5rem', color: '#006664' }}></i>
          </div>
          <h2 className="fw-bold" style={{ color: '#006664' }}>แผนผังเว็บไซต์ (Sitemap)</h2>
          <p className="text-muted">
            รวบรวมสารบัญเมนูหลักของระบบรับสมัครบุคลากร มก.ฉกส. แบ่งตามกลุ่มผู้ใช้งาน
          </p>
        </div>

        <div className="row g-4">
          
          {/* ============================== */}
          {/* 1. ส่วนของผู้ใช้งานทั่วไป (Public / Guest) */}
          {/* ============================== */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm sitemap-card" style={{ borderRadius: '12px', borderTop: '4px solid #6c757d' }}>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4 text-secondary border-bottom pb-2">
                  <i className="bi bi-globe me-2"></i>สำหรับบุคคลทั่วไป
                </h6>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  <li>
                    <Link to="/" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-house-door text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">หน้าหลัก</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>หน้าแรกของระบบ</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/jobs" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-search text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">ค้นหาตำแหน่งงาน</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ดูงานที่เปิด/ปิดรับสมัคร</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-box-arrow-in-right text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">เข้าสู่ระบบ</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>สำหรับผู้สมัครและบุคลากร</div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ============================== */}
          {/* 2. ส่วนของผู้สมัครงาน (Applicant) */}
          {/* ============================== */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm sitemap-card" style={{ borderRadius: '12px', borderTop: '4px solid #0dcaf0' }}>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4 text-info text-darken border-bottom pb-2">
                  <i className="bi bi-person-badge me-2"></i>สำหรับผู้สมัครงาน
                </h6>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  <li>
                    <Link to="/my-applications" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-file-earmark-text text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">การสมัครของฉัน</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ดูประวัติและใบสมัครงาน</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-applications" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-clock-history text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">ติดตามสถานะ</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ดูผลสอบและกำหนดการ</div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ============================== */}
          {/* 3. ส่วนของคณะ/หน่วยงาน (Faculty) */}
          {/* ============================== */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm sitemap-card" style={{ borderRadius: '12px', borderTop: '4px solid #fd7e14' }}>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4 border-bottom pb-2" style={{ color: '#fd7e14' }}>
                  <i className="bi bi-building-fill me-2"></i>สำหรับคณะ / ต้นสังกัด
                </h6>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  <li>
                    <Link to="/faculty-jobs" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-card-checklist text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">งานที่เปิดรับของคณะ</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ตรวจสอบผู้สมัครงานเบื้องต้น</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/request-job" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-send-plus text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">ขอเปิดรับสมัครงาน</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ส่งคำขออัตรากำลังให้ HR</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/faculty-job-requests" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-clock text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">ติดตามคำขอ</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ดูสถานะคำขอเปิดรับสมัคร</div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ============================== */}
          {/* 4. ส่วนของงานบุคคล (HR / Admin) */}
          {/* ============================== */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm sitemap-card" style={{ borderRadius: '12px', borderTop: '4px solid #03A96B' }}>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4 border-bottom pb-2" style={{ color: '#03A96B' }}>
                  <i className="bi bi-shield-lock-fill me-2"></i>สำหรับเจ้าหน้าที่ HR
                </h6>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  <li>
                    <Link to="/manage-jobs" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-briefcase text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">จัดการประกาศงาน</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>สร้าง/แก้ไข และจัดการผู้สมัคร</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/job-requests" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-inbox text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">รายการคำขอจากคณะ</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ตรวจสอบคำขอเปิดรับสมัคร</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/manage-users" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-people text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">จัดการผู้ใช้งาน</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ดูแลสิทธิ์การเข้าถึงระบบ</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/reports" className="sitemap-link text-decoration-none text-dark d-flex align-items-start">
                      <i className="bi bi-pie-chart text-muted me-2 mt-1"></i>
                      <div>
                        <div className="fw-medium">สถิติและรายงาน</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>สรุปข้อมูลการรับสมัคร</div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
        
        <div className="text-center mt-5 mb-3">
          <Link to="/" className="btn px-5 py-2 shadow-sm text-white fw-bold" style={{ backgroundColor: '#006664', borderRadius: '8px' }}>
            <i className="bi bi-house-door-fill me-2"></i>กลับสู่หน้าหลัก
          </Link>
        </div>

      </div>
      
      {/* CSS สำหรับเอฟเฟกต์และ Layout */}
      <style dangerouslySetInnerHTML={{__html: `
        .sitemap-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sitemap-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.08)!important;
        }
        .sitemap-link {
          transition: all 0.2s ease;
          border-radius: 6px;
          padding: 6px;
          margin-left: -6px;
        }
        .sitemap-link:hover { 
          background-color: #f0fdf4;
          transform: translateX(4px);
        }
        .sitemap-link:hover .fw-medium {
          color: #03A96B;
        }
        .sitemap-link:hover i {
          color: #03A96B !important;
        }
      `}} />
    </div>
  );
}