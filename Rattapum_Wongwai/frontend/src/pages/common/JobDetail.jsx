import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3000/api/job-search/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          const d = result.data;

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
      .catch(err => console.error("Error fetching job details:", err))
      .finally(() => setLoading(false));

    if (currentUser.citizenId && id) {
      const emailParam = currentUser.email ? `?email=${encodeURIComponent(currentUser.email.trim())}` : '';
      fetch(`http://localhost:3000/api/applications/check-status/${id}/${currentUser.citizenId}${emailParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.hasApplied) {
            setHasApplied(true);
          } else {
            setHasApplied(false);
          }
        })
        .catch(err => console.error("Error checking applied status:", err));
    }
  }, [id, currentUser.citizenId, currentUser.email]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status"></div>
        <div className="text-muted small">กำลังโหลดข้อมูลประกาศรับสมัคร...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: '600px' }}>
        <div className="p-4 bg-white rounded-3 border text-center">
          <i className="bi bi-info-circle text-muted fs-1 d-block mb-3"></i>
          <h5 className="fw-bold text-dark mb-2">ไม่พบข้อมูลประกาศรับสมัครงาน</h5>
          <p className="text-muted small mb-4">ประกาศนี้อาจปิดรับสมัครแล้ว หรือไม่พบรหัสประกาศในระบบ</p>
          <Link to="/jobs" className="btn btn-outline-secondary px-4 py-2 text-sm">
            <i className="bi bi-arrow-left me-2"></i>กลับสู่หน้ารายการตำแหน่งงาน
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: '960px', fontFamily: 'inherit' }}>

      {/* 🧭 Breadcrumb & Back navigation */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 d-print-none">
        <Link to="/jobs" className="text-decoration-none text-muted small d-inline-flex align-items-center hover-opacity">
          <i className="bi bi-chevron-left me-1"></i> ย้อนกลับไปรายการประกาศงาน
        </Link>
        <div className="d-flex gap-2">
          {job.fileUrl ? (
            <a
              href={job.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center shadow-sm fw-medium"
              title="ดาวน์โหลดไฟล์ประกาศฉบับเต็ม (PDF) ที่ HR อัปโหลด"
            >
              <i className="bi bi-file-earmark-pdf-fill me-1 text-danger"></i> พิมพ์ / ดาวน์โหลดประกาศ (PDF)
            </a>
          ) : (
            <button
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center text-muted"
              disabled
              style={{ opacity: 0.6 }}
              title="ไม่มีไฟล์ประกาศที่ HR อัปโหลด"
            >
              <i className="bi bi-file-earmark-x me-1"></i> ไม่มีไฟล์ประกาศ (PDF)
            </button>
          )}
          {hasApplied ? (
            <Link to="/my-applications" className="btn btn-sm btn-secondary text-white d-inline-flex align-items-center">
              <i className="bi bi-check2-circle me-1 text-warning"></i> สมัครแล้ว
            </Link>
          ) : (
            <Link to={`/apply/${job.id}`} className="btn btn-sm text-white px-3 d-inline-flex align-items-center" style={{ backgroundColor: '#03A96B' }}>
              <i className="bi bi-pencil-square me-1"></i> สมัครงาน
            </Link>
          )}
        </div>
      </div>

      {/* 📄 Main Content Card (Clean & Minimalist Style) */}
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

        {/* 📌 หมวดที่ 3: วิธีการและลำดับการสอบคัดเลือก */}
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

        {/* 📌 Action buttons at bottom of document */}
        <div className="pt-4 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 d-print-none">
          <Link to="/jobs" className="btn btn-sm btn-outline-secondary px-3">
            <i className="bi bi-arrow-left me-1"></i> กลับหน้ารายการ
          </Link>
          <div className="d-flex gap-2">
            {job.fileUrl ? (
              <a
                href={job.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn btn-sm btn-outline-danger px-3 shadow-sm d-inline-flex align-items-center fw-medium"
                title="ดาวน์โหลดไฟล์ประกาศฉบับเต็ม (PDF) ที่ HR อัปโหลด"
              >
                <i className="bi bi-file-earmark-pdf-fill me-1 text-danger"></i> พิมพ์ / ดาวน์โหลดประกาศ (PDF)
              </a>
            ) : (
              <button
                className="btn btn-sm btn-outline-secondary px-3 d-inline-flex align-items-center text-muted"
                disabled
                style={{ opacity: 0.6 }}
                title="ไม่มีไฟล์ประกาศที่ HR อัปโหลด"
              >
                <i className="bi bi-file-earmark-x me-1"></i> ไม่มีไฟล์ประกาศ (PDF)
              </button>
            )}
            {hasApplied ? (
              <Link to="/my-applications" className="btn btn-sm btn-secondary text-white px-4">
                <i className="bi bi-check2-circle me-1 text-warning"></i> สมัครตำแหน่งนี้แล้ว
              </Link>
            ) : (
              <Link to={`/apply/${job.id}`} className="btn btn-sm text-white px-4 fw-medium" style={{ backgroundColor: '#03A96B' }}>
                <i className="bi bi-pencil-square me-1"></i> สมัครงานตำแหน่งนี้
              </Link>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}