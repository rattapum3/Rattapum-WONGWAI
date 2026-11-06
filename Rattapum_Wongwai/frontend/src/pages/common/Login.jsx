import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('applicant');
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับผู้สมัคร
  const [applicantId, setApplicantId] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');

  // State สำหรับบุคลากร
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // State สำหรับข้อความแจ้งเตือนข้อผิดพลาด
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // ตรวจสอบเบื้องต้น
    if (loginType === 'applicant') {
      if (applicantId.length !== 13) {
        setErrorMessage('เลขประจำตัวประชาชนต้องครบ 13 หลัก');
        return;
      }
      if (!applicantEmail.trim()) {
        setErrorMessage('กรุณากรอกอีเมลผู้สมัคร');
        return;
      }
    } else {
      if (!staffEmail.trim()) {
        setErrorMessage('กรุณากรอกอีเมลบุคลากร');
        return;
      }
      if (!staffPassword) {
        setErrorMessage('กรุณากรอกรหัสผ่าน');
        return;
      }
    }

    setIsLoading(true);

    // เตรียมข้อมูลส่งไป Backend
    const payload = loginType === 'applicant'
      ? { loginType: 'applicant', applicantId, applicantEmail: applicantEmail.trim().toLowerCase() }
      : { loginType: 'staff', email: staffEmail.trim().toLowerCase(), password: staffPassword };

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        // บันทึกข้อมูลผู้ใช้งาน
        localStorage.setItem('currentUser', JSON.stringify(result.user));

        // นำทางไปยังหน้าแรกตามสิทธิ์ของผู้ใช้งาน
        if (result.user.role === 'หน่วยทรัพยากรมนุษย์และสวัสดิการ') {
          navigate('/manage-jobs');
        } else if (result.user.role === 'คณะ/หน่วยงาน') {
          navigate('/faculty-jobs');
        } else {
          navigate('/');
        }
      } else {
        setErrorMessage(result.message || "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 overflow-hidden" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      <div className="row g-0" style={{ minHeight: '100vh' }}>

        {/* ครึ่งซ้าย: แบนเนอร์ต้อนรับ (ซ่อนบนหน้าจอเล็กกว่า lg) */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center text-white p-5"
          style={{ background: 'linear-gradient(135deg, #004d4b 0%, #03A96B 100%)' }}>
          <div className="text-center">
            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 shadow-lg" style={{ width: '120px', height: '120px' }}>
              <i className="bi bi-mortarboard-fill" style={{ fontSize: '4rem', color: '#006664' }}></i>
            </div>
            <h1 className="fw-bold display-5 mb-3">ระบบรับสมัครงานออนไลน์</h1>
            <h4 className="fw-light mb-4 text-white-50">มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติฯ</h4>
          </div>
        </div>

        {/* ครึ่งขวา: ฟอร์มเข้าสู่ระบบ */}
        <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center p-3 p-md-5 bg-white">
          <div className="w-100 px-2" style={{ maxWidth: '420px' }}>

            {/* โลโก้สำหรับมือถือ */}
            <div className="d-lg-none text-center mb-4">
              <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-mortarboard-fill text-white fs-3"></i>
              </div>
              <h4 className="fw-bold text-dark mb-1">ระบบรับสมัครงานออนไลน์</h4>
              <p className="text-muted small">มก. วิทยาเขตเฉลิมพระเกียรติฯ</p>
            </div>

            <h3 className="fw-bold mb-4 text-dark text-center d-none d-lg-block">เข้าสู่ระบบ</h3>

            {/* แสดงข้อความแจ้งเตือนข้อผิดพลาดถ้ามี */}
            {errorMessage && (
              <div className="alert alert-danger alert-dismissible fade show shadow-sm d-flex align-items-center py-2 px-3 mb-4" role="alert" style={{ borderRadius: '10px' }}>
                <i className="bi bi-exclamation-triangle-fill fs-5 me-2 text-danger"></i>
                <div className="small flex-grow-1">{errorMessage}</div>
                <button type="button" className="btn-close py-2" onClick={() => setErrorMessage('')} aria-label="Close"></button>
              </div>
            )}

            {/* แท็บสลับประเภทผู้ใช้งาน */}
            <ul className="nav nav-pills nav-fill mb-4 p-1 bg-light rounded-pill shadow-sm border" style={{ fontSize: '0.9rem' }}>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link rounded-pill fw-bold py-2 ${loginType === 'applicant' ? 'active shadow-sm' : 'text-muted'}`}
                  style={loginType === 'applicant' ? { backgroundColor: '#006664', color: 'white' } : {}}
                  onClick={() => { setLoginType('applicant'); setErrorMessage(''); }}
                >
                  <i className="bi bi-person-fill me-1"></i> ผู้สมัคร
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link rounded-pill fw-bold py-2 ${loginType === 'staff' ? 'active shadow-sm' : 'text-muted'}`}
                  style={loginType === 'staff' ? { backgroundColor: '#006664', color: 'white' } : {}}
                  onClick={() => { setLoginType('staff'); setErrorMessage(''); }}
                >
                  <i className="bi bi-building-fill me-1"></i> บุคลากร
                </button>
              </li>
            </ul>

            <form onSubmit={handleLogin}>

              {/* ฟอร์มผู้สมัคร */}
              {loginType === 'applicant' && (
                <div className="animate__animated animate__fadeIn">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-bold text-dark small mb-0">เลขประจำตัวประชาชน</label>
                      <span className="text-muted small">{applicantId.length}/13</span>
                    </div>
                    <div className="input-group shadow-sm border rounded-3 overflow-hidden">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-person-vcard text-muted"></i></span>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light border-0 ps-0"
                        placeholder="เลขประชาชน 13 หลัก (ตัวเลขเท่านั้น)"
                        maxLength={13}
                        value={applicantId}
                        onChange={(e) => setApplicantId(e.target.value.replace(/\D/g, '').slice(0, 13))}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold text-dark small">อีเมลผู้ใช้งาน</label>
                    <div className="input-group shadow-sm border rounded-3 overflow-hidden">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-muted"></i></span>
                      <input
                        type="email"
                        className="form-control form-control-lg bg-light border-0 ps-0"
                        placeholder="กรอกอีเมลที่ใช้สมัคร"
                        maxLength={50}
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 50).toLowerCase())}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ฟอร์มบุคลากร */}
              {loginType === 'staff' && (
                <div className="animate__animated animate__fadeIn">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small">อีเมลผู้ใช้งาน</label>
                    <div className="input-group shadow-sm border rounded-3 overflow-hidden">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-muted"></i></span>
                      <input
                        type="email"
                        className="form-control form-control-lg bg-light border-0 ps-0"
                        placeholder="กรอกอีเมลบุคลากร (เช่น user@ku.th)"
                        maxLength={50}
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 50).toLowerCase())}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold text-dark small">รหัสผ่าน</label>
                    <div className="input-group shadow-sm border rounded-3 overflow-hidden">
                      <span className="input-group-text bg-light border-0"><i className="bi bi-lock text-muted"></i></span>
                      <input
                        type="password"
                        className="form-control form-control-lg bg-light border-0 ps-0"
                        placeholder="กรอกรหัสผ่าน"
                        maxLength={32}
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value.slice(0, 32))}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn w-100 fw-bold shadow-sm text-white py-3 mb-3" style={{ backgroundColor: '#006664', borderRadius: '12px' }} disabled={isLoading}>
                {isLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>กำลังเข้าสู่ระบบ...</>
                ) : (
                  <>เข้าสู่ระบบ <i className="bi bi-box-arrow-in-right ms-2"></i></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}