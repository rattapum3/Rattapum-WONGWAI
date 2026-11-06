import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function JobAnnouncementDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [positionExams, setPositionExams] = useState([]);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);

  const toggleAccordion = (index, currentActive) => {
    setOpenAccordion(currentActive === index ? -1 : index);
  };

  useEffect(() => {
    setLoading(true);

    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      const cleanStr = String(dateStr).split('T')[0].split(' ')[0].trim();
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12) {
          const yearBe = y > 2400 ? y : y + 543;
          return `${d} ${thaiMonths[m]} ${yearBe}`;
        }
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      const y = date.getFullYear();
      const yearBe = y > 2400 ? y : y + 543;
      return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${yearBe}`;
    };

    // 1. Fetch Job Details
    const fetchJob = fetch(`http://localhost:3000/api/job-search/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          const d = result.data;

          let salaryText = "-";
          if (d.salaryMin || d.salaryMax) {
            const minStr = d.salaryMin ? Number(d.salaryMin).toLocaleString() : '';
            const maxStr = d.salaryMax ? Number(d.salaryMax).toLocaleString() : '';
            if (minStr && maxStr) salaryText = `${minStr} - ${maxStr} บาท`;
            else if (minStr) salaryText = `${minStr} บาท`;
            else if (maxStr) salaryText = `สูงสุด ${maxStr} บาท`;
          }

          setJob({
            ...d,
            openDateFormatted: formatDate(d.openDate),
            closeDateFormatted: formatDate(d.closeDate),
            salaryText
          });
        }
      })
      .catch(err => console.error("Error fetching job details:", err));

    // 2. Fetch Applicants and Exam configurations
    const fetchApplicants = fetch(`http://localhost:3000/api/applications/recruitment/${id}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setApplicants(resData.data || []);
          setPositionExams(resData.positionExams || []);
        }
      })
      .catch(err => console.error("Error fetching applicants:", err));

    Promise.all([fetchJob, fetchApplicants]).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-secondary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status"></div>
        <div className="text-muted small">กำลังโหลดข้อมูลตำแหน่งงานและประกาศผล...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: '600px' }}>
        <div className="p-4 bg-white rounded-3 border text-center shadow-sm">
          <i className="bi bi-info-circle text-muted fs-1 d-block mb-3"></i>
          <h5 className="fw-bold text-dark mb-2">ไม่พบข้อมูลตำแหน่งงาน</h5>
          <p className="text-muted small mb-4">ไม่พบรหัสตำแหน่งงานในระบบ หรืออาจถูกลบออกจากระบบแล้ว</p>
          <Link to="/jobs" className="btn btn-outline-secondary px-4 py-2 text-sm">
            <i className="bi bi-arrow-left me-2"></i>กลับสู่หน้ารายการตำแหน่งงาน
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // จัดเตรียมข้อมูลประกาศผล (3 ส่วน)
  // ==========================================
  // จัดเตรียมข้อมูลรอบการรับสมัคร และประกาศผล
  // ==========================================

  // คำนวณรอบการรับสมัครทั้งหมด (เรียงจากรอบล่าสุดไปรอบแรก เพื่อให้แสดงรอบล่าสุดก่อน)
  const maxRound = Math.max(
    Number(job?.round || job?.roundNo || 1),
    ...applicants.map(a => Number(a.roundNo || 1)),
    1
  );
  const roundsSet = new Set();
  for (let r = 1; r <= maxRound; r++) {
    roundsSet.add(r);
  }
  applicants.forEach(a => {
    if (a.roundNo) roundsSet.add(Number(a.roundNo));
  });
  const availableRounds = Array.from(roundsSet).sort((a, b) => b - a);

  const latestRound = availableRounds[0] || 1;
  const currentActiveRound = (selectedRound !== null && selectedRound !== 'all') ? selectedRound : latestRound;

  // กรองผู้สมัครตามรอบที่เลือก (ค่าเริ่มต้นคือรอบล่าสุด และแสดงทีละรอบ)
  const filteredApplicants = applicants.filter(a => Number(a.roundNo || 1) === Number(currentActiveRound));

  // 1. ประกาศรายชื่อผู้ผ่านการคัดเลือกเบื้องต้น
  const initialQualifiedApplicants = filteredApplicants.filter(a => {
    const st = (a.qualStatus || '').trim();
    return st === 'ผ่านการคัดเลือกเบื้องต้น' || (st.includes('ผ่าน') && !st.includes('ไม่ผ่าน'));
  });

  // 2. รายชื่อผู้มีสิทธิ์สอบแต่ละประเภท (อิงตาม positionExams เรียงตามลำดับ)
  const examAnnouncements = positionExams.map((exam, examIdx) => {
    // กรองเฉพาะผู้ที่ผ่านการคัดเลือกเบื้องต้น และไม่ตกสอบในรอบก่อนหน้า
    const qualifiedCandidates = filteredApplicants.filter(a => {
      const qual = (a.qualStatus || '').trim();
      const isQualPassed = qual === 'ผ่านการคัดเลือกเบื้องต้น' || (qual.includes('ผ่าน') && !qual.includes('ไม่ผ่าน'));
      if (!isQualPassed) return false;

      // ตรวจสอบการสอบรอบก่อนหน้า (ถ้ามี)
      for (let j = 0; j < examIdx; j++) {
        const prevExam = positionExams[j];
        const prevApplicantExam = a.exams?.find(e => e.Exam_position_type_id === prevExam.id);
        if (prevApplicantExam && prevApplicantExam.status && prevApplicantExam.status.includes('ไม่ผ่าน')) {
          return false;
        }
      }

      // หากถูกปรับสถานะขั้นสุดท้ายเป็นไม่ผ่าน
      if (a.finalStatus && a.finalStatus.includes('ไม่ผ่าน')) {
        return false;
      }

      return true;
    });

    // map ข้อมูลวัน เวลา สถานที่สอบของแต่ละคน
    const candidates = qualifiedCandidates.map(a => {
      const appExam = a.exams?.find(e => e.Exam_position_type_id === exam.id);
      const date = (appExam?.date && appExam.date !== 'รอกำหนดการ' && !appExam.date.startsWith('0000')) ? appExam.date : 'อยู่ระหว่างดำเนินการ';
      const time = (appExam?.time && appExam.time !== 'รอกำหนดการ' && appExam.time !== '00:00:00') ? appExam.time : 'อยู่ระหว่างดำเนินการ';
      const location = (appExam?.location && appExam.location !== 'รอกำหนดการ') ? appExam.location : 'อยู่ระหว่างดำเนินการ';

      return {
        id: a.id,
        name: a.name,
        roundNo: a.roundNo || 1,
        date,
        time,
        location
      };
    });

    const examName = exam.name || 'การสอบ';
    const examTitle = examName.startsWith('สอบ')
      ? `รายชื่อผู้มีสิทธิ์${examName}`
      : `รายชื่อผู้มีสิทธิ์สอบ${examName}`;

    const examAnnouncementFile = exam.announcementFile?.trim() || null;
    const examFileUrl = examAnnouncementFile
      ? (examAnnouncementFile.startsWith('http')
          ? examAnnouncementFile
          : (exam.fileUrl || `http://localhost:3000/uploads/exam_announcements/${examAnnouncementFile}`))
      : null;

    return {
      id: `exam-${exam.id}`,
      title: examTitle,
      examName: examName,
      isAnnounced: Boolean(exam.isAnnounced),
      fileUrl: examFileUrl,
      candidates
    };
  });

  // 3. รายชื่อผู้ผ่านการคัดเลือก (รอบสุดท้าย)
  const finalSelectedApplicants = filteredApplicants.filter(a => {
    const f = (a.finalStatus || '').trim();
    const q = (a.qualStatus || '').trim();
    return f === 'ได้งาน' || f === 'ผ่านการคัดเลือก' || q === 'ได้งาน';
  });

  // รวบรวม Accordion ทั้งหมด (เฉพาะผู้มีสิทธิ์สอบแต่ละประเภท และผู้ผ่านการคัดเลือก)
  const accordions = [
    ...examAnnouncements.map((ea, idx) => ({
      id: ea.id,
      title: ea.title,
      badge: `รอบการทดสอบที่ ${idx + 1}`,
      type: 'exam',
      isAnnounced: Boolean(ea.isAnnounced),
      fileUrl: ea.fileUrl || null,
      candidates: ea.candidates
    })),
    {
      id: 'final',
      title: 'รายชื่อผู้ผ่านการคัดเลือก',
      badge: 'ผลการคัดเลือก',
      type: 'simple',
      isAnnounced: Boolean(job?.isFinalAnnounced),
      fileUrl: job?.finalAnnouncementFile ? (job?.finalFileUrl || `http://localhost:3000/uploads/exam_announcements/${job.finalAnnouncementFile}`) : null,
      candidates: finalSelectedApplicants
    }
  ];

  // Auto-detect active accordion index without conditional hooks
  const defaultAnnouncedIndex = accordions.findIndex(a => a.isAnnounced && a.candidates && a.candidates.length > 0);
  const activeAccordionIndex = openAccordion !== null ? openAccordion : (defaultAnnouncedIndex !== -1 ? defaultAnnouncedIndex : 0);

  return (
    <div className="container py-4" style={{ maxWidth: '960px', fontFamily: 'inherit' }}>

      {/* 🧭 Breadcrumb & Navigation */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 d-print-none">
        <Link to="/jobs" className="text-decoration-none text-muted small d-inline-flex align-items-center hover-opacity">
          <i className="bi bi-chevron-left me-1"></i> ย้อนกลับไปรายการประกาศงาน
        </Link>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-secondary text-white d-inline-flex align-items-center" disabled>
            <i className="bi bi-x-circle me-1"></i> หมดเขตรับสมัครแล้ว
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 📢 ส่วนประกาศผลการคัดเลือก / รายชื่อผู้มีสิทธิสอบ (Accordion) */}
      {/* ======================================================= */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1 text-dark d-flex align-items-center">
              <i className="bi bi-megaphone-fill me-2 text-warning"></i>
              ประกาศผลการคัดเลือก / รายชื่อผู้มีสิทธิสอบ
            </h4>
            <div className="text-muted small">
              ตำแหน่ง: <span className="fw-semibold text-dark">{job.title}</span> {job.faculty ? `(${job.faculty})` : ''}
            </div>
          </div>
          <span className="badge bg-light text-secondary border px-2 py-1 small">
            ทั้งหมด {accordions.length} ประกาศ
          </span>
        </div>

        {/* เลือกรอบการรับสมัคร (แสดงรอบล่าสุดก่อน และมีให้เลือกรอบได้) */}
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3 p-3 bg-white rounded-3 border shadow-sm flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-bold text-dark d-flex align-items-center gap-1 small">
              <i className="bi bi-clock-history text-success"></i> รอบการรับสมัคร:
            </span>
            <div className="btn-group btn-group-sm shadow-sm" role="group">
              {availableRounds.map(r => {
                const countInRound = applicants.filter(a => Number(a.roundNo || 1) === r).length;
                return (
                  <button
                    key={r}
                    type="button"
                    className={`btn ${currentActiveRound === r ? 'btn-success fw-bold text-white' : 'btn-outline-secondary bg-white'}`}
                    onClick={() => setSelectedRound(r)}
                  >
                    รอบที่ {r} {r === latestRound ? ' (รอบล่าสุด)' : ''} ({countInRound} คน)
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-muted small">
            <span>แสดงเฉพาะผู้สมัครใน <strong className="text-success">รอบที่ {currentActiveRound}</strong> ({filteredApplicants.length} คน)</span>
          </div>
        </div>

        <div className="accordion shadow-sm border rounded-3 overflow-hidden" id="announcementAccordion">
          {accordions.map((item, index) => {
            const isOpen = activeAccordionIndex === index;
            const isAnnounced = Boolean(item.isAnnounced);
            const hasCandidates = isAnnounced && item.candidates && item.candidates.length > 0;

            return (
              <div className="accordion-item border-0 border-bottom" key={item.id}>
                
                <h2 className="accordion-header" id={`heading-${item.id}`}>
                  <button
                    className={`accordion-button ${isOpen ? '' : 'collapsed'}`}
                    type="button"
                    onClick={() => toggleAccordion(index, activeAccordionIndex)}
                    style={{
                      backgroundColor: isOpen ? '#f0fdf4' : '#fff',
                      color: isOpen ? '#03A96B' : '#333',
                      fontWeight: '600',
                      boxShadow: 'none'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between w-100 pe-3 flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${item.type === 'simple' ? (item.id === 'final' ? 'bi-trophy-fill text-warning' : 'bi-person-check-fill text-success') : 'bi-journal-check text-primary'}`}></i>
                        <span>{item.title}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-muted border small fw-normal">
                          {item.badge}
                        </span>
                        {isAnnounced ? (
                          hasCandidates ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small fw-normal">
                              {item.candidates.length} ท่าน
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border small fw-normal">
                              รอบนี้ไม่มีรายชื่อ (0 ท่าน)
                            </span>
                          )
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-muted border small fw-normal">
                            อยู่ระหว่างดำเนินการ
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </h2>

                <div
                  id={`collapse-${item.id}`}
                  className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`}
                >
                  <div className="accordion-body bg-light p-3 p-md-4">
                    {item.fileUrl && (
                      <div className="d-flex justify-content-between align-items-center mb-3 p-2 px-3 bg-white rounded border shadow-sm flex-wrap gap-2">
                        <div className="d-flex align-items-center text-dark small fw-medium">
                          <i className="bi bi-file-earmark-pdf-fill text-danger fs-5 me-2"></i>
                          <span>เอกสารประกาศรายชื่อฉบับทางการ (ลงนามแล้ว)</span>
                        </div>
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="btn btn-sm btn-outline-danger shadow-sm d-inline-flex align-items-center fw-medium"
                          title="คลิกเพื่อเปิดอ่านหรือดาวน์โหลดประกาศฉบับลงนาม (PDF)"
                        >
                          <i className="bi bi-download me-1"></i> ดาวน์โหลดประกาศ (PDF)
                        </a>
                      </div>
                    )}

                    {!hasCandidates ? (
                      <div className="p-4 text-center bg-white rounded-2 border text-muted">
                        {!isAnnounced ? (
                          <>
                            <i className="bi bi-hourglass-split fs-3 d-block mb-2 text-secondary opacity-75"></i>
                            <span className="fw-medium text-dark">อยู่ระหว่างดำเนินการ</span>
                            <div className="text-secondary small mt-1">ยังไม่มีการเผยแพร่ประกาศรายชื่อในระบบ</div>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-person-slash fs-3 d-block mb-2 text-secondary opacity-75"></i>
                            <span className="fw-medium text-dark">
                              ไม่มีผู้มีสิทธิ์ในรอบที่ {currentActiveRound}
                            </span>
                            <div className="text-secondary small mt-1">
                              ท่านสามารถคลิกเลือกดูรอบอื่น เช่น {availableRounds.filter(r => r !== currentActiveRound).map(r => `รอบที่ ${r}`).join(', ') || '-'} จากแถบเลือกรอบด้านบน
                            </div>
                          </>
                        )}
                      </div>
                    ) : item.type === 'exam' ? (
                      /* ตารางผู้มีสิทธิสอบ: ลำดับ, ชื่อ นามสกุล, วันที่สอบ, เวลาที่สอบ, สถานที่สอบ */
                      <div className="table-responsive bg-white rounded-2 border shadow-sm">
                        <table className="table table-hover mb-0 align-middle small">
                          <thead className="table-light text-muted">
                            <tr>
                              <th className="py-3 px-3 text-center" style={{ width: '70px' }}>ลำดับ</th>
                              <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                              <th className="py-3 px-3 text-nowrap">วันที่สอบ</th>
                              <th className="py-3 px-3 text-nowrap">เวลาที่สอบ</th>
                              <th className="py-3 px-4">สถานที่สอบ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.candidates.map((cand, cIdx) => (
                              <tr key={cand.id || cIdx}>
                                <td className="py-3 px-3 text-center text-muted fw-medium">{cIdx + 1}</td>
                                <td className="py-3 px-4 fw-medium text-dark text-nowrap">
                                  {cand.name}
                                  {cand.roundNo && (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small ms-2 fw-normal">
                                      รอบที่ {cand.roundNo}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-nowrap">
                                  {cand.date === 'อยู่ระหว่างดำเนินการ' ? (
                                    <span className="text-muted fst-italic">อยู่ระหว่างดำเนินการ</span>
                                  ) : (
                                    <span className="text-dark"><i className="bi bi-calendar3 me-1 text-secondary"></i>{cand.date}</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-nowrap">
                                  {cand.time === 'อยู่ระหว่างดำเนินการ' ? (
                                    <span className="text-muted fst-italic">อยู่ระหว่างดำเนินการ</span>
                                  ) : (
                                    <span className="text-danger fw-medium"><i className="bi bi-clock me-1"></i>{cand.time}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {cand.location === 'อยู่ระหว่างดำเนินการ' ? (
                                    <span className="text-muted fst-italic">อยู่ระหว่างดำเนินการ</span>
                                  ) : (
                                    <span><i className="bi bi-geo-alt me-1 text-secondary"></i>{cand.location}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* ตารางผู้ผ่านการคัดเลือกเบื้องต้น & ผู้ผ่านการคัดเลือกรอบสุดท้าย: ลำดับ, ชื่อ นามสกุล */
                      <div className="table-responsive bg-white rounded-2 border shadow-sm" style={{ maxWidth: '600px' }}>
                        <table className="table table-hover mb-0 align-middle small">
                          <thead className="table-light text-muted">
                            <tr>
                              <th className="py-3 px-3 text-center" style={{ width: '80px' }}>ลำดับ</th>
                              <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.candidates.map((cand, cIdx) => (
                              <tr key={cand.id || cIdx}>
                                <td className="py-3 px-3 text-center text-muted fw-medium">{cIdx + 1}</td>
                                <td className="py-3 px-4 fw-medium text-dark">
                                  {cand.name}
                                  {cand.roundNo && (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small ms-2 fw-normal">
                                      รอบที่ {cand.roundNo}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 📄 Main Content Card (รายละเอียดตำแหน่งงาน) */}
      <div className="bg-white border rounded-3 p-4 p-md-5 mb-4 shadow-sm">

        {/* 🏷️ Tags & Position Title */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <span className="badge bg-light text-success border px-2 py-1 small fw-normal">
            {job.type || 'พนักงานมหาวิทยาลัย'}
          </span>
          {job.round && (
            <span className="badge bg-light text-secondary border px-2 py-1 small fw-normal">
              รอบที่ {job.round}
            </span>
          )}
          <span className="badge bg-danger text-white px-2 py-1 small fw-medium">
            <i className="bi bi-lock-fill me-1"></i> ปิดรับสมัครแล้ว
          </span>
        </div>

        <h3 className="fw-bold text-dark mb-2" style={{ lineHeight: '1.4' }}>
          {job.title}
        </h3>

        <div className="text-muted small mb-4 d-flex flex-wrap align-items-center gap-3">
          {job.position && job.position !== '-' && (
            <span><i className="bi bi-briefcase me-1 text-primary"></i>ตำแหน่ง: <strong className="text-dark">{job.position}</strong></span>
          )}
          <span><i className="bi bi-building me-1 text-secondary"></i>{job.faculty}</span>
          {job.department && job.department !== '-' && (
            <span><i className="bi bi-diagram-3 me-1 text-secondary"></i>{job.department}</span>
          )}
        </div>

        {/* 📊 Minimal Key Meta Summary Strip */}
        <div className="row g-3 py-3 px-2 border-top border-bottom my-4 text-center text-sm-start bg-light bg-opacity-50 rounded-2">
          <div className="col-6 col-md-3">
            <div className="text-muted" style={{ fontSize: '12px' }}>จำนวนเปิดรับ</div>
            <div className="fw-bold text-dark mt-1 fs-6">{job.amount} <span className="text-muted fw-normal" style={{ fontSize: '13px' }}>อัตรา</span></div>
          </div>
          <div className="col-6 col-md-3 border-start-md">
            <div className="text-muted" style={{ fontSize: '12px' }}>อัตราเงินเดือน</div>
            <div className="fw-bold text-dark mt-1 fs-6">{job.salaryText}</div>
          </div>
          <div className="col-6 col-md-3 border-start-md">
            <div className="text-muted" style={{ fontSize: '12px' }}>เริ่มรับสมัคร</div>
            <div className="fw-bold text-dark mt-1 fs-6">{job.openDateFormatted}</div>
          </div>
          <div className="col-6 col-md-3 border-start-md">
            <div className="text-muted" style={{ fontSize: '12px' }}>ปิดรับสมัคร</div>
            <div className="fw-bold text-danger mt-1 fs-6">{job.closeDateFormatted}</div>
          </div>
        </div>

        {/* 📢 รายละเอียดเพิ่มเติม (ถ้ามี) */}
        {job.announcementDetail && (
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-2">รายละเอียดประกาศ</h6>
            <p className="text-secondary small mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>
              {job.announcementDetail}
            </p>
          </div>
        )}

        <hr className="my-4 text-muted opacity-25" />

        {/* 📌 หมวดที่ 1: คุณสมบัติของผู้สมัคร */}
        <section className="mb-4">
          <h6 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center">
            <i className="bi bi-person-check me-2 text-success"></i> คุณสมบัติของผู้สมัคร
          </h6>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-2 border-0 h-100">
                <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>วุฒิการศึกษาขั้นต่ำ</span>
                <span className="fw-medium text-dark">{job.minEducation || '-'}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 bg-light rounded-2 border-0 h-100">
                <span className="text-muted d-block mb-1" style={{ fontSize: '12px' }}>สาขาวิชาเอกที่เปิดรับ</span>
                <span className="fw-medium text-dark">
                  {job.majors && job.majors.length > 0 ? job.majors.join(', ') : (job.requiredMajor || '-')}
                </span>
              </div>
            </div>
          </div>

          {/* คุณสมบัติเฉพาะสำหรับตำแหน่ง */}
          {job.applicantDetail && job.applicantDetail !== '-' && (
            <div className="mb-3">
              <span className="text-muted d-block mb-1 small fw-medium">คุณสมบัติเฉพาะสำหรับตำแหน่ง:</span>
              <div className="text-dark small p-3 bg-light rounded-2" style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>
                {job.applicantDetail}
              </div>
            </div>
          )}

          {/* คุณสมบัติทั่วไป & ลักษณะต้องห้าม */}
          <div className="row g-3 mb-3">
            {job.generalQuals && job.generalQuals.length > 0 && (
              <div className="col-md-6">
                <span className="text-muted d-block mb-2 small fw-medium">คุณสมบัติทั่วไป:</span>
                <ul className="list-unstyled mb-0 small text-secondary">
                  {job.generalQuals.map((g, idx) => (
                    <li key={idx} className="mb-1 d-flex align-items-start gap-2">
                      <i className="bi bi-dot text-success fs-5 lh-1"></i>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.prohibitedTraits && job.prohibitedTraits.length > 0 && (
              <div className="col-md-6">
                <span className="text-muted d-block mb-2 small fw-medium">ลักษณะต้องห้าม:</span>
                <ul className="list-unstyled mb-0 small text-secondary">
                  {job.prohibitedTraits.map((p, idx) => (
                    <li key={idx} className="mb-1 d-flex align-items-start gap-2">
                      <i className="bi bi-dot text-danger fs-5 lh-1"></i>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ความสามารถและคุณสมบัติอื่นที่ต้องการ */}
          {job.otherAbilities && job.otherAbilities.filter(Boolean).length > 0 && (
            <div className="mb-3">
              <span className="text-muted d-block mb-2 small fw-medium">ความสามารถและคุณสมบัติอื่นที่ต้องการ:</span>
              <ul className="list-unstyled mb-0 small text-secondary">
                {job.otherAbilities.filter(Boolean).map((o, idx) => (
                  <li key={idx} className="mb-1 d-flex align-items-start gap-2">
                    <i className="bi bi-check text-success"></i>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* เกณฑ์คะแนนภาษาอังกฤษ */}
          {job.engTests && job.engTests.length > 0 && (
            <div className="mb-3">
              <span className="text-muted d-block mb-2 small fw-medium">เกณฑ์คะแนนภาษาอังกฤษ:</span>
              <div className="table-responsive border rounded-2">
                <table className="table table-sm table-hover mb-0 align-middle small">
                  <thead className="table-light text-muted">
                    <tr>
                      <th className="py-2 px-3">ประเภทการทดสอบ</th>
                      <th className="py-2 px-3 text-end">คะแนนขั้นต่ำ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.engTests.map((t, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">{t.testName}</td>
                        <td className="py-2 px-3 text-end fw-medium text-dark">{t.minScore} คะแนน</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* 📌 หมวดที่ 2: ลักษณะงานที่ปฏิบัติและหน้าที่รับผิดชอบ */}
        {job.jobResponsibilities && job.jobResponsibilities.length > 0 && (
          <section className="mb-4">
            <h6 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center">
              <i className="bi bi-briefcase me-2 text-primary"></i> ลักษณะงานที่ปฏิบัติและหน้าที่รับผิดชอบ
            </h6>
            <ol className="mb-0 text-secondary small ps-3" style={{ lineHeight: '1.8' }}>
              {job.jobResponsibilities.map((r, idx) => (
                <li key={idx} className="mb-1">{r}</li>
              ))}
            </ol>
          </section>
        )}

        {/* 📌 หมวดที่ 3: วิธีการและขั้นตอนการคัดเลือก */}
        {job.exams && job.exams.length > 0 && (
          <section className="mb-4">
            <h6 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center">
              <i className="bi bi-journal-check me-2 text-warning"></i> วิธีการและขั้นตอนการคัดเลือก
            </h6>
            <div className="row g-2">
              {job.exams.map((e, idx) => (
                <div key={idx} className="col-md-6">
                  <div className="p-3 bg-light rounded-2 border h-100">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold text-dark small">{idx + 1}. {e.type}</span>
                    </div>
                    <div className="text-muted small" style={{ lineHeight: '1.6' }}>
                      {e.details || 'การประเมินความรู้ความสามารถเฉพาะตำแหน่ง'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 📌 หมวดที่ 4: เอกสารหลักฐานที่ต้องยื่น และ ค่าธรรมเนียม */}
        <section className="mb-4">
          <h6 className="fw-bold text-dark mb-3 pb-2 border-bottom d-flex align-items-center">
            <i className="bi bi-file-earmark-text me-2 text-secondary"></i> เอกสารหลักฐานและเงื่อนไขการสมัคร
          </h6>

          {job.feeDetails && (
            <div className="mb-3 p-3 bg-light rounded-2 d-flex align-items-center justify-content-between">
              <span className="small text-muted">ค่าธรรมเนียมการสมัคร</span>
              <span className="fw-bold text-dark small">{job.feeDetails}</span>
            </div>
          )}

          {job.documents && job.documents.length > 0 && (
            <div className="mb-3">
              <span className="text-muted d-block mb-2 small fw-medium">รายการเอกสารที่ต้องแนบ:</span>
              <div className="table-responsive border rounded-2">
                <table className="table table-sm table-hover mb-0 align-middle small">
                  <thead className="table-light text-muted">
                    <tr>
                      <th className="py-2 px-3" style={{ width: '8%' }}>ลำดับ</th>
                      <th className="py-2 px-3" style={{ width: '35%' }}>ชื่อเอกสาร</th>
                      <th className="py-2 px-3" style={{ width: '57%' }}>รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.documents.map((doc, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-muted">{idx + 1}</td>
                        <td className="py-2 px-3 fw-medium text-dark">{doc.name}</td>
                        <td className="py-2 px-3 text-secondary">{doc.detail || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {job.appSteps && job.appSteps.length > 0 && (
            <div className="mt-3">
              <span className="text-muted d-block mb-2 small fw-medium">ขั้นตอนการดำเนินการสมัคร:</span>
              <ol className="mb-0 text-secondary small ps-3" style={{ lineHeight: '1.7' }}>
                {job.appSteps.map((step, idx) => (
                  <li key={idx} className="mb-1">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* เงื่อนไขและข้อกำหนดในการสมัคร */}
          {job.appConditions && (
            <div className="mt-3 p-3 bg-light rounded-2 border-start border-4 border-warning">
              <span className="text-dark d-block mb-2 small fw-bold d-flex align-items-center">
                <i className="bi bi-shield-exclamation text-warning me-2 fs-6"></i>
                เงื่อนไขและข้อกำหนดในการสมัคร:
              </span>
              <p className="text-secondary small mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>
                {job.appConditions}
              </p>
            </div>
          )}
        </section>

        {/* 📌 ปุ่มด้านล่างของรายละเอียดตำแหน่งงาน */}
        <div className="pt-4 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 d-print-none">
          <Link to="/jobs" className="btn btn-sm btn-outline-secondary px-3">
            <i className="bi bi-arrow-left me-1"></i> กลับหน้ารายการ
          </Link>
          <div className="d-flex gap-2">
            {job.fileUrl && (
              <a
                href={job.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn btn-sm btn-outline-danger px-3 shadow-sm d-inline-flex align-items-center fw-medium"
                title="ดาวน์โหลดไฟล์ประกาศรับสมัครงานเดิม (PDF)"
              >
                <i className="bi bi-file-earmark-pdf-fill me-1 text-danger"></i> ดาวน์โหลดประกาศรับสมัครงานเดิม (PDF)
              </a>
            )}
            <button className="btn btn-sm btn-secondary text-white px-4" disabled>
              <i className="bi bi-x-circle me-1"></i> หมดเขตรับสมัครแล้ว
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}