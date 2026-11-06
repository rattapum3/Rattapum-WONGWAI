import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ApplicationStatus() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    fetch(`http://localhost:3000/api/applications/${id}/tracking`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApplication(data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // ฟังก์ชันช่วยกำหนดสีของ Step 
  const getStepStyle = (stepNumber) => {
    const isPassed = application?.overallStatus === 'ผ่าน' || application?.overallStatus === 'ผ่านการคัดเลือก' || application?.overallStatus === 'ได้งาน';
    const isFailed = application?.overallStatus === 'ไม่ผ่าน' || application?.overallStatus?.includes('ไม่ผ่าน');
    const currentStep = application?.currentStep || 1;

    // หากผ่านการคัดเลือกแล้ว ทุกขั้นตอนรวมถึงขั้นตอนสุดท้ายสรุปผลต้องเป็นสีเขียว
    if (isPassed) {
      return { bg: '#03A96B', text: 'white', icon: 'bi-check-lg' };
    }

    if (isFailed && stepNumber === currentStep) {
      return { bg: '#dc3545', text: 'white', icon: 'bi-x-lg' };
    }

    if (currentStep > stepNumber) {
      // ผ่านมาแล้ว (สีเขียว)
      return { bg: '#03A96B', text: 'white', icon: 'bi-check-lg' };
    } else if (currentStep === stepNumber) {
      // กำลังอยู่ในขั้นตอนนี้ (สีส้ม/ฟ้า)
      return { bg: '#ff9800', text: 'white', icon: 'bi-hourglass-split' };
    } else {
      // ยังไปไม่ถึง (สีเทา)
      return { bg: '#e0e0e0', text: '#777', icon: 'bi-circle-fill' };
    }
  };

  // สร้างรายการขั้นตอนสอบแบบไดนามิกจากข้อมูลจริงของ DB
  const getDynamicSteps = () => {
    if (!application) return [];

    const steps = [
      { id: 1, title: 'ตรวจสอบคุณสมบัติเบื้องต้น' }
    ];

    if (application.exams && application.exams.length > 0) {
      application.exams.forEach((ex, idx) => {
        steps.push({
          id: idx + 2,
          title: ex.name,
          exam: ex
        });
      });
    }

    steps.push({ id: steps.length + 1, title: 'สรุปผลการคัดเลือก' });
    return steps;
  };

  // ฟังก์ชันช่วยกำหนดสีของสถานะรายวิชา
  const getExamStatusBadge = (status) => {
    if (!status) return "badge bg-light text-dark";
    if (status.includes("ผ่าน") && !status.includes("ไม่ผ่าน")) return "badge bg-success bg-opacity-10 text-success border border-success px-2 py-1";
    if (status.includes("รอ")) return "badge bg-warning bg-opacity-10 text-dark border border-warning px-2 py-1";
    if (status.includes("ไม่ผ่าน")) return "badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1";
    return "badge bg-light text-dark px-2 py-1";
  };

  // ฟังก์ชันแสดง Badge สถานะหลัก
  const getStatusBadge = (status) => {
    const s = String(status || '').trim();
    if (s === 'ผ่าน' || s === 'ผ่านการคัดเลือก' || s === 'ได้งาน') {
      return <span className="badge bg-success text-white px-3 py-2 fs-6 shadow-sm"><i className="bi bi-check-circle-fill me-1"></i>ผ่านการคัดเลือก</span>;
    }
    if (s === 'ไม่ผ่าน' || s === 'ไม่ผ่านการคัดเลือก' || s.includes('ไม่ผ่าน')) {
      return <span className="badge bg-danger text-white px-3 py-2 fs-6 shadow-sm"><i className="bi bi-x-circle-fill me-1"></i>ไม่ผ่านการคัดเลือก</span>;
    }
    if (s === 'รอพิจารณา' || s === 'ผ่านการคัดเลือกเบื้องต้น' || s === 'ตรวจสอบแล้ว') {
      return <span className="badge bg-warning text-dark px-3 py-2 fs-6 shadow-sm"><i className="bi bi-hourglass-split me-1"></i>อยู่ระหว่างการทดสอบ / รอพิจารณา</span>;
    }
    return <span className="badge bg-info text-dark px-3 py-2 fs-6 shadow-sm"><i className="bi bi-building me-1"></i>รอคณะ/หน่วยงานพิจารณา</span>;
  };

  const dynamicSteps = getDynamicSteps();

  return (
    <div className="container-fluid py-4 py-md-5" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '1000px' }}>

        {/* ส่วนหัวหน้าจอ */}
        <div className="mb-4 d-flex align-items-center gap-3">
          <Link to="/my-applications" className="btn btn-outline-secondary btn-sm rounded-circle px-2 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
            <i className="bi bi-arrow-left fs-5"></i>
          </Link>
          <div>
            <h2 className="mb-1 fw-bold fs-4 fs-md-2" style={{ color: '#006664' }}>
              ติดตามสถานะการสมัครงาน
            </h2>
            <p className="text-muted small mb-0">ยินดีต้อนรับ, {currentUser.name || 'ผู้สมัคร'}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success me-2" role="status"></div>
            กำลังโหลดข้อมูลสถานะการสมัคร...
          </div>
        ) : !application ? (
          <div className="text-center py-5 text-danger fw-bold">ไม่พบข้อมูลการสมัครสำหรับรหัสนี้</div>
        ) : (
          <>
            {/* การ์ดสรุปข้อมูลใบสมัคร */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', borderTop: '4px solid #006664' }}>
              <div className="card-body p-3 p-md-5">

                <div className="row g-3 mb-4">
                  <div className="col-md-7">
                    <h5 className="text-muted mb-1 small uppercase fw-bold">ตำแหน่งที่สมัคร</h5>
                    <h3 className="fw-bold text-dark mb-3 fs-4 fs-md-3">{application.jobTitle}</h3>
                    <div className="d-flex flex-column gap-2 text-muted small bg-light p-3 rounded-3 border">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-building text-success me-2 fs-6"></i>
                        <span><strong>คณะ:</strong> {application.facultyName || '-'}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-diagram-3 text-primary me-2 fs-6"></i>
                        <span><strong>หน่วยงาน/ภาควิชา:</strong> {application.departmentName || '-'}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-calendar-event text-danger me-2 fs-6"></i>
                        <span><strong>ช่วงเวลาเปิด-ปิดรับสมัคร:</strong> {application.openDateFormatted || '-'} ถึง {application.closeDateFormatted || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-5 d-flex flex-column align-items-md-end justify-content-start gap-2 pt-2">
                    <div>{getStatusBadge(application.overallStatus)}</div>
                    <div className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                      <i className="bi bi-calendar3 me-1"></i>วันที่ยื่นสมัคร: {application.appliedDate} {application.appliedTime && application.appliedTime !== '-' ? `เวลา ${application.appliedTime} น.` : ''}
                    </div>
                  </div>
                </div>

                {application.statusDescription && (
                  <div className={`alert ${application.overallStatus?.includes('ไม่ผ่าน') ? 'alert-danger' : (application.overallStatus === 'ผ่าน' || application.overallStatus === 'ผ่านการคัดเลือก' || application.overallStatus === 'ได้งาน') ? 'alert-success' : 'alert-warning'} border-0 py-2 px-3 small d-flex align-items-center gap-2 mb-3 mt-1 rounded-3 shadow-sm`}>
                    <i className={`bi ${(application.overallStatus === 'ผ่าน' || application.overallStatus === 'ผ่านการคัดเลือก' || application.overallStatus === 'ได้งาน') ? 'bi-check-circle-fill fs-5' : application.overallStatus?.includes('ไม่ผ่าน') ? 'bi-x-circle-fill fs-5' : 'bi-info-circle-fill fs-5'}`}></i>
                    <div>{application.statusDescription}</div>
                  </div>
                )}

                {/* ======================================================= */}
                {/* UI: Dynamic Progress Stepper */}
                {/* ======================================================= */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 mt-4 pt-3 border-top">
                  <h5 className="fw-bold mb-0" style={{ color: '#006664' }}>
                    <i className="bi bi-list-task me-2"></i>ลำดับขั้นตอนการคัดเลือก ({dynamicSteps.length} ขั้นตอน)
                  </h5>
                </div>

                <div className="overflow-auto pb-4 pt-2">
                  <div className="position-relative mb-2 mt-4 px-2" style={{ minWidth: `${Math.max(600, dynamicSteps.length * 140)}px` }}>
                    {/* แถบเส้นหลัง (Background track line) เริ่มที่ศูนย์กลาง 1 และจบที่ศูนย์กลาง N พอดี ไม่ยื่นเกินออกข้าง */}
                    <div
                      className="position-absolute"
                      style={{
                        top: '21px',
                        height: '4px',
                        backgroundColor: '#e0e0e0',
                        zIndex: 0,
                        left: `${100 / (2 * dynamicSteps.length)}%`,
                        right: `${100 / (2 * dynamicSteps.length)}%`
                      }}
                    />

                    {/* แถบเส้นสีเขียว/แดง (Active progress line) วิ่งจากศูนย์กลาง 1 มาแตะที่ศูนย์กลางของขั้นตอนปัจจุบันพอดี ไม่เกินไปโหนดข้างหน้า */}
                    <div
                      className="position-absolute"
                      style={{
                        top: '21px',
                        height: '4px',
                        backgroundColor: application.overallStatus?.includes('ไม่ผ่าน') ? '#dc3545' : '#03A96B',
                        zIndex: 0,
                        left: `${100 / (2 * dynamicSteps.length)}%`,
                        width: (application.overallStatus === 'ผ่าน' || application.overallStatus === 'ผ่านการคัดเลือก' || application.overallStatus === 'ได้งาน')
                          ? `${100 - (100 / dynamicSteps.length)}%`
                          : `${Math.min(100 - (100 / dynamicSteps.length), Math.max(0, ((application.currentStep - 1) / dynamicSteps.length) * 100))}%`,
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />

                    <div className="d-flex justify-content-between position-relative" style={{ zIndex: 1 }}>
                      {dynamicSteps.map((step) => {
                        const style = getStepStyle(step.id);
                        return (
                          <div key={step.id} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1, flex: 1 }}>
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm"
                              style={{ width: '42px', height: '42px', backgroundColor: style.bg, color: style.text, transition: 'all 0.3s' }}
                            >
                              <i className={`bi ${style.icon} fs-5`}></i>
                            </div>
                            <div className="small fw-bold text-dark text-center lh-sm px-1" style={{ fontSize: '12px' }}>
                              {step.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ======================================================= */}
                {/* เนื้อหาที่จะแสดง (ตารางกำหนดการและคะแนนสอบ) */}
                {/* ======================================================= */}
                <div className="card border shadow-sm rounded-3 mb-4 mt-3">
                  <div className="card-header bg-white py-3 fw-bold text-dark small fs-md-6 d-flex justify-content-between align-items-center">
                    <span><i className="bi bi-calendar-check text-warning me-2"></i>รายละเอียดกำหนดการทดสอบและผลคะแนน</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle" style={{ minWidth: '650px' }}>
                      <thead className="table-light">
                        <tr>
                          <th className="py-3 px-4 small" style={{ width: '5%' }}>ลำดับ</th>
                          <th className="py-3 px-4 small" style={{ width: '30%' }}>วิชา/ประเภทการทดสอบ</th>
                          <th className="py-3 px-4 text-center small">วันที่</th>
                          <th className="py-3 px-4 text-center small">เวลา</th>
                          <th className="py-3 px-4 small">สถานที่ / ห้องสอบ</th>
                          <th className="py-3 px-4 text-center small">คะแนนสอบ</th>
                          <th className="py-3 px-4 text-center small">สถานะผลสอบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {application.exams && application.exams.length > 0 ? (
                          application.exams.map((exam, idx) => (
                            <tr key={idx}>
                              <td className="py-3 px-4 text-muted small">{idx + 1}</td>
                              <td className="py-3 px-4 fw-bold text-dark small">{exam.name}</td>
                              <td className="py-3 px-4 text-center text-primary fw-medium small">{exam.date || '-'}</td>
                              <td className="py-3 px-4 text-center text-danger fw-medium small">{exam.time || '-'}</td>
                              <td className="py-3 px-4 text-muted small">{exam.location || '-'}</td>
                              <td className="py-3 px-4 text-center">
                                {exam.score ? (
                                  exam.score
                                ) : (
                                  <span className="text-muted fw-medium fs-6">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={getExamStatusBadge(exam.status)}>
                                  {exam.status || 'รอจัดสอบ'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-4 text-muted small">
                              <i className="bi bi-clock-history me-2"></i>ขณะนี้ยังไม่มีการกำหนดรายวิชาสอบเพิ่มเติม หรืออยู่ระหว่างรอประกาศผล
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ข้อความหมายเหตุจาก HR */}
                {application.remark && application.remark !== '-' && (
                  <div className="alert alert-info border-0 shadow-sm d-flex align-items-start gap-2 py-3" style={{ borderRadius: '10px' }}>
                    <i className="bi bi-info-circle-fill fs-5"></i>
                    <div className="small">
                      <strong className="d-block mb-1">หมายเหตุจากเจ้าหน้าที่:</strong>
                      {application.remark}
                    </div>
                  </div>
                )}

              </div>

              <div className="card-footer bg-white border-top p-3 p-md-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                <Link to={`/applicant-details/${application.rawId || application.appId}`} className="btn btn-outline-secondary px-4 w-100 w-sm-auto small">
                  <i className="bi bi-file-earmark-text me-2"></i>ดูข้อมูลใบสมัครฉบับเต็ม
                </Link>
                <button className="btn btn-outline-danger px-4 shadow-sm w-100 w-sm-auto small" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>พิมพ์รายละเอียด
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}