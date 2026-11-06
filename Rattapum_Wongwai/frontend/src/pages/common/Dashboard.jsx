import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'หน่วยทรัพยากรมนุษย์และสวัสดิการ') {
          navigate('/manage-jobs', { replace: true });
        } else if (user.role === 'คณะ/หน่วยงาน') {
          navigate('/faculty-jobs', { replace: true });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [navigate]);
  return (
    // ยืดความสูงให้เต็มพื้นที่ที่เหลือ
    <div 
      className="bg-white rounded-4 shadow-sm d-flex flex-column align-items-center justify-content-center w-100 p-4 p-md-5" 
      style={{ minHeight: 'calc(100vh - 140px)' }} 
    >
      
      {/* โลโก้มหาวิทยาลัย */}
      <img 
        src="/src/assets/logokucsc.jpg" 
        alt="KUCSC Logo" 
        className="img-fluid mb-4 shadow-sm" // ใส่ shadow อ่อนๆ ให้รูปดูมีมิติ
        style={{ 
          maxWidth: '180px', // กำหนดขนาดความกว้างให้พอดี
          height: 'auto', 
          objectFit: 'contain',
        }} 
        // กรณีหารูปไม่เจอ จะซ่อนรูปอัตโนมัติไม่ให้ขึ้นไอคอนแตกๆ
        onError={(e) => { e.target.style.display = 'none'; }} 
      />
      
      {/* ข้อความต้อนรับ */}
      <h1 className="fw-bold mb-3 text-dark text-center" style={{ letterSpacing: '-0.5px' }}>
        ยินดีต้อนรับเข้าสู่ระบบรับสมัครบุคลากร
      </h1>
      
      <h4 className="mb-4 text-center" style={{ color: '#03A96B', lineHeight: '1.6' }}>
        มหาวิทยาลัยเกษตรศาสตร์<br />วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร
      </h4>
      
      {/* เส้นคั่น (เปลี่ยนจาก hr ธรรมดา ให้เป็นเส้นทึบสีเขียวเข้มเพื่อเน้นความสวยงาม) */}
      <div 
        className="my-4" 
        style={{ width: '50%', maxWidth: '400px', height: '3px', backgroundColor: '#006664', opacity: '0.8', borderRadius: '2px' }} 
      ></div>
      
      <p className="text-muted fs-5 text-center mb-0">
        กรุณาเลือกเมนูจากแถบด้านซ้ายมือเพื่อเริ่มต้นการใช้งาน
      </p>

    </div>
  );
}