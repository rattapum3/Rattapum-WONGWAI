import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ReportList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้งานปัจจุบัน
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const isFacultyRole = currentUser.role === 'คณะ/หน่วยงาน';
  const userFaculty = (currentUser.dept || '').trim();

  useEffect(() => {
    fetchReportList();
    if (!isFacultyRole) {
      fetchFaculties();
    }
  }, []);

  const fetchFaculties = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/faculties');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFaculties(data.data);
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const fetchReportList = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:3000/api/reports/list';
      if (isFacultyRole && userFaculty) {
        url += `?facultyName=${encodeURIComponent(userFaculty)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching report list:', error);
    } finally {
      setLoading(false);
    }
  };

  // สร้างรายการคณะใน Dropdown แบบสะอาด ไม่มีตัวเลขต่อท้าย
  const availableFaculties = faculties.length > 0
    ? faculties.map(f => (f.Faculty_name || f.name || '').trim()).filter(Boolean)
    : Array.from(new Set(jobs.map(j => (j.facultyName || '').trim()).filter(Boolean)));

  // ระบบค้นหาและกรองข้อมูล
  const filteredJobs = jobs.filter(job => {
    const matchSearch = !searchTerm.trim() ||
      (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase().trim())) || 
      (job.department && job.department.toLowerCase().includes(searchTerm.toLowerCase().trim()));
    
    // สำหรับ Role คณะ: ให้ล็อคแสดงเฉพาะคณะของตนเองเสมอ
    // สำหรับ Role HR: กรองตาม Dropdown ที่เลือก
    const matchFaculty = isFacultyRole
      ? (!userFaculty || (job.facultyName && job.facultyName.trim() === userFaculty) || (job.department && job.department.includes(userFaculty)))
      : (filterFaculty === "all" || 
         (job.facultyName && job.facultyName.trim() === filterFaculty.trim()) ||
         (job.department && job.department.includes(filterFaculty.trim())));

    return matchSearch && matchFaculty;
  });

  // ตัวเลขสรุปสถิติภาพรวมด้านบน
  const totalPositions = filteredJobs.length;
  const totalOpen = filteredJobs.filter(j => j.status === 'กำลังเปิดรับสมัคร').length;
  const totalClosed = filteredJobs.filter(j => j.status === 'ปิดรับสมัครแล้ว').length;
  const totalApplicants = filteredJobs.reduce((sum, j) => sum + (j.applicants || 0), 0);

  const getStatusBadge = (status) => {
    if (status === 'กำลังเปิดรับสมัคร') {
      return <span className="badge bg-success rounded-pill fw-normal px-3 py-2 shadow-sm"><i className="bi bi-check-circle me-1"></i>{status}</span>;
    }
    return <span className="badge bg-secondary rounded-pill fw-normal px-3 py-2 shadow-sm"><i className="bi bi-lock me-1"></i>{status}</span>;
  };

  return (
    <div className="container-fluid py-4 py-md-5" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>
        
        {/* ส่วนหัวหน้าจอ */}
        <div className="mb-4 d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div className="d-flex align-items-start gap-3">
            <Link to={isFacultyRole ? "/faculty-jobs" : "/manage-jobs"} className="btn btn-outline-secondary btn-sm rounded-circle px-2 mt-1 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
              <i className="bi bi-arrow-left fs-5"></i>
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2 className="fw-bold mb-0" style={{ color: '#006664' }}>
                  <i className="bi bi-folder2-open me-2"></i>คลังรายงานสรุปผลการรับสมัคร
                </h2>
                {isFacultyRole && userFaculty && (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fs-6">
                    <i className="bi bi-building me-1"></i>{userFaculty}
                  </span>
                )}
              </div>
              <p className="text-muted mb-0">
                {isFacultyRole 
                  ? `แสดงสถิติรายงานสรุปผลการรับสมัครเฉพาะของ ${userFaculty}`
                  : 'ค้นหาและเลือกตำแหน่งที่ต้องการดูสถิติการรับสมัครย้อนหลังหรือปัจจุบัน'}
              </p>
            </div>
          </div>

          {!isFacultyRole && (
            <Link to="/report/all" className="btn btn-lg text-white fw-bold shadow-sm text-nowrap" style={{ backgroundColor: '#03A96B', borderRadius: '8px' }}>
              <i className="bi bi-pie-chart-fill me-2"></i>ดูภาพรวมทุกตำแหน่ง
            </Link>
          )}
        </div>

        {/* สรุปตัวเลขสถิติภาพรวมด้านบน */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm p-3 rounded-4 bg-white h-100 border-start border-4 border-primary">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-medium">ตำแหน่งทั้งหมด</span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">{totalPositions}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                  <i className="bi bi-briefcase fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm p-3 rounded-4 bg-white h-100 border-start border-4 border-success">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-medium">กำลังเปิดรับสมัคร</span>
                  <h3 className="fw-bold text-success mb-0 mt-1">{totalOpen}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                  <i className="bi bi-check-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm p-3 rounded-4 bg-white h-100 border-start border-4 border-secondary">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-medium">ปิดรับสมัครแล้ว</span>
                  <h3 className="fw-bold text-secondary mb-0 mt-1">{totalClosed}</h3>
                </div>
                <div className="bg-secondary bg-opacity-10 p-2 rounded-circle text-secondary">
                  <i className="bi bi-lock fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm p-3 rounded-4 bg-white h-100 border-start border-4 border-info">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted small fw-medium">ผู้สมัครรวมทั้งหมด</span>
                  <h3 className="fw-bold text-info mb-0 mt-1">{totalApplicants} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                </div>
                <div className="bg-info bg-opacity-10 p-2 rounded-circle text-info">
                  <i className="bi bi-people-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* เครื่องมือค้นหาและตัวกรอง */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderTop: '4px solid #03A96B', borderRadius: '12px' }}>
          <div className="card-body p-3 p-md-4">
            <div className="row g-3 align-items-center">
              
              {/* ช่องค้นหา */}
              <div className={isFacultyRole ? "col-12" : "col-md-7"}>
                <div className="input-group shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                  <input 
                    type="text" 
                    className="form-control form-control-lg bg-light border-0 ps-0 shadow-none" 
                    placeholder="ค้นหาชื่อตำแหน่งรับสมัคร หรือชื่อหน่วยงาน..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="btn bg-light border-0 text-muted" onClick={() => setSearchTerm('')}>
                      <i className="bi bi-x-circle"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Dropdown กรองคณะ (แสดงเฉพาะฝั่ง HR/Admin) */}
              {!isFacultyRole && (
                <div className="col-md-5">
                  <select 
                    className="form-select form-select-lg bg-light border-0 shadow-sm text-dark fw-medium" 
                    value={filterFaculty} 
                    onChange={(e) => setFilterFaculty(e.target.value)}
                  >
                    <option value="all">ทุกคณะ / หน่วยงาน</option>
                    {availableFaculties.map((name, i) => (
                      <option key={i} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 1. มุมมองแบบตาราง (Table View) - สำหรับจอคอม */}
        {/* ======================================================== */}
        <div className="card border-0 shadow-sm d-none d-lg-block" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4 border-0 text-center" style={{ width: '70px' }}>ลำดับ</th>
                  <th className="py-3 px-4 border-0">ชื่อตำแหน่งที่เปิดรับ</th>
                  <th className="py-3 px-4 border-0 text-center" style={{ width: '220px' }}>วันที่เปิดรับ - ปิดรับ</th>
                  <th className="py-3 px-4 border-0 text-center" style={{ width: '130px' }}>ผู้สมัคร (คน)</th>
                  <th className="py-3 px-4 border-0 text-center" style={{ width: '170px' }}>สถานะ</th>
                  <th className="py-3 px-4 border-0 text-center" style={{ width: '130px' }}>รายงาน</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-success me-2" role="status"></div>
                    กำลังโหลดข้อมูลรายงาน...
                  </td></tr>
                ) : filteredJobs.length > 0 ? filteredJobs.map((job, index) => (
                  <tr key={job.id}>
                    <td className="py-3 px-4 text-center text-muted fw-bold">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-dark fs-6">{job.title}</div>
                      {job.department && <div className="text-muted small"><i className="bi bi-building me-1"></i>{job.department}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="fw-medium text-dark small d-inline-flex align-items-center gap-1">
                        <i className="bi bi-calendar-range text-muted"></i>
                        {job.dateRange}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center fw-bold text-primary fs-5">{job.applicants}</td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link to={`/report/${job.id}`} className="btn btn-sm btn-outline-primary px-3 shadow-sm fw-bold" style={{ borderRadius: '6px' }}>
                        <i className="bi bi-bar-chart-line-fill me-1"></i> ดูสถิติ
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 text-secondary d-block mb-2"></i>
                    ไม่พบข้อมูลประกาศรับสมัครงานตามเงื่อนไขที่เลือก
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. มุมมองแบบการ์ด (Card View) - สำหรับมือถือ */}
        {/* ======================================================== */}
        <div className="d-lg-none d-flex flex-column gap-3">
          {loading ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <div className="spinner-border text-success me-2" role="status"></div>
              กำลังโหลดข้อมูล...
            </div>
          ) : filteredJobs.length > 0 ? filteredJobs.map((job, index) => (
            <div key={job.id} className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: job.status === 'กำลังเปิดรับสมัคร' ? '4px solid #198754' : '4px solid #6c757d' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span className="badge bg-light text-secondary border px-2 py-1">ลำดับที่ {index + 1}</span>
                  {getStatusBadge(job.status)}
                </div>
                
                <h5 className="fw-bold text-dark mb-1">{job.title}</h5>
                {job.department && <p className="text-muted small mb-3"><i className="bi bi-building me-1"></i>{job.department}</p>}
                
                <div className="bg-light p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <span className="text-muted small d-block mb-1">ช่วงเวลาเปิดรับสมัคร</span>
                    <span className="fw-bold text-dark small"><i className="bi bi-calendar-range me-1"></i> {job.dateRange}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block mb-1">จำนวนผู้สมัคร</span>
                    <span className="fw-bold text-primary fs-5"><i className="bi bi-people-fill me-1"></i> {job.applicants} <span className="fs-6 fw-normal text-muted">คน</span></span>
                  </div>
                </div>

                <Link to={`/report/${job.id}`} className="btn btn-outline-primary btn-sm w-100 py-2 shadow-sm fw-bold" style={{ borderRadius: '8px' }}>
                  <i className="bi bi-bar-chart-line-fill me-2"></i> ดูสถิติเชิงลึก
                </Link>
              </div>
            </div>
          )) : (
            <div className="text-center py-5 text-muted bg-white rounded-3 shadow-sm border">
              <i className="bi bi-inbox fs-2 text-secondary d-block mb-2"></i>
              ไม่พบข้อมูลประกาศรับสมัครงานตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>

      </div>
    </div>
  );
}