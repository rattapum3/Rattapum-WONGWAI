import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับตัวกรองสถานะ: 'open' (เปิดรับสมัคร), 'closed' (ปิดรับสมัครแล้ว), 'all' (ทั้งหมด)
  const [statusFilter, setStatusFilter] = useState('open');

  // State สำหรับช่องค้นหา
  const [searchTerm, setSearchTerm] = useState("");

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const [appliedRecruitmentIds, setAppliedRecruitmentIds] = useState([]);

  useEffect(() => {
    fetchJobs();
    if (currentUser.id || currentUser.citizenId) {
      const qParams = new URLSearchParams();
      if (currentUser.id) qParams.append('applicantId', currentUser.id);
      if (currentUser.email) qParams.append('email', currentUser.email);
      if (currentUser.citizenId) qParams.append('citizenId', currentUser.citizenId);

      fetch(`http://localhost:3000/api/applications/my-applications?${qParams.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const ids = data.data.map(app => Number(app.recruitmentId || app.id));
            setAppliedRecruitmentIds(ids);
          }
        })
        .catch(err => console.error("Error fetching applied jobs:", err));
    }
  }, [currentUser.id, currentUser.citizenId, currentUser.email]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/job-search');
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTime = (dateString) => {
    if (!dateString) return 0;
    const t = new Date(dateString).getTime();
    return isNaN(t) ? 0 : t;
  };

  // 1. นับจำนวนตามสถานะ
  const openJobsCount = jobs.filter(j => j.status === 'open').length;
  const closedJobsCount = jobs.filter(j => j.status === 'closed').length;

  // 2. จัดเรียงและกรองข้อมูลตามสถานะที่เลือก
  let displayedJobs = [...jobs];

  if (statusFilter === 'closed') {
    // เรียงตำแหน่งที่ปิดรับจากวันที่ปิดรับล่าสุด ตามวันที่ (Close Date ล่าสุด -> เก่าสุด)
    displayedJobs = displayedJobs
      .filter(job => job.status === 'closed')
      .sort((a, b) => {
        const timeA = getTime(a.closeDate);
        const timeB = getTime(b.closeDate);
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  } else if (statusFilter === 'open') {
    // แสดงเฉพาะตำแหน่งงานที่เปิดรับสมัคร
    displayedJobs = displayedJobs
      .filter(job => job.status === 'open')
      .sort((a, b) => {
        const timeA = getTime(a.openDate);
        const timeB = getTime(b.openDate);
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  } else {
    // ทั้งหมด (all): ให้ 'open' อยู่บน และ 'closed' อยู่ล่าง (ในกลุ่ม closed เรียงตามวันที่ปิดรับล่าสุด)
    displayedJobs.sort((a, b) => {
      if (a.status === 'open' && b.status === 'closed') return -1;
      if (a.status === 'closed' && b.status === 'open') return 1;
      if (a.status === 'closed' && b.status === 'closed') {
        const timeA = getTime(a.closeDate);
        const timeB = getTime(b.closeDate);
        return timeB - timeA;
      }
      return 0;
    });
  }

  // 3. กรองข้อมูลตามช่องค้นหา (ค้นหาตามชื่อตำแหน่ง, ชื่อประกาศ, คณะ, ภาควิชา แบบไม่สนตัวพิมพ์เล็ก-ใหญ่)
  const filteredJobs = displayedJobs.filter(job => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const titleMatch = job.title?.toLowerCase().includes(term);
    const positionMatch = job.position?.toLowerCase().includes(term);
    const facultyMatch = job.faculty?.toLowerCase().includes(term);
    const deptMatch = job.department?.toLowerCase().includes(term);
    return titleMatch || positionMatch || facultyMatch || deptMatch;
  });

  return (
    <div className="container-fluid py-4">
      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h2 className="mb-1" style={{ color: '#03A96B', fontWeight: '600' }}>
            <i className={`bi ${statusFilter === 'closed' ? 'bi-archive-fill text-danger' : 'bi-briefcase-fill'} me-2`}></i>
            {statusFilter === 'closed' ? 'ตำแหน่งงานที่ปิดรับสมัครแล้ว' : (statusFilter === 'all' ? 'ตำแหน่งงานทั้งหมด' : 'ตำแหน่งงานที่เปิดรับสมัคร')}
          </h2>
          <p className="text-muted mb-0">
            {statusFilter === 'closed'
              ? 'แสดงตำแหน่งงานที่ปิดรับสมัครแล้ว (เรียงตามวันที่ปิดรับล่าสุด)'
              : 'ค้นหาและสมัครงานในตำแหน่งต่าง ๆ ของมหาวิทยาลัย'}
          </p>
        </div>

        {/* ปุ่มสลับดูตำแหน่งงานที่เปิดรับสมัคร / ปิดรับสมัคร */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className={`btn fw-bold d-flex align-items-center shadow-sm ${statusFilter === 'open' ? 'btn-success text-white' : 'btn-outline-secondary bg-white'}`}
            style={statusFilter === 'open' ? { backgroundColor: '#03A96B', borderColor: '#03A96B' } : {}}
            onClick={() => setStatusFilter('open')}
          >
            <i className="bi bi-briefcase-fill me-2"></i>
            เปิดรับสมัคร
            <span className={`badge rounded-pill ms-2 ${statusFilter === 'open' ? 'bg-white text-success' : 'bg-secondary'}`}>
              {openJobsCount}
            </span>
          </button>

          <button
            type="button"
            className={`btn fw-bold d-flex align-items-center shadow-sm ${statusFilter === 'closed' ? 'btn-danger text-white' : 'btn-outline-danger bg-white'}`}
            onClick={() => setStatusFilter('closed')}
            title="ดูตำแหน่งงานที่ปิดรับสมัครแล้ว เรียงตามวันที่ปิดรับล่าสุด"
          >
            <i className="bi bi-archive-fill me-2"></i>
            ดูตำแหน่งงานที่ปิดรับสมัคร
            <span className={`badge rounded-pill ms-2 ${statusFilter === 'closed' ? 'bg-white text-danger' : 'bg-danger text-white'}`}>
              {closedJobsCount}
            </span>
          </button>

          <button
            type="button"
            className={`btn fw-bold d-flex align-items-center shadow-sm ${statusFilter === 'all' ? 'btn-secondary text-white' : 'btn-outline-secondary bg-white'}`}
            onClick={() => setStatusFilter('all')}
          >
            <i className="bi bi-list-ul me-2"></i>
            ทั้งหมด
            <span className={`badge rounded-pill ms-2 ${statusFilter === 'all' ? 'bg-white text-secondary' : 'bg-light text-dark border'}`}>
              {jobs.length}
            </span>
          </button>
        </div>
      </div>

      {/* ส่วนค้นหา */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body bg-light rounded p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 py-2"
              placeholder="ค้นหาชื่อตำแหน่งงาน (เช่น อาจารย์, พนักงานขับรถ) หรือสังกัดคณะ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '1.05rem' }}
            />
          </div>
        </div>
      </div>

      {/* ส่วนแสดงรายการตำแหน่งงาน */}
      <div className="d-flex flex-column gap-3">
        {isLoading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-success mb-3" role="status"></div>
            <h5>กำลังโหลดข้อมูลประกาศรับสมัครงาน...</h5>
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job, index) => (
            <div
              className={`card shadow-sm border-0 ${job.status === 'closed' ? 'bg-light' : ''}`}
              key={job.id}
              style={{
                borderLeft: job.status === 'closed' ? '5px solid #6c757d' : '5px solid #03A96B',
                opacity: job.status === 'closed' ? 0.85 : 1 // ดรอปความสว่างลงนิดหน่อยถ้าปิดรับสมัคร
              }}
            >
              <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

                {/* ข้อมูลด้านซ้าย */}
                <div style={{ fontSize: '1.1rem', color: '#333' }}>

                  <div className="mb-2 d-flex flex-wrap align-items-center gap-2">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-1 rounded-pill small fw-bold">
                      ลำดับที่ {index + 1}
                    </span>

                    {job.status === 'closed' && (
                      <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-1 rounded-pill small fw-bold">
                        <i className="bi bi-x-circle me-1"></i>ปิดรับสมัครแล้ว {job.daysClosed ? `(ปิดมาแล้ว ${job.daysClosed} วัน)` : ''}
                      </span>
                    )}
                  </div>

                  <div className={`mb-2 ${job.status === 'closed' ? 'text-muted' : ''}`}>
                    <span className="fw-medium">ชื่อประกาศ : </span> <span className="fw-bold">{job.title}</span>
                  </div>
                  <div className={`mb-2 ${job.status === 'closed' ? 'text-muted' : ''}`}>
                    <span className="fw-medium">ตำแหน่ง : </span> <span className="fw-bold text-success">{job.position || ''}</span>
                  </div>
                  <div className={`mb-2 ${job.status === 'closed' ? 'text-muted' : ''}`}>
                    <span className="fw-medium">หน่วยงาน : </span> <span>{job.faculty || ''} {(job.department && job.department !== '-') ? `(ภาควิชา/ส่วนงาน: ${job.department})` : ''}</span>
                  </div>

                  <div className="mb-2 d-flex flex-wrap gap-4">
                    <div><span className="fw-medium">ประเภท : </span>{job.type}</div>
                    <div><span className="fw-medium">จำนวนที่รับ : </span>{job.amount} อัตรา</div>
                  </div>

                  <div className="mb-2">รอบที่ {job.round}</div>

                  <div className={`mt-2 ${job.status === 'closed' ? 'text-muted' : 'text-danger'}`}>
                    เปิดรับสมัครวันที่ : {formatDate(job.openDate)}
                  </div>
                  <div className={job.status === 'closed' ? 'text-muted' : 'text-danger'}>
                    ปิดรับสมัครวันที่ : {formatDate(job.closeDate)}
                  </div>
                </div>

                {/* ปุ่มกดด้านขวา */}
                <div className="d-flex flex-column gap-2 flex-shrink-0 w-100" style={{ maxWidth: '200px' }}>

                  {/* เปลี่ยน Route การลิงก์ปุ่ม "รายละเอียด" ตามสถานะการปิด/เปิด */}
                  <Link
                    to={job.status === 'open' ? `/jobs/${job.id}` : `/jobs/closed/${job.id}`}
                    className="btn btn-outline-secondary w-100 py-2 text-decoration-none shadow-sm d-flex align-items-center justify-content-center"
                    style={{ borderRadius: '8px' }}
                  >
                    รายละเอียด
                  </Link>

                  {/* เช็คสถานะสำหรับปุ่มสมัครงาน */}
                  {job.status === 'open' ? (
                    appliedRecruitmentIds.includes(Number(job.id)) ? (
                      <Link
                        to="/my-applications"
                        className="btn btn-secondary w-100 py-2 text-decoration-none shadow-sm fw-bold text-nowrap d-flex align-items-center justify-content-center"
                        style={{ borderRadius: '8px' }}
                      >
                        <i className="bi bi-check-circle-fill text-warning me-2"></i>สมัครแล้ว
                      </Link>
                    ) : (
                      <Link
                        to={`/apply/${job.id}`}
                        className="btn w-100 py-2 text-decoration-none shadow-sm fw-bold text-nowrap d-flex align-items-center justify-content-center"
                        style={{ backgroundColor: '#03A96B', color: 'white', borderRadius: '8px' }}
                      >
                        <i className="bi bi-pencil-square me-2"></i>สมัครงานตำแหน่งนี้
                      </Link>
                    )
                  ) : (
                    <button
                      className="btn btn-secondary w-100 py-2 shadow-sm fw-bold text-nowrap d-flex align-items-center justify-content-center"
                      style={{ borderRadius: '8px' }}
                      disabled
                    >
                      <i className="bi bi-x-circle me-2"></i>ปิดรับสมัคร
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5 bg-white rounded shadow-sm border">
            <i className="bi bi-search text-muted fs-1 mb-3 d-block"></i>
            <h5 className="text-muted">
              {searchTerm.trim()
                ? 'ไม่พบตำแหน่งงานที่ค้นหา'
                : (statusFilter === 'closed'
                  ? 'ยังไม่มีตำแหน่งงานที่ปิดรับสมัคร'
                  : 'ยังไม่มีตำแหน่งงานที่เปิดรับสมัครในขณะนี้')}
            </h5>
          </div>
        )}
      </div>
    </div>
  );
}