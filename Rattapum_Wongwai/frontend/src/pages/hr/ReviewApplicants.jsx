import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ReviewApplicants() {
  const { id } = useParams();

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState('กำลังโหลด...');
  const [positionExams, setPositionExams] = useState([]);
  const [jobDetails, setJobDetails] = useState({
    jobTitle: 'กำลังโหลด...',
    departmentName: '',
    facultyName: '',
    openDate: '',
    closeDate: ''
  });

  // State สำหรับตัวกรองการแสดงผลเฉพาะในตำแหน่งนี้
  // คีย์ที่รองรับ: 'waiting_all' (รอการจัดสอบ), 'exam_${ex.id}' (รอสอบแต่ละวิชา), 'failed_exam' (ไม่ผ่านการทดสอบ)
  const [selectedFilterKeys, setSelectedFilterKeys] = useState([]);

  // State สำหรับเลือกผู้สมัครหลายคน (Checkbox)
  const [selectedAppIds, setSelectedAppIds] = useState([]);

  // View state: 'list' | 'schedule' | 'results'
  const [view, setView] = useState('list');

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // ==========================================
  // State สำหรับ 1. การนัดหมายสอบ (Schedule View)
  // ==========================================
  const [scheduleTargets, setScheduleTargets] = useState([]); // ผู้สมัครที่จะส่งอีเมลนัดสอบ
  const [scheduleExams, setScheduleExams] = useState([]); // [{ Exam_position_type_id, name, date, time, location }]
  const [selectedScheduleExamIndex, setSelectedScheduleExamIndex] = useState(0); // เลือกนัดหมายสอบทีละ 1 วิชา
  const [scheduleEmailSubject, setScheduleEmailSubject] = useState('');
  const [scheduleEmailBody, setScheduleEmailBody] = useState('');
  const [isScheduleEmailCustomized, setIsScheduleEmailCustomized] = useState(false);

  // ==========================================
  // State สำหรับ 2. การบันทึกและแจ้งผลสอบ (Results View)
  // ==========================================
  const [resultApplicant, setResultApplicant] = useState(null); // ผู้สมัครที่กำลังลงคะแนน
  const [resultExams, setResultExams] = useState([]); // [{ Exam_position_type_id, name, status, score }]
  const [selectedResultExamIndex, setSelectedResultExamIndex] = useState(0); // เลือกแจ้งผลคะแนนทีละ 1 วิชา
  const [resultFinal, setResultFinal] = useState('รอพิจารณา');
  const [resultEmailSubject, setResultEmailSubject] = useState('');
  const [resultEmailBody, setResultEmailBody] = useState('');
  const [isResultEmailCustomized, setIsResultEmailCustomized] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/applications/recruitment/${id}`);
      const data = await res.json();
      if (data.success) {
        setApplicants(data.data || []);
        setJobTitle(data.jobTitle || 'ผู้สมัคร');
        if (data.jobDetails) setJobDetails(data.jobDetails);
        if (data.positionExams) setPositionExams(data.positionExams || []);

        // กำหนดรอบเริ่มต้นเป็นรอบล่าสุดของตำแหน่งนี้
        const latestRound = data.jobDetails?.roundNo
          ? Number(data.jobDetails.roundNo)
          : (data.data && data.data.length > 0
            ? Math.max(...data.data.map(a => Number(a.roundNo || 1)))
            : 1);
        setRoundFilter(String(latestRound));
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ฟังก์ชันตรวจสอบสถานะสำหรับตำแหน่งนี้
  // ==========================================
  // 1. สถานะรอคณะตรวจสอบคุณสมบัติเบื้องต้น (HR ยังไม่สามารถจัดสอบหรือแจ้งผลได้)
  const isPendingFaculty = (app) => {
    const qual = app.qualStatus || '';
    return !qual || qual === 'รอตรวจสอบ' || qual === 'รอคณะ/หน่วยงานพิจารณา';
  };

  // 2. สถานะไม่ผ่านคุณสมบัติจากคณะ
  const isRejectedFaculty = (app) => {
    const qual = app.qualStatus || '';
    return qual === 'ไม่ผ่านการคัดเลือกเบื้องต้น' || (qual.includes('ไม่ผ่าน') && !qual.includes('ผ่านการคัดเลือก'));
  };

  // 3. สถานะผ่านการคัดเลือกเบื้องต้นจากคณะ
  const isQualPassed = (app) => {
    const qual = app.qualStatus || '';
    return qual === 'ผ่านการคัดเลือกเบื้องต้น' || (qual.includes('ผ่าน') && !qual.includes('ไม่ผ่าน'));
  };

  // 4. ผู้สมัครที่ไม่ผ่านการทดสอบ (ไม่ผ่านในวิชาใดวิชาหนึ่ง หรือผลสอบรอบสุดท้ายไม่ผ่าน)
  const isFailedExam = (app) => {
    if (isRejectedFaculty(app)) return false; // ถ้าตกตั้งแต่รอบคณะ ไม่นับว่าไม่ผ่านการทดสอบ
    const exams = app.exams || [];
    const hasFailedInExam = exams.some(e => e.status === 'ไม่ผ่าน' || e.status === 'ไม่ผ่านการสอบ');
    const isFinalFailed = app.finalStatus === 'ไม่ผ่านการคัดเลือก' || app.finalStatus === 'ไม่ผ่าน';
    return hasFailedInExam || isFinalFailed;
  };

  // 5. ผู้สมัครที่ผ่าน (ผ่านการคัดเลือก / ได้งาน หรือผ่านทุกวิชาที่ต้องสอบ)
  const isPassedExam = (app) => {
    if (isRejectedFaculty(app) || isFailedExam(app)) return false;
    const final = app.finalStatus || '';
    if (final === 'ได้งาน' || final === 'ผ่านการคัดเลือก' || final === 'ผ่าน') return true;
    const exams = app.exams || [];
    if (exams.length > 0 && exams.every(e => e.status === 'ผ่าน' || e.status === 'ผ่านการสอบ')) {
      return true;
    }
    return false;
  };

  // 6. ผู้สมัครที่รอแจ้งผลคะแนน (นัดสอบแล้ว / ส่งอีเมลนัดสอบแล้ว แต่อยู่ระหว่างรอผลคะแนนหรือยังไม่ได้แจ้งผล)
  const isWaitingResults = (app) => {
    if (!isQualPassed(app) || isFailedExam(app) || isPassedExam(app)) return false;
    const exams = (app.exams && app.exams.length > 0) ? app.exams : positionExams;
    if (!exams || exams.length === 0) return false;
    return exams.some(ex => {
      const hasSchedule = ex.date && ex.date !== 'รอกำหนดการ' && ex.date !== '-';
      const isWaitingRes = ex.status === 'รอแจ้งผลคะแนน' || ex.status === 'รอผลการสอบ';
      const isPendingStatus = ex.status !== 'ผ่าน' && ex.status !== 'ผ่านการสอบ' && ex.status !== 'ไม่ผ่าน' && ex.status !== 'ไม่ผ่านการสอบ';
      return isWaitingRes || (hasSchedule && isPendingStatus);
    });
  };

  // 7. ผู้สมัครที่รอการจัดสอบ (ผ่านคุณสมบัติคณะแล้ว แต่ยังไม่ได้กำหนดวันสอบหรือยังไม่ได้ส่งอีเมลนัดสอบ)
  const isWaitingSchedule = (app) => {
    if (!isQualPassed(app) || isFailedExam(app) || isPassedExam(app)) return false;
    if (isWaitingResults(app)) return false;
    const exams = (app.exams && app.exams.length > 0) ? app.exams : positionExams;
    if (!exams || exams.length === 0) return true;
    return exams.some(ex => !ex.status || ex.status === 'รอจัดการสอบ' || ex.status === 'รอจัดสอบ' || !ex.date || ex.date === 'รอกำหนดการ');
  };

  // 8. ผู้สมัครที่รอการสอบแต่ละวิชา (ดึงมาจากตำแหน่งนั้นๆ เช่น รอสอบข้อเขียน, รอสอบสัมภาษณ์)
  const isWaitingSpecificExam = (app, examId, examName) => {
    if (!isQualPassed(app) || isFailedExam(app) || isPassedExam(app)) return false;
    const exams = (app.exams && app.exams.length > 0) ? app.exams : positionExams;
    const target = exams.find(e => e.Exam_position_type_id === examId || e.name === examName);
    if (!target) return false;
    return !target.status || target.status === 'รอจัดการสอบ' || target.status === 'รอจัดสอบ' || target.status === 'รอแจ้งผลคะแนน' || target.status === 'รอผลการสอบ';
  };

  // 9. ฟังก์ชันระบุสถานะภาพรวม 4 สถานะหลักสำหรับผู้สมัครแต่ละคน
  const getApplicantOverallStatus = (app) => {
    if (isPendingFaculty(app)) {
      return { key: 'pending_faculty', label: 'รอการคัดเลือกเบื้องต้น (คณะ)', badgeClass: 'bg-warning bg-opacity-25 text-warning-emphasis border border-warning', icon: 'bi-hourglass-split' };
    }
    if (isRejectedFaculty(app)) {
      return { key: 'rejected_faculty', label: 'ไม่ผ่านการคัดเลือกเบื้องต้น', badgeClass: 'bg-danger bg-opacity-10 text-danger border border-danger', icon: 'bi-x-circle-fill' };
    }
    if (isFailedExam(app)) {
      return { key: 'failed', label: 'ไม่ผ่าน', badgeClass: 'bg-danger text-white shadow-sm', icon: 'bi-x-circle-fill' };
    }
    if (isPassedExam(app)) {
      return { key: 'passed', label: 'ผ่าน', badgeClass: 'bg-success text-white shadow-sm', icon: 'bi-check-circle-fill' };
    }
    if (isWaitingResults(app)) {
      return { key: 'waiting_result', label: 'รอแจ้งผลคะแนน', badgeClass: 'bg-info bg-opacity-25 text-primary-emphasis border border-info shadow-sm', icon: 'bi-pencil-square' };
    }
    return { key: 'waiting_schedule', label: 'รอจัดการสอบ', badgeClass: 'bg-warning bg-opacity-25 text-dark border border-warning shadow-sm', icon: 'bi-clock-history' };
  };

  // ตรวจสอบว่าผู้สมัครถูกปิดการแก้ไข/นัดสอบ/แจ้งผลสอบหรือไม่ (แสดงสีเทาและแก้ไขไม่ได้)
  const isAppDisabled = (app) => {
    return isPendingFaculty(app) || isRejectedFaculty(app) || isFailedExam(app);
  };

  const getDisabledReason = (app) => {
    if (isPendingFaculty(app)) return 'อยู่ระหว่างรอคณะตรวจสอบคุณสมบัติเบื้องต้น';
    if (isRejectedFaculty(app)) return 'ไม่ผ่านการคัดเลือกเบื้องต้น';
    if (isFailedExam(app)) return 'ไม่ผ่านการทดสอบในรอบการสอบ';
    return '';
  };

  // ฟังก์ชันสลับการเลือกติ๊กกรอง
  const toggleFilter = (filterKey) => {
    setSelectedFilterKeys(prev => {
      if (prev.includes(filterKey)) {
        return prev.filter(k => k !== filterKey);
      } else {
        return [...prev, filterKey];
      }
    });
  };

  const [roundFilter, setRoundFilter] = useState('all');

  // รายการรอบทั้งหมดในตำแหน่งนี้ (เรียงรอบล่าสุดไว้ก่อน)
  const availableRounds = Array.from(
    new Set([
      ...(jobDetails.roundNo ? [Number(jobDetails.roundNo)] : []),
      ...applicants.map(a => Number(a.roundNo || 1))
    ])
  ).sort((a, b) => b - a);

  // ผู้สมัครที่กรองตามรอบก่อน (ใช้สำหรับคำนวณตัวเลขและสถิติในตำแหน่งนี้)
  const roundScopedApplicants = roundFilter === 'all'
    ? applicants
    : applicants.filter(a => Number(a.roundNo || 1) === Number(roundFilter));

  // กรองผู้สมัครตามตัวเลือกการติ๊กกรองในตำแหน่งนี้
  let displayedApplicants = roundScopedApplicants;
  if (selectedFilterKeys.length > 0) {
    displayedApplicants = displayedApplicants.filter(app => {
      return selectedFilterKeys.every(key => {
        if (key === 'waiting_schedule') return isWaitingSchedule(app);
        if (key === 'waiting_result') return isWaitingResults(app);
        if (key === 'passed') return isPassedExam(app);
        if (key === 'failed') return isFailedExam(app);
        if (key === 'waiting_all') return isWaitingSchedule(app) || isWaitingResults(app);
        if (key === 'failed_exam') return isFailedExam(app);
        if (key.startsWith('exam_')) {
          const examId = parseInt(key.replace('exam_', ''), 10);
          const examObj = positionExams.find(e => e.id === examId);
          return isWaitingSpecificExam(app, examId, examObj?.name);
        }
        return false;
      });
    });
  }

  // เรียงลำดับให้ผู้สมัครในรอบล่าสุดอยู่ด้านบนก่อนเสมอ
  displayedApplicants.sort((a, b) => {
    const roundDiff = Number(b.roundNo || 1) - Number(a.roundNo || 1);
    if (roundDiff !== 0) return roundDiff;
    return (b.rawId || 0) - (a.rawId || 0);
  });

  const totalApplicants = roundScopedApplicants.length;
  const qualifiedApplicants = roundScopedApplicants.filter(isQualPassed);
  const waitingScheduleCount = roundScopedApplicants.filter(isWaitingSchedule).length;
  const waitingResultCount = roundScopedApplicants.filter(isWaitingResults).length;
  const passedCount = roundScopedApplicants.filter(isPassedExam).length;
  const failedCount = roundScopedApplicants.filter(isFailedExam).length;

  // ==========================================
  // การจัดการ Checkbox เลือกหลายคน
  // ==========================================
  const toggleSelect = (appId) => {
    setSelectedAppIds(prev =>
      prev.includes(appId) ? prev.filter(x => x !== appId) : [...prev, appId]
    );
  };

  const handleSelectAll = () => {
    const selectableApplicants = displayedApplicants.filter(a => !isAppDisabled(a));
    const selectableIds = selectableApplicants.map(a => a.rawId || a.id);

    const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedAppIds.includes(id));
    if (allSelected) {
      setSelectedAppIds(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      setSelectedAppIds(prev => Array.from(new Set([...prev, ...selectableIds])));
    }
  };

  // ==========================================
  // แสดงสถานะการสอบในตาราง
  // ==========================================
  const renderApplicantExamStatuses = (app) => {
    const qual = app.qualStatus || '';
    const final = app.finalStatus || '';

    // 1. ไม่ผ่านคุณสมบัติเบื้องต้นจากคณะ
    if (qual === "ไม่ผ่านการคัดเลือกเบื้องต้น" || qual.includes("ไม่ผ่าน")) {
      return (
        <div className="d-flex flex-column align-items-center">
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger rounded-pill px-3 py-2 fw-bold">
            <i className="bi bi-x-circle-fill me-1"></i>ไม่ผ่านการคัดเลือกเบื้องต้น
          </span>
          <span className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>คณะปฏิเสธคุณสมบัติ</span>
        </div>
      );
    }

    // 2. รอคณะตรวจสอบคุณสมบัติเบื้องต้น
    if (qual === "รอตรวจสอบ" || qual === "รอคณะ/หน่วยงานพิจารณา") {
      return (
        <div className="d-flex flex-column align-items-center">
          <span className="badge bg-warning bg-opacity-25 text-warning-emphasis border border-warning rounded-pill px-3 py-2 fw-bold">
            <i className="bi bi-hourglass-split me-1"></i>รอการคัดเลือกเบื้องต้น (คณะ)
          </span>
          <span className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>รอคณะตรวจคุณสมบัติก่อนจัดสอบ</span>
        </div>
      );
    }

    // 3. ผ่านคุณสมบัติเบื้องต้น: แสดงสถานะภาพรวมหลัก + รายการวิชาที่ต้องสอบ
    const overall = getApplicantOverallStatus(app);
    const examsList = (app.exams && app.exams.length > 0) ? app.exams : positionExams;

    return (
      <div className="d-flex flex-column gap-2 text-start mx-auto" style={{ maxWidth: '380px' }}>
        {/* ป้ายสถานะภาพรวมหลัก (1 ใน 4 สถานะ: รอจัดการสอบ, รอแจ้งผลคะแนน, ผ่าน, ไม่ผ่าน) */}


        {examsList && examsList.length > 0 ? (
          examsList.map((ex, exIdx) => {
            const isPassed = ex.status === 'ผ่านการสอบ' || ex.status === 'ผ่าน';
            const isFailed = ex.status === 'ไม่ผ่าน' || ex.status === 'ไม่ผ่านการสอบ';
            const isWaitingRes = ex.status === 'รอแจ้งผลคะแนน' || (ex.date && ex.date !== 'รอกำหนดการ' && !isPassed && !isFailed);

            return (
              <div key={exIdx} className="d-flex align-items-center justify-content-between px-3 py-2 rounded-3 bg-light border border-1 shadow-sm">
                <div className="fw-semibold text-dark me-2 small">
                  <span className="badge bg-primary bg-opacity-10 text-primary me-2 rounded-pill">{exIdx + 1}</span>
                  {ex.name}
                  {ex.date && ex.date !== 'รอกำหนดการ' && (
                    <div className="text-muted" style={{ fontSize: '0.72rem', marginLeft: '1.75rem' }}>
                      <i className="bi bi-calendar3 me-1"></i>{ex.date} {ex.time && ex.time !== 'รอกำหนดการ' ? `(${ex.time})` : ''}
                    </div>
                  )}
                </div>
                <div>
                  {isPassed ? (
                    <span className="badge bg-success text-white rounded-pill px-2 py-1 fw-bold small">
                      <i className="bi bi-check-circle-fill me-1"></i>ผ่าน {ex.score ? `(${ex.score})` : ''}
                    </span>
                  ) : isFailed ? (
                    <span className="badge bg-danger text-white rounded-pill px-2 py-1 fw-bold small">
                      <i className="bi bi-x-circle-fill me-1"></i>ไม่ผ่าน {ex.score ? `(${ex.score})` : ''}
                    </span>
                  ) : isWaitingRes ? (
                    <span className="badge bg-info bg-opacity-25 text-primary border border-info rounded-pill px-2 py-1 fw-bold small">
                      <i className="bi bi-pencil-square me-1"></i>รอแจ้งผลคะแนน
                    </span>
                  ) : (
                    <span className="badge bg-warning bg-opacity-25 text-dark border border-warning rounded-pill px-2 py-1 fw-bold small">
                      <i className="bi bi-clock-history me-1"></i>รอจัดการสอบ
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-1">
            <span className="badge bg-light text-muted border px-3 py-2 rounded-pill">
              ไม่มีกำหนดการสอบสำหรับตำแหน่งนี้
            </span>
          </div>
        )}

        {/* ป้ายสรุปผลรอบสุดท้ายจาก HR หากสรุปแล้ว */}
        {(final === "ได้งาน" || final === "ผ่านการคัดเลือก" || final === "ผ่าน") && (
          <div className="mt-1 text-center">
            <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-1 rounded-pill fw-bold small">
              <i className="bi bi-trophy-fill me-1"></i>สรุปผล: ผ่านการคัดเลือกรอบสุดท้าย (ได้งาน)
            </span>
          </div>
        )}
        {final === "ไม่ผ่านการคัดเลือก" && (
          <div className="mt-1 text-center">
            <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-3 py-1 rounded-pill fw-bold small">
              <i className="bi bi-x-circle-fill me-1"></i>สรุปผล: ไม่ผ่านการคัดเลือกรอบสุดท้าย
            </span>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // ฟังก์ชันสร้างข้อความอีเมลแม่แบบ 1: การนัดหมายสอบ (Schedule Email - ทีละ 1 วิชา)
  // =========================================================================
  const generateScheduleEmail = (selectedExam, applicantsList = scheduleTargets) => {
    const pos = jobDetails.jobTitle || jobTitle || 'ตำแหน่งงาน';
    const facultyDeptText = `${jobDetails.facultyName || ''} ${jobDetails.departmentName && jobDetails.departmentName !== '-' ? `(${jobDetails.departmentName})` : ''}`.trim();
    const affiliationText = facultyDeptText ? ` สังกัด ${facultyDeptText}` : '';

    const firstApplicant = applicantsList && applicantsList.length > 0 ? applicantsList[0] : null;
    let recipientText = 'ผู้สมัคร';
    if (firstApplicant) {
      const rawName = (firstApplicant.name || '').trim();
      const hasTitle = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'].some(t => rawName.startsWith(t));
      const formattedName = hasTitle ? rawName : `คุณ${rawName}`;
      if (applicantsList.length === 1) {
        recipientText = formattedName;
      } else {
        recipientText = `${formattedName} (ระบบจะเปลี่ยนเป็นชื่อจริงของผู้สมัครแต่ละท่านโดยอัตโนมัติ)`;
      }
    }

    let body = `เรียน ${recipientText},\n\n`;
    body += `ตามที่ท่านได้สมัครเข้ารับการคัดเลือกเป็นบุคลากร ในตำแหน่ง ${pos}${affiliationText} นั้น\n`;
    body += `มหาวิทยาลัยขอแจ้งกำหนดการนัดหมายการทดสอบและประเมินความรู้ความสามารถ ดังนี้:\n\n`;

    if (selectedExam) {
      let dateStr = selectedExam.date;
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-');
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        dateStr = `${parseInt(d, 10)} ${thaiMonths[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
      }
      body += `วิชาที่จัดสอบ: ${selectedExam.name}\n`;
      body += `- วันที่สอบ: ${dateStr || 'รอกำหนดการ'}\n`;
      body += `- เวลาสอบ: ${selectedExam.time || 'รอกำหนดการ'}\n`;
      body += `- สถานที่ / ห้องสอบ: ${selectedExam.location || 'รอกำหนดการ'}\n\n`;
    } else {
      body += `(ยังไม่ได้เลือกวิชาสอบที่ต้องการนัดหมาย)\n\n`;
    }

    body += `คำแนะนำในการเข้าสอบ:\n`;
    body += `1. กรุณามาถึงสถานที่สอบก่อนเวลาอย่างน้อย 15 นาที\n`;
    body += `2. โปรดเตรียมบัตรประจำตัวประชาชนตัวจริง หรือเอกสารแสดงตนที่ทางราชการออกให้\n`;
    body += `3. แต่งกายด้วยชุดสุภาพเรียบร้อย\n\n`;
    body += `จึงเรียนมาเพื่อโปรดทราบและเข้ารับการทดสอบตามกำหนดการดังกล่าว\n\n`;
    body += `หน่วยทรัพยากรมนุษย์และสวัสดิการ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร`;
    return body;
  };

  // =========================================================================
  // ฟังก์ชันสร้างข้อความอีเมลแม่แบบ 2: การแจ้งผลสอบ (Results Email - ทีละ 1 วิชา)
  // =========================================================================
  const generateResultEmail = (applicant = resultApplicant, selectedExam = null, finalStatus = resultFinal) => {
    const pos = jobDetails.jobTitle || jobTitle || 'ตำแหน่งงาน';
    const facultyDeptText = `${jobDetails.facultyName || ''} ${jobDetails.departmentName && jobDetails.departmentName !== '-' ? `(${jobDetails.departmentName})` : ''}`.trim();
    const affiliationText = facultyDeptText ? ` สังกัด ${facultyDeptText}` : '';

    const rawName = (applicant?.name || '').trim();
    const hasTitle = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'].some(t => rawName.startsWith(t));
    const recipientText = hasTitle ? rawName : `คุณ${rawName || 'ผู้สมัคร'}`;

    let body = `เรียน ${recipientText},\n\n`;
    body += `ตามที่ท่านได้เข้ารับการคัดเลือกเป็นบุคลากร ในตำแหน่ง ${pos}${affiliationText}\n\n`;

    if (selectedExam) {
      body += `มหาวิทยาลัยขอแจ้งผลคะแนนและการทดสอบ: ${selectedExam.name}\n`;
      body += `- ผลการทดสอบ: ${selectedExam.status || 'รอผลการทดสอบ'}\n`;
      if (selectedExam.score) {
        body += `- คะแนนที่ได้: ${selectedExam.score}\n`;
      }
      body += `\n`;
    }

    if (finalStatus === "ได้งาน") {
      body += `ขอแสดงความยินดี ท่าน "ผ่านการคัดเลือกรอบสุดท้าย" ได้รับการบรรจุเข้าเป็นบุคลากร ในตำแหน่งดังกล่าว\nโปรดรอการติดต่อกลับจากหน่วยทรัพยากรมนุษย์และสวัสดิการ เพื่อดำเนินการรายงานตัวในขั้นตอนต่อไป\n\n`;
    } else if (finalStatus === "ไม่ผ่านการคัดเลือก") {
      body += `ขอเรียนให้ทราบว่า ท่าน "ไม่ผ่านการคัดเลือกรอบสุดท้าย" ในการคัดเลือกตำแหน่งดังกล่าว\nมหาวิทยาลัยขอขอบคุณที่ท่านให้ความสนใจร่วมงานกับเรา และหวังเป็นอย่างยิ่งว่าจะมีโอกาสได้ร่วมงานกันในอนาคต\n\n`;
    }

    body += `จึงเรียนมาเพื่อโปรดทราบ\nหน่วยทรัพยากรมนุษย์และสวัสดิการ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร`;
    return body;
  };

  // ==========================================
  // 1. จัดการเปิดหน้า "นัดหมายสอบ" (Schedule View)
  // ==========================================
  const handleOpenSchedule = (targetApplicantsList) => {
    const validTargets = (targetApplicantsList || []).filter(a => !isAppDisabled(a));
    if (validTargets.length === 0) {
      alert('ผู้สมัครที่เลือกไม่สามารถนัดสอบได้ (เนื่องจากรอคณะตรวจสอบ หรือไม่ผ่านคุณสมบัติ/การทดสอบ)');
      return;
    }

    setScheduleTargets(validTargets);

    // สร้างรายการวิชาสอบ
    let initExams = [];
    if (positionExams && positionExams.length > 0) {
      initExams = positionExams.map(ex => ({
        Exam_position_type_id: ex.id,
        name: ex.name,
        date: (ex.date && /^\d{4}-\d{2}-\d{2}$/.test(ex.date)) ? ex.date : '',
        time: ex.time === 'รอกำหนดการ' ? '' : (ex.time || ''),
        location: ex.location === 'รอกำหนดการ' ? '' : (ex.location || '')
      }));
    } else if (targetApplicantsList[0]?.exams && targetApplicantsList[0].exams.length > 0) {
      initExams = targetApplicantsList[0].exams.map(ex => ({
        Exam_position_type_id: ex.Exam_position_type_id,
        name: ex.name,
        date: (ex.date && /^\d{4}-\d{2}-\d{2}$/.test(ex.date)) ? ex.date : '',
        time: ex.time === 'รอกำหนดการ' ? '' : (ex.time || ''),
        location: ex.location === 'รอกำหนดการ' ? '' : (ex.location || '')
      }));
    }

    setScheduleExams(initExams);
    setSelectedScheduleExamIndex(0);
    const pos = jobDetails.jobTitle || jobTitle || 'ตำแหน่งงาน';
    const firstExamName = initExams[0]?.name || 'การสอบ';
    setScheduleEmailSubject(`แจ้งกำหนดการนัดหมายสอบ: ${firstExamName} - ตำแหน่ง ${pos}`);
    setIsScheduleEmailCustomized(false);
    setScheduleEmailBody(generateScheduleEmail(initExams[0], targetApplicantsList));

    setView('schedule');
    window.scrollTo(0, 0);
  };

  // จัดการเลือกวิชาที่จะนัดหมายสอบ (เลือกทีละ 1 วิชา)
  const handleSelectScheduleExam = (index) => {
    setSelectedScheduleExamIndex(index);
    const pos = jobDetails.jobTitle || jobTitle || 'ตำแหน่งงาน';
    const examName = scheduleExams[index]?.name || 'การสอบ';
    if (!isScheduleEmailCustomized) {
      setScheduleEmailSubject(`แจ้งกำหนดการนัดหมายสอบ: ${examName} - ตำแหน่ง ${pos}`);
      setScheduleEmailBody(generateScheduleEmail(scheduleExams[index], scheduleTargets));
    }
  };

  const handleScheduleExamChange = (index, field, value) => {
    const updated = [...scheduleExams];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleExams(updated);
    if (!isScheduleEmailCustomized && index === selectedScheduleExamIndex) {
      setScheduleEmailBody(generateScheduleEmail(updated[index], scheduleTargets));
    }
  };

  // กดยืนยันการส่งอีเมลนัดสอบ -> เปิด Confirmation Modal
  const handleRequestScheduleSubmit = (e) => {
    if (e) e.preventDefault();
    if (scheduleTargets.length === 0) {
      alert('ไม่พบรายชื่อผู้สมัครที่จะส่งอีเมล');
      return;
    }

    const currentExam = scheduleExams[selectedScheduleExamIndex];
    if (!currentExam) {
      alert('กรุณาเลือกวิชาที่ต้องการนัดหมายสอบ');
      return;
    }

    setConfirmModalData({
      type: 'schedule',
      title: 'ยืนยันการส่งอีเมลนัดหมายสอบ',
      icon: <i className="bi bi-calendar-check-fill text-primary me-2 fs-5"></i>,
      subject: scheduleEmailSubject,
      selectedExams: [currentExam.name],
      recipients: scheduleTargets.map(a => ({
        id: a.rawId || a.id,
        name: a.name,
        email: a.email
      })),
      onConfirm: executeScheduleSend
    });
    setShowConfirmModal(true);
  };

  const executeScheduleSend = async () => {
    setIsSending(true);
    try {
      const appIds = scheduleTargets.map(a => a.rawId || a.id);
      const currentExam = scheduleExams[selectedScheduleExamIndex];

      const res = await fetch('http://localhost:3000/api/applications/batch-schedule-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruitmentId: id,
          applicationIds: appIds,
          exams: [currentExam], // ส่งเฉพาะ 1 วิชาที่เลือก
          emailSubject: scheduleEmailSubject,
          emailBodyTemplate: scheduleEmailBody,
          sendEmail: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`บันทึกกำหนดการสอบและส่งอีเมลเรียบร้อยแล้ว!\n(ส่งสำเร็จ ${data.sentCount || scheduleTargets.length} ท่าน สำหรับวิชา "${currentExam.name}" และอัปเดตสถานะเป็น "รอแจ้งผลคะแนน")`);
        setShowConfirmModal(false);
        setSelectedAppIds([]);
        fetchApplicants();
        setView('list');
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถส่งอีเมลได้'));
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSending(false);
    }
  };

  // ==========================================
  // 2. จัดการเปิดหน้า "บันทึกและแจ้งผลสอบ" (Results View - ทีละ 1 วิชา)
  // ==========================================
  const handleOpenResults = async (applicant) => {
    if (isAppDisabled(applicant)) {
      alert(`ไม่สามารถแจ้งผลสอบได้ (${getDisabledReason(applicant)})`);
      return;
    }

    setResultApplicant(applicant);
    const initialFinal = applicant.finalStatus || 'รอพิจารณา';
    setResultFinal(initialFinal);
    setIsResultEmailCustomized(false);

    const pos = jobDetails.jobTitle || jobTitle || 'ตำแหน่งงาน';

    let loadedExams = [];
    try {
      const appId = applicant.rawId || applicant.id;
      const res = await fetch(`http://localhost:3000/api/applications/${appId}/tracking`);
      const data = await res.json();
      if (data.success && data.data.exams) {
        loadedExams = data.data.exams.map(ex => {
          let st = ex.status;
          let sc = ex.score || '';
          if (st && st.includes('|')) {
            const parts = st.split('|');
            st = parts[0];
            sc = parts[1];
          }
          return {
            ...ex,
            status: st || 'รอจัดสอบ',
            score: sc
          };
        });
      } else if (applicant.exams) {
        loadedExams = applicant.exams;
      }
    } catch (err) {
      console.error(err);
      if (applicant.exams) loadedExams = applicant.exams;
    }

    setResultExams(loadedExams);
    setSelectedResultExamIndex(0);
    const firstExam = loadedExams[0];
    const examName = firstExam?.name || 'รายวิชา';
    setResultEmailSubject(`แจ้งผลคะแนนและการทดสอบ: ${examName} - ตำแหน่ง ${pos}`);
    setResultEmailBody(generateResultEmail(applicant, firstExam, initialFinal));
    setView('results');
    window.scrollTo(0, 0);
  };

  const handleSelectResultExam = (index) => {
    setSelectedResultExamIndex(index);
    const pos = jobDetails.jobTitle || jobTitle || 'ตำแหน่งงาน';
    const examName = resultExams[index]?.name || 'รายวิชา';
    if (!isResultEmailCustomized) {
      setResultEmailSubject(`แจ้งผลคะแนนและการทดสอบ: ${examName} - ตำแหน่ง ${pos}`);
      setResultEmailBody(generateResultEmail(resultApplicant, resultExams[index], resultFinal));
    }
  };

  const handleResultExamChange = (index, field, value) => {
    const updated = [...resultExams];
    updated[index][field] = value;
    setResultExams(updated);
    if (!isResultEmailCustomized && index === selectedResultExamIndex) {
      setResultEmailBody(generateResultEmail(resultApplicant, updated[index], resultFinal));
    }
  };

  const handleResultFinalChange = (value) => {
    setResultFinal(value);
    if (!isResultEmailCustomized) {
      setResultEmailBody(generateResultEmail(resultApplicant, resultExams[selectedResultExamIndex], value));
    }
  };

  // กดยืนยันการส่งอีเมลผลสอบ -> เปิด Confirmation Modal
  const handleRequestResultsSubmit = (e) => {
    if (e) e.preventDefault();
    if (!resultApplicant) return;

    const currentExam = resultExams[selectedResultExamIndex];

    setConfirmModalData({
      type: 'results',
      title: 'ยืนยันการส่งอีเมลแจ้งผลคะแนนและการทดสอบ',
      icon: <i className="bi bi-clipboard2-check-fill text-success me-2 fs-5"></i>,
      subject: resultEmailSubject,
      selectedExams: currentExam ? [currentExam.name] : [],
      recipients: [{
        id: resultApplicant.rawId || resultApplicant.id,
        name: resultApplicant.name,
        email: resultApplicant.email
      }],
      onConfirm: executeResultsSend
    });
    setShowConfirmModal(true);
  };

  const executeResultsSend = async () => {
    setIsSending(true);
    try {
      const appId = resultApplicant.rawId || resultApplicant.id;
      const currentExam = resultExams[selectedResultExamIndex];

      const res = await fetch(`http://localhost:3000/api/applications/${appId}/evaluation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qualStatus: resultApplicant.qualStatus,
          finalStatus: resultFinal,
          exams: resultExams, // ส่งผลการสอบทั้งหมดเพื่อบันทึกลง DB
          emailSubject: resultEmailSubject,
          emailBody: resultEmailBody,
          sendEmail: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`บันทึกผลสอบและส่งอีเมลแจ้งผู้สมัครเรียบร้อยแล้ว!\n(วิชา: "${currentExam?.name || 'รายวิชา'}" ส่งไปยัง: ${resultApplicant.email || 'ผู้สมัคร'})`);
        setShowConfirmModal(false);
        fetchApplicants();
        setView('list');
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถบันทึกได้'));
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = (app) => {
    const appId = app?.rawId || app?.id;
    if (!appId) {
      alert('ไม่พบรหัสใบสมัครของผู้สมัครท่านนี้');
      return;
    }
    // เปิด/ดาวน์โหลดไฟล์ PDF ใบสมัครจริงจาก backend API เพื่อดู พิมพ์ หรือบันทึกเป็น PDF ทันที
    window.open(`http://localhost:3000/api/export/application/${appId}/pdf`, '_blank');
  };

  // =========================================================================
  // VIEW 1: หน้าตารางรายชื่อผู้สมัคร (List View)
  // =========================================================================
  if (view === 'list') {
    const selectableInDisplay = displayedApplicants.filter(a => !isAppDisabled(a));
    const allSelectableChecked = selectableInDisplay.length > 0 && selectableInDisplay.every(a => selectedAppIds.includes(a.rawId || a.id));

    return (
      <div className="container-fluid py-4 position-relative">

        {/* ส่วนหัวหน้าจอ */}
        <div className="mb-4 d-flex align-items-start gap-3">
          <Link to="/manage-jobs" className="btn btn-outline-secondary btn-sm rounded-circle px-2 mt-1 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
            <i className="bi bi-arrow-left fs-5"></i>
          </Link>
          <div className="flex-grow-1">
            <h2 className="mb-1" style={{ color: '#03A96B', fontWeight: '600' }}>
              <i className="bi bi-person-lines-fill me-2"></i>ตรวจสอบและจัดการผู้สมัคร
            </h2>

            {/* ข้อมูลสังกัดและวันที่ของตำแหน่งนี้ */}
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

            {/* แสดงรายการสอบที่ตำแหน่งนี้กำหนดไว้ */}
            <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-2 border-top">
              <span className="small fw-bold text-dark me-1 d-flex align-items-center">
                <i className="bi bi-pencil-square me-1 text-success fs-6"></i>การสอบที่ต้องสอบในตำแหน่งนี้ ({positionExams.length} รายการ):
              </span>
              {positionExams.length > 0 ? (
                positionExams.map((ex, idx) => (
                  <span key={idx} className="badge bg-white text-dark border px-3 py-2 shadow-sm rounded-pill small fw-semibold">
                    <span className="badge bg-primary bg-opacity-10 text-primary me-1 rounded-circle">{idx + 1}</span>
                    {ex.name}
                  </span>
                ))
              ) : (
                <span className="text-muted small">ไม่มีกำหนดการสอบสำหรับตำแหน่งนี้</span>
              )}
            </div>
          </div>
        </div>

        {/* การ์ดสรุปภาพรวม 4 สถานะหลัก */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg">
            <div className="card border-0 shadow-sm border-start border-primary border-4 h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-bold">ผู้สมัครทั้งหมด</h6>
                    <h3 className="fw-bold mb-0 text-primary">{totalApplicants} <span className="fs-6 fw-normal text-muted">คน</span></h3>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>ทั้งหมดในรอบนี้</div>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary d-none d-sm-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-people-fill fs-5"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg">
            <div className="card border-0 shadow-sm border-start border-warning border-4 h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-bold">รอจัดการสอบ</h6>
                    <h3 className="fw-bold mb-0 text-warning text-dark">
                      {waitingScheduleCount} <span className="fs-6 fw-normal text-muted">คน</span>
                    </h3>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>รอกำหนดวัน/ส่งอีเมลนัดสอบ</div>
                  </div>
                  <div className="p-2 rounded-circle d-none d-sm-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', backgroundColor: '#fff3cd' }}>
                    <i className="bi bi-clock-history fs-5" style={{ color: '#d97706' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg">
            <div className="card border-0 shadow-sm border-start border-info border-4 h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-bold">รอแจ้งผลคะแนน</h6>
                    <h3 className="fw-bold mb-0 text-info">
                      {waitingResultCount} <span className="fs-6 fw-normal text-muted">คน</span>
                    </h3>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>นัดสอบแล้ว รอผล/แจ้งคะแนน</div>
                  </div>
                  <div className="bg-info bg-opacity-10 p-2 rounded-circle text-info d-none d-sm-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-pencil-square fs-5"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg">
            <div className="card border-0 shadow-sm border-start border-success border-4 h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-bold">ผ่านการสอบ</h6>
                    <h3 className="fw-bold mb-0 text-success">
                      {passedCount} <span className="fs-6 fw-normal text-muted">คน</span>
                    </h3>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>ผ่านการคัดเลือก</div>
                  </div>
                  <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success d-none d-sm-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg">
            <div className="card border-0 shadow-sm border-start border-danger border-4 h-100" style={{ borderRadius: '12px' }}>
              <div className="card-body py-3 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1 small fw-bold">ไม่ผ่านการสอบ</h6>
                    <h3 className="fw-bold mb-0 text-danger">
                      {failedCount} <span className="fs-6 fw-normal text-muted">คน</span>
                    </h3>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>ไม่ผ่านเกณฑ์การทดสอบ</div>
                  </div>
                  <div className="bg-danger bg-opacity-10 p-2 rounded-circle text-danger d-none d-sm-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-x-circle-fill fs-5 text-danger"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* แถบตัวกรองการแสดงผล (Filter Toolbar: ติ๊กกรองผู้สมัครในตำแหน่งนี้) */}
        {/* ========================================================================= */}
        <div className="card shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px' }}>
          <div className="card-body p-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                {/* ตัวกรองรอบการรับสมัคร */}
                <div className="d-flex align-items-center gap-2 me-2 pe-2 border-end">
                  <label htmlFor="roundFilterSelect" className="small fw-bold text-dark text-nowrap mb-0">
                    <i className="bi bi-arrow-repeat text-success me-1"></i>รอบรับสมัคร:
                  </label>
                  <select
                    id="roundFilterSelect"
                    className="form-select form-select-sm shadow-sm fw-bold"
                    style={{ width: 'auto', minWidth: '150px', borderRadius: '8px' }}
                    value={roundFilter}
                    onChange={(e) => setRoundFilter(e.target.value)}
                  >
                    {availableRounds.map(r => (
                      <option key={r} value={String(r)}>
                        รอบที่ {r} {r === (jobDetails.roundNo || Math.max(...availableRounds)) ? '(ล่าสุด)' : ''} ({applicants.filter(a => Number(a.roundNo || 1) === r).length} คน)
                      </option>
                    ))}
                    <option value="all">แสดงทุกรอบ ({applicants.length} คน)</option>
                  </select>
                </div>

                <span className="fw-bold text-dark small d-flex align-items-center me-2">
                  <i className="bi bi-funnel-fill text-primary me-2"></i>ติ๊กกรองสถานะ:
                </span>

                {/* 1. ติ๊กกรอง: รอจัดการสอบ */}
                <div
                  className={`form-check form-check-inline mb-0 px-3 py-2 rounded-3 border transition-all ${selectedFilterKeys.includes('waiting_schedule') ? 'bg-warning bg-opacity-10 border-warning shadow-sm' : 'bg-light'
                    }`}
                >
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="filter_waiting_schedule"
                    checked={selectedFilterKeys.includes('waiting_schedule')}
                    onChange={() => toggleFilter('waiting_schedule')}
                  />
                  <label className="form-check-label small fw-bold cursor-pointer text-dark user-select-none" htmlFor="filter_waiting_schedule">
                    <i className="bi bi-clock-history text-warning me-1"></i>รอจัดการสอบ
                    <span className="badge bg-warning text-dark ms-2 rounded-pill">
                      {waitingScheduleCount} คน
                    </span>
                  </label>
                </div>

                {/* 2. ติ๊กกรอง: รอแจ้งผลคะแนน */}
                <div
                  className={`form-check form-check-inline mb-0 px-3 py-2 rounded-3 border transition-all ${selectedFilterKeys.includes('waiting_result') ? 'bg-info bg-opacity-10 border-info shadow-sm' : 'bg-light'
                    }`}
                >
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="filter_waiting_result"
                    checked={selectedFilterKeys.includes('waiting_result')}
                    onChange={() => toggleFilter('waiting_result')}
                  />
                  <label className="form-check-label small fw-bold cursor-pointer text-dark user-select-none" htmlFor="filter_waiting_result">
                    <i className="bi bi-pencil-square text-info me-1"></i>รอแจ้งผลคะแนน
                    <span className="badge bg-info text-white ms-2 rounded-pill">
                      {waitingResultCount} คน
                    </span>
                  </label>
                </div>

                {/* 3. ติ๊กกรอง: ผ่าน */}
                <div
                  className={`form-check form-check-inline mb-0 px-3 py-2 rounded-3 border transition-all ${selectedFilterKeys.includes('passed') ? 'bg-success bg-opacity-10 border-success shadow-sm' : 'bg-light'
                    }`}
                >
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="filter_passed"
                    checked={selectedFilterKeys.includes('passed')}
                    onChange={() => toggleFilter('passed')}
                  />
                  <label className="form-check-label small fw-bold cursor-pointer text-dark user-select-none" htmlFor="filter_passed">
                    <i className="bi bi-check-circle text-success me-1"></i>ผ่าน
                    <span className="badge bg-success text-white ms-2 rounded-pill">
                      {passedCount} คน
                    </span>
                  </label>
                </div>

                {/* 4. ติ๊กกรอง: ไม่ผ่าน */}
                <div
                  className={`form-check form-check-inline mb-0 px-3 py-2 rounded-3 border transition-all ${selectedFilterKeys.includes('failed') ? 'bg-danger bg-opacity-10 border-danger shadow-sm' : 'bg-light'
                    }`}
                >
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="filter_failed"
                    checked={selectedFilterKeys.includes('failed')}
                    onChange={() => toggleFilter('failed')}
                  />
                  <label className="form-check-label small fw-bold cursor-pointer text-dark user-select-none" htmlFor="filter_failed">
                    <i className="bi bi-x-circle text-danger me-1"></i>ไม่ผ่าน
                    <span className="badge bg-danger text-white ms-2 rounded-pill">
                      {failedCount} คน
                    </span>
                  </label>
                </div>

                {/* 5. ติ๊กกรอง: ผู้สมัครที่รอการสอบแต่ละวิชา */}
                {positionExams.map((ex, exIdx) => {
                  const key = `exam_${ex.id}`;
                  const isChecked = selectedFilterKeys.includes(key);
                  const count = roundScopedApplicants.filter(a => isWaitingSpecificExam(a, ex.id, ex.name)).length;
                  const label = ex.name.startsWith('สอบ') ? `ผู้สมัครที่รอ${ex.name}` : `ผู้สมัครที่รอสอบ${ex.name}`;

                  return (
                    <div
                      key={exIdx}
                      className={`form-check form-check-inline mb-0 px-3 py-2 rounded-3 border transition-all ${isChecked ? 'bg-primary bg-opacity-10 border-primary shadow-sm' : 'bg-light'
                        }`}
                    >
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        id={`filter_${key}`}
                        checked={isChecked}
                        onChange={() => toggleFilter(key)}
                      />
                      <label className="form-check-label small fw-bold cursor-pointer text-dark user-select-none" htmlFor={`filter_${key}`}>
                        <i className="bi bi-card-checklist text-primary me-1"></i>{label}
                        <span className="badge bg-primary text-white ms-2 rounded-pill">
                          {count} คน
                        </span>
                      </label>
                    </div>
                  );
                })}

                {/* ปุ่มล้างตัวกรอง */}
                {selectedFilterKeys.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary border-0 text-muted ms-1"
                    onClick={() => setSelectedFilterKeys([])}
                  >
                    <i className="bi bi-x-circle me-1"></i>ล้างตัวกรอง
                  </button>
                )}
              </div>

              <div className="text-muted small">
                แสดง <strong>{displayedApplicants.length}</strong> จาก <strong>{totalApplicants}</strong> คน
              </div>
            </div>
          </div>
        </div>

        {/* แถบเครื่องมือจัดการหลายคนพร้อมกัน (Batch Action Bar) */}
        <div className="card shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px' }}>
          <div className="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary fw-semibold"
                onClick={handleSelectAll}
              >
                <i className={`bi ${allSelectableChecked ? 'bi-check-square-fill text-primary' : 'bi-square'} me-1`}></i>
                {allSelectableChecked ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>

              {selectedAppIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-light border text-muted"
                  onClick={() => setSelectedAppIds([])}
                >
                  <i className="bi bi-x-lg me-1"></i>ล้างการเลือก
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark border px-3 py-2 fs-6 rounded-pill">
                เลือกอยู่ <strong>{selectedAppIds.length}</strong> คน
              </span>
              <button
                type="button"
                className="btn btn-primary shadow-sm fw-bold d-flex align-items-center"
                disabled={selectedAppIds.length === 0}
                onClick={() => {
                  const targets = displayedApplicants.filter(a => selectedAppIds.includes(a.rawId || a.id) && !isAppDisabled(a));
                  if (targets.length === 0) {
                    alert('ผู้สมัครที่เลือกไม่สามารถนัดสอบได้ (เนื่องจากรอคณะตรวจสอบ หรือไม่ผ่านคุณสมบัติ/การทดสอบ)');
                    return;
                  }
                  handleOpenSchedule(targets);
                }}
              >
                <i className="bi bi-calendar-plus me-2"></i>
                นัดสอบผู้สมัครที่เลือก ({selectedAppIds.length} คน)
              </button>
            </div>
          </div>
        </div>

        {/* ตาราง Desktop View */}
        <div className="card shadow-sm border-0 d-none d-lg-block" style={{ borderTop: '4px solid #03A96B', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold text-dark">
              <i className="bi bi-list-ul me-2 text-primary"></i>
              รายชื่อผู้สมัคร ({jobDetails.jobTitle || jobTitle})
            </h6>
            <span className="badge bg-light text-muted border px-3 py-1 rounded-pill small">
              {displayedApplicants.length} คน
            </span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive" style={{ minHeight: '400px' }}>
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="py-3 px-3 text-center border-0" style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={allSelectableChecked}
                        onChange={handleSelectAll}
                        title="เลือกทั้งหมดเฉพาะผู้สมัครที่สามารถดำเนินการได้"
                      />
                    </th>
                    <th className="py-3 px-3 border-0" style={{ width: '28%' }}>ข้อมูลผู้สมัคร</th>
                    <th className="py-3 px-4 border-0 text-center" style={{ width: '42%' }}>การสอบและสถานะของตำแหน่งนี้</th>
                    <th className="py-3 px-3 border-0 text-end" style={{ width: '26%' }}>จัดการโดย HR</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedApplicants.map((app, index) => {
                    const isSelected = selectedAppIds.includes(app.rawId || app.id);
                    const isPending = isPendingFaculty(app);
                    const isRejected = isRejectedFaculty(app);
                    const isFailed = isFailedExam(app);
                    const isDisabled = isAppDisabled(app);
                    const disabledReason = getDisabledReason(app);

                    return (
                      <tr
                        key={index}
                        className={`${isSelected ? 'table-primary bg-opacity-25' : ''} ${isDisabled ? 'bg-light bg-opacity-75 text-muted' : ''}`}
                        style={isDisabled ? { backgroundColor: '#fcfcfc' } : {}}
                      >
                        <td className="py-4 px-3 text-center align-middle border-bottom">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleSelect(app.rawId || app.id)}
                            title={isDisabled ? `ไม่สามารถเลือกได้ (${disabledReason})` : "เลือกผู้สมัคร"}
                            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.35 : 1 }}
                          />
                        </td>
                        <td className="py-4 px-3 align-middle border-bottom">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-light text-secondary border">ลำดับที่ {index + 1}</span>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 small">
                              รอบที่ {app.roundNo || 1}
                            </span>
                            {isPending && (
                              <span className="badge bg-warning bg-opacity-25 text-dark border border-warning">
                                <i className="bi bi-hourglass-split me-1"></i>รอคณะตรวจ
                              </span>
                            )}
                            {isRejected && (
                              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                <i className="bi bi-x-circle me-1"></i>ไม่ผ่านเบื้องต้น
                              </span>
                            )}
                            {isFailed && (
                              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                <i className="bi bi-x-circle me-1"></i>ไม่ผ่านการสอบ
                              </span>
                            )}
                          </div>

                          <div className={`fw-bold fs-6 mb-1 ${isDisabled ? 'text-secondary' : 'text-primary'}`}>{app.name}</div>
                          <div className="text-muted small mb-1"><i className="bi bi-mortarboard me-1"></i>{app.edu}</div>
                          <div className="text-muted small"><i className="bi bi-calendar3 me-1"></i>สมัคร: {app.appliedDate}</div>
                        </td>

                        <td className="py-4 px-4 align-middle text-center border-bottom">
                          {renderApplicantExamStatuses(app)}
                        </td>

                        <td className="py-4 px-3 align-middle text-end border-bottom">
                          <div className="d-flex flex-column align-items-end gap-2 ms-auto" style={{ maxWidth: '240px' }}>
                            <div className="d-flex gap-2 w-100">
                              <Link to={`/applicant-details/${app.rawId || app.id}`} className="btn btn-sm btn-outline-secondary flex-grow-1 text-start" title="ดูข้อมูลใบสมัคร" style={{ borderRadius: '6px' }}>
                                <i className="bi bi-file-earmark-text me-1"></i> ดูเอกสาร
                              </Link>
                              <button
                                className="btn btn-sm btn-outline-danger px-3 shadow-sm"
                                title="พิมพ์ / ดาวน์โหลดใบสมัครเป็น PDF"
                                onClick={() => handleDownloadPDF(app)}
                                style={{ borderRadius: '6px' }}
                              >
                                <i className="bi bi-file-earmark-pdf-fill"></i>
                              </button>
                            </div>

                            {/* ปุ่ม: นัดสอบ กับ แจ้งผลสอบ */}
                            {/* หากรอคณะตรวจ / ไม่ผ่านเบื้องต้น / ไม่ผ่านการสอบ จะเป็นสีเทาและไม่สามารถกดได้ */}
                            <div className="d-flex gap-2 w-100">
                              <button
                                className={`btn btn-sm fw-bold flex-grow-1 text-nowrap ${isDisabled
                                  ? 'btn-light border text-muted shadow-none opacity-50'
                                  : 'btn-outline-primary shadow-sm'
                                  }`}
                                style={{
                                  borderRadius: '6px',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  backgroundColor: isDisabled ? '#e9ecef' : '',
                                  borderColor: isDisabled ? '#ced4da' : ''
                                }}
                                disabled={isDisabled}
                                onClick={() => !isDisabled && handleOpenSchedule([app])}
                                title={isDisabled ? `ไม่สามารถนัดสอบได้ (${disabledReason})` : "กำหนดวันเวลาสถานที่และส่งอีเมลนัดสอบ"}
                              >
                                <i className="bi bi-calendar-event me-1"></i>นัดสอบ
                              </button>

                              <button
                                className={`btn btn-sm fw-bold flex-grow-1 text-nowrap ${isDisabled
                                  ? 'btn-light border text-muted shadow-none opacity-50'
                                  : 'text-white shadow-sm'
                                  }`}
                                style={{
                                  backgroundColor: isDisabled ? '#e9ecef' : '#006664',
                                  borderColor: isDisabled ? '#ced4da' : '',
                                  color: isDisabled ? '#6c757d' : '#ffffff',
                                  borderRadius: '6px',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                                }}
                                disabled={isDisabled}
                                onClick={() => !isDisabled && handleOpenResults(app)}
                                title={isDisabled ? `ไม่สามารถแจ้งผลสอบได้ (${disabledReason})` : "ลงคะแนนและแจ้งผลการทดสอบ"}
                              >
                                <i className="bi bi-clipboard2-check me-1"></i>แจ้งผลสอบ
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedApplicants.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        <i className="bi bi-search fs-2 d-block mb-2 text-secondary"></i>
                        {selectedFilterKeys.length > 0
                          ? 'ไม่พบผู้สมัครที่ตรงกับเงื่อนไขตัวกรองที่เลือก'
                          : 'ไม่พบข้อมูลผู้สมัครสำหรับตำแหน่งนี้'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="d-lg-none d-flex flex-column gap-4">
          {displayedApplicants.map((app, index) => {
            const isSelected = selectedAppIds.includes(app.rawId || app.id);
            const isPending = isPendingFaculty(app);
            const isRejected = isRejectedFaculty(app);
            const isFailed = isFailedExam(app);
            const isDisabled = isAppDisabled(app);
            const disabledReason = getDisabledReason(app);

            return (
              <div
                key={index}
                className={`card shadow-sm border-0 ${isSelected ? 'border-primary border-2' : ''}`}
                style={{
                  borderTop: isDisabled ? '4px solid #ced4da' : '4px solid #03A96B',
                  borderRadius: '12px',
                  backgroundColor: isDisabled ? '#fafafa' : '#fff'
                }}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => toggleSelect(app.rawId || app.id)}
                        title={isDisabled ? `ไม่สามารถเลือกได้ (${disabledReason})` : "เลือกผู้สมัคร"}
                        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.35 : 1 }}
                      />
                      <span className="badge bg-light text-secondary border px-2 py-1">ลำดับที่ {index + 1}</span>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 small">
                        รอบที่ {app.roundNo || 1}
                      </span>
                      {isPending && (
                        <span className="badge bg-warning bg-opacity-25 text-dark border border-warning">
                          <i className="bi bi-hourglass-split me-1"></i>รอคณะตรวจ
                        </span>
                      )}
                      {isRejected && (
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                          <i className="bi bi-x-circle me-1"></i>ไม่ผ่านเบื้องต้น
                        </span>
                      )}
                      {isFailed && (
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                          <i className="bi bi-x-circle me-1"></i>ไม่ผ่านการสอบ
                        </span>
                      )}
                    </div>
                    <span className="text-muted small"><i className="bi bi-calendar3 me-1"></i>{app.appliedDate}</span>
                  </div>

                  <h5 className={`fw-bold mb-1 ${isDisabled ? 'text-secondary' : 'text-primary'}`}>{app.name}</h5>
                  <div className="text-muted small mb-3"><i className="bi bi-mortarboard me-1"></i>{app.edu}</div>

                  <div className="bg-light p-3 rounded-3 mb-3">
                    <div className="text-dark fw-bold mb-2 small d-flex align-items-center">
                      <i className="bi bi-card-checklist text-primary me-1"></i>การสอบและสถานะของตำแหน่งนี้:
                    </div>
                    {renderApplicantExamStatuses(app)}
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-2">
                      <Link to={`/applicant-details/${app.rawId || app.id}`} className="btn btn-outline-secondary btn-sm flex-grow-1 shadow-sm fw-bold" style={{ borderRadius: '6px' }}>
                        <i className="bi bi-file-earmark-text me-1"></i> ดูเอกสาร
                      </Link>
                      <button
                        className="btn btn-outline-danger btn-sm px-3 shadow-sm"
                        title="พิมพ์ / ดาวน์โหลดใบสมัครเป็น PDF"
                        onClick={() => handleDownloadPDF(app)}
                        style={{ borderRadius: '6px' }}
                      >
                        <i className="bi bi-file-earmark-pdf-fill"></i>
                      </button>
                    </div>

                    <div className="d-flex gap-2 mt-1">
                      <button
                        className={`btn btn-sm py-2 shadow-sm fw-bold flex-grow-1 ${isDisabled
                          ? 'btn-light border text-muted opacity-50 shadow-none'
                          : 'btn-outline-primary'
                          }`}
                        style={{
                          borderRadius: '6px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          backgroundColor: isDisabled ? '#e9ecef' : '',
                          borderColor: isDisabled ? '#ced4da' : ''
                        }}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && handleOpenSchedule([app])}
                        title={isDisabled ? `ไม่สามารถนัดสอบได้ (${disabledReason})` : "นัดสอบ"}
                      >
                        <i className="bi bi-calendar-event me-1"></i>นัดสอบ
                      </button>
                      <button
                        className={`btn btn-sm py-2 shadow-sm fw-bold flex-grow-1 ${isDisabled
                          ? 'btn-light border text-muted opacity-50 shadow-none'
                          : 'text-white'
                          }`}
                        style={{
                          backgroundColor: isDisabled ? '#e9ecef' : '#006664',
                          borderColor: isDisabled ? '#ced4da' : '',
                          color: isDisabled ? '#6c757d' : '#ffffff',
                          borderRadius: '6px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer'
                        }}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && handleOpenResults(app)}
                        title={isDisabled ? `ไม่สามารถแจ้งผลสอบได้ (${disabledReason})` : "แจ้งผลสอบ"}
                      >
                        <i className="bi bi-clipboard2-check me-1"></i>แจ้งผลสอบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {displayedApplicants.length === 0 && (
            <div className="text-center py-5 text-muted w-100">
              <i className="bi bi-search fs-2 d-block mb-2 text-secondary"></i>
              {selectedFilterKeys.length > 0
                ? 'ไม่พบผู้สมัครที่ตรงกับเงื่อนไขตัวกรองที่เลือก'
                : 'ไม่พบผู้สมัครสำหรับตำแหน่งนี้'}
            </div>
          )}
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: หน้านัดหมายสอบ (Schedule View - รองรับทั้งรายบุคคลและหลายคน)
  // =========================================================================
  if (view === 'schedule') {
    return (
      <div className="container-fluid py-4 position-relative animate__animated animate__fadeIn">

        {/* หัวหน้าจอ */}
        <div className="mb-4 d-flex align-items-start gap-3">
          <button onClick={() => setView('list')} className="btn btn-outline-secondary btn-sm rounded-circle px-2 mt-1 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
            <i className="bi bi-arrow-left fs-5"></i>
          </button>
          <div className="flex-grow-1">
            <h2 className="mb-1 text-primary fw-bold">
              <i className="bi bi-calendar-check-fill me-2"></i>การนัดหมายสอบ
            </h2>
            <p className="text-muted fs-6 mb-0">
              กำหนดวัน เวลา สถานที่สอบ และส่งอีเมลแจ้งกำหนดการสอบไปยังผู้สมัครที่เลือก
            </p>
          </div>
        </div>

        {/* สรุปข้อมูลผู้สมัครที่จะได้รับอีเมลนัดสอบ */}
        <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderLeft: '5px solid #0d6efd', borderRadius: '12px' }}>
          <div className="card-body p-3">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
              <div className="fw-bold text-dark fs-6 d-flex align-items-center">
                <i className="bi bi-people-fill text-primary me-2 fs-5"></i>
                ผู้สมัครที่จะได้รับอีเมลนัดสอบนี้:
                <span className="badge bg-primary fs-6 px-3 py-1 rounded-pill ms-2">
                  {scheduleTargets.length} คน
                </span>
              </div>
              <div className="small text-muted">
                ตำแหน่ง: <strong className="text-dark">{jobDetails.jobTitle || jobTitle}</strong>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 pt-1 border-top">
              {scheduleTargets.map((t, idx) => (
                <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                  <i className="bi bi-person-circle text-primary me-1"></i>
                  {t.name} {t.email && <span className="text-muted fw-normal">({t.email})</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleRequestScheduleSubmit}>
          <div className="row g-4">

            {/* คอลัมน์ซ้าย: กำหนดการสอบแต่ละวิชา */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', borderLeft: '4px solid #0d6efd' }}>
                <div className="card-header bg-white fw-bold py-3 text-dark border-bottom-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-card-checklist text-primary me-2"></i>
                    <span>เลือกวิชาที่ต้องการจัดสอบและส่งอีเมล (ทีละ 1 วิชา)</span>
                  </div>
                </div>
                <div className="card-body pt-0">
                  <p className="text-muted small mb-3">
                    <i className="bi bi-info-circle me-1 text-primary"></i>
                    คลิกเลือกวิชาที่ต้องการนัดหมายสอบในครั้งนี้ ระบบจะส่งอีเมลแจ้งกำหนดการเฉพาะวิชาที่เลือก
                  </p>
                  {scheduleExams.length === 0 ? (
                    <div className="alert alert-warning py-2 small">
                      <i className="bi bi-info-circle me-1"></i>ไม่พบรายการวิชาสอบที่ผูกกับตำแหน่งนี้
                    </div>
                  ) : (
                    scheduleExams.map((exam, index) => {
                      const isSelected = selectedScheduleExamIndex === index;
                      return (
                        <div
                          key={index}
                          className={`p-3 mb-3 rounded border transition-all ${isSelected ? 'bg-white shadow-sm border-primary' : 'bg-light opacity-75 border-secondary-subtle'}`}
                          style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                          onClick={() => handleSelectScheduleExam(index)}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <div className="form-check d-flex align-items-center mb-0">
                              <input
                                className="form-check-input me-2"
                                type="radio"
                                name="scheduleExamRadio"
                                id={`schedule-exam-radio-${index}`}
                                checked={isSelected}
                                onChange={() => handleSelectScheduleExam(index)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                              />
                              <label
                                className="form-check-label fw-bold text-dark mb-0 d-flex align-items-center"
                                htmlFor={`schedule-exam-radio-${index}`}
                                style={{ cursor: 'pointer' }}
                              >
                                <span
                                  className={`badge me-2 rounded-circle ${isSelected ? 'bg-primary' : 'bg-secondary'}`}
                                  style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  {index + 1}
                                </span>
                                {exam.name}
                              </label>
                            </div>
                            <div>
                              {isSelected ? (
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 small">
                                  <i className="bi bi-check-circle-fill me-1"></i>เลือกนัดสอบวิชานี้
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted border rounded-pill px-2 py-1 small">
                                  คลิกเพื่อเลือกวิชานี้
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="row g-2 mt-1" onClick={(e) => e.stopPropagation()}>
                              <div className="col-12 col-md-4">
                                <label className="small text-muted mb-1 fw-semibold">วันที่สอบ</label>
                                <input
                                  type="date"
                                  className="form-control form-control-sm bg-light"
                                  value={exam.date}
                                  onChange={(e) => handleScheduleExamChange(index, 'date', e.target.value)}
                                />
                              </div>
                              <div className="col-12 col-md-4">
                                <label className="small text-muted mb-1 fw-semibold">เวลาสอบ</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm bg-light"
                                  placeholder="เช่น 09:00 - 11:00 น."
                                  value={exam.time}
                                  onChange={(e) => handleScheduleExamChange(index, 'time', e.target.value)}
                                />
                              </div>
                              <div className="col-12 col-md-4">
                                <label className="small text-muted mb-1 fw-semibold">สถานที่ / ห้องสอบ</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm bg-light"
                                  placeholder="เช่น อาคาร 9 ห้อง 201"
                                  value={exam.location}
                                  onChange={(e) => handleScheduleExamChange(index, 'location', e.target.value)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="small text-muted">
                              {exam.date || exam.time || exam.location ? (
                                <span>กำหนดการปัจจุบัน: {exam.date || '-'} | {exam.time || '-'} | {exam.location || '-'}</span>
                              ) : (
                                <span>ยังไม่ระบุกำหนดการ (คลิกเพื่อเลือกและตั้งค่า)</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* คอลัมน์ขวา: พรีวิวอีเมลนัดสอบ */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100 d-flex flex-column" style={{ backgroundColor: '#f0f7ff', border: '1px solid #cce5ff', borderRadius: '12px' }}>
                <div className="card-header bg-transparent fw-bold py-3 text-primary border-bottom-0 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-envelope-paper-fill me-2"></i>ร่างอีเมลแจ้งกำหนดการสอบ</span>
                  {isScheduleEmailCustomized && (
                    <button
                      type="button"
                      className="btn btn-sm text-primary p-0 text-decoration-underline border-0 bg-transparent small"
                      onClick={() => {
                        setIsScheduleEmailCustomized(false);
                        setScheduleEmailBody(generateScheduleEmail(scheduleExams, scheduleTargets));
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>คืนค่าแม่แบบอัตโนมัติ
                    </button>
                  )}
                </div>
                <div className="card-body pt-0 d-flex flex-column">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">หัวข้ออีเมล</label>
                    <input
                      type="text"
                      className="form-control bg-white"
                      value={scheduleEmailSubject}
                      onChange={e => setScheduleEmailSubject(e.target.value)}
                    />
                  </div>
                  <div className="flex-grow-1 d-flex flex-column">
                    <label className="form-label small fw-bold text-dark mb-1">เนื้อหาอีเมล (แก้ไขได้อิสระ)</label>
                    <textarea
                      className="form-control bg-white text-dark flex-grow-1 p-3"
                      style={{ resize: 'vertical', minHeight: '340px', lineHeight: '1.6' }}
                      value={scheduleEmailBody}
                      onChange={(e) => {
                        setIsScheduleEmailCustomized(true);
                        setScheduleEmailBody(e.target.value);
                      }}
                    ></textarea>
                    <div className="form-text mt-2 text-muted small">
                      <i className="bi bi-info-circle me-1 text-primary"></i>ระบบจะใส่ชื่อผู้สมัครแต่ละท่านในคำขึ้นต้นให้อัตโนมัติเมื่อส่งอีเมล
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* แถบปุ่มบันทึกด้านล่าง */}
          <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-4">
              <div className="d-flex align-items-center text-muted small">
                <i className="bi bi-info-circle-fill text-primary me-2 fs-6"></i>
                <span>เมื่อส่งอีเมลนัดสอบแล้ว ระบบจะอัปเดตสถานะของผู้สมัครเป็น <strong>"รอแจ้งผลคะแนน"</strong> โดยอัตโนมัติ</span>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light border px-4 py-2 fw-bold w-100 w-sm-auto"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setView('list')}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="btn btn-primary px-5 py-2 shadow-sm fw-bold text-white w-100 w-sm-auto d-flex align-items-center justify-content-center"
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-send-fill me-2"></i>
                  บันทึกกำหนดการและส่งอีเมลนัดสอบ ({scheduleExams[selectedScheduleExamIndex]?.name || '1 วิชา'}, {scheduleTargets.length} คน)
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Render Confirmation Modal */}
        {renderConfirmModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: หน้าบันทึกและแจ้งผลสอบ (Results View - เฉพาะการลงคะแนนและแจ้งผล)
  // =========================================================================
  if (view === 'results') {
    return (
      <div className="container-fluid py-4 position-relative animate__animated animate__fadeIn">

        {/* หัวหน้าจอ */}
        <div className="mb-4 d-flex align-items-start gap-3">
          <button onClick={() => setView('list')} className="btn btn-outline-secondary btn-sm rounded-circle px-2 mt-1 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
            <i className="bi bi-arrow-left fs-5"></i>
          </button>
          <div className="flex-grow-1">
            <h2 className="mb-1 fw-bold" style={{ color: '#006664' }}>
              <i className="bi bi-clipboard2-check-fill me-2"></i>บันทึกคะแนนและแจ้งผลสอบ
            </h2>
            <p className="text-muted fs-6 mb-0">
              ลงคะแนนผลการทดสอบแต่ละวิชา สรุปผลการคัดเลือกรอบสุดท้าย และส่งอีเมลแจ้งผู้สมัคร
            </p>
          </div>
        </div>

        {/* แถบข้อมูลผู้สมัครที่กำลังลงคะแนน */}
        <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderLeft: '5px solid #03A96B', borderRadius: '12px' }}>
          <div className="card-body p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="text-muted small mb-1"><i className="bi bi-person-circle me-1 text-success"></i>ข้อมูลผู้สมัคร</div>
              <div className="fs-5 text-dark fw-bold">
                ผู้สมัคร: <span style={{ color: '#03A96B' }}>{resultApplicant?.name}</span>
                {resultApplicant?.email && (
                  <span className="text-muted fw-normal fs-6 ms-2">({resultApplicant.email})</span>
                )}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="badge bg-light text-dark border px-3 py-2 fs-6 rounded-pill">
                <i className="bi bi-briefcase-fill me-1 text-primary"></i>ตำแหน่ง: <strong>{jobDetails.jobTitle || jobTitle}</strong>
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleRequestResultsSubmit}>
          <div className="row g-4">

            {/* คอลัมน์ซ้าย: บันทึกคะแนนแต่ละวิชา + สรุปผลรอบสุดท้าย */}
            <div className="col-lg-6">

              {/* 1. บันทึกผลสอบแต่ละวิชา */}
              <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', borderLeft: '4px solid #006664' }}>
                <div className="card-header bg-white fw-bold py-3 text-dark border-bottom-0 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-pencil-square me-2 text-success"></i>1. เลือกวิชาที่ต้องการแจ้งคะแนนและผลสอบ (ทีละ 1 วิชา)</span>
                  <span className="badge bg-success bg-opacity-10 text-success small">HR ลงคะแนน</span>
                </div>
                <div className="card-body pt-0">
                  <p className="text-muted small mb-3">
                    <i className="bi bi-info-circle me-1 text-success"></i>
                    คลิกเลือกวิชาที่ต้องการลงคะแนนและส่งอีเมลแจ้งผลสอบในครั้งนี้ ระบบจะส่งอีเมลแจ้งผลเฉพาะวิชาที่เลือก
                  </p>
                  {resultExams.length === 0 ? (
                    <div className="alert alert-warning py-2 small">ไม่พบรายการวิชาสอบ</div>
                  ) : (
                    resultExams.map((exam, index) => {
                      const isSelected = selectedResultExamIndex === index;
                      return (
                        <div
                          key={index}
                          className={`p-3 mb-3 rounded border transition-all ${isSelected ? 'bg-white shadow-sm border-success' : 'bg-light opacity-75 border-secondary-subtle'}`}
                          style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                          onClick={() => handleSelectResultExam(index)}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <div className="form-check d-flex align-items-center mb-0">
                              <input
                                className="form-check-input me-2"
                                type="radio"
                                name="resultExamRadio"
                                id={`result-exam-radio-${index}`}
                                checked={isSelected}
                                onChange={() => handleSelectResultExam(index)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                              />
                              <label
                                className="form-check-label fw-bold text-dark mb-0 d-flex align-items-center"
                                htmlFor={`result-exam-radio-${index}`}
                                style={{ cursor: 'pointer' }}
                              >
                                <span
                                  className={`badge me-2 rounded-circle ${isSelected ? 'bg-success' : 'bg-secondary'}`}
                                  style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  {index + 1}
                                </span>
                                {exam.name}
                              </label>
                            </div>
                            <div>
                              {isSelected ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1 small">
                                  <i className="bi bi-check-circle-fill me-1"></i>เลือกแจ้งผลวิชานี้
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted border rounded-pill px-2 py-1 small">
                                  {exam.status || 'รอจัดสอบ'} {exam.score ? `(${exam.score})` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 pb-2 gap-2 border-bottom">
                                <span className="small fw-bold text-dark">สถานะผลการสอบวิชานี้:</span>
                                <select
                                  className={`form-select form-select-sm w-100 w-sm-auto fw-bold ${exam.status === 'ผ่าน' || exam.status === 'ผ่านการสอบ' ? 'text-success' : exam.status === 'ไม่ผ่าน' ? 'text-danger' : exam.status === 'รอแจ้งผลคะแนน' ? 'text-info' : 'text-warning text-dark'}`}
                                  value={exam.status}
                                  onChange={(e) => handleResultExamChange(index, 'status', e.target.value)}
                                >
                                  <option value="รอจัดการสอบ">⏳ รอจัดการสอบ</option>
                                  <option value="รอแจ้งผลคะแนน">📝 รอแจ้งผลคะแนน</option>
                                  <option value="ผ่าน">✅ ผ่าน</option>
                                  <option value="ไม่ผ่าน">❌ ไม่ผ่าน</option>
                                </select>
                              </div>
                              <div className="row g-2 align-items-center">
                                <div className="col-12 col-md-6">
                                  <label className="small fw-bold text-primary mb-1">คะแนนที่ได้ (ถ้ามี)</label>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm border-primary"
                                    placeholder="เช่น 85 หรือ 85/100"
                                    value={exam.score}
                                    onChange={(e) => handleResultExamChange(index, 'score', e.target.value)}
                                  />
                                </div>
                                <div className="col-12 col-md-6 text-muted small">
                                  <i className="bi bi-info-circle me-1"></i>คะแนนจะแสดงในอีเมลแจ้งผลสอบวิชานี้ให้อัตโนมัติ
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="small text-muted">
                              คลิกเพื่อเลือกวิชานี้เพื่อลงคะแนนและแจ้งผล
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 2. สรุปผลการคัดเลือกรอบสุดท้าย */}
              <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px', borderLeft: '4px solid #198754' }}>
                <div className="card-header bg-white fw-bold py-3 text-dark border-bottom-0 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-trophy-fill me-2 text-warning"></i>2. สรุปผลการคัดเลือกรอบสุดท้าย</span>
                </div>
                <div className="card-body pt-0">
                  <select
                    className="form-select w-100"
                    value={resultFinal}
                    onChange={e => handleResultFinalChange(e.target.value)}
                    style={{ borderColor: resultFinal === "ได้งาน" ? '#198754' : resultFinal === "ไม่ผ่านการคัดเลือก" ? '#dc3545' : '#ccc', backgroundColor: '#f8f9fa' }}
                  >
                    <option value="รอพิจารณา">⏳ ยังไม่สรุปผล (อยู่ระหว่างการสอบ / รอผลสอบ)</option>
                    <option value="ได้งาน">🎉 ผ่านการคัดเลือก (ได้งาน)</option>
                    <option value="ไม่ผ่านการคัดเลือก">❌ ไม่ผ่านการคัดเลือก</option>
                  </select>
                </div>
              </div>

            </div>

            {/* คอลัมน์ขวา: พรีวิวอีเมลแจ้งผลสอบ */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100 d-flex flex-column" style={{ backgroundColor: '#fffdf5', border: '1px solid #ffeeba', borderRadius: '12px' }}>
                <div className="card-header bg-transparent fw-bold py-3 text-warning-emphasis border-bottom-0 d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-envelope-paper-fill me-2"></i>ร่างอีเมลแจ้งผลสอบและผลการคัดเลือก</span>
                  {isResultEmailCustomized && (
                    <button
                      type="button"
                      className="btn btn-sm text-primary p-0 text-decoration-underline border-0 bg-transparent small"
                      onClick={() => {
                        setIsResultEmailCustomized(false);
                        setResultEmailBody(generateResultEmail(resultApplicant, resultExams, resultFinal));
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>คืนค่าแม่แบบอัตโนมัติ
                    </button>
                  )}
                </div>
                <div className="card-body pt-0 d-flex flex-column">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">หัวข้ออีเมล</label>
                    <input
                      type="text"
                      className="form-control bg-white"
                      value={resultEmailSubject}
                      onChange={e => setResultEmailSubject(e.target.value)}
                    />
                  </div>
                  <div className="flex-grow-1 d-flex flex-column">
                    <label className="form-label small fw-bold text-dark mb-1">เนื้อหาอีเมล (แก้ไขได้อิสระ)</label>
                    <textarea
                      className="form-control bg-white text-dark flex-grow-1 p-3"
                      style={{ resize: 'vertical', minHeight: '340px', lineHeight: '1.6' }}
                      value={resultEmailBody}
                      onChange={(e) => {
                        setIsResultEmailCustomized(true);
                        setResultEmailBody(e.target.value);
                      }}
                    ></textarea>
                    <div className="form-text mt-2 text-muted small">
                      <i className="bi bi-pencil-square me-1 text-warning"></i>คุณสามารถปรับแต่งข้อความแจ้งผลสอบและข้อแนะนำเพิ่มเติมได้ก่อนกดส่ง
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* แถบปุ่มบันทึกด้านล่าง */}
          <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-4">
              <button
                type="button"
                className="btn btn-light border px-4 py-2 fw-bold w-100 w-sm-auto"
                style={{ borderRadius: '8px' }}
                onClick={() => setView('list')}
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className="btn px-5 py-2 shadow-sm fw-bold text-white w-100 w-sm-auto d-flex align-items-center justify-content-center"
                style={{ backgroundColor: '#006664', borderRadius: '8px' }}
              >
                <i className="bi bi-send-fill me-2"></i>
                บันทึกและส่งอีเมลแจ้งผลสอบ
              </button>
            </div>
          </div>
        </form>

        {/* Render Confirmation Modal */}
        {renderConfirmModal()}
      </div>
    );
  }

  // =========================================================================
  // Confirmation Modal Component (กล่องยืนยันก่อนส่งอีเมล)
  // =========================================================================
  function renderConfirmModal() {
    if (!showConfirmModal || !confirmModalData) return null;

    return (
      <div
        className="modal show d-block animate__animated animate__fadeIn"
        tabIndex="-1"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '550px' }}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="modal-header bg-light border-0 py-3 px-4">
              <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                {confirmModalData.icon || <i className="bi bi-envelope-check-fill text-primary me-2"></i>}
                {confirmModalData.title}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSending}
              ></button>
            </div>

            <div className="modal-body px-4 py-3">
              <div className="alert alert-warning d-flex align-items-center mb-3 py-2 border-warning bg-warning bg-opacity-10">
                <i className="bi bi-exclamation-triangle-fill fs-4 me-2 text-warning"></i>
                <div className="small text-dark">
                  โปรดตรวจสอบความถูกต้องก่อนยืนยัน ระบบจะดำเนินการส่งอีเมลไปยังผู้สมัครทันที
                </div>
              </div>

              <div className="mb-3">
                <label className="small text-muted fw-bold mb-1">หัวข้ออีเมล (Subject):</label>
                <div className="p-2 bg-light rounded border small fw-semibold text-dark">
                  {confirmModalData.subject}
                </div>
              </div>

              {confirmModalData.selectedExams && confirmModalData.selectedExams.length > 0 && (
                <div className="mb-3">
                  <label className="small text-muted fw-bold mb-1">
                    วิชาที่เลือก{confirmModalData.type === 'results' ? 'แจ้งผลคะแนนและการทดสอบ' : 'นัดหมายสอบ'}ในครั้งนี้:
                  </label>
                  <div className="d-flex flex-wrap gap-1 p-2 bg-light rounded border">
                    {confirmModalData.selectedExams.map((exName, idx) => (
                      <span key={idx} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill small">
                        <i className="bi bi-check-circle-fill me-1"></i>{exName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="small text-muted fw-bold mb-1">
                  รายชื่อผู้สมัครที่จะได้รับอีเมล ({confirmModalData.recipients?.length || 0} คน):
                </label>
                <div className="border rounded p-2 bg-light" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {confirmModalData.recipients?.map((r, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center py-1 border-bottom border-light-subtle small">
                      <span className="fw-semibold text-dark">{i + 1}. {r.name}</span>
                      <span className="text-muted">{r.email || <span className="text-danger fw-bold">ไม่มีอีเมล</span>}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-dark small mb-0 fw-medium">
                <i className="bi bi-question-circle-fill me-1 text-primary"></i>
                คุณต้องการยืนยันการส่งอีเมลไปยังผู้สมัครจำนวน <strong>{confirmModalData.recipients?.length || 0}</strong> ท่าน ใช่หรือไม่?
              </p>
            </div>

            <div className="modal-footer border-0 bg-light px-4 py-3">
              <button
                type="button"
                className="btn btn-secondary px-4 fw-medium"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSending}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className="btn btn-success px-4 fw-bold shadow-sm d-flex align-items-center"
                onClick={confirmModalData.onConfirm}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    กำลังส่งอีเมล...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill me-2"></i>
                    ยืนยันส่ง
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}