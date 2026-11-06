import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FacultyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const facultyName = currentUser.dept || '';

  // State สำหรับค้นหาผู้สมัครด้วยเลขบัตรประชาชน หรือชื่อ-นามสกุล
  const [searchCitizenId, setSearchCitizenId] = useState('');
  const [matchedApplicants, setMatchedApplicants] = useState([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filterCandidateOnly, setFilterCandidateOnly] = useState(false);

  React.useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/job-requests/faculty-jobs?facultyName=${encodeURIComponent(facultyName)}`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching faculty jobs:', error);
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
    setMatchedApplicants([]);
    setSelectedApplicantId(null);
    setSearchError('');
    setFilterCandidateOnly(false);
  };

  // กรองตำแหน่งงานเมื่อเปิดตัวกรองให้ดูเฉพาะตำแหน่งที่ผู้สมัครยื่น
  const candidateRecruitmentIds = (searchResult && searchResult.applications) 
    ? new Set(searchResult.applications.map(a => Number(a.recruitmentId))) 
    : null;

  const filteredJobs = (filterCandidateOnly && candidateRecruitmentIds)
    ? jobs.filter(j => candidateRecruitmentIds.has(Number(j.rawId || j.id)))
    : jobs;

  // สรุปตัวเลขด้านบน
  const totalActiveJobs = jobs.filter(j => j.status === "เปิดรับสมัคร").length;
  const totalPending = jobs.reduce((sum, job) => sum + (job.pendingReview || 0), 0);

  if (loading) {
    return <div className="text-center py-5">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="container-fluid py-4 py-md-5" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '1200px' }}>
        
        {/* ส่วนหัวหน้าจอ */}
        <div className="mb-4 text-center text-md-start">
          <h2 className="fw-bold mb-2" style={{ color: '#006664' }}>
            <i className="bi bi-briefcase-fill me-2"></i>รายการประกาศของคณะ
          </h2>
          <p className="text-muted mb-0">ตรวจสอบคุณสมบัติผู้สมัครเบื้องต้นแยกตามตำแหน่งงาน</p>
        </div>

        {/* การ์ดสรุปข้อมูล */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-md-4">
            <div className="card border-0 shadow-sm border-start border-warning border-4 h-100" style={{ borderRadius: '10px' }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-semibold">ผู้สมัครที่รอการคัดเลือกเบื้องต้น</h6>
                    <h3 className="fw-bold mb-0 text-warning">{totalPending} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                  </div>
                  <i className="bi bi-hourglass-split fs-1 text-warning opacity-50"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <div className="card border-0 shadow-sm border-start border-primary border-4 h-100" style={{ borderRadius: '10px' }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-semibold">ประกาศที่เปิดรับ</h6>
                    <h3 className="fw-bold mb-0 text-primary">{totalActiveJobs} <span className="fs-6 fw-normal text-muted">ตำแหน่ง</span></h3>
                  </div>
                  <i className="bi bi-megaphone fs-1 text-primary opacity-25"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <div className="card border-0 shadow-sm border-start border-success border-4 h-100" style={{ borderRadius: '10px' }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-semibold">ประกาศทั้งหมดของคณะ</h6>
                    <h3 className="fw-bold mb-0 text-success">{jobs.length} <span className="fs-6 fw-normal text-muted">ตำแหน่ง</span></h3>
                  </div>
                  <i className="bi bi-briefcase fs-1 text-success opacity-25"></i>
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
                    <i className="bi bi-person-vcard fs-4 me-2" style={{ color: '#006664' }}></i>
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
                    <button 
                      type="submit" 
                      className="btn px-4 fw-bold d-flex align-items-center text-white" 
                      style={{ backgroundColor: '#006664' }}
                      disabled={isSearching}
                    >
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
                  <i className="bi bi-people-fill me-2 fs-5" style={{ color: '#006664' }}></i>
                  <strong>พบผู้สมัคร {matchedApplicants.length} คนที่ตรงกับคำค้นหา:</strong>
                  <span className="text-muted ms-2">คลิกเพื่อเลือกดูข้อมูลของผู้สมัครแต่ละท่าน</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {matchedApplicants.map((ap, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 fw-bold ${
                        selectedApplicantId === ap.id || (!selectedApplicantId && idx === 0)
                          ? 'text-white shadow-sm'
                          : 'bg-white border'
                      }`}
                      style={{
                        backgroundColor: (selectedApplicantId === ap.id || (!selectedApplicantId && idx === 0)) ? '#006664' : '#fff',
                        borderColor: '#006664',
                        color: (selectedApplicantId === ap.id || (!selectedApplicantId && idx === 0)) ? '#fff' : '#006664'
                      }}
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
                      <i className="bi bi-person-circle me-2" style={{ color: '#006664' }}></i>
                      {searchResult.applicant.fullName}
                    </h5>
                    <div className="d-flex flex-wrap gap-3 small text-muted">
                      <span><i className="bi bi-card-heading me-1 text-secondary"></i>เลขบัตร ปชช: <strong className="text-dark">{searchResult.applicant.citizenId}</strong></span>
                      <span><i className="bi bi-telephone-fill me-1 text-success"></i>โทร: {searchResult.applicant.phone}</span>
                      <span><i className="bi bi-envelope-fill me-1 text-danger"></i>อีเมล: {searchResult.applicant.email}</span>
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <div className="badge fs-6 px-3 py-2 rounded-pill text-white" style={{ backgroundColor: '#006664' }}>
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
                            <span className={`badge ${
                              app.status === 'รอตรวจสอบ' ? 'bg-warning text-dark' :
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
                              <Link 
                                to={`/faculty-review/${app.recruitmentId}`} 
                                className="btn btn-sm text-white px-2 py-1 shadow-sm fw-medium"
                                style={{ backgroundColor: '#03A96B' }}
                              >
                                <i className="bi bi-check2-circle me-1"></i>ตรวจคุณสมบัติ
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

        {/* ส่วนแสดงรายการ (Responsive Table & Cards) */}
        <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          
          {/* Desktop Table: แสดงบนจอขนาดใหญ่ (lg ขึ้นไป) */}
          <div className="table-responsive d-none d-lg-block">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#006664', color: 'white' }}>
                <tr>
                  <th className="py-3 px-3 text-center fw-medium border-0" style={{ width: '70px' }}>ลำดับ</th>
                  <th className="py-3 px-4 fw-medium border-0">ชื่อตำแหน่ง / ระยะเวลา</th>
                  <th className="py-3 px-4 fw-medium border-0 text-center" style={{ width: '260px' }}>ผู้สมัครที่รอการคัดเลือกเบื้องต้น</th>
                  <th className="py-3 px-4 fw-medium border-0 text-center" style={{ width: '130px' }}>สถานะ</th>
                  <th className="py-3 px-4 fw-medium border-0 text-center" style={{ width: '130px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredJobs.map((job, index) => (
                  <tr key={index}>
                    <td className="py-3 px-3 text-center fw-bold text-muted">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-dark mb-1">{job.title}</div>
                      <div className="small text-secondary mb-1">{job.announcementName}</div>
                      <div className="small text-muted mb-1"><i className="bi bi-building me-1"></i> {job.facultyName} / {job.deptName}</div>
                      <div className="small text-muted mb-1"><i className="bi bi-people me-1"></i> รับ {job.quantity} อัตรา</div>
                      <div className="small text-muted"><i className="bi bi-calendar3 me-1"></i> {job.openDate} - {job.closeDate}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {job.pendingReview > 0 ? (
                        <div className="d-inline-flex flex-column align-items-center">
                          <span className="badge bg-warning bg-opacity-25 text-warning-emphasis border border-warning px-3 py-2 fs-6 rounded-pill fw-bold">
                            <i className="bi bi-hourglass-split me-1"></i> {job.pendingReview} คน
                          </span>
                          <span className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                            รอคัดเลือกเบื้องต้น
                          </span>
                        </div>
                      ) : (
                        <span className="badge bg-light text-muted border px-3 py-2 rounded-pill">
                          <i className="bi bi-check-circle me-1 text-success"></i> ไม่มีค้างตรวจ
                        </span>
                      )}
                      <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                        ผู้สมัครรวม {job.totalApplicants} คน
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge ${job.status === 'เปิดรับสมัคร' ? 'bg-success' : 'bg-secondary'} rounded-pill px-3 py-2 fw-normal`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link 
                        to={`/faculty-review/${job.rawId || job.id}`} 
                        className="btn btn-sm px-3 text-white shadow-sm fw-medium text-nowrap" 
                        style={{ backgroundColor: '#03A96B', borderRadius: '6px' }}
                      >
                        <i className="bi bi-person-check-fill me-1"></i> ตรวจสอบผู้สมัคร
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List: แสดงบนจอมือถือถึงแท็บเล็ต (ต่ำกว่า lg) */}
          <div className="d-lg-none bg-white p-3">
            <div className="d-flex flex-column gap-3">
              {filteredJobs.map((job, index) => (
                <div key={index} className="card border shadow-sm" style={{ borderRadius: '10px' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="fw-bold text-secondary small bg-light px-2 py-1 rounded border">ลำดับที่ {index + 1}</span>
                      <span className={`badge ${job.status === 'เปิดรับสมัคร' ? 'bg-success' : 'bg-secondary'} rounded-pill`}>
                        {job.status}
                      </span>
                    </div>
                    <h6 className="fw-bold mb-1">{job.title}</h6>
                    <div className="small text-secondary mb-1">{job.announcementName}</div>
                    <div className="small text-muted mb-1"><i className="bi bi-building me-1"></i> {job.facultyName} / {job.deptName}</div>
                    <div className="small text-muted mb-1"><i className="bi bi-people me-1"></i> รับ {job.quantity} อัตรา</div>
                    <div className="small text-muted mb-3">
                      <i className="bi bi-calendar3 me-1"></i> {job.openDate} - {job.closeDate}
                    </div>
                    <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded mb-3">
                      <div>
                        <div className="small text-muted fw-medium">รอการคัดเลือกเบื้องต้น:</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>ผู้สมัครรวม {job.totalApplicants} คน</div>
                      </div>
                      <div>
                        {job.pendingReview > 0 ? (
                          <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                            <i className="bi bi-hourglass-split me-1"></i> {job.pendingReview} คน
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border px-2 py-1">ไม่มีค้างตรวจ</span>
                        )}
                      </div>
                    </div>
                    <Link 
                      to={`/faculty-review/${job.rawId || job.id}`} 
                      className="btn w-100 text-white shadow-sm fw-medium" 
                      style={{ backgroundColor: '#03A96B', borderRadius: '8px' }}
                    >
                      <i className="bi bi-person-check-fill me-2"></i>ตรวจสอบผู้สมัคร
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* กรณีไม่มีข้อมูล */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-5 text-muted bg-white">
              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
              {filterCandidateOnly 
                ? 'ไม่มีประกาศของคณะที่ตรงกับตำแหน่งที่ผู้สมัครท่านนี้ยื่นสมัคร'
                : 'ไม่มีประกาศรับสมัครงานในขณะนี้'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}