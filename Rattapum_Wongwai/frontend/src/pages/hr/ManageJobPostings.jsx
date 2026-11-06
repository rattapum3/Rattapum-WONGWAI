import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ManageJobPostings() {
  const [postings, setPostings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // State สำหรับค้นหาผู้สมัครจากเลขบัตร ปชช หรือชื่อ-นามสกุล
  const [searchCitizenId, setSearchCitizenId] = useState('');
  const [matchedApplicants, setMatchedApplicants] = useState([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [filterCandidateOnly, setFilterCandidateOnly] = useState(false);

  // State สำหรับจัดการ Modal ขยายเวลา
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [newDeadline, setNewDeadline] = useState('');

  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setNewDeadline(job.closeDate ? job.closeDate.split('T')[0] : '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedJob(null);
    setNewDeadline('');
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  const fetchPostings = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/job-posting/all');
      const data = await res.json();
      if (data.success) {
        setPostings(data.data || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByCitizen = async (e, applicantIdOverride = null) => {
    if (e) e.preventDefault();
    const clean = searchCitizenId.trim();
    if (!clean && !applicantIdOverride) {
      setSearchResult(null);
      setMatchedApplicants([]);
      setSearchError("กรุณากรอกเลขประจำตัวประชาชน หรือชื่อ-นามสกุล");
      return;
    }
    setIsSearching(true);
    setSearchError("");
    try {
      let url = `http://localhost:3000/api/applications/search-by-citizen/${encodeURIComponent(clean || 'query')}`;
      if (applicantIdOverride) {
        url += `?applicantId=${applicantIdOverride}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (data.found && data.data) {
          setSearchResult(data.data);
          setMatchedApplicants(data.matchedApplicants || []);
          setSelectedApplicantId(data.data.applicant?.id || null);
          setSearchError("");
        } else {
          setSearchResult(null);
          setMatchedApplicants([]);
          setSearchError(data.message || "ไม่พบข้อมูลผู้สมัครที่ตรงกับเลขบัตร ปชช หรือชื่อ-นามสกุลนี้ในระบบ");
        }
      } else {
        setSearchResult(null);
        setMatchedApplicants([]);
        setSearchError(data.message || "เกิดข้อผิดพลาดในการค้นหา");
      }
    } catch (err) {
      console.error("Error searching applicant:", err);
      setSearchResult(null);
      setMatchedApplicants([]);
      setSearchError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchCitizenId('');
    setSearchResult(null);
    setSearchError('');
    setFilterCandidateOnly(false);
  };

  const handleSaveExtension = async () => {
    if (!newDeadline) {
      alert("กรุณาระบุวันที่สิ้นสุดการรับสมัครใหม่");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/job-posting/${selectedJob.rawId}/deadline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closeDate: newDeadline })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `ขยายเวลาเปิดรับสมัครตำแหน่ง "${selectedJob.jobTitle}" สำเร็จ!`);
        fetchPostings(); // รีโหลดข้อมูล
        handleCloseModal();
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดต: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleCloseRecruitment = async (job) => {
    const roundText = job.roundNo || job.round ? ` (รอบที่ ${job.roundNo || job.round})` : '';
    const confirmClose = window.confirm(
      `คุณต้องการปิดรับสมัครตำแหน่ง "${job.jobTitle}"${roundText} ทันทีใช่หรือไม่?\n\n(หากต้องการเปิดรับสมัครใหม่ในภายหลัง สามารถกดปุ่ม "ขยายเวลา" เพื่อเปิดรอบถัดไปได้)`
    );
    if (!confirmClose) return;

    try {
      const res = await fetch(`http://localhost:3000/api/job-posting/${job.rawId || job.id}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `ปิดรับสมัครตำแหน่ง "${job.jobTitle}" สำเร็จ!`);
        fetchPostings();
      } else {
        alert('เกิดข้อผิดพลาดในการปิดรับสมัคร: ' + (data.message || ''));
      }
    } catch (error) {
      console.error('Error closing recruitment:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const formatDateThai = (dateString) => {
    if (!dateString) return '-';
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const parts = dateString.split('T')[0].split(' ')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12) {
          const thaiY = y > 2400 ? y : y + 543;
          return `${d} ${months[m]} ${thaiY}`;
        }
      }
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear() > 2400 ? date.getFullYear() : date.getFullYear() + 543;
    return `${d} ${m} ${y}`;
  };

  // กรองประกาศงาน หากเปิดตัวกรองเฉพาะตำแหน่งที่ผู้สมัครที่ค้นหายื่นไว้
  const candidateRecruitmentIds = (searchResult && searchResult.applications)
    ? new Set(searchResult.applications.map(a => Number(a.recruitmentId)))
    : null;

  // กรองประกาศรับสมัคร โดยไม่แสดงสถานะ draft หรือแบบร่าง
  const validPostings = postings.filter(p =>
    p.status !== "ร่างประกาศ (HR)" &&
    p.status !== "Draft" &&
    p.requestStatus !== "HR_Draft" &&
    p.requestStatus !== "Draft" &&
    p.requestStatus !== "RequestDraft"
  );

  const filteredPostings = (filterCandidateOnly && candidateRecruitmentIds)
    ? validPostings.filter(p => candidateRecruitmentIds.has(Number(p.rawId || p.id)))
    : validPostings;

  const sortedPostings = [...filteredPostings].sort((a, b) => {
    if (a.status === "เปิดรับสมัคร" && b.status === "ปิดรับสมัครแล้ว") return -1;
    if (a.status === "ปิดรับสมัครแล้ว" && b.status === "เปิดรับสมัคร") return 1;

    const dateA = new Date(a.closeDate).getTime();
    const dateB = new Date(b.closeDate).getTime();

    if (a.status === "เปิดรับสมัคร") {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  const getStatusBadge = (status) => {
    if (status === "เปิดรับสมัคร") {
      return <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem', verticalAlign: 'middle' }}></i>{status}</span>;
    }
    return <span className="badge bg-secondary px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-lock-fill me-1"></i>{status}</span>;
  };

  return (
    <div className="container-fluid py-4">

      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h2 className="mb-1" style={{ color: '#03A96B', fontWeight: '600' }}>
            <i className="bi bi-card-list me-2"></i>จัดการประกาศรับสมัครงาน
          </h2>
          <p className="text-muted fs-6 mb-0">
            จัดการสถานะ วันที่เปิด-ปิด ตรวจสอบผู้สมัคร และติดตามผู้ที่รอจัดการสถานะ
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-self-start align-self-md-auto">
          <Link to="/job-requests" className="btn btn-outline-secondary px-3 shadow-sm d-flex align-items-center" style={{ borderRadius: '8px', fontWeight: '500' }}>
            <i className="bi bi-inbox me-2"></i>คำร้องขอเปิดรับสมัคร
          </Link>
          <Link to="/create-job/new" className="btn px-4 shadow-sm d-flex align-items-center" style={{ backgroundColor: '#03A96B', color: 'white', fontWeight: '500', borderRadius: '8px' }}>
            <i className="bi bi-plus-lg me-2"></i>สร้างประกาศใหม่
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 📊 การ์ดสรุปสถานะภาพรวมของผู้สมัครและประกาศงาน */}
      {/* ======================================================== */}
      <div className="row g-3 mb-4">
        {/* การ์ดที่ 1: ประกาศรับสมัครงานทั้งหมด */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #03A96B' }}>
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">ประกาศรับสมัครงานทั้งหมด</h6>
                  <h3 className="fw-bold mb-0 text-dark">{summary?.totalJobs ?? validPostings.length} <span className="fs-6 fw-normal text-muted">ตำแหน่ง</span></h3>
                  <div className="text-success small mt-1">
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>เปิดรับอยู่ {summary?.activeJobs ?? 0} | ปิดรับ {summary?.closedJobs ?? 0} ตำแหน่ง
                  </div>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success">
                  <i className="bi bi-megaphone-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* การ์ดที่ 2: ผู้สมัครทั้งหมด (ยื่นจริง) */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #0d6efd' }}>
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">ผู้สมัครทั้งหมด (ยื่นจริง)</h6>
                  <h3 className="fw-bold mb-0 text-primary">{summary?.totalApplicants ?? 0} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                  <div className="text-muted small mt-1">
                    จากทุกตำแหน่งในระบบ
                  </div>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* การ์ดที่ 3: ผู้สมัครที่รอจัดสอบ */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #ffc107', backgroundColor: (summary?.totalWaitingExam || summary?.totalHrPending || 0) > 0 ? '#fffdf2' : '#fff' }}>
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small fw-bold">ผู้สมัครที่รอจัดสอบ</h6>
                  <h3 className="fw-bold mb-0 text-warning text-dark">{(summary?.totalWaitingExam ?? summary?.totalHrPending) ?? 0} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                  <div className={`small mt-1 fw-bold ${(summary?.totalWaitingExam || summary?.totalHrPending || 0) > 0 ? 'text-warning-emphasis' : 'text-success'}`}>
                    {(summary?.totalWaitingExam || summary?.totalHrPending || 0) > 0 ? (
                      <><i className="bi bi-calendar-event me-1"></i>มีผู้สมัครที่รอจัดสอบ</>
                    ) : (
                      <><i className="bi bi-check-circle-fill me-1"></i>ไม่มีผู้สมัครรอจัดสอบ</>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', backgroundColor: '#fff3cd' }}>
                  <i className="bi bi-calendar-event-fill fs-3" style={{ color: '#d97706' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🔍 กล่องค้นหาผู้สมัครจากเลขประจำตัวประชาชน หรือชื่อ-นามสกุล */}
      {/* ======================================================== */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', background: '#ffffff' }}>
        <div className="card-body p-3 p-md-4">
          <form onSubmit={handleSearchByCitizen}>
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-auto">
                <span className="fw-bold text-dark d-flex align-items-center">
                  <i className="bi bi-person-vcard fs-4 text-primary me-2"></i>
                  ค้นหาผู้สมัครจากเลขบัตร ปชช หรือชื่อ-นามสกุล:
                </span>
              </div>
              <div className="col-12 col-md">
                <div className="input-group shadow-sm">
                  <input
                    type="text"
                    className="form-control form-control-lg fs-6"
                    placeholder="กรอกเลขบัตร ปชช 13 หลัก หรือ ชื่อ-นามสกุลผู้สมัครเพื่อดูประวัติและสถานะ..."
                    value={searchCitizenId}
                    onChange={(e) => setSearchCitizenId(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary px-4 fw-bold d-flex align-items-center" disabled={isSearching}>
                    {isSearching ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <i className="bi bi-search me-2"></i>}
                    ค้นหา
                  </button>
                  {(searchCitizenId || searchResult || searchError) && (
                    <button type="button" className="btn btn-outline-secondary px-3" onClick={handleClearSearch} title="ล้างการค้นหา">
                      <i className="bi bi-x-lg me-1"></i>ล้าง
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* แสดงข้อความแจ้งเตือนกรณีค้นหาไม่พบ */}
          {searchError && (
            <div className="alert alert-warning d-flex align-items-center mt-3 mb-0 py-2 shadow-sm" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2 fs-5 text-warning"></i>
              <div>{searchError}</div>
            </div>
          )}

          {/* กรณีพบผู้สมัครหลายคนที่ชื่อตรงกัน */}
          {matchedApplicants && matchedApplicants.length > 1 && (
            <div className="alert alert-info py-2 px-3 mt-3 mb-0 d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-sm rounded-3">
              <div className="small">
                <i className="bi bi-people-fill me-2 text-primary fs-5"></i>
                <strong>พบผู้สมัคร {matchedApplicants.length} คนที่ตรงกับคำค้นหา:</strong>
                <span className="text-muted ms-2">คลิกเพื่อเลือกดูข้อมูลของผู้สมัครแต่ละท่าน</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {matchedApplicants.map((ap, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${selectedApplicantId === ap.id || (!selectedApplicantId && idx === 0)
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-outline-primary bg-white'
                      }`}
                    onClick={() => handleSearchByCitizen(null, ap.id)}
                  >
                    <i className="bi bi-person me-1"></i>
                    {ap.fullName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* แสดงผลการค้นหาข้อมูลผู้สมัคร */}
          {searchResult && (
            <div className="mt-3 p-3 bg-light rounded-3 border animate__animated animate__fadeIn">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-2 mb-3 gap-2">
                <div>
                  <h5 className="fw-bold text-dark mb-1">
                    <i className="bi bi-person-circle text-primary me-2"></i>
                    {searchResult.applicant.fullName}
                  </h5>
                  <div className="d-flex flex-wrap gap-3 small text-muted">
                    <span><i className="bi bi-card-heading me-1 text-secondary"></i>เลขบัตร ปชช: <strong className="text-dark">{searchResult.applicant.citizenId}</strong></span>
                    <span><i className="bi bi-envelope-fill me-1 text-danger"></i>อีเมล: {searchResult.applicant.email}</span>
                  </div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <div className="badge bg-primary fs-6 px-3 py-2 rounded-pill">
                    ยื่นสมัครทั้งหมด {searchResult.applications.length} ตำแหน่ง
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterCandidateOnly ? 'btn-dark' : 'btn-outline-dark'} fw-bold`}
                    onClick={() => setFilterCandidateOnly(!filterCandidateOnly)}
                  >
                    <i className={`bi ${filterCandidateOnly ? 'bi-funnel-fill text-warning' : 'bi-funnel'} me-1`}></i>
                    {filterCandidateOnly ? 'แสดงทุกประกาศ' : 'กรองตารางให้ดูเฉพาะตำแหน่งนี้'}
                  </button>
                </div>
              </div>

              {/* รายการตำแหน่งที่ผู้สมัครคนนี้ยื่นไว้ */}
              <div className="table-responsive bg-white rounded border">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th className="py-2 px-3">ตำแหน่งงานที่สมัคร</th>
                      <th className="py-2 px-3">คณะ / หน่วยงาน</th>
                      <th className="py-2 px-3 text-center">วันที่ยื่นสมัคร</th>
                      <th className="py-2 px-3 text-center">สถานะปัจจุบัน</th>
                      <th className="py-2 px-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResult.applications.map((app, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 fw-bold text-dark">
                          {app.jobTitle}
                          <span className="badge bg-secondary bg-opacity-10 text-secondary ms-2">รอบที่ {app.roundNo}</span>
                        </td>
                        <td className="py-2 px-3 text-muted">{app.department}</td>
                        <td className="py-2 px-3 text-center text-nowrap">{app.appliedDate}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`badge ${app.status === 'รอตรวจสอบ' ? 'bg-warning text-dark' :
                            app.status.includes('ผ่านการคัดเลือกเบื้องต้น') ? 'bg-info text-dark' :
                              app.status === 'ผ่าน' || app.status === 'ผ่านการคัดเลือก' ? 'bg-success' :
                                app.status.includes('ไม่ผ่าน') ? 'bg-danger' : 'bg-secondary'
                            } px-2 py-1 rounded-pill`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-nowrap">
                          <div className="d-flex gap-1 justify-content-center">
                            <Link to={`/applicant-details/${app.applicationId}`} className="btn btn-sm btn-outline-secondary px-2 py-1 shadow-sm">
                              <i className="bi bi-file-earmark-text me-1"></i>ดูใบสมัคร
                            </Link>
                            <Link to={`/review-applicants/${app.recruitmentId}`} className="btn btn-sm btn-outline-primary px-2 py-1 shadow-sm">
                              <i className="bi bi-check2-square me-1"></i>จัดการตำแหน่งนี้
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. มุมมองแบบตาราง (Table View) - จะแสดงเฉพาะบนจอคอม/แท็บเล็ตใหญ่ (d-none d-xl-block) */}
      {/* ======================================================== */}
      <div className="card shadow-sm border-0 d-none d-xl-block" style={{ borderTop: '4px solid #03A96B', borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">กำลังโหลดข้อมูล...</div>
          ) : sortedPostings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
              {filterCandidateOnly ? 'ไม่พบตำแหน่งงานที่ผู้สมัครคนนี้ยื่นไว้' : 'ไม่พบข้อมูลประกาศรับสมัครงาน'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="py-3 px-4 border-0">ตำแหน่งและสังกัด</th>
                    <th className="py-3 px-4 border-0">ระยะเวลารับสมัคร</th>
                    <th className="py-3 px-4 border-0 text-center">สถานะ</th>
                    <th className="py-3 px-4 border-0 text-center" style={{ minWidth: '200px' }}>ผู้สมัครที่รอจัดสอบ</th>
                    <th className="py-3 px-4 border-0 text-center">จัดการประกาศ</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {sortedPostings.map((job, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-dark fs-5">{job.jobTitle}</span>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 small">
                            รอบที่ {job.roundNo || job.round || 1}
                          </span>
                        </div>
                        <div className="text-muted small">{job.department}</div>
                      </td>
                      <td className="py-3 px-4 text-nowrap">
                        <div className="small text-muted mb-1">
                          <i className="bi bi-calendar-check me-2 text-success"></i>เปิด: {formatDateThai(job.openDate)}
                        </div>
                        <div className={`small fw-bold ${job.status === 'เปิดรับสมัคร' ? 'text-danger' : 'text-muted'}`}>
                          <i className="bi bi-calendar-x me-2"></i>ปิด: {formatDateThai(job.closeDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="d-flex flex-column align-items-center gap-1">
                          {(job.waitingExamCount > 0 || job.hrPendingCount > 0) ? (
                            <Link
                              to={`/review-applicants/${job.id}`}
                              className="badge bg-warning bg-opacity-25 text-warning-emphasis border border-warning text-decoration-none px-3 py-2 fs-6 rounded-pill fw-bold shadow-sm"
                              title="มีผู้สมัครที่รอจัดสอบ คลิกเพื่อไปหน้านัดหมายและจัดการสอบ"
                            >
                              <i className="bi bi-calendar-event me-1"></i> รอจัดสอบ: {job.waitingExamCount || job.hrPendingCount} คน
                            </Link>
                          ) : (
                            <span className="badge bg-light text-muted border px-3 py-2 rounded-pill">
                              <i className="bi bi-check-circle me-1 text-success"></i> ไม่มีผู้สมัครรอจัดสอบ
                            </span>
                          )}
                          <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                            ผู้สมัครรวม {job.applicantCount} คน
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="d-flex flex-wrap gap-2 justify-content-center">
                          <Link to={`/review-applicants/${job.id}`} className="btn btn-sm btn-outline-primary px-3 shadow-sm" style={{ borderRadius: '6px' }}>
                            <i className="bi bi-search me-1"></i> ตรวจสอบ
                          </Link>

                          <Link to={`/create-exam-announcement/${job.id}`} className="btn btn-sm btn-outline-success px-3 shadow-sm" style={{ borderRadius: '6px' }}>
                            <i className="bi bi-megaphone me-1"></i> ประกาศผลสอบ
                          </Link>
                          <button className="btn btn-sm btn-outline-info px-3 shadow-sm" style={{ borderRadius: '6px' }} onClick={() => handleOpenModal(job)}>
                            <i className="bi bi-calendar-plus me-1"></i> ขยายเวลา
                          </button>
                          {job.status === "เปิดรับสมัคร" && (
                            <button
                              className="btn btn-sm btn-outline-danger px-3 shadow-sm"
                              style={{ borderRadius: '6px' }}
                              onClick={() => handleCloseRecruitment(job)}
                              title="ปิดรับสมัครตำแหน่งนี้ทันที"
                            >
                              <i className="bi bi-lock-fill me-1"></i> ปิดรับสมัคร
                            </button>
                          )}
                          {job.announcementFile ? (
                            <a
                              href={`http://localhost:3000/api/export/job-announcement/${job.id}/pdf`}
                              download
                              className="btn btn-sm btn-outline-secondary px-2 shadow-sm"
                              style={{ borderRadius: '6px' }}
                              title="ดาวน์โหลดประกาศ PDF ที่ HR เพิ่ม"
                            >
                              <i className="bi bi-file-earmark-pdf text-danger me-1"></i>PDF
                            </a>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-secondary px-2 shadow-sm text-muted"
                              style={{ borderRadius: '6px', opacity: 0.6 }}
                              disabled
                              title="ไม่มีไฟล์ประกาศที่ HR เพิ่ม"
                            >
                              <i className="bi bi-file-earmark-x me-1"></i>ไม่มี PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. มุมมองแบบการ์ด (Card View) - จะแสดงเฉพาะบนมือถือ/แท็บเล็ตเล็ก (d-block d-xl-none) */}
      {/* ======================================================== */}
      <div className="d-block d-xl-none mt-4">
        {loading ? (
          <div className="text-center py-5">กำลังโหลดข้อมูล...</div>
        ) : sortedPostings.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
            {filterCandidateOnly ? 'ไม่พบตำแหน่งงานที่ผู้สมัครคนนี้ยื่นไว้' : 'ไม่พบข้อมูลประกาศรับสมัครงาน'}
          </div>
        ) : (
          <div className="row g-3">
            {sortedPostings.map((job, index) => (
              <div key={index} className="card shadow-sm border-0" style={{ borderRadius: '12px', borderLeft: job.status === 'เปิดรับสมัคร' ? '5px solid #03A96B' : '5px solid #6c757d' }}>
                <div className="card-body p-3 p-sm-4">

                  {/* แถวที่ 1: สถานะ และ จำนวนคน */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>{getStatusBadge(job.status)}</div>
                    <div className="text-end">
                      {(job.waitingExamCount > 0 || job.hrPendingCount > 0) ? (
                        <span className="badge bg-warning text-dark px-2 py-1 shadow-sm fw-bold">
                          <i className="bi bi-calendar-event me-1"></i> รอจัดสอบ: {job.waitingExamCount || job.hrPendingCount} คน
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border px-2 py-1 small">
                          ไม่มีผู้สมัครรอจัดสอบ
                        </span>
                      )}
                      <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                        ผู้สมัครรวม {job.applicantCount} คน
                      </div>
                    </div>
                  </div>

                  {/* แถวที่ 2: ชื่อตำแหน่ง */}
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <h5 className="fw-bold text-dark mb-0">{job.jobTitle}</h5>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 small">
                      รอบที่ {job.roundNo || job.round || 1}
                    </span>
                  </div>
                  <div className="text-muted small mb-3"><i className="bi bi-building me-1"></i>{job.department}</div>

                  {/* แถวที่ 3: วันที่เปิด-ปิด */}
                  <div className="bg-light p-2 rounded mb-3 small">
                    <div className="text-muted mb-1"><i className="bi bi-calendar-check me-2 text-success"></i>เปิดรับ: {formatDateThai(job.openDate)}</div>
                    <div className={`fw-bold ${job.status === 'เปิดรับสมัคร' ? 'text-danger' : 'text-muted'}`}>
                      <i className="bi bi-calendar-x me-2"></i>หมดเขต: {formatDateThai(job.closeDate)}
                    </div>
                  </div>

                  {/* แถวที่ 4: ปุ่มจัดการ (ปุ่มจะขยายเต็มความกว้างในมือถือ) */}
                  <div className="d-flex flex-column gap-2">
                    <Link to={`/review-applicants/${job.id}`} className="btn btn-outline-primary btn-sm py-2 shadow-sm fw-bold">
                      <i className="bi bi-search me-2"></i> ตรวจสอบผู้สมัคร
                    </Link>

                    <Link to={`/create-exam-announcement/${job.id}`} className="btn btn-outline-success btn-sm py-2 shadow-sm fw-bold">
                      <i className="bi bi-megaphone me-2"></i> ประกาศผลสอบ
                    </Link>

                    <button className="btn btn-outline-info btn-sm py-2 shadow-sm w-100" onClick={() => handleOpenModal(job)}>
                      <i className="bi bi-calendar-plus me-1"></i> ขยายเวลา
                    </button>

                    {job.status === "เปิดรับสมัคร" && (
                      <button
                        className="btn btn-outline-danger btn-sm py-2 shadow-sm w-100 fw-bold"
                        onClick={() => handleCloseRecruitment(job)}
                      >
                        <i className="bi bi-lock-fill me-1"></i> ปิดรับสมัคร
                      </button>
                    )}

                    <div>
                      {job.announcementFile ? (
                        <a
                          href={`http://localhost:3000/api/export/job-announcement/${job.id}/pdf`}
                          download
                          className="btn btn-outline-secondary btn-sm py-2 shadow-sm w-100"
                        >
                          <i className="bi bi-file-earmark-pdf text-danger me-1"></i> ดาวน์โหลดประกาศ PDF
                        </a>
                      ) : (
                        <button
                          className="btn btn-outline-secondary btn-sm py-2 shadow-sm w-100 text-muted"
                          disabled
                          style={{ opacity: 0.6 }}
                        >
                          <i className="bi bi-file-earmark-x me-1"></i> ไม่มีไฟล์ประกาศ PDF
                        </button>
                      )}
                    </div>

                    <Link to={`/create-exam-announcement/${job.id}`} className="btn btn-outline-success btn-sm py-2 shadow-sm fw-bold">
                      <i className="bi bi-megaphone me-2"></i> จัดทำประกาศผลสอบ
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* Modal ป็อปอัป ขยายเวลารับสมัคร */}
      {/* ========================================== */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable px-2">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>

              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold" style={{ color: '#03A96B' }}>
                  <i className="bi bi-calendar-plus-fill me-2"></i>ขยายเวลาเปิดรับสมัคร
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>

              <div className="modal-body p-4">
                <div className="p-3 mb-4 rounded" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #03A96B' }}>
                  <span className="text-muted small">ตำแหน่งที่เลือก:</span><br />
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <strong className="text-dark fs-6">{selectedJob?.jobTitle}</strong>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 small">
                      รอบปัจจุบัน: รอบที่ {selectedJob?.roundNo || selectedJob?.round || 1}
                    </span>
                  </div>
                  <div className="text-danger small mt-2">
                    <i className="bi bi-clock-history me-1"></i> วันหมดเขตเดิม: {formatDateThai(selectedJob?.closeDate)}
                  </div>
                  {selectedJob?.status === 'ปิดรับสมัครแล้ว' && (
                    <div className="text-success small mt-1 fw-bold">
                      <i className="bi bi-arrow-repeat me-1"></i> ตำแหน่งนี้ปิดรับสมัครแล้ว ระบบจะปรับเป็น "รอบที่ {(selectedJob?.roundNo || selectedJob?.round || 1) + 1}" อัตโนมัติ
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">ระบุวันที่สิ้นสุดการรับสมัครใหม่ <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control form-control-lg bg-light border-0"
                    value={newDeadline}
                    min={getTodayStr()}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                  <div className="form-text mt-2 text-info small">
                    <i className="bi bi-info-circle me-1"></i> หากตำแหน่งนี้ถูกปิดรับสมัครไปแล้ว สถานะจะกลับมาเป็น "เปิดรับสมัคร" ทันที
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 px-4 pb-4 flex-nowrap">
                <button type="button" className="btn btn-light fw-bold w-50" onClick={handleCloseModal} style={{ borderRadius: '8px' }}>
                  ยกเลิก
                </button>
                <button type="button" className="btn text-white fw-bold w-50 shadow-sm" style={{ backgroundColor: '#03A96B', borderRadius: '8px' }} onClick={handleSaveExtension}>
                  บันทึก
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}