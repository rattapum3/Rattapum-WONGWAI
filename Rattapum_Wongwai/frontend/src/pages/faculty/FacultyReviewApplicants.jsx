import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function FacultyReviewApplicants() {
  const { id } = useParams();

  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState("กำลังโหลด...");
  const [jobDetails, setJobDetails] = useState({
    jobTitle: 'กำลังโหลด...',
    departmentName: '',
    facultyName: '',
    openDate: '',
    closeDate: ''
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchApplicants();
  }, [id]);

  const fetchApplicants = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/applications/recruitment/${id}`);
      const data = await response.json();
      if (data.success) {
        setApplicants(data.data || []);
        setJobTitle(data.jobTitle);
        if (data.jobDetails) setJobDetails(data.jobDetails);

        const list = data.data || [];
        setApplicants(list);
        setJobTitle(data.jobTitle);
        if (data.jobDetails) setJobDetails(data.jobDetails);

        // กำหนดให้แสดงผลทุกรอบโดยเริ่มต้น เพื่อไม่ให้ผู้สมัครในรอบอื่นตกหล่น
        setRoundFilter('all');

        // หากมีผู้สมัครที่รอการคัดเลือกเบื้องต้น ให้เริ่มที่รอตรวจสอบ แต่หากไม่มีผู้สมัครรอตรวจเลย (ประเมินแล้วทั้งหมด) ให้แสดงทั้งหมด ('all') ตารางจะได้ไม่ว่างเปล่า
        const hasPending = list.some(a => !a.qualStatus || a.qualStatus === 'รอตรวจสอบ');
        setStatusFilter(hasPending ? 'pending' : 'all');
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const [roundFilter, setRoundFilter] = useState('all'); // เริ่มต้นแสดงทุกรอบ
  const [statusFilter, setStatusFilter] = useState('all'); // ปรับตามข้อมูลจริงใน fetchApplicants

  // ดึงรายการรอบที่มีผู้สมัครในตำแหน่งนี้ (เรียงรอบล่าสุดไว้ก่อน)
  const availableRounds = Array.from(
    new Set([
      ...(jobDetails.roundNo ? [Number(jobDetails.roundNo)] : []),
      ...applicants.map(a => Number(a.roundNo || 1))
    ])
  ).sort((a, b) => b - a);

  // ผู้สมัครที่ถูกกรองตามรอบ (ใช้สำหรับคำนวณสถิติบนการ์ด)
  const roundApplicants = roundFilter === 'all'
    ? applicants
    : applicants.filter(a => Number(a.roundNo || 1) === Number(roundFilter));

  const totalApplicants = roundApplicants.length;
  const pendingApplicants = roundApplicants.filter(a => a.qualStatus === 'รอตรวจสอบ' || !a.qualStatus);
  const passedApplicants = roundApplicants.filter(a => a.qualStatus === 'ผ่านการคัดเลือกเบื้องต้น');
  const rejectedApplicants = roundApplicants.filter(a => a.qualStatus === 'ไม่ผ่านการคัดเลือกเบื้องต้น');

  const filteredApplicants = roundApplicants.filter(app => {
    if (statusFilter === 'pending') return app.qualStatus === 'รอตรวจสอบ' || !app.qualStatus;
    if (statusFilter === 'passed') return app.qualStatus === 'ผ่านการคัดเลือกเบื้องต้น';
    if (statusFilter === 'rejected') return app.qualStatus === 'ไม่ผ่านการคัดเลือกเบื้องต้น';
    return true;
  });
  filteredApplicants.sort((a, b) => {
    const roundDiff = Number(b.roundNo || 1) - Number(a.roundNo || 1);
    if (roundDiff !== 0) return roundDiff;
    return (b.rawId || b.id || 0) - (a.rawId || a.id || 0);
  });

  const [showModal, setShowModal] = useState(false);
  const [activeAppId, setActiveAppId] = useState(null);

  const [modalQual, setModalQual] = useState("");
  const [modalComment, setModalComment] = useState("");

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isEmailCustomized, setIsEmailCustomized] = useState(false);

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // =========================================================================
  // State สำหรับการเลือกประเมินผลพร้อมกันหลายคน (Batch Review)
  // =========================================================================
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchQual, setBatchQual] = useState("ผ่านการคัดเลือกเบื้องต้น");
  const [batchComment, setBatchComment] = useState("");
  const [batchEmailSubject, setBatchEmailSubject] = useState("");
  const [batchEmailBody, setBatchEmailBody] = useState("");
  const [isBatchEmailCustomized, setIsBatchEmailCustomized] = useState(false);
  const [isBatchSending, setIsBatchSending] = useState(false);

  const selectedApplicants = applicants.filter(a => selectedAppIds.includes(a.rawId || a.id));

  const toggleSelect = (rawId) => {
    setSelectedAppIds(prev =>
      prev.includes(rawId) ? prev.filter(x => x !== rawId) : [...prev, rawId]
    );
  };

  const handleSelectAllPending = () => {
    const pendingIds = pendingApplicants.map(a => a.rawId || a.id);
    if (pendingIds.length > 0 && selectedAppIds.length === pendingIds.length && pendingIds.every(id => selectedAppIds.includes(id))) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(pendingIds);
    }
  };

  const isAllPendingSelected = pendingApplicants.length > 0 && pendingApplicants.every(a => selectedAppIds.includes(a.rawId || a.id));

  const getStatusColor = (status) => {
    if (status.includes("ผ่านการคัดเลือกเบื้องต้น") && !status.includes("ไม่ผ่าน")) return "text-success fw-bold";
    if (status.includes("ไม่ผ่าน")) return "text-danger fw-bold";
    if (status === "รอตรวจสอบ") return "text-warning text-dark fw-bold";
    return "text-muted";
  };

  // ฟังก์ชันสร้างตัวอย่างอีเมล (Preview) สำหรับคนเดียว
  const generateEmailPreview = (qual = modalQual) => {
    const target = applicants.find(a => a.id === activeAppId);
    const rawName = (target?.name || '').trim();
    const hasTitle = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'].some(t => rawName.startsWith(t));
    const greetingName = hasTitle ? rawName : `คุณ${rawName || 'ผู้สมัคร'}`;

    const pos = jobDetails.jobTitle || jobTitle || 'อาจารย์';
    const facultyDeptText = `${jobDetails.facultyName || ''} ${jobDetails.departmentName && jobDetails.departmentName !== '-' ? `(${jobDetails.departmentName})` : ''}`.trim();
    const affiliationText = facultyDeptText ? ` สังกัด ${facultyDeptText}` : '';

    if (qual === "ผ่านการคัดเลือกเบื้องต้น") {
      return `เรียน ${greetingName},\n\nขอแสดงความยินดี! ทางคณะกรรมการได้พิจารณาคุณสมบัติของท่านแล้ว ขอเรียนให้ทราบว่าท่าน "ผ่านการคัดเลือกเบื้องต้น" ในตำแหน่ง ${pos}${affiliationText}\n\nโปรดรอรับการติดต่อ หรืออีเมลแจ้งกำหนดการทดสอบจากหน่วยทรัพยากรมนุษย์และสวัสดิการ ในลำดับถัดไป\n\nจึงเรียนมาเพื่อโปรดทราบ\nมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร`;
    }

    if (qual === "ไม่ผ่านการคัดเลือกเบื้องต้น") {
      return `เรียน ${greetingName},\n\nทางคณะกรรมการได้พิจารณาคุณสมบัติของท่านแล้ว ขอเรียนให้ทราบด้วยความเสียใจว่า ท่าน "ไม่ผ่านการคัดเลือกเบื้องต้น" สำหรับตำแหน่ง ${pos}${affiliationText}\n\nเหตุผลประกอบการพิจารณา: คุณสมบัติไม่ตรงตามเงื่อนไขที่ระบุไว้ในประกาศรับสมัคร\n\nมหาวิทยาลัยขอขอบคุณที่ท่านให้ความสนใจและสละเวลาในการสมัครร่วมงานกับเรา และขอแสดงความเสียใจที่ท่านไม่ผ่านการคัดเลือกเบื้องต้นในครั้งนี้\n\nจึงเรียนมาเพื่อโปรดทราบ\nมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร`;
    }

    return "กรุณาเลือกผลการคัดเลือกทางด้านซ้ายมือ เพื่อดูตัวอย่างอีเมลที่จะส่งถึงผู้สมัคร...";
  };

  // ฟังก์ชันสร้างตัวอย่างอีเมลสำหรับการประเมินแบบกลุ่ม (Batch)
  const generateBatchEmailPreview = (qual = batchQual, selectedList = selectedApplicants) => {
    const pos = jobDetails.jobTitle || jobTitle || 'ตำแหน่งงาน';
    const facultyDeptText = `${jobDetails.facultyName || ''} ${jobDetails.departmentName && jobDetails.departmentName !== '-' ? `(${jobDetails.departmentName})` : ''}`.trim();
    const affiliationText = facultyDeptText ? ` สังกัด ${facultyDeptText}` : '';

    const firstApplicant = selectedList && selectedList.length > 0 ? selectedList[0] : null;
    let sampleGreeting = 'ผู้สมัคร';
    if (firstApplicant) {
      const rawName = (firstApplicant.name || '').trim();
      const hasTitle = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'].some(t => rawName.startsWith(t));
      const formattedName = hasTitle ? rawName : `คุณ${rawName}`;
      if (selectedList.length === 1) {
        sampleGreeting = formattedName;
      } else {
        sampleGreeting = `${formattedName} (ระบบจะเปลี่ยนเป็นชื่อจริงของผู้สมัครแต่ละท่านโดยอัตโนมัติ)`;
      }
    }

    if (qual === "ผ่านการคัดเลือกเบื้องต้น") {
      return `เรียน ${sampleGreeting},\n\nขอแสดงความยินดี! ทางคณะกรรมการได้พิจารณาคุณสมบัติของท่านแล้ว ขอเรียนให้ทราบว่าท่าน "ผ่านการคัดเลือกเบื้องต้น" ในตำแหน่ง ${pos}${affiliationText}\n\nโปรดรอรับการติดต่อ หรืออีเมลแจ้งกำหนดการทดสอบจากหน่วยทรัพยากรมนุษย์และสวัสดิการ ในลำดับถัดไป\n\nจึงเรียนมาเพื่อโปรดทราบ\nมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร`;
    }

    if (qual === "ไม่ผ่านการคัดเลือกเบื้องต้น") {
      return `เรียน ${sampleGreeting},\n\nทางคณะกรรมการได้พิจารณาคุณสมบัติของท่านแล้ว ขอเรียนให้ทราบด้วยความเสียใจว่า ท่าน "ไม่ผ่านการคัดเลือกเบื้องต้น" สำหรับตำแหน่ง ${pos}${affiliationText}\n\nเหตุผลประกอบการพิจารณา: คุณสมบัติไม่ตรงตามเงื่อนไขที่ระบุไว้ในประกาศรับสมัคร\n\nมหาวิทยาลัยขอขอบคุณที่ท่านให้ความสนใจและสละเวลาในการสมัครร่วมงานกับเรา และขอแสดงความเสียใจที่ท่านไม่ผ่านการคัดเลือกเบื้องต้นในครั้งนี้\n\nจึงเรียนมาเพื่อโปรดทราบ\nมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร`;
    }

    return "กรุณาเลือกผลการคัดเลือกเพื่อดูตัวอย่างอีเมลที่จะส่งถึงผู้สมัคร...";
  };

  const openStatusModal = (applicant) => {
    setActiveAppId(applicant.id);
    setModalQual(applicant.qualStatus);
    setModalComment(applicant.qualComment || "");
    const pos = jobDetails.jobTitle || jobTitle || 'อาจารย์';
    setEmailSubject(`แจ้งผลการพิจารณาคุณสมบัติเบื้องต้น: ตำแหน่ง ${pos} - มหาวิทยาลัยเกษตรศาสตร์`);
    setIsEmailCustomized(false);
    setEmailBody(generateEmailPreview(applicant.qualStatus));
    setShowModal(true);
  };

  const openBatchModal = (initialQual = "ผ่านการคัดเลือกเบื้องต้น") => {
    if (selectedAppIds.length === 0) {
      alert("กรุณาเลือกผู้สมัครอย่างน้อย 1 คน");
      return;
    }
    setBatchQual(initialQual);
    setBatchComment("");
    const pos = jobDetails.jobTitle || jobTitle || 'อาจารย์';
    setBatchEmailSubject(`แจ้งผลการพิจารณาคุณสมบัติเบื้องต้น: ตำแหน่ง ${pos} - มหาวิทยาลัยเกษตรศาสตร์`);
    setIsBatchEmailCustomized(false);
    setBatchEmailBody(generateBatchEmailPreview(initialQual, selectedApplicants));
    setShowBatchModal(true);
  };

  // อัปเดตเนื้อหาอีเมลตามสถานะอัตโนมัติ (หากผู้ใช้ไม่ได้พิมพ์แก้ไขเอง)
  React.useEffect(() => {
    if (!isEmailCustomized && showModal) {
      setEmailBody(generateEmailPreview(modalQual));
    }
  }, [modalQual, isEmailCustomized, showModal, activeAppId, jobDetails]);

  React.useEffect(() => {
    if (!isBatchEmailCustomized && showBatchModal) {
      setBatchEmailBody(generateBatchEmailPreview(batchQual, selectedApplicants));
    }
  }, [batchQual, isBatchEmailCustomized, showBatchModal, selectedAppIds, jobDetails]);

  const handleSaveBatchReview = async (e) => {
    if (e) e.preventDefault();
    if (selectedAppIds.length === 0) return;

    const confirmMsg = `ระบบจะบันทึกผล "${batchQual}" และส่งอีเมลแจ้งผลไปยังผู้สมัครที่เลือกจำนวน ${selectedAppIds.length} ท่าน\n\nคุณต้องการยืนยันการส่งผลและอีเมลหรือไม่?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBatchSending(true);
    try {
      const response = await fetch('http://localhost:3000/api/applications/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedAppIds,
          status: batchQual,
          comment: batchComment,
          emailSubject: batchEmailSubject,
          emailBodyTemplate: batchEmailBody,
          sendEmail: true
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message || `บันทึกผลและส่งอีเมลเรียบร้อยแล้ว (${selectedAppIds.length} คน)`);
        setShowBatchModal(false);
        setSelectedAppIds([]);
        fetchApplicants();
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      console.error("Error saving batch review:", error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsBatchSending(false);
    }
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();

    const targetApplicant = applicants.find(a => a.id === activeAppId);
    if (!targetApplicant) return;

    if (targetApplicant.qualStatus !== "รอตรวจสอบ") {
      alert("ผลการคัดเลือกเบื้องต้นนี้ได้รับการส่งอีเมลแจ้งผู้สมัครเรียบร้อยแล้ว จึงไม่สามารถแก้ไขได้");
      return;
    }

    // แจ้งเตือนถามการส่งอีเมล หากมีการอัปเดตสถานะเป็นผ่าน/ไม่ผ่าน
    if (modalQual === "รอตรวจสอบ" || !modalQual) {
      alert("กรุณาเลือกผลการคัดเลือกเบื้องต้น (ผ่านการคัดเลือกเบื้องต้น หรือ ไม่ผ่านการคัดเลือกเบื้องต้น) ก่อนบันทึก");
      return;
    }

    const confirmEmail = window.confirm(`ระบบจะส่งอีเมลแจ้งผลไปยัง ${targetApplicant.email} ทันที\n\nคุณต้องการยืนยันการส่งอีเมลและบันทึกผลหรือไม่?`);
    if (!confirmEmail) return;

    setIsSendingEmail(true);

    // บันทึกผ่าน API พร้อมส่งอีเมลแจ้งผลจริง
    try {
      const response = await fetch(`http://localhost:3000/api/applications/${targetApplicant.rawId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modalQual,
          comment: modalComment,
          emailSubject: emailSubject,
          emailBody: emailBody,
          sendEmail: true
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(`บันทึกผลและส่งอีเมลแจ้งผลไปยัง ${targetApplicant.email} เรียบร้อยแล้ว`);
        setApplicants(applicants.map(app =>
          app.id === activeAppId ? {
            ...app,
            qualStatus: modalQual,
            qualComment: modalComment,
            finalStatus: modalQual === "ไม่ผ่านการคัดเลือกเบื้องต้น" ? "ไม่ผ่านการคัดเลือกเบื้องต้น" : "รอการดำเนินการจาก HR"
          } : app
        ));
        setShowModal(false);
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      console.error("Error saving review:", error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="container-fluid py-3 py-md-4 position-relative" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>

      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-4 d-flex flex-column flex-sm-row align-items-start gap-3">
        <Link to="/faculty-jobs" className="btn btn-outline-secondary btn-sm rounded-circle px-2 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
          <i className="bi bi-arrow-left fs-5"></i>
        </Link>
        <div>
          <h2 className="mb-1 fw-bold fs-4 fs-md-3" style={{ color: '#03A96B' }}>
            <i className="bi bi-person-check-fill me-2"></i>ตรวจสอบคุณสมบัติผู้สมัคร (คณะ)
          </h2>
          <div className="d-flex flex-wrap align-items-center gap-3 mt-2 text-secondary fs-6">
            <div>
              <i className="bi bi-briefcase-fill me-1 text-primary"></i>ตำแหน่ง: <span className="fw-bold text-dark">{jobDetails.jobTitle || jobTitle}</span>
            </div>
            {jobDetails.facultyName && jobDetails.facultyName !== '-' && (
              <div>
                <i className="bi bi-building me-1 text-primary"></i>คณะ: <span className="fw-bold text-dark">{jobDetails.facultyName}</span>
              </div>
            )}
            {jobDetails.departmentName && jobDetails.departmentName !== '-' && (
              <div>
                <i className="bi bi-diagram-3 me-1 text-primary"></i>ภาควิชา/หน่วยงาน: <span className="fw-bold text-dark">{jobDetails.departmentName}</span>
              </div>
            )}
            {(jobDetails.openDate || jobDetails.closeDate) && (
              <div>
                <i className="bi bi-calendar-event me-1 text-success"></i>ระยะเวลารับสมัคร: <span className="fw-bold text-dark">{jobDetails.openDate}</span> - <span className="fw-bold text-danger">{jobDetails.closeDate}</span>
                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 ms-2 small">
                  รอบปัจจุบัน: รอบที่ {jobDetails.roundNo || 1}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* การ์ดสรุปตัวเลขสถานะ */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className={`card border-0 shadow-sm border-start border-warning border-4 h-100 cursor-pointer ${statusFilter === 'pending' ? 'bg-warning bg-opacity-10' : 'bg-white'}`}
            style={{ borderRadius: '10px', cursor: 'pointer' }}
            onClick={() => setStatusFilter('pending')}
          >
            <div className="card-body py-2 py-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small fw-semibold">รอการคัดเลือกเบื้องต้น</h6>
                  <h3 className="fw-bold mb-0 text-warning">{pendingApplicants.length} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                </div>
                <i className="bi bi-hourglass-split fs-2 text-warning opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`card border-0 shadow-sm border-start border-success border-4 h-100 cursor-pointer ${statusFilter === 'passed' ? 'bg-success bg-opacity-10' : 'bg-white'}`}
            style={{ borderRadius: '10px', cursor: 'pointer' }}
            onClick={() => setStatusFilter('passed')}
          >
            <div className="card-body py-2 py-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small fw-semibold">ผ่านการคัดเลือก</h6>
                  <h3 className="fw-bold mb-0 text-success">{passedApplicants.length} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                </div>
                <i className="bi bi-check-circle fs-2 text-success opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`card border-0 shadow-sm border-start border-danger border-4 h-100 cursor-pointer ${statusFilter === 'rejected' ? 'bg-danger bg-opacity-10' : 'bg-white'}`}
            style={{ borderRadius: '10px', cursor: 'pointer' }}
            onClick={() => setStatusFilter('rejected')}
          >
            <div className="card-body py-2 py-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small fw-semibold">ไม่ผ่านการคัดเลือก</h6>
                  <h3 className="fw-bold mb-0 text-danger">{rejectedApplicants.length} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                </div>
                <i className="bi bi-x-circle fs-2 text-danger opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`card border-0 shadow-sm border-start border-primary border-4 h-100 cursor-pointer ${statusFilter === 'all' ? 'bg-primary bg-opacity-10' : 'bg-white'}`}
            style={{ borderRadius: '10px', cursor: 'pointer' }}
            onClick={() => setStatusFilter('all')}
          >
            <div className="card-body py-2 py-md-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small fw-semibold">ผู้สมัครทั้งหมด</h6>
                  <h3 className="fw-bold mb-0 text-primary">{totalApplicants} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                </div>
                <i className="bi bi-people fs-2 text-primary opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* แถบแจ้งเตือนและการจัดการเมื่อเลือกผู้สมัครหลายคน (Batch Action Bar) */}
      {selectedAppIds.length > 0 && (
        <div className="alert alert-success d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 shadow-sm py-3 px-4 rounded-3 border-0" style={{ backgroundColor: '#e8f5e9' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
              <i className="bi bi-check2-all fs-5"></i>
            </div>
            <div>
              <div className="fw-bold text-success fs-6">
                เลือกผู้สมัครแล้ว {selectedAppIds.length} คน
              </div>
              <div className="text-muted small">
                ท่านสามารถส่งผลการพิจารณาเบื้องต้นและส่งอีเมลแจ้งผู้สมัครที่เลือกพร้อมกันได้
              </div>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button
              type="button"
              className="btn btn-sm btn-success fw-bold px-3 py-2 shadow-sm rounded-pill"
              onClick={() => openBatchModal("ผ่านการคัดเลือกเบื้องต้น")}
            >
              <i className="bi bi-check-circle-fill me-1"></i> ให้ผ่าน ({selectedAppIds.length} คน)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger fw-bold px-3 py-2 shadow-sm rounded-pill bg-white"
              onClick={() => openBatchModal("ไม่ผ่านการคัดเลือกเบื้องต้น")}
            >
              <i className="bi bi-x-circle-fill me-1"></i> ไม่ผ่าน ({selectedAppIds.length} คน)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={() => setSelectedAppIds([])}
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}

      {/* ตารางรายชื่อผู้สมัคร */}
      <div className="card shadow-sm border-0" style={{ borderTop: '4px solid #03A96B', borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header bg-white py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <h6 className="mb-0 fw-bold"><i className="bi bi-list-ul me-2 text-success"></i>รายชื่อผู้สมัคร</h6>
              <span className="badge bg-light text-dark border">
                แสดง {filteredApplicants.length} จาก {totalApplicants} คน
              </span>
            </div>

            {/* ตัวกรองรอบการเปิดรับสมัคร */}
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="facultyRoundFilter" className="small fw-bold text-dark text-nowrap mb-0">
                <i className="bi bi-arrow-repeat text-success me-1"></i>รอบรับสมัคร:
              </label>
              <select
                id="facultyRoundFilter"
                className="form-select form-select-sm shadow-sm fw-bold"
                style={{ width: 'auto', minWidth: '150px', borderRadius: '8px' }}
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
              >
                <option value="all">แสดงทุกรอบ ({applicants.length} คน)</option>
                {availableRounds.map(r => (
                  <option key={r} value={String(r)}>
                    รอบที่ {r} {r === (jobDetails.roundNo || Math.max(...availableRounds)) ? '(ล่าสุด)' : ''} ({applicants.filter(a => Number(a.roundNo || 1) === r).length} คน)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ปุ่มตัวกรองสถานะ */}
          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-warning text-dark fw-bold shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('pending')}
              style={{ borderRadius: '20px' }}
            >
              <i className="bi bi-hourglass-split me-1"></i> รอการคัดเลือกเบื้องต้น ({pendingApplicants.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'passed' ? 'btn-success text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('passed')}
              style={{ borderRadius: '20px' }}
            >
              <i className="bi bi-check-circle me-1"></i> ผ่านเบื้องต้น ({passedApplicants.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'rejected' ? 'btn-danger text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('rejected')}
              style={{ borderRadius: '20px' }}
            >
              <i className="bi bi-x-circle me-1"></i> ไม่ผ่าน ({rejectedApplicants.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-dark text-white fw-bold shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('all')}
              style={{ borderRadius: '20px' }}
            >
              <i className="bi bi-people me-1"></i> ทั้งหมด ({totalApplicants})
            </button>
          </div>
        </div>

        <div className="card-body p-0">

          {/* ============================== */}
          {/* Desktop View (Table) */}
          {/* ============================== */}
          <div className="table-responsive d-none d-lg-block" style={{ minHeight: '300px' }}>
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-3 border-0 text-center" style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={isAllPendingSelected}
                      onChange={handleSelectAllPending}
                      title={isAllPendingSelected ? "ยกเลิกการเลือกทั้งหมด" : "เลือกผู้สมัครที่รอตรวจสอบทั้งหมด"}
                      disabled={pendingApplicants.length === 0}
                    />
                  </th>
                  <th className="py-3 px-4 border-0" style={{ width: '30%' }}>ข้อมูลผู้สมัคร</th>
                  <th className="py-3 px-4 border-0" style={{ width: '38%' }}>ผลการคัดเลือกเบื้องต้น (โดยคณะ)</th>
                  <th className="py-3 px-4 border-0" style={{ width: '28%' }}>จัดการโดยคณะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.length > 0 ? (
                  filteredApplicants.map((app, index) => (
                    <tr key={index} className={selectedAppIds.includes(app.rawId || app.id) ? "table-success" : ""}>
                      <td className="py-4 px-3 align-top border-bottom text-center">
                        <input
                          type="checkbox"
                          className="form-check-input mt-1"
                          checked={selectedAppIds.includes(app.rawId || app.id)}
                          onChange={() => toggleSelect(app.rawId || app.id)}
                          disabled={app.qualStatus !== 'รอตรวจสอบ' && !!app.qualStatus}
                          title={app.qualStatus !== 'รอตรวจสอบ' && !!app.qualStatus ? "ประเมินผลเรียบร้อยแล้ว ไม่สามารถเลือกได้" : `เลือก ${app.name}`}
                        />
                      </td>
                      <td className="py-4 px-4 align-top border-bottom">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-light text-secondary border">ลำดับที่ {index + 1}</span>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 small">
                            รอบที่ {app.roundNo || 1}
                          </span>
                        </div>
                        <div className="fw-bold text-primary fs-6 mb-1">{app.name}</div>
                        <div className="text-muted small"><i className="bi bi-calendar3 me-1"></i>สมัคร: {app.appliedDate}</div>
                      </td>

                      <td className="py-4 px-4 align-top border-bottom">
                        <div className="p-3 rounded bg-light border-start border-4" style={{ borderColor: app.qualStatus === 'รอตรวจสอบ' ? '#ffc107' : app.qualStatus.includes('ไม่ผ่าน') ? '#dc3545' : '#198754' }}>
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-dark mb-2">สถานะคุณสมบัติเบื้องต้น:</span>
                            <span className={getStatusColor(app.qualStatus)}>
                              {app.qualStatus === "รอตรวจสอบ" && <i className="bi bi-hourglass-split me-1"></i>}
                              {app.qualStatus === "ผ่านการคัดเลือกเบื้องต้น" && <i className="bi bi-check-circle-fill me-1"></i>}
                              {app.qualStatus === "ไม่ผ่านการคัดเลือกเบื้องต้น" && <i className="bi bi-x-circle-fill me-1"></i>}
                              {app.qualStatus}
                            </span>
                            {app.qualComment && <div className="text-danger small mt-2 pt-2 border-top">หมายเหตุ: {app.qualComment}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 align-top border-bottom">
                        <div className="d-flex flex-column gap-2" style={{ maxWidth: '240px' }}>
                          <Link to={`/applicant-details/${app.rawId || app.id}`} className="btn btn-sm btn-outline-secondary w-100 text-start" style={{ borderRadius: '6px' }}>
                            <i className="bi bi-file-earmark-text me-2"></i> ดูเอกสารประกอบ
                          </Link>
                          <button
                            className={`btn btn-sm w-100 text-start shadow-sm fw-bold ${app.qualStatus === 'รอตรวจสอบ' ? 'btn-warning text-dark' : 'btn-secondary text-white'}`}
                            onClick={() => openStatusModal(app)}
                            style={{ borderRadius: '6px' }}
                          >
                            {app.qualStatus === 'รอตรวจสอบ' ? (
                              <><i className="bi bi-check2-square me-2"></i> ประเมินผลเบื้องต้น</>
                            ) : (
                              <><i className="bi bi-lock-fill me-2"></i> ดูผลประเมิน (ส่งผลแล้ว)</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 text-secondary d-block mb-2"></i>
                      <div className="fw-bold fs-5">
                        {applicants.length === 0
                          ? 'ยังไม่มีผู้สมัครยื่นใบสมัครในตำแหน่งงานนี้'
                          : statusFilter === 'pending'
                            ? 'ไม่มีผู้สมัครที่รอการคัดเลือกเบื้องต้น (ได้รับการประเมินผลครบแล้ว)'
                            : roundFilter !== 'all'
                              ? `ไม่พบผู้สมัครในรอบที่ ${roundFilter}`
                              : 'ไม่พบรายชื่อผู้สมัครในสถานะที่เลือก'}
                      </div>
                      <div className="mt-2 d-flex justify-content-center gap-2 flex-wrap">
                        {applicants.length > 0 && (statusFilter !== 'all' || roundFilter !== 'all') && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm"
                            onClick={() => { setStatusFilter('all'); setRoundFilter('all'); }}
                          >
                            <i className="bi bi-people me-1"></i> ดูผู้สมัครทั้งหมด ({applicants.length} คน)
                          </button>
                        )}
                        {applicants.length === 0 && (
                          <Link to="/faculty-jobs" className="btn btn-outline-secondary btn-sm rounded-pill px-3 mt-1">
                            <i className="bi bi-arrow-left me-1"></i> กลับไปหน้ารายการประกาศของคณะ
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ============================== */}
          {/* Mobile View (Cards) */}
          {/* ============================== */}
          <div className="d-lg-none bg-light p-3">
            <div className="d-flex flex-column gap-3">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((app, index) => (
                  <div key={index} className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedAppIds.includes(app.rawId || app.id)}
                            onChange={() => toggleSelect(app.rawId || app.id)}
                            disabled={app.qualStatus !== 'รอตรวจสอบ' && !!app.qualStatus}
                          />
                          <span className="badge bg-light text-secondary border px-2 py-1">ลำดับที่ {index + 1}</span>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 small">
                            รอบที่ {app.roundNo || 1}
                          </span>
                        </div>
                        <span className="text-muted small"><i className="bi bi-calendar3 me-1"></i>{app.appliedDate}</span>
                      </div>
                      <h6 className="fw-bold text-primary mb-1">{app.name}</h6>

                      <div className="bg-white p-3 rounded border small mb-3">
                        <div className="fw-bold text-dark mb-2 pb-1 border-bottom">การคัดเลือกเบื้องต้น:</div>
                        <div className={getStatusColor(app.qualStatus)}>{app.qualStatus}</div>
                        {app.qualComment && <div className="text-danger mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>หมายเหตุ: {app.qualComment}</div>}
                      </div>

                      <div className="d-flex gap-2">
                        <Link to={`/applicant-details/${app.rawId || app.id}`} className="btn btn-sm btn-outline-secondary w-100 fw-bold" style={{ borderRadius: '6px' }}>
                          เอกสาร
                        </Link>
                        <button
                          className={`btn btn-sm w-100 fw-bold ${app.qualStatus === 'รอตรวจสอบ' ? 'btn-warning' : 'btn-secondary text-white'}`}
                          onClick={() => openStatusModal(app)}
                          style={{ borderRadius: '6px' }}
                        >
                          {app.qualStatus === 'รอตรวจสอบ' ? 'ประเมินผล' : 'ดูผลประเมิน (ส่งผลแล้ว)'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-5 text-muted bg-white rounded shadow-sm p-4">
                  <i className="bi bi-inbox fs-1 text-secondary d-block mb-2"></i>
                  <div className="fw-bold">
                    {applicants.length === 0
                      ? 'ยังไม่มีผู้สมัครยื่นใบสมัครในตำแหน่งงานนี้'
                      : statusFilter === 'pending'
                        ? 'ไม่มีผู้สมัครที่รอการคัดเลือกเบื้องต้น (ได้รับการประเมินผลครบแล้ว)'
                        : roundFilter !== 'all'
                          ? `ไม่พบผู้สมัครในรอบที่ ${roundFilter}`
                          : 'ไม่พบรายชื่อผู้สมัครในสถานะที่เลือก'}
                  </div>
                  <div className="mt-2 d-flex justify-content-center gap-2 flex-wrap">
                    {applicants.length > 0 && (statusFilter !== 'all' || roundFilter !== 'all') && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm"
                        onClick={() => { setStatusFilter('all'); setRoundFilter('all'); }}
                      >
                        <i className="bi bi-people me-1"></i> ดูผู้สมัครทั้งหมด ({applicants.length} คน)
                      </button>
                    )}
                    {applicants.length === 0 && (
                      <Link to="/faculty-jobs" className="btn btn-outline-secondary btn-sm rounded-pill px-3 mt-1">
                        <i className="bi bi-arrow-left me-1"></i> กลับไปหน้ารายการประกาศของคณะ
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* Modal Popup สำหรับประเมินผลและดูตัวอย่างอีเมล (ขยายเป็น modal-xl) */}
      {/* ========================================================= */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>

              <div className="modal-header text-white" style={{ backgroundColor: '#03A96B' }}>
                <h5 className="modal-title fw-bold fs-5 fs-md-4">
                  <i className="bi bi-person-check-fill me-2"></i>บันทึกผลการคัดเลือกเบื้องต้น
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} disabled={isSendingEmail}></button>
              </div>

              <form onSubmit={handleSaveReview}>
                <div className="modal-body p-4 bg-light">

                  {applicants.find(a => a.id === activeAppId)?.qualStatus !== "รอตรวจสอบ" && (
                    <div className="alert alert-warning py-2 px-3 mb-3 d-flex align-items-center gap-2 border border-warning shadow-sm" style={{ borderRadius: '8px' }}>
                      <i className="bi bi-lock-fill fs-5 text-warning-emphasis"></i>
                      <div>
                        <div className="fw-bold text-dark">ผลการคัดเลือกเบื้องต้นได้รับการบันทึกและส่งอีเมลแจ้งผู้สมัครเรียบร้อยแล้ว (ไม่สามารถแก้ไขได้)</div>
                        <div className="small text-muted">ระบบได้แจ้งผลไปยัง {applicants.find(a => a.id === activeAppId)?.email} เรียบร้อยแล้ว จึงไม่สามารถเปลี่ยนแปลงผลการประเมินได้</div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 mb-4 rounded d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 shadow-sm bg-white" style={{ borderLeft: '5px solid #03A96B' }}>
                    <div>
                      <div className="text-muted small mb-1"><i className="bi bi-person-circle me-1 text-success"></i>ข้อมูลผู้สมัคร</div>
                      <div className="fs-5 text-dark fw-bold">
                        ผู้สมัคร: <span style={{ color: '#03A96B' }}>{applicants.find(a => a.id === activeAppId)?.name}</span>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span className="badge bg-light text-dark border px-3 py-2 fs-6 rounded-pill">
                        <i className="bi bi-briefcase-fill me-1 text-primary"></i>{jobDetails.jobTitle || jobTitle}
                      </span>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fs-6 rounded-pill">
                        <i className="bi bi-building-fill me-1"></i>{jobDetails.facultyName || 'คณะ'} {jobDetails.departmentName && jobDetails.departmentName !== '-' ? `(${jobDetails.departmentName})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="row g-4">
                    {/* คอลัมน์ซ้าย: ฟอร์มประเมินผล */}
                    <div className="col-lg-5">
                      <div className="card shadow-sm border-0 border-primary h-100" style={{ borderTop: '4px solid #0d6efd' }}>
                        <div className="card-header bg-white fw-bold py-3 text-primary border-bottom d-flex justify-content-between align-items-center">
                          <span><i className="bi bi-clipboard-check me-2"></i>ประเมินคุณสมบัติโดยคณะ</span>
                        </div>
                        <div className="card-body p-4">

                          <div className="mb-4">
                            <label className="form-label fw-bold text-dark">ผลการคัดเลือกเบื้องต้น <span className="text-danger">*</span></label>
                            <select
                              className="form-select form-select-lg shadow-sm"
                              value={modalQual}
                              onChange={(e) => setModalQual(e.target.value)}
                              style={{ borderColor: modalQual === 'ผ่านการคัดเลือกเบื้องต้น' ? '#198754' : modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? '#dc3545' : '#ccc', fontSize: '1rem' }}
                              required
                              disabled={isSendingEmail || (applicants.find(a => a.id === activeAppId)?.qualStatus !== "รอตรวจสอบ")}
                            >
                              <option value="รอตรวจสอบ">⏳ รอตรวจสอบ</option>
                              <option value="ผ่านการคัดเลือกเบื้องต้น">✅ ผ่านการคัดเลือกเบื้องต้น</option>
                              <option value="ไม่ผ่านการคัดเลือกเบื้องต้น">❌ ไม่ผ่านการคัดเลือกเบื้องต้น</option>
                            </select>
                          </div>

                          <div className="p-3 bg-light rounded-3 border">
                            <div className="fw-bold text-dark small mb-2"><i className="bi bi-info-circle-fill me-1 text-primary"></i>รายละเอียดตำแหน่งที่ประเมิน</div>
                            <div className="small text-muted mb-1"><strong>ตำแหน่ง:</strong> {jobDetails.jobTitle || jobTitle}</div>
                            <div className="small text-muted mb-1"><strong>สังกัด:</strong> {jobDetails.facultyName || '-'} {jobDetails.departmentName && jobDetails.departmentName !== '-' ? `(${jobDetails.departmentName})` : ''}</div>
                            <div className="small text-muted"><strong>อีเมลผู้สมัคร:</strong> {applicants.find(a => a.id === activeAppId)?.email || '-'}</div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* คอลัมน์ขวา: พรีวิวและแก้ไขอีเมล */}
                    <div className="col-lg-7">
                      <div
                        className="card shadow-sm border-0 h-100 d-flex flex-column"
                        style={{
                          backgroundColor: modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? '#fff5f5' : modalQual === 'ผ่านการคัดเลือกเบื้องต้น' ? '#f0fdf4' : '#fff8e1',
                          border: modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? '1px solid #ffcdd2' : modalQual === 'ผ่านการคัดเลือกเบื้องต้น' ? '1px solid #bbf7d0' : '1px solid #ffecb3',
                          borderRadius: '12px'
                        }}
                      >
                        <div className={`card-header bg-transparent fw-bold py-3 border-bottom d-flex align-items-center justify-content-between ${modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? 'text-danger' : modalQual === 'ผ่านการคัดเลือกเบื้องต้น' ? 'text-success' : 'text-warning-emphasis'}`}>
                          <div className="d-flex align-items-center">
                            <i className={`bi me-2 fs-5 ${modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? 'bi-envelope-x-fill text-danger' : modalQual === 'ผ่านการคัดเลือกเบื้องต้น' ? 'bi-envelope-check-fill text-success' : 'bi-envelope-paper-fill'}`}></i>
                            {modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? 'ตัวอย่างอีเมลแจ้งเตือน (ไม่ผ่านคุณสมบัติ)' : 'ตัวอย่างอีเมลแจ้งเตือนผู้สมัคร'}
                          </div>
                          {applicants.find(a => a.id === activeAppId)?.qualStatus === "รอตรวจสอบ" && isEmailCustomized && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2 fw-normal"
                              onClick={() => { setIsEmailCustomized(false); setEmailBody(generateEmailPreview()); }}
                              title="คลิกเพื่อคืนค่าข้อความที่ระบบสร้างให้อัตโนมัติ"
                            >
                              <i className="bi bi-arrow-counterclockwise me-1"></i>รีเซ็ตข้อความ
                            </button>
                          )}
                        </div>
                        <div className="card-body d-flex flex-column p-4">
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-dark">หัวข้ออีเมล</label>
                            <input
                              type="text"
                              className="form-control bg-white"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              disabled={isSendingEmail || (applicants.find(a => a.id === activeAppId)?.qualStatus !== "รอตรวจสอบ")}
                              placeholder="ระบุหัวข้ออีเมล"
                            />
                          </div>
                          <div className="flex-grow-1 d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <label className="form-label small fw-bold text-dark mb-0">เนื้อหาอีเมล</label>
                              {applicants.find(a => a.id === activeAppId)?.qualStatus === "รอตรวจสอบ" && (
                                <span className="small text-muted" style={{ fontSize: '0.8rem' }}>
                                  <i className="bi bi-pencil-square me-1 text-primary"></i>พิมพ์แก้ไขได้โดยตรง
                                </span>
                              )}
                            </div>
                            <textarea
                              className="form-control bg-white text-dark flex-grow-1"
                              style={{
                                resize: 'vertical',
                                minHeight: '220px',
                                fontSize: '0.95rem',
                                borderColor: modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? '#f5c6cb' : undefined
                              }}
                              value={emailBody}
                              onChange={(e) => {
                                setIsEmailCustomized(true);
                                setEmailBody(e.target.value);
                              }}
                              disabled={isSendingEmail || (applicants.find(a => a.id === activeAppId)?.qualStatus !== "รอตรวจสอบ")}
                              placeholder="พิมพ์เนื้อหาอีเมลที่ต้องการส่ง..."
                            ></textarea>
                            {modalQual !== "รอตรวจสอบ" && applicants.find(a => a.id === activeAppId)?.qualStatus === "รอตรวจสอบ" && (
                              <div className={`form-text mt-2 small fw-bold ${modalQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? 'text-danger' : 'text-primary'}`}>
                                <i className="bi bi-info-circle me-1"></i>
                                เมื่อกดบันทึกผล ระบบจะส่งอีเมลฉบับนี้ไปยัง {applicants.find(a => a.id === activeAppId)?.email} ทันที
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                <div className="modal-footer bg-white border-top px-4 py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  {modalQual === "รอตรวจสอบ" && applicants.find(a => a.id === activeAppId)?.qualStatus === "รอตรวจสอบ" && (
                    <div className="text-warning-emphasis small fw-bold d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                      กรุณาเลือกผลการคัดเลือก (ผ่าน / ไม่ผ่าน) ด้านซ้ายก่อนบันทึก
                    </div>
                  )}
                  <div className="d-flex gap-2 ms-auto">
                    <button type="button" className="btn btn-light border fw-bold px-4" onClick={() => setShowModal(false)} disabled={isSendingEmail}>
                      {applicants.find(a => a.id === activeAppId)?.qualStatus !== "รอตรวจสอบ" ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
                    </button>
                    {applicants.find(a => a.id === activeAppId)?.qualStatus === "รอตรวจสอบ" ? (
                      <button type="submit" className="btn shadow-sm px-4 fw-bold" style={{ backgroundColor: '#03A96B', color: 'white' }} disabled={isSendingEmail}>
                        {isSendingEmail ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>กำลังส่งอีเมล...</>
                        ) : (
                          <><i className="bi bi-send-fill me-2"></i>บันทึกและส่งอีเมล</>
                        )}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary px-4 fw-bold shadow-sm" disabled>
                        <i className="bi bi-lock-fill me-2"></i>ส่งผลแล้ว (ไม่สามารถแก้ไขได้)
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Modal Popup สำหรับประเมินผลพร้อมกันหลายคน (Batch Review Modal) */}
      {/* ========================================================= */}
      {showBatchModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>

              <div className="modal-header text-white" style={{ backgroundColor: '#03A96B' }}>
                <h5 className="modal-title fw-bold fs-5 fs-md-4">
                  <i className="bi bi-check2-all me-2"></i>บันทึกผลการคัดเลือกเบื้องต้นแบบกลุ่ม ({selectedAppIds.length} คน)
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowBatchModal(false)} disabled={isBatchSending}></button>
              </div>

              <form onSubmit={handleSaveBatchReview}>
                <div className="modal-body p-4 bg-light">

                  <div className="p-3 mb-4 rounded d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 shadow-sm bg-white" style={{ borderLeft: '5px solid #03A96B' }}>
                    <div>
                      <div className="text-muted small mb-1"><i className="bi bi-people-fill me-1 text-success"></i>ประเมินผลผู้สมัครพร้อมกัน</div>
                      <div className="fs-5 text-dark fw-bold">
                        จำนวนผู้สมัครที่เลือก: <span className="text-success">{selectedAppIds.length} คน</span>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span className="badge bg-light text-dark border px-3 py-2 fs-6 rounded-pill">
                        <i className="bi bi-briefcase-fill me-1 text-primary"></i>{jobDetails.jobTitle || jobTitle}
                      </span>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fs-6 rounded-pill">
                        <i className="bi bi-building-fill me-1"></i>{jobDetails.facultyName || 'คณะ'} {jobDetails.departmentName && jobDetails.departmentName !== '-' ? `(${jobDetails.departmentName})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="row g-4">
                    {/* คอลัมน์ซ้าย: ฟอร์มประเมินผลและรายชื่อที่เลือก */}
                    <div className="col-lg-5">
                      <div className="card shadow-sm border-0 h-100" style={{ borderTop: '4px solid #03A96B' }}>
                        <div className="card-header bg-white fw-bold py-3 text-dark border-bottom d-flex justify-content-between align-items-center">
                          <span><i className="bi bi-clipboard-check me-2 text-success"></i>กำหนดผลการคัดเลือก</span>
                          <span className="badge bg-success bg-opacity-10 text-success">{selectedAppIds.length} คน</span>
                        </div>
                        <div className="card-body p-4">

                          <div className="mb-3">
                            <label className="form-label fw-bold text-dark">ผลการคัดเลือกเบื้องต้น (ที่เลือกทุกคน) <span className="text-danger">*</span></label>
                            <select
                              className="form-select form-select-lg shadow-sm"
                              value={batchQual}
                              onChange={(e) => setBatchQual(e.target.value)}
                              style={{ borderColor: batchQual === 'ผ่านการคัดเลือกเบื้องต้น' ? '#198754' : '#dc3545', fontSize: '1rem' }}
                              required
                              disabled={isBatchSending}
                            >
                              <option value="ผ่านการคัดเลือกเบื้องต้น"> ผ่านการคัดเลือกเบื้องต้น</option>
                              <option value="ไม่ผ่านการคัดเลือกเบื้องต้น"> ไม่ผ่านการคัดเลือกเบื้องต้น</option>
                            </select>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-bold text-dark small">หมายเหตุ / เหตุผลประกอบ (ถ้ามี)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={batchComment}
                              onChange={(e) => setBatchComment(e.target.value)}
                              placeholder="เช่น คุณสมบัติตรงตามประกาศรับสมัคร"
                              disabled={isBatchSending}
                            />
                          </div>

                          <div>
                            <label className="form-label fw-bold text-dark small mb-2">
                              <i className="bi bi-list-check me-1 text-primary"></i>รายชื่อผู้สมัครที่เลือก ({selectedApplicants.length} คน):
                            </label>
                            <div className="border rounded-3 p-2 bg-light" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                              {selectedApplicants.map((app, idx) => (
                                <div key={idx} className="d-flex justify-content-between align-items-center py-1 px-2 border-bottom bg-white rounded mb-1">
                                  <div>
                                    <span className="badge bg-light text-dark border me-2" style={{ fontSize: '0.75rem' }}>{idx + 1}</span>
                                    <span className="fw-bold text-dark small">{app.name}</span>
                                  </div>
                                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{app.email || '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* คอลัมน์ขวา: พรีวิวและแก้ไขอีเมล */}
                    <div className="col-lg-7">
                      <div
                        className="card shadow-sm border-0 h-100 d-flex flex-column"
                        style={{
                          backgroundColor: batchQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? '#fff5f5' : '#f0fdf4',
                          border: batchQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? '1px solid #ffcdd2' : '1px solid #bbf7d0',
                          borderRadius: '12px'
                        }}
                      >
                        <div className={`card-header bg-transparent fw-bold py-3 border-bottom d-flex align-items-center justify-content-between ${batchQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? 'text-danger' : 'text-success'}`}>
                          <div className="d-flex align-items-center">
                            <i className={`bi me-2 fs-5 ${batchQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? 'bi-envelope-x-fill text-danger' : 'bi-envelope-check-fill text-success'}`}></i>
                            ตัวอย่างเนื้อหาอีเมลที่จะส่งถึงผู้สมัคร
                          </div>
                          {isBatchEmailCustomized && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2 fw-normal"
                              onClick={() => { setIsBatchEmailCustomized(false); setBatchEmailBody(generateBatchEmailPreview()); }}
                              title="คลิกเพื่อคืนค่าข้อความที่ระบบสร้างให้อัตโนมัติ"
                            >
                              <i className="bi bi-arrow-counterclockwise me-1"></i>รีเซ็ตข้อความ
                            </button>
                          )}
                        </div>
                        <div className="card-body d-flex flex-column p-4">
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-dark">หัวข้ออีเมล</label>
                            <input
                              type="text"
                              className="form-control bg-white"
                              value={batchEmailSubject}
                              onChange={(e) => setBatchEmailSubject(e.target.value)}
                              disabled={isBatchSending}
                              placeholder="ระบุหัวข้ออีเมล"
                            />
                          </div>
                          <div className="flex-grow-1 d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <label className="form-label small fw-bold text-dark mb-0">เนื้อหาอีเมล (Template)</label>
                              <span className="small text-muted" style={{ fontSize: '0.8rem' }}>
                                <i className="bi bi-pencil-square me-1 text-primary"></i>แก้ไขเนื้อหาได้
                              </span>
                            </div>
                            <textarea
                              className="form-control bg-white text-dark flex-grow-1"
                              style={{
                                resize: 'vertical',
                                minHeight: '200px',
                                fontSize: '0.95rem',
                                borderColor: batchQual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' ? '#f5c6cb' : undefined
                              }}
                              value={batchEmailBody}
                              onChange={(e) => {
                                setIsBatchEmailCustomized(true);
                                setBatchEmailBody(e.target.value);
                              }}
                              disabled={isBatchSending}
                              placeholder="พิมพ์เนื้อหาอีเมลที่ต้องการส่ง..."
                            ></textarea>
                            <div className="alert alert-info py-2 px-3 mt-3 mb-0 d-flex align-items-center gap-2 border-0 small">
                              <i className="bi bi-magic fs-5 text-primary"></i>
                              <div>
                                <strong>ระบบจะระบุชื่อจริงของผู้สมัครแต่ละท่านโดยอัตโนมัติ:</strong> เมื่อส่งออก อีเมลแต่ละฉบับจะขึ้นต้นด้วยชื่อและคำนำหน้าจริงของผู้สมัครรายนั้นๆ เช่น "เรียน นายสมชาย ใจดี,"
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light border fw-bold px-4" onClick={() => setShowBatchModal(false)} disabled={isBatchSending}>
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn shadow-sm px-4 fw-bold" style={{ backgroundColor: '#03A96B', color: 'white' }} disabled={isBatchSending}>
                    {isBatchSending ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>กำลังส่งอีเมล...</>
                    ) : (
                      <><i className="bi bi-send-fill me-2"></i>บันทึกและส่งอีเมล ({selectedAppIds.length} คน)</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}