import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './MainLayout.css';

export default function MainLayout() {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();
  // 📍 1. เพิ่ม useLocation เพื่อดักจับการเปลี่ยนหน้า
  const location = useLocation();

  // ดึงข้อมูลผู้ใช้งานจาก LocalStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 📍 2. เพิ่ม useEffect ให้อัปเดตข้อมูลผู้ใช้ใหม่ทุกครั้งที่มีการย้าย URL (เช่น ตอน Login เสร็จ)
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    setCurrentUser(savedUser ? JSON.parse(savedUser) : null);
  }, [location.pathname]);

  const isExpanded = isPinned || isHovered;

  // กำหนดโครงสร้างเมนู Sidebar (แยกตาม 3 Role เป๊ะๆ ตามที่ออกแบบไว้)
  const menus = {
    guest: [
      { path: '/', icon: 'bi-house-door-fill', text: 'หน้าหลัก' },
      { path: '/jobs', icon: 'bi-briefcase-fill', text: 'ค้นหาตำแหน่งงาน' },
    ],
    applicant: [
      { path: '/', icon: 'bi-house-door-fill', text: 'หน้าหลัก' },
      { path: '/jobs', icon: 'bi-briefcase-fill', text: 'ค้นหาตำแหน่งงาน' },
      { path: '/my-applications', icon: 'bi-file-earmark-text-fill', text: 'ดูสถานะใบสมัคร' },
    ],
    hr: [
      { path: '/manage-jobs', icon: 'bi-megaphone-fill', text: 'จัดการประกาศรับสมัคร' },
      { path: '/job-requests', icon: 'bi-inbox-fill', text: 'ดูรายการขอเปิดรับสมัคร' },
      { path: '/manage-users', icon: 'bi-person-plus-fill', text: 'เพิ่มบัญชีผู้ใช้' },
      { path: '/reports', icon: 'bi-pie-chart-fill', text: 'ดูสรุปรายงาน' },
    ],
    faculty: [
      { path: '/faculty-jobs', icon: 'bi-people-fill', text: 'จัดการและตรวจสอบผู้สมัคร' },
      { path: '/my-requests', icon: 'bi-pencil-square', text: 'แจ้งความจำนงเปิดรับสมัคร' },
      { path: '/reports', icon: 'bi-pie-chart-fill', text: 'ดูสรุปรายงาน' },
    ]
  };

  const getActiveMenu = () => {
    if (!currentUser) return menus.guest;
    if (currentUser.role === 'ผู้สมัคร') return menus.applicant;
    if (currentUser.role === 'หน่วยทรัพยากรมนุษย์และสวัสดิการ') return menus.hr;
    if (currentUser.role === 'คณะ/หน่วยงาน') return menus.faculty;
    return menus.guest;
  };

  const getHomePath = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'หน่วยทรัพยากรมนุษย์และสวัสดิการ') return '/manage-jobs';
    if (currentUser.role === 'คณะ/หน่วยงาน') return '/faculty-jobs';
    return '/';
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="app-wrapper">
      {/* ================= Sidebar ================= */}
      <nav
        className={`sidebar ${isExpanded ? 'expanded' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="sidebar-header">
          {/* ปรับ path ของรูปภาพให้ตรงกับโปรเจคนะ */}
          <Link to={getHomePath()} style={{ display: 'contents' }}>
            <img className="sidebar-logo" src="/src/assets/logokucsc.jpg" alt="KU Logo" style={{ cursor: 'pointer' }} />
          </Link>
          <button className="hamburger-btn" onClick={() => setIsPinned(!isPinned)}>
            <i className="bi bi-list"></i>
          </button>
        </div>

        <ul className="nav-list">
          {getActiveMenu().map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon} nav-icon`}></i>
                <span className="nav-text">{item.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ================= Main Content ================= */}
      <main className={`main-content d-flex flex-column min-vh-100 ${isPinned ? 'pushed' : ''}`}>

        {/* ================= Header ================= */}
        <header className="top-header d-flex justify-content-between align-items-center px-3 py-2 w-100 flex-shrink-0">
          <div className="text-truncate pe-3 flex-grow-1">
            <Link to={getHomePath()} className="text-white text-decoration-none">
              <span className="d-none d-lg-inline fw-bold">ระบบรับสมัครบุคลากร มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร</span>
              <span className="d-none d-sm-inline d-lg-none fw-bold">ระบบรับสมัครบุคลากร มก.ฉกส.</span>
              <span className="d-inline d-sm-none fw-bold">ระบบรับสมัครฯ</span>
            </Link>
          </div>

          <div className="user-section d-flex align-items-center flex-shrink-0">
            {!currentUser ? (
              <Link to="/login" className="btn-primary d-flex align-items-center shadow-sm" style={{ padding: '6px 15px', borderRadius: '6px', background: '#fff', color: '#03A96B', fontWeight: 'bold', textDecoration: 'none' }}>
                <i className="bi bi-box-arrow-in-right me-1 fs-5"></i>
                <span className="d-none d-sm-inline ms-1">เข้าสู่ระบบ</span>
              </Link>
            ) : (
              <>
                <div className="user-info-display text-end" style={{ lineHeight: '1.2' }}>
                  <div className="user-name" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    <span className="d-none d-xl-inline">
                      {currentUser.role === "ผู้สมัคร" && currentUser.citizenId ? `เลขบัตร ปชช. ${currentUser.citizenId.substring(0, 1)}-${currentUser.citizenId.substring(1, 5)}-xxxxx-xx-x ` : ""}
                    </span>
                    {currentUser.name}
                  </div>
                  <div className="user-role d-none d-md-block" style={{ fontSize: '0.75rem', color: '#e0f2f1' }}>
                    {currentUser.role === "คณะ/หน่วยงาน" || currentUser.role === "หน่วยทรัพยากรมนุษย์และสวัสดิการ" ? currentUser.dept || currentUser.role : currentUser.role}
                  </div>
                </div>
                <div className="d-none d-sm-block" style={{ margin: '0 12px', color: 'rgba(255,255,255,0.4)' }}>|</div>
                <button onClick={handleLogout} className="logout-btn d-flex align-items-center bg-transparent border-0 p-0 text-white ms-3 ms-sm-0" title="ออกจากระบบ">
                  <i className="bi bi-box-arrow-right fs-4"></i>
                  <span className="d-none d-md-inline ms-2 fw-medium">ออกจากระบบ</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* ================= Content Area ================= */}
        <div className="content-area flex-grow-1" style={{ backgroundColor: '#fff' }}>
          <Outlet />
        </div>

      </main>

      {/* CSS สำหรับเอฟเฟกต์ Footer Link */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .mega-footer-link {
          color: #4a5568;
          text-decoration: none;
          transition: all 0.2s ease-in-out;
          display: inline-block;
        }
        .mega-footer-link:hover {
          color: #03A96B;
          transform: translateX(5px);
          font-weight: 500;
        }
      `}} />
    </div>
  );
}