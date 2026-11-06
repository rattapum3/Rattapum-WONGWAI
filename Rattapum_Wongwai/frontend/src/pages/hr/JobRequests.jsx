import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function JobRequests() {
  // 📍 1. State สำหรับเก็บข้อมูลจริงจาก Database
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 📍 2. ฟังก์ชันดึงข้อมูลจาก Backend API
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/job-requests');
      const result = await response.json();

      if (result.success) {
        // กรองเอาเฉพาะคำขอที่ส่งมาแล้ว (ไม่เอา RequestDraft ของคณะ)
        const activeRequests = result.data.filter(item => item.status !== "RequestDraft" && item.status !== "Draft" && item.status !== "");

        // แปลงสถานะให้ตรงกับ UI ฝั่ง HR
        const formattedData = activeRequests.map(item => {
          let displayStatus = "รอตรวจสอบ";
          if (item.status === "HR_Draft") {
            displayStatus = "ร่างประกาศ (HR)";
          } else if (item.status === "Processed") {
            displayStatus = "ดำเนินการแล้ว";
          }
          return {
            ...item,
            displayStatus
          };
        });
        setRequests(formattedData);
      }
    } catch (error) {
      console.error('❌ ไม่สามารถดึงข้อมูลรายการคำขอได้:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // เรียกโหลดข้อมูลคำขอตอนเปิดหน้านี้ครั้งแรก
  useEffect(() => {
    fetchRequests();
  }, []);

  // 📍 3. คำนวณสถิติจากข้อมูลจริง
  const pendingCount = requests.filter(req => req.displayStatus === "รอตรวจสอบ").length;
  const hrDraftCount = requests.filter(req => req.displayStatus === "ร่างประกาศ (HR)").length;
  const processedCount = requests.filter(req => req.displayStatus === "ดำเนินการแล้ว").length;

  // 📍 4. ฟังก์ชันจัดรูปแบบ Badge สถานะ
  const getStatusBadge = (displayStatus) => {
    if (displayStatus === "รอตรวจสอบ") {
      return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-clock-history me-1"></i>รอตรวจสอบ</span>;
    }
    if (displayStatus === "ร่างประกาศ (HR)") {
      return <span className="badge bg-info text-dark px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-file-earmark-text me-1"></i>ร่างประกาศ</span>;
    }
    return <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-check-circle me-1"></i>ดำเนินการแล้ว</span>;
  };

  return (
    <div className="container-fluid py-4">

      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-4 d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">
        <div>
          <h2 className="mb-1" style={{ color: '#03A96B', fontWeight: '600' }}>
            <i className="bi bi-inbox-fill me-2"></i>รายการแจ้งความจำนงขอเปิดรับสมัคร
          </h2>
          <p className="text-muted fs-6 mb-0">
            ตรวจสอบคำขอจากคณะ/หน่วยงาน และนำไปสร้างประกาศรับสมัครงาน
          </p>
        </div>

        {/* กลุ่มเครื่องมือด้านขวา (กล่องสถิติ + ปุ่มเพิ่มประกาศ) */}
        <div className="d-flex flex-wrap align-items-stretch gap-3">

          {/* กล่องสรุปสถิติสั้นๆ */}
          <div className="d-flex gap-2 text-center flex-grow-1 flex-md-grow-0">
            <div className="bg-white px-3 py-2 rounded shadow-sm border-start border-warning border-4 d-flex flex-column justify-content-center flex-grow-1">
              <div className="text-muted small fw-bold">รอตรวจสอบ</div>
              <div className="fs-5 fw-bold text-dark">{pendingCount}</div>
            </div>
            <div className="bg-white px-3 py-2 rounded shadow-sm border-start border-info border-4 d-flex flex-column justify-content-center flex-grow-1">
              <div className="text-muted small fw-bold">ร่างประกาศ</div>
              <div className="fs-5 fw-bold text-dark">{hrDraftCount}</div>
            </div>
            <div className="bg-white px-3 py-2 rounded shadow-sm border-start border-success border-4 d-flex flex-column justify-content-center flex-grow-1">
              <div className="text-muted small fw-bold">ดำเนินการแล้ว</div>
              <div className="fs-5 fw-bold text-dark">{processedCount}</div>
            </div>
          </div>

          {/* ปุ่มเพิ่มประกาศใหม่ (แบบอิสระ) */}
          <Link
            to="/create-job/new"
            className="btn shadow-sm text-white fw-bold px-4 d-flex align-items-center justify-content-center w-100 w-md-auto"
            style={{ backgroundColor: '#006664', borderRadius: '8px' }}
          >
            <i className="bi bi-plus-circle-fill me-2 fs-5"></i>สร้างประกาศใหม่
          </Link>

        </div>
      </div>

      <div className="card shadow-sm border-0" style={{ borderTop: '4px solid #03A96B', borderRadius: '12px', overflow: 'hidden' }}>

        {/* ======================================================== */}
        {/* 1. มุมมองแบบตาราง (Table View) - แสดงเฉพาะบนจอคอม */}
        {/* ======================================================== */}
        <div className="card-body p-0 d-none d-xl-block">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-3 text-center text-nowrap border-0" style={{ width: '80px' }}>ลำดับ</th>
                  <th className="py-3 px-4 text-nowrap border-0">วันที่ส่งคำขอ</th>
                  <th className="py-3 px-4 border-0">หน่วยงานที่แจ้งขอ</th>
                  <th className="py-3 px-4 border-0">ตำแหน่งที่ต้องการ</th>
                  <th className="py-3 px-4 text-center border-0">จำนวน (อัตรา)</th>
                  <th className="py-3 px-4 text-center border-0">สถานะ</th>
                  <th className="py-3 px-4 text-center border-0">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="spinner-border text-success mb-2" role="status"></div>
                      <div>กำลังโหลดข้อมูลคำขอ...</div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">ยังไม่มีรายการคำขอแจ้งความจำนงเข้ามาในระบบ</td>
                  </tr>
                ) : (
                  requests.map((req, index) => (
                    <tr key={index}>
                      <td className="py-3 px-3 text-center fw-bold text-muted">{index + 1}</td>
                      <td className="py-3 px-4">{req.requestDate}</td>
                      <td className="py-3 px-4">
                        <div className="fw-bold text-dark">{req.faculty || "ไม่ระบุคณะ"}</div>
                        <div className="text-muted small">{req.department || "ไม่ระบุภาควิชา"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="fw-bold text-primary">{req.jobTitle}</div>
                        <div className="text-muted small">{req.details}</div>
                      </td>
                      <td className="py-3 px-4 text-center fw-bold fs-5">{req.amount}</td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(req.displayStatus)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {req.displayStatus === "รอตรวจสอบ" ? (
                          <Link to={`/create-job/${req.id}`} className="btn btn-sm text-white px-3 shadow-sm" style={{ backgroundColor: '#03A96B', borderRadius: '6px' }}>
                            <i className="bi bi-pencil-square me-1"></i>สร้างจากคำขอ
                          </Link>
                        ) : req.displayStatus === "ร่างประกาศ (HR)" ? (
                          <Link to={`/create-job/${req.id}`} className="btn btn-sm btn-info text-dark fw-bold px-3 shadow-sm" style={{ borderRadius: '6px' }}>
                            <i className="bi bi-pencil-fill me-1"></i>แก้ไขแบบร่าง
                          </Link>
                        ) : (
                          <Link to={`/review-applicants/${req.id}`} className="btn btn-sm btn-outline-primary px-3 shadow-sm" style={{ borderRadius: '6px' }}>
                            <i className="bi bi-person-check-fill me-1"></i>ตรวจสอบผู้สมัคร
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. มุมมองแบบการ์ด (Card View) - แสดงเฉพาะมือถือ */}
        {/* ======================================================== */}
        <div className="card-body bg-light p-3 d-xl-none">
          <div className="d-flex flex-column gap-3">
            {isLoading ? (
              <div className="text-center py-4 text-muted">กำลังโหลดข้อมูล...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-4 text-muted border bg-white rounded">ยังไม่มีรายการคำขอแจ้งความจำนงเข้ามาในระบบ</div>
            ) : (
              requests.map((req, index) => (
                <div key={index} className="card shadow-sm border-0" style={{ borderRadius: '12px', borderLeft: req.displayStatus === 'รอตรวจสอบ' ? '5px solid #ffc107' : req.displayStatus === 'ร่างประกาศ (HR)' ? '5px solid #0dcaf0' : '5px solid #198754' }}>
                  <div className="card-body p-3 p-sm-4">

                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="fw-bold text-secondary small bg-light px-2 py-1 rounded border">ลำดับที่ {index + 1}</span>
                      {getStatusBadge(req.displayStatus)}
                    </div>

                    <h5 className="fw-bold text-primary mb-1 mt-3">{req.jobTitle}</h5>
                    <div className="text-muted small mb-3">
                      <i className="bi bi-building me-1"></i>{req.faculty || "ไม่ระบุคณะ"} <br />
                      <span className="ms-3 text-secondary">{req.department || "ไม่ระบุภาควิชา"}</span>
                    </div>

                    <div className="bg-light p-2 rounded mb-3 small d-flex justify-content-between align-items-center">
                      <div><i className="bi bi-info-square me-2 text-info"></i>{req.details}</div>
                      <div className="fw-bold text-dark"><i className="bi bi-person-plus-fill me-1 text-secondary"></i> {req.amount} อัตรา</div>
                    </div>

                    {req.additionalSkills && (
                      <div className="mb-3 small p-2 rounded bg-white border">
                        <span className="badge bg-light text-dark border me-1"><i className="bi bi-star-fill text-warning me-1"></i>ทักษะเฉพาะ:</span>
                        <span className="text-secondary">{req.additionalSkills}</span>
                      </div>
                    )}

                    <div className="text-muted small mb-3">
                      <i className="bi bi-calendar-event me-1"></i> วันที่ส่งคำขอ: {req.requestDate}
                    </div>

                    <div className="mt-3 pt-3 border-top text-center">
                      {req.displayStatus === "รอตรวจสอบ" ? (
                        <Link to={`/create-job/${req.id}`} className="btn w-100 text-white shadow-sm" style={{ backgroundColor: '#03A96B', borderRadius: '8px' }}>
                          <i className="bi bi-pencil-square me-2"></i>สร้างประกาศรับสมัคร
                        </Link>
                      ) : req.displayStatus === "ร่างประกาศ (HR)" ? (
                        <Link to={`/create-job/${req.id}`} className="btn w-100 btn-info text-dark fw-bold shadow-sm" style={{ borderRadius: '8px' }}>
                          <i className="bi bi-pencil-fill me-2"></i>แก้ไขแบบร่างประกาศ
                        </Link>
                      ) : (
                        <Link to={`/review-applicants/${req.id}`} className="btn w-100 btn-outline-primary shadow-sm fw-bold" style={{ borderRadius: '8px' }}>
                          <i className="bi bi-person-check-fill me-2"></i>ตรวจสอบผู้สมัคร
                        </Link>
                      )}
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer ของ Card */}
        <div className="card-footer bg-white py-3 border-top text-muted small text-center text-md-start">
          <i className="bi bi-info-circle me-1"></i> แสดงรายการคำขอทั้งหมดจากระบบฐานข้อมูล เรียงตามวันที่ล่าสุด
        </div>
      </div>

    </div>
  );
}