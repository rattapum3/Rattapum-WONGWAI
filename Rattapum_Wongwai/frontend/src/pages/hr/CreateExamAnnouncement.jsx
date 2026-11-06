import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function CreateExamAnnouncement() {
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'final' | 'all'

  // ข้อมูลตำแหน่งงาน
  const [jobDetails, setJobDetails] = useState({
    jobTitle: 'กำลังโหลด...',
    departmentName: '',
    facultyName: '',
    openDate: '',
    closeDate: '',
    totalPosition: 1,
    isInitialAnnounced: false,
    isFinalAnnounced: false,
    initialAnnouncementFile: null,
    finalAnnouncementFile: null,
    initialFileUrl: null,
    finalFileUrl: null
  });

  // รายการผู้สมัครทั้งหมดที่ผ่านการคัดเลือกเบื้องต้น และรอบสุดท้าย
  const [allApplicants, setAllApplicants] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [positionExamsMaster, setPositionExamsMaster] = useState([]);
  const [initialCandidates, setInitialCandidates] = useState([]);
  const [finalCandidates, setFinalCandidates] = useState([]);

  // ข้อมูลประกาศรอบคัดเลือกเบื้องต้น
  const [initialAnnouncement, setInitialAnnouncement] = useState({
    title: 'ประกาศรายชื่อผู้ผ่านการคัดเลือกเบื้องต้น',
    remark: 'ขอให้ผู้มีรายชื่อตามประกาศข้างต้น เตรียมความพร้อมเพื่อเข้ารับการประเมิน/ทดสอบในลำดับต่อไป',
    isAnnounced: false,
    fileName: null,
    fileUrl: null
  });

  // ข้อมูลประกาศรายชื่อผู้มีสิทธิ์สอบแต่ละประเภท
  const [examAnnouncements, setExamAnnouncements] = useState([]);
  // รายการ examId ที่ถูกติ๊กเลือกสำหรับการประกาศพร้อมกัน (Batch Announce)
  const [selectedExamIds, setSelectedExamIds] = useState([]);

  // ข้อมูลประกาศผลการคัดเลือก (รอบสุดท้าย)
  const [finalAnnouncement, setFinalAnnouncement] = useState({
    title: 'ประกาศรายชื่อผู้ผ่านการคัดเลือก',
    remark: 'ให้ผู้ผ่านการคัดเลือกมารายงานตัวเพื่อบรรจุแต่งตั้ง ณ หน่วยงานต้นสังกัด ภายในวันและเวลาที่กำหนด',
    isAnnounced: false,
    fileName: null,
    fileUrl: null
  });

  // Helper สำหรับแปลงวันที่เป็นรูปแบบ YYYY-MM-DD
  const toInputDate = (dateVal) => {
    if (!dateVal || dateVal === 'รอกำหนดการ' || dateVal === 'อยู่ระหว่างดำเนินการ' || dateVal === '-') return '';
    const cleanStr = String(dateVal).split('T')[0].split(' ')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const parts = cleanStr.split('-');
      let y = parseInt(parts[0], 10);
      if (y >= 2400 && y <= 2700) y -= 543;
      return `${y}-${parts[1]}-${parts[2]}`;
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    let y = d.getFullYear();
    if (y >= 2400 && y <= 2700) y -= 543;
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    fetchJobInfo();
  }, [id]);

  const fetchJobInfo = async (targetRoundParam = null) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/applications/recruitment/${id}`);
      const data = await res.json();
      if (data.success) {
        if (data.jobDetails) {
          setJobDetails(data.jobDetails);
          setInitialAnnouncement(prev => ({
            ...prev,
            isAnnounced: Boolean(data.jobDetails.isInitialAnnounced),
            fileName: data.jobDetails.initialAnnouncementFile || null,
            fileUrl: data.jobDetails.initialFileUrl || null
          }));
          setFinalAnnouncement(prev => ({
            ...prev,
            isAnnounced: Boolean(data.jobDetails.isFinalAnnounced),
            fileName: data.jobDetails.finalAnnouncementFile || null,
            fileUrl: data.jobDetails.finalFileUrl || null
          }));
        }

        const rawApplicants = data.data || [];
        setAllApplicants(rawApplicants);

        const examsList = data.positionExams || [];
        setPositionExamsMaster(examsList);

        const maxRound = Math.max(
          Number(data.jobDetails?.roundNo || 1),
          ...rawApplicants.map(a => Number(a.roundNo || 1)),
          1
        );
        const roundsSet = new Set();
        for (let r = 1; r <= maxRound; r++) {
          roundsSet.add(r);
        }
        rawApplicants.forEach(a => {
          if (a.roundNo) roundsSet.add(Number(a.roundNo));
        });
        const rounds = Array.from(roundsSet).sort((a, b) => b - a);

        // หา round ที่มีผู้สมัครอยู่จริงเป็นค่าเริ่มต้น เพื่อไม่ให้แสดง 0 คน
        const roundWithApplicants = rounds.find(r => rawApplicants.some(a => Number(a.roundNo || 1) === r)) || rounds[0] || 1;
        const targetRound = targetRoundParam !== null
          ? targetRoundParam
          : (selectedRound !== null ? selectedRound : roundWithApplicants);

        setSelectedRound(targetRound);
        buildCandidatesForRound(rawApplicants, examsList, targetRound);
      }
    } catch (error) {
      console.error('Error fetching job info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper สำหรับสร้างรายการผู้มีสิทธิ์ตามรอบที่เลือก (จัดการทีละรอบ)
  const buildCandidatesForRound = (applicantsList, examsMasterList, round) => {
    const targetRound = (round !== null && round !== 'all') ? Number(round) : 1;
    const currentApplicants = applicantsList.filter(app => Number(app.roundNo || 1) === targetRound);

    // 1. ผู้ผ่านการคัดเลือกเบื้องต้น
    const passedInitial = currentApplicants.filter(app => {
      const qual = (app.qualStatus || '').trim();
      const isPassed = qual === 'ผ่านการคัดเลือกเบื้องต้น' || (qual.includes('ผ่าน') && !qual.includes('ไม่ผ่าน'));
      return isPassed && qual !== 'Draft';
    });
    setInitialCandidates(passedInitial);

    // 2. ผู้ผ่านการคัดเลือกขั้นสุดท้าย (ได้งาน)
    const passedFinal = currentApplicants.filter(app => {
      const f = (app.finalStatus || '').trim();
      const q = (app.qualStatus || '').trim();
      return f === 'ได้งาน' || f === 'ผ่านการคัดเลือก' || q === 'ได้งาน';
    });
    setFinalCandidates(passedFinal);

    // 3. จัดการรายชื่อผู้มีสิทธิ์สอบแต่ละประเภท (positionExams)
    const builtExams = examsMasterList.map((exam) => {
      const topicName = exam.name.startsWith('สอบ')
        ? `ประกาศรายชื่อผู้มีสิทธิ${exam.name}`
        : `ประกาศรายชื่อผู้มีสิทธิสอบ${exam.name}`;

      const candidates = passedInitial.map(app => {
        const appExam = app.exams?.find(e => e.Exam_position_type_id === exam.id);
        const dateVal = (appExam?.date && appExam.date !== 'รอกำหนดการ' && appExam.date !== 'อยู่ระหว่างดำเนินการ' && appExam.date !== '-' && !appExam.date.startsWith('0000'))
          ? (appExam.rawDate || appExam.date)
          : '';
        const timeVal = (appExam?.time && appExam.time !== 'รอกำหนดการ' && appExam.time !== '00:00:00' && appExam.time !== 'อยู่ระหว่างดำเนินการ')
          ? appExam.time
          : '';
        const locVal = (appExam?.location && appExam.location !== 'รอกำหนดการ' && appExam.location !== 'อยู่ระหว่างดำเนินการ')
          ? appExam.location
          : '';

        return {
          rawId: app.rawId,
          appId: app.id,
          name: app.name,
          roundNo: app.roundNo || 1,
          date: toInputDate(dateVal),
          time: timeVal,
          location: locVal
        };
      });

      return {
        id: exam.id,
        examPositionTypeId: exam.id,
        examName: exam.name,
        topicType: topicName,
        isAnnounced: Boolean(exam.isAnnounced),
        fileName: exam.announcementFile || null,
        fileUrl: exam.fileUrl || null,
        remark: '๑. ให้ผู้มีสิทธิสอบแต่งกายด้วยชุดสุภาพ และนำบัตรประจำตัวประชาชนมาแสดงต่อคณะกรรมการคุมสอบ\n๒. ให้ผู้มีสิทธิสอบมารายงานตัวก่อนเวลาเริ่มสอบอย่างน้อย ๑๕ นาที',
        candidates,
        batchDate: '',
        batchTime: '',
        batchLocation: ''
      };
    });

    setExamAnnouncements(builtExams);
    setSelectedExamIds(builtExams.map(e => e.id));
  };

  const handleRoundChange = (round) => {
    setSelectedRound(round);
    buildCandidatesForRound(allApplicants, positionExamsMaster, round);
  };

  // ==========================================
  // จัดการการเลือก Checkbox สำหรับประกาศพร้อมกันหลายประเภท
  // ==========================================
  const handleToggleSelectExam = (examId) => {
    setSelectedExamIds(prev =>
      prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
    );
  };

  const handleSelectAllExams = (isChecked) => {
    if (isChecked) {
      setSelectedExamIds(examAnnouncements.map(e => e.id));
    } else {
      setSelectedExamIds([]);
    }
  };

  // ==========================================
  // แก้ไขข้อมูลตารางผู้เข้าสอบ (รายบุคคล / Quick Batch Fill)
  // ==========================================
  const handleCandidateChange = (examId, candIndex, field, value) => {
    setExamAnnouncements(prev => prev.map(exam => {
      if (exam.id === examId) {
        const updated = [...exam.candidates];
        updated[candIndex] = { ...updated[candIndex], [field]: value };
        return { ...exam, candidates: updated };
      }
      return exam;
    }));
  };

  const handleExamFieldChange = (examId, field, value) => {
    setExamAnnouncements(prev => prev.map(exam => {
      if (exam.id === examId) {
        return { ...exam, [field]: value };
      }
      return exam;
    }));
  };

  const handleApplyBatchToAll = (examId) => {
    setExamAnnouncements(prev => prev.map(exam => {
      if (exam.id === examId) {
        const updated = exam.candidates.map(c => ({
          ...c,
          date: exam.batchDate || c.date,
          time: exam.batchTime || c.time,
          location: exam.batchLocation || c.location
        }));
        return { ...exam, candidates: updated };
      }
      return exam;
    }));
  };

  // ==========================================
  // บันทึกข้อมูล (แบบร่าง) หรือ บันทึกและประกาศ
  // ==========================================
  const handleSaveAction = async ({ target, isAnnounced, targetExamIds = [] }) => {
    setIsSubmitting(true);
    try {
      const payload = { recruitmentId: id };

      if (target === 'initial') {
        payload.initialAnnounce = { isAnnounced };
      } else if (target === 'final') {
        payload.finalAnnounce = { isAnnounced };
      } else if (target === 'exams_selected') {
        if (targetExamIds.length === 0) {
          alert('กรุณาเลือกประเภทการสอบที่ต้องการบันทึกหรือประกาศอย่างน้อย 1 ประเภท');
          setIsSubmitting(false);
          return;
        }
      }

      // บันทึกกำหนดการสอบของทุกประเภทเสมอ เพื่อไม่ให้ข้อมูลที่กรอกไว้ในประเภทอื่นสูญหายเมื่อกดบันทึกหรือร่าง
      payload.exams = examAnnouncements.map(e => {
        let shouldAnnounce = Boolean(e.isAnnounced);
        if (target === 'exams_selected' && targetExamIds.includes(e.id)) {
          shouldAnnounce = isAnnounced;
        } else if (target === 'exam_single' && targetExamIds.includes(e.id)) {
          shouldAnnounce = isAnnounced;
        }

        // หากมีการกรอก Quick Batch Fill ไว้ ให้นำมาเติมให้ผู้สมัครที่ยังไม่มีข้อมูล
        const candidates = e.candidates.map(c => ({
          ...c,
          date: c.date || e.batchDate || '',
          time: c.time || e.batchTime || '',
          location: c.location || e.batchLocation || ''
        }));

        return {
          examPositionTypeId: e.id,
          isAnnounced: shouldAnnounce,
          candidates
        };
      });

      const res = await fetch('http://localhost:3000/api/applications/batch-schedule-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        const msg = isAnnounced
          ? ` บันทึกและเผยแพร่ประกาศรอบที่ ${activeRound} สำเร็จเรียบร้อยแล้ว!\nข้อมูลจะไปแสดงที่หน้ารายละเอียดตำแหน่งงานทันที`
          : ` บันทึกข้อมูลแบบร่างรอบที่ ${activeRound} เรียบร้อยแล้ว (ยังไม่เผยแพร่ต่อสาธารณะ)`;
        alert(msg);
        fetchJobInfo(activeRound);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + (result.message || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Export PDF & Word สำหรับประกาศรายชื่อ
  // ==========================================
  const maxRound = Math.max(
    Number(jobDetails.roundNo || 1),
    ...allApplicants.map(a => Number(a.roundNo || 1)),
    1
  );
  const roundsSet = new Set();
  for (let r = 1; r <= maxRound; r++) {
    roundsSet.add(r);
  }
  allApplicants.forEach(a => {
    if (a.roundNo) roundsSet.add(Number(a.roundNo));
  });
  const availableRounds = Array.from(roundsSet).sort((a, b) => b - a);

  const latestRound = availableRounds[0] || 1;
  const activeRound = (selectedRound !== null && selectedRound !== 'all') ? selectedRound : latestRound;
  const currentApplicants = allApplicants.filter(a => Number(a.roundNo || 1) === Number(activeRound));
  const announcedExamsCount = examAnnouncements.filter(e => e.isAnnounced).length;

  const handleExportPDF = async (exportData) => {
    try {
      const res = await fetch('http://localhost:3000/api/export/candidate-announcement/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...exportData,
          recruitmentId: id,
          roundNo: activeRound !== 'all' ? activeRound : (jobDetails.roundNo || 1),
          totalPosition: jobDetails.totalPosition || 1,
          positionName: jobDetails.jobTitle,
          faculty: jobDetails.facultyName,
          department: jobDetails.departmentName
        })
      });
      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert('ไม่สามารถพิมพ์หรือสร้าง PDF ได้: ' + err.message);
    }
  };

  const handleExportWord = async (exportData) => {
    try {
      const res = await fetch('http://localhost:3000/api/export/candidate-announcement/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...exportData,
          recruitmentId: id,
          roundNo: activeRound !== 'all' ? activeRound : (jobDetails.roundNo || 1),
          totalPosition: jobDetails.totalPosition || 1,
          positionName: jobDetails.jobTitle,
          faculty: jobDetails.facultyName,
          department: jobDetails.departmentName
        })
      });
      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการสร้างไฟล์ Word');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportData.title || 'ประกาศรายชื่อ'}${activeRound !== 'all' ? `_รอบที่_${activeRound}` : ''}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('ไม่สามารถดาวน์โหลด Word ได้: ' + err.message);
    }
  };

  // ==========================================
  // แนบไฟล์ PDF ฉบับลงนามแล้ว (Upload & Delete)
  // ==========================================
  const handleUploadSignedFile = async (type, examPositionTypeId, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('กรุณาเลือกไฟล์เอกสาร PDF เท่านั้น');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('recruitmentId', id);
    formData.append('type', type);
    if (examPositionTypeId) {
      formData.append('examPositionTypeId', examPositionTypeId);
    }

    try {
      const res = await fetch('http://localhost:3000/api/applications/announcements/upload-signed-file', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ แนบไฟล์ประกาศฉบับลงนาม (PDF) สำเร็จเรียบร้อยแล้ว');
        fetchJobInfo();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result.message || 'ไม่สามารถอัปโหลดไฟล์ได้'));
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    }
  };

  const handleDeleteSignedFile = async (type, examPositionTypeId) => {
    if (!window.confirm('คุณต้องการลบไฟล์ประกาศฉบับลงนามที่แนบไว้นี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch('http://localhost:3000/api/applications/announcements/signed-file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruitmentId: id, type, examPositionTypeId })
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ ลบไฟล์แนบเรียบร้อยแล้ว');
        fetchJobInfo();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (result.message || 'ไม่สามารถลบไฟล์ได้'));
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <div className="text-muted fs-6">กำลังโหลดข้อมูลผู้สมัครและจัดการประกาศ...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>

      {/* 🧭 ส่วนหัวของหน้าและข้อมูลตำแหน่งงาน */}
      <div className="container mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white p-4 rounded-3 border shadow-sm">
          <div className="d-flex align-items-start gap-3">
            <Link to="/manage-jobs" className="btn btn-outline-secondary btn-sm rounded-circle px-2 mt-1 shadow-sm" style={{ border: 'none', background: '#f1f5f9', color: '#334155' }} title="กลับสู่หน้ารายการประกาศงาน">
              <i className="bi bi-arrow-left fs-5"></i>
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 small">
                  ระบบประกาศผลและกำหนดการสอบ
                </span>
                <Link to={`/jobs/closed/${id}`} target="_blank" className="badge bg-light text-primary border text-decoration-none px-2 py-1 small" title="คลิกเพื่อดูมุมมองผู้สมัคร/สาธารณะ">
                  <i className="bi bi-box-arrow-up-right me-1"></i>ดูหน้าประกาศสาธารณะ
                </Link>
              </div>
              <h3 className="fw-bold mt-2 mb-1" style={{ color: '#006664' }}>
                <i className="bi bi-megaphone-fill me-2 text-warning"></i>
                จัดการประกาศรายชื่อผู้มีสิทธิสอบ / ผลการคัดเลือก
              </h3>
              <div className="d-flex flex-wrap align-items-center gap-3 mt-2 text-secondary small">
                <div>
                  <i className="bi bi-briefcase-fill me-1 text-primary"></i>ตำแหน่ง: <span className="fw-bold text-dark">{jobDetails.jobTitle}</span>
                </div>
                {jobDetails.facultyName && (
                  <div>
                    <i className="bi bi-building me-1 text-primary"></i>คณะ: <span className="fw-bold text-dark">{jobDetails.facultyName}</span>
                  </div>
                )}
                {jobDetails.departmentName && jobDetails.departmentName !== '-' && (
                  <div>
                    <i className="bi bi-diagram-3 me-1 text-primary"></i>หน่วยงาน: <span className="fw-bold text-dark">{jobDetails.departmentName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 🔄 ส่วนเลือกรอบการรับสมัครที่ต้องการจัดการ */}
        <div className="d-flex align-items-center justify-content-between gap-3 bg-white p-3 rounded-3 border shadow-sm mt-3 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-bold text-dark d-flex align-items-center gap-1 small">
              <i className="bi bi-clock-history text-success fs-6"></i> เลือกรอบการรับสมัคร:
            </span>
            <div className="btn-group btn-group-sm shadow-sm" role="group">
              {availableRounds.map(r => {
                const countInRound = allApplicants.filter(a => Number(a.roundNo || 1) === r).length;
                return (
                  <button
                    key={r}
                    type="button"
                    className={`btn ${activeRound === r ? 'btn-success fw-bold text-white' : 'btn-outline-secondary bg-white'}`}
                    onClick={() => handleRoundChange(r)}
                  >
                    รอบที่ {r} {r === latestRound ? ' (รอบล่าสุด)' : ''} ({countInRound} คน)
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-muted small">
            <span>กำลังจัดการและประกาศผลผู้สมัครใน <strong className="text-success">รอบที่ {activeRound}</strong> ({currentApplicants.length} ท่าน)</span>
          </div>
        </div>

        {/* 📑 การ์ดนำทางแยก 2 หัวข้อหลักอย่างชัดเจน */}
        <div className="row g-3 mt-3">
          {/* หัวข้อที่ ๑: ประกาศรายชื่อผู้มีสิทธิ์เข้าทดสอบแต่ละตำแหน่ง */}
          <div className="col-lg-6 col-md-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('exams')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('exams'); }}
              className={`card h-100 p-3 transition-all cursor-pointer ${activeTab === 'exams'
                  ? 'border-primary shadow bg-white'
                  : 'border bg-white text-secondary'
                }`}
              style={{
                borderRadius: '12px',
                borderWidth: activeTab === 'exams' ? '2.5px' : '1px',
                borderLeft: '6px solid #2563eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                transform: activeTab === 'exams' ? 'translateY(-2px)' : 'none',
              }}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 small fw-bold">
                  หัวข้อที่ ๑
                </span>
                {announcedExamsCount === examAnnouncements.length && examAnnouncements.length > 0 ? (
                  <span className="badge bg-success text-white small">
                    <i className="bi bi-check-circle-fill me-1"></i>ประกาศครบแล้ว
                  </span>
                ) : announcedExamsCount > 0 ? (
                  <span className="badge bg-primary text-white small">
                    ประกาศแล้ว {announcedExamsCount}/{examAnnouncements.length}
                  </span>
                ) : (
                  <span className="badge bg-warning bg-opacity-25 text-dark border border-warning small">
                    <i className="bi bi-pencil-fill me-1"></i>ยังไม่เผยแพร่ ({examAnnouncements.length})
                  </span>
                )}
              </div>
              <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <i className="bi bi-pencil-square text-primary fs-5"></i>
                ประกาศรายชื่อผู้มีสิทธิ์เข้าทดสอบแต่ละตำแหน่ง
              </h6>
              <p className="text-muted small mb-2" style={{ minHeight: '36px' }}>
                กำหนดวัน เวลา สถานที่สอบ และรายชื่อผู้มีสิทธิ์สอบแต่ละประเภท
              </p>
              <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto small">
                <span className="text-secondary">ประเภทการสอบ:</span>
                <span className="fw-bold text-primary fs-6">{examAnnouncements.length} ประเภท</span>
              </div>
              {activeTab === 'exams' && (
                <div className="text-center mt-2 pt-1 border-top border-primary-subtle">
                  <span className="text-primary fw-bold small d-inline-flex align-items-center gap-1">
                    <i className="bi bi-arrow-down-circle-fill"></i> กำลังจัดการหัวข้อนี้
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* หัวข้อที่ ๒: ประกาศรายชื่อผู้ผ่านการคัดเลือก */}
          <div className="col-lg-6 col-md-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('final')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('final'); }}
              className={`card h-100 p-3 transition-all cursor-pointer ${activeTab === 'final'
                  ? 'border-warning shadow bg-white'
                  : 'border bg-white text-secondary'
                }`}
              style={{
                borderRadius: '12px',
                borderWidth: activeTab === 'final' ? '2.5px' : '1px',
                borderLeft: '6px solid #d97706',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                transform: activeTab === 'final' ? 'translateY(-2px)' : 'none',
              }}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="badge bg-warning bg-opacity-25 text-dark border border-warning border-opacity-50 px-2 py-1 small fw-bold">
                  หัวข้อที่ ๒
                </span>
                {finalAnnouncement.isAnnounced ? (
                  <span className="badge bg-success text-white small">
                    <i className="bi bi-check-circle-fill me-1"></i>เผยแพร่แล้ว
                  </span>
                ) : (
                  <span className="badge bg-warning bg-opacity-25 text-dark border border-warning small">
                    <i className="bi bi-pencil-fill me-1"></i>ยังไม่เผยแพร่
                  </span>
                )}
              </div>
              <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <i className="bi bi-trophy-fill text-warning fs-5"></i>
                ประกาศรายชื่อผู้ผ่านการคัดเลือก
              </h6>
              <p className="text-muted small mb-2" style={{ minHeight: '36px' }}>
                ประกาศผลการคัดเลือกขั้นสุดท้าย (ได้งาน) เพื่อบรรจุแต่งตั้ง
              </p>
              <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto small">
                <span className="text-secondary">ผู้ผ่านการคัดเลือก:</span>
                <span className="fw-bold text-dark fs-6">{finalCandidates.length} ท่าน</span>
              </div>
              {activeTab === 'final' && (
                <div className="text-center mt-2 pt-1 border-top border-warning-subtle">
                  <span className="text-warning-emphasis fw-bold small d-inline-flex align-items-center gap-1">
                    <i className="bi bi-arrow-down-circle-fill"></i> กำลังจัดการหัวข้อนี้
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* แถบสลับโหมด: แสดงทีละหัวข้อ VS ดูรวมทุกหัวข้อ */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3 px-1">
          <div className="small text-secondary">
            <i className="bi bi-info-circle me-1 text-primary"></i>
            คลิกเลือกการ์ดด้านบนเพื่อสลับจัดการทีละหัวข้อได้อย่างชัดเจน
          </div>
          <button
            type="button"
            className={`btn btn-sm px-3 rounded-pill shadow-none fw-medium ${activeTab === 'all'
                ? 'btn-dark text-white'
                : 'btn-outline-secondary bg-white'
              }`}
            onClick={() => setActiveTab(activeTab === 'all' ? 'exams' : 'all')}
          >
            <i className={`bi ${activeTab === 'all' ? 'bi-check-circle-fill' : 'bi-grid-fill'} me-1`}></i>
            {activeTab === 'all' ? 'กำลังแสดงรวมทั้ง 2 ส่วน (คลิกเพื่อกลับไปดูทีละหัวข้อ)' : 'แสดงทั้ง 2 หัวข้อในหน้าเดียว'}
          </button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1100px' }}>

        {/* ================================================================================= */}
        {/* 1. หัวข้อที่ ๑: ประกาศรายชื่อผู้มีสิทธิ์เข้าทดสอบแต่ละตำแหน่ง */}
        {/* ================================================================================= */}
        {(activeTab === 'all' || activeTab === 'exams') && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', borderLeft: '5px solid #2563eb' }}>
            <div className="card-header bg-white py-3 border-bottom">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-primary px-2 py-1">หัวข้อที่ ๑</span>
                    <span className="text-muted small">กำหนดการทดสอบและรายชื่อผู้มีสิทธิ์สอบ</span>
                  </div>
                  <h4 className="fw-bold text-dark mb-0">ประกาศรายชื่อผู้มีสิทธิ์เข้าทดสอบแต่ละตำแหน่ง</h4>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 fw-medium">
                    <i className="bi bi-journal-check me-1"></i>ทั้งหมด {examAnnouncements.length} ประเภทการสอบ
                  </span>
                </div>
              </div>

              <div className="text-muted small mt-2">
                * กำหนดวัน เวลา สถานที่สอบ และสามารถเลือกประกาศพร้อมกันทุกประเภท หรือประกาศแยกทีละประเภทการสอบได้
              </div>

              {/* แถบการจัดการแบบกลุ่ม (Batch Toolbar สำหรับประกาศพร้อมกัน) */}
              {examAnnouncements.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 p-2 px-3 bg-light rounded-2 border">
                  <div className="form-check mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="selectAllExamsCheck"
                      checked={selectedExamIds.length === examAnnouncements.length && examAnnouncements.length > 0}
                      onChange={(e) => handleSelectAllExams(e.target.checked)}
                    />
                    <label className="form-check-label small fw-bold text-dark" htmlFor="selectAllExamsCheck">
                      เลือกทุกประเภทการสอบ ({selectedExamIds.length}/{examAnnouncements.length})
                    </label>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary shadow-sm fw-medium"
                      disabled={isSubmitting || selectedExamIds.length === 0}
                      onClick={() => handleSaveAction({ target: 'exams_selected', isAnnounced: false, targetExamIds: selectedExamIds })}
                    >
                      <i className="bi bi-save me-1"></i>บันทึกข้อมูลประเภทที่เลือกในรอบที่ {activeRound} (ไม่ประกาศ)
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary shadow-sm fw-medium"
                      disabled={isSubmitting || selectedExamIds.length === 0}
                      onClick={() => handleSaveAction({ target: 'exams_selected', isAnnounced: true, targetExamIds: selectedExamIds })}
                    >
                      <i className="bi bi-megaphone-fill me-1"></i>ประกาศประเภทที่เลือกในรอบที่ {activeRound} ({selectedExamIds.length} รายการ)
                    </button>
                  </div>
                </div>
              )}

              {/* แถบเลือกรอบสำหรับดูและจัดการผู้มีสิทธิ์สอบแต่ละประเภท */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 p-2 px-3 bg-white rounded-2 border shadow-none">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="small fw-bold text-dark d-flex align-items-center gap-1">
                    <i className="bi bi-funnel-fill text-primary"></i> แสดงผู้มีสิทธิ์สอบรอบ:
                  </span>
                  <div className="btn-group btn-group-sm shadow-sm" role="group">
                    {availableRounds.map(r => {
                      const countInRound = allApplicants.filter(a => {
                        const qual = (a.qualStatus || '').trim();
                        const isPassed = qual === 'ผ่านการคัดเลือกเบื้องต้น' || (qual.includes('ผ่าน') && !qual.includes('ไม่ผ่าน'));
                        return Number(a.roundNo || 1) === r && isPassed && qual !== 'Draft';
                      }).length;

                      return (
                        <button
                          key={r}
                          type="button"
                          className={`btn ${activeRound === r ? 'btn-primary fw-bold text-white' : 'btn-outline-secondary bg-white'}`}
                          onClick={() => handleRoundChange(r)}
                        >
                          รอบที่ {r} {r === latestRound ? '(ล่าสุด)' : ''} ({countInRound} คน)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-muted small">
                  <span>แสดงผู้มีสิทธิ์สอบเฉพาะ <strong className="text-primary">รอบที่ {activeRound}</strong></span>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              {examAnnouncements.length === 0 ? (
                <div className="p-4 text-center text-muted border rounded bg-light">
                  <i className="bi bi-journal-x fs-3 d-block mb-2 text-secondary opacity-50"></i>
                  ตำแหน่งนี้ยังไม่มีการกำหนดประเภทการสอบไว้ในระบบ
                </div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {examAnnouncements.map((exam, index) => {
                    const isSelected = selectedExamIds.includes(exam.id);

                    return (
                      <div
                        key={exam.id}
                        className={`card border rounded-3 shadow-none transition-all ${isSelected ? 'border-primary border-opacity-50' : 'border-light-subtle'}`}
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <div className="card-header py-3 bg-light bg-opacity-50 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isSelected}
                              onChange={() => handleToggleSelectExam(exam.id)}
                              title="ติ๊กเลือกเพื่อประกาศหรือบันทึกพร้อมกัน"
                            />
                            <span className="badge bg-secondary">{index + 1}</span>
                            <span className="fw-bold text-dark fs-6">{exam.topicType}</span>
                            {exam.isAnnounced ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small fw-normal">
                                <i className="bi bi-check-circle-fill me-1"></i>เผยแพร่แล้ว
                              </span>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 small fw-normal">
                                <i className="bi bi-hourglass-split me-1"></i>แบบร่าง (ยังไม่เผยแพร่)
                              </span>
                            )}
                          </div>

                          {/* ปุ่มพิมพ์ PDF & Word ประจำการสอบนี้ */}
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger shadow-sm d-inline-flex align-items-center"
                              onClick={() => handleExportPDF({
                                title: exam.topicType,
                                topicType: 'exam',
                                hasExamSchedule: true,
                                examName: exam.examName,
                                candidates: exam.candidates.map((c, i) => ({
                                  seq: i + 1,
                                  appId: c.appId,
                                  name: c.name,
                                  date: c.date,
                                  time: c.time,
                                  location: c.location
                                })),
                                remark: exam.remark
                              })}
                              title="พิมพ์/ดาวน์โหลดเอกสารประกาศทางการเพื่อเสนอลงนาม"
                            >
                              <i className="bi bi-file-earmark-pdf-fill me-1 text-danger"></i>พิมพ์ / PDF
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary shadow-sm d-inline-flex align-items-center"
                              onClick={() => handleExportWord({
                                title: exam.topicType,
                                topicType: 'exam',
                                hasExamSchedule: true,
                                examName: exam.examName,
                                candidates: exam.candidates.map((c, i) => ({
                                  seq: i + 1,
                                  appId: c.appId,
                                  name: c.name,
                                  date: c.date,
                                  time: c.time,
                                  location: c.location
                                })),
                                remark: exam.remark
                              })}
                              title="ดาวน์โหลดไฟล์ Word (.docx)"
                            >
                              <i className="bi bi-file-earmark-word-fill me-1 text-primary"></i>Word (.docx)
                            </button>
                            <a
                              href="http://localhost:3000/api/export/templates/candidate-announcement"
                              download="แม่แบบประกาศรายชื่อผู้มีสิทธิสอบ.docx"
                              className="btn btn-sm btn-outline-secondary shadow-sm d-inline-flex align-items-center"
                              title="ดาวน์โหลดไฟล์แม่แบบ Word สำหรับผู้มีสิทธิสอบ"
                            >
                              <i className="bi bi-download me-1 text-secondary"></i>แม่แบบ Word
                            </a>
                          </div>
                        </div>

                        <div className="card-body p-3 p-md-4">

                          {/* Quick Batch Fill Toolbar สำหรับประเภทการสอบนี้ */}
                          {exam.candidates.length > 0 && (
                            <div className="bg-light p-3 rounded-2 border mb-3">
                              <div className="small fw-bold text-secondary mb-2 d-flex align-items-center">
                                <i className="bi bi-magic me-1 text-primary"></i> กำหนดวัน เวลา สถานที่ ให้กับผู้เข้าสอบทุกคนพร้อมกัน:
                              </div>
                              <div className="row g-2 align-items-center">
                                <div className="col-12 col-md-3">
                                  <input
                                    type="date"
                                    className="form-control form-control-sm bg-white"
                                    title="กำหนดวันที่ให้กับทุกคน"
                                    value={exam.batchDate || ''}
                                    onChange={(e) => handleExamFieldChange(exam.id, 'batchDate', e.target.value)}
                                  />
                                </div>
                                <div className="col-12 col-md-3">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm bg-white"
                                    placeholder="เวลา เช่น 09:00 - 12:00"
                                    value={exam.batchTime || ''}
                                    onChange={(e) => handleExamFieldChange(exam.id, 'batchTime', e.target.value)}
                                  />
                                </div>
                                <div className="col-12 col-md-4">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm bg-white"
                                    placeholder="สถานที่ / ห้องสอบ"
                                    value={exam.batchLocation || ''}
                                    onChange={(e) => handleExamFieldChange(exam.id, 'batchLocation', e.target.value)}
                                  />
                                </div>
                                <div className="col-12 col-md-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary w-100 fw-medium shadow-sm"
                                    onClick={() => handleApplyBatchToAll(exam.id)}
                                  >
                                    <i className="bi bi-check-all me-1"></i>นำไปใช้
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ตารางกำหนดการสอบผู้สมัครแต่ละคน */}
                          {exam.candidates.length > 0 ? (
                            <div className="table-responsive border rounded bg-white mb-3" style={{ maxHeight: '280px' }}>
                              <table className="table table-bordered table-hover align-middle mb-0 small">
                                <thead className="table-light text-muted sticky-top">
                                  <tr>
                                    <th className="py-2 px-3 text-center" style={{ width: '60px' }}>ลำดับ</th>
                                    <th className="py-2 px-3" style={{ width: '220px' }}>ชื่อ - นามสกุล</th>
                                    <th className="py-2 px-2" style={{ width: '150px' }}>วันที่สอบ</th>
                                    <th className="py-2 px-2" style={{ width: '150px' }}>เวลาสอบ</th>
                                    <th className="py-2 px-2">สถานที่ / ห้องสอบ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exam.candidates.map((cand, cIdx) => (
                                    <tr key={cand.rawId || cand.appId || cIdx}>
                                      <td className="text-center text-muted fw-medium py-2 px-3">{cIdx + 1}</td>
                                      <td className="py-2 px-3 fw-bold text-dark">
                                        {cand.name}
                                        {cand.roundNo && (
                                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 small ms-2 fw-normal">
                                            รอบที่ {cand.roundNo}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1 px-2">
                                        <input
                                          type="date"
                                          className="form-control form-control-sm bg-light"
                                          value={cand.date || ''}
                                          onChange={(e) => handleCandidateChange(exam.id, cIdx, 'date', e.target.value)}
                                        />
                                      </td>
                                      <td className="py-1 px-2">
                                        <input
                                          type="text"
                                          className="form-control form-control-sm bg-light"
                                          placeholder="09:00 - 12:00"
                                          value={cand.time || ''}
                                          onChange={(e) => handleCandidateChange(exam.id, cIdx, 'time', e.target.value)}
                                        />
                                      </td>
                                      <td className="py-1 px-2">
                                        <input
                                          type="text"
                                          className="form-control form-control-sm bg-light"
                                          placeholder="ระบุห้องสอบ..."
                                          value={cand.location || ''}
                                          onChange={(e) => handleCandidateChange(exam.id, cIdx, 'location', e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="alert alert-light border py-3 text-center small mb-3 text-muted">
                              <i className="bi bi-info-circle me-1 text-primary"></i>
                              ไม่มีผู้มีสิทธิ์สอบในรอบที่ {activeRound} (สามารถคลิกเลือกรอบอื่น เช่น {availableRounds.filter(r => r !== activeRound).map(r => `รอบที่ ${r}`).join(', ') || '-'} จากแถบเลือกรอบด้านบน)
                            </div>
                          )}

                          {/* แนบไฟล์ประกาศฉบับลงนาม (PDF) ประจำการสอบนี้ */}
                          <div className="p-3 bg-light rounded-3 border mb-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                              <label className="fw-bold small text-dark mb-0">
                                <i className="bi bi-paperclip me-1 text-danger"></i>
                                แนบไฟล์ประกาศฉบับทางการที่ลงนามแล้ว (PDF) สำหรับ{exam.examName}:
                              </label>
                              {exam.fileName && (
                                <span className="badge bg-success bg-opacity-10 text-success border small">
                                  <i className="bi bi-check-lg me-1"></i>มีไฟล์แนบในระบบแล้ว
                                </span>
                              )}
                            </div>

                            {exam.fileName ? (
                              <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded border flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2 small">
                                  <i className="bi bi-file-earmark-pdf-fill fs-5 text-danger"></i>
                                  <span className="fw-medium text-dark">{exam.fileName}</span>
                                </div>
                                <div className="d-flex gap-2">
                                  <a
                                    href={exam.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-danger"
                                  >
                                    <i className="bi bi-eye me-1"></i>เปิดดูไฟล์ PDF
                                  </a>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleDeleteSignedFile('exam', exam.id)}
                                  >
                                    <i className="bi bi-trash me-1"></i>ลบไฟล์
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <input
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  id={`examFileInput-${exam.id}`}
                                  className="form-control form-control-sm bg-white"
                                  style={{ maxWidth: '380px' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary fw-medium shadow-sm"
                                  onClick={() => {
                                    const input = document.getElementById(`examFileInput-${exam.id}`);
                                    if (input && input.files[0]) {
                                      handleUploadSignedFile('exam', exam.id, input.files[0]);
                                    } else {
                                      alert('กรุณาเลือกไฟล์ PDF ที่ต้องการแนบก่อน');
                                    }
                                  }}
                                >
                                  <i className="bi bi-upload me-1"></i>อัปโหลดไฟล์ประกาศฉบับลงนาม
                                </button>
                              </div>
                            )}
                          </div>



                          {/* ปุ่มควบคุมเฉพาะประเภทการสอบนี้ */}
                          <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top flex-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary shadow-sm px-3 fw-medium"
                              disabled={isSubmitting}
                              onClick={() => handleSaveAction({ target: 'exam_single', isAnnounced: false, targetExamIds: [exam.id] })}
                            >
                              <i className="bi bi-save me-1"></i>บันทึกข้อมูล (ไม่ประกาศ)
                            </button>
                            {exam.isAnnounced ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-warning shadow-sm px-3 fw-medium text-dark"
                                disabled={isSubmitting}
                                onClick={() => handleSaveAction({ target: 'exam_single', isAnnounced: false, targetExamIds: [exam.id] })}
                              >
                                <i className="bi bi-eye-slash me-1"></i>ยกเลิกการประกาศ {exam.examName}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary shadow-sm px-4 fw-medium text-white"
                                disabled={isSubmitting}
                                onClick={() => handleSaveAction({ target: 'exam_single', isAnnounced: true, targetExamIds: [exam.id] })}
                              >
                                <i className="bi bi-send-check me-1"></i>บันทึกและประกาศ {exam.examName}
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* แถบนำทางขั้นตอน (เมื่อดูทีละหัวข้อ) */}
              {activeTab !== 'all' && (
                <div className="d-flex justify-content-end align-items-center pt-3 mt-3 border-top bg-light p-3 rounded-2 flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm fw-medium text-dark shadow-sm"
                    onClick={() => { setActiveTab('final'); window.scrollTo({ top: 150, behavior: 'smooth' }); }}
                  >
                    ไปยัง หัวข้อที่ ๒: ประกาศรายชื่อผู้ผ่านการคัดเลือก <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================================= */}
        {/* 2. หัวข้อที่ ๒: ประกาศรายชื่อผู้ผ่านการคัดเลือก */}
        {/* ================================================================================= */}
        {(activeTab === 'all' || activeTab === 'final') && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', borderLeft: '5px solid #d97706' }}>
            <div className="card-header bg-white py-3 border-bottom">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-warning text-dark px-2 py-1">หัวข้อที่ ๒</span>
                    <span className="text-muted small">การคัดเลือกขั้นสุดท้าย (ได้งาน) เพื่อบรรจุแต่งตั้ง</span>
                  </div>
                  <h4 className="fw-bold text-dark mb-0">ประกาศรายชื่อผู้ผ่านการคัดเลือก</h4>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {finalAnnouncement.isAnnounced ? (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-medium">
                      <i className="bi bi-check-circle-fill me-1"></i>เผยแพร่แล้วต่อสาธารณะ
                    </span>
                  ) : (
                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 py-2 fw-medium">
                      <i className="bi bi-hourglass-split me-1"></i>ยังไม่เผยแพร่ (แบบร่าง)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div className="text-secondary small">
                  รายชื่อผู้ผ่านการคัดเลือกขั้นสุดท้าย (ได้งาน): <span className="fw-bold text-dark">{finalCandidates.length} ท่าน</span>
                </div>

                {/* ปุ่มพิมพ์ PDF & Word สำหรับรอบสุดท้าย */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger shadow-sm d-inline-flex align-items-center"
                    onClick={() => handleExportPDF({
                      title: finalAnnouncement.title,
                      topicType: 'final',
                      hasExamSchedule: false,
                      candidates: finalCandidates.map((c, i) => ({ seq: i + 1, appId: c.id, name: c.name, remark: 'ผ่านการคัดเลือก' })),
                      remark: finalAnnouncement.remark
                    })}
                    title="พิมพ์หรือดาวน์โหลดเอกสารประกาศทางการเพื่อเสนอลงนาม"
                  >
                    <i className="bi bi-file-earmark-pdf-fill me-1 text-danger"></i>พิมพ์ / PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary shadow-sm d-inline-flex align-items-center"
                    onClick={() => handleExportWord({
                      title: finalAnnouncement.title,
                      topicType: 'final',
                      hasExamSchedule: false,
                      candidates: finalCandidates.map((c, i) => ({ seq: i + 1, appId: c.id, name: c.name, remark: 'ผ่านการคัดเลือก' })),
                      remark: finalAnnouncement.remark
                    })}
                    title="ดาวน์โหลดไฟล์ Word (.docx)"
                  >
                    <i className="bi bi-file-earmark-word-fill me-1 text-primary"></i>Word (.docx)
                  </button>
                  <a
                    href="http://localhost:3000/api/export/templates/final-candidate-announcement"
                    download="แม่แบบประกาศรายชื่อผู้ผ่านการคัดเลือก.docx"
                    className="btn btn-sm btn-outline-secondary shadow-sm d-inline-flex align-items-center"
                    title="ดาวน์โหลดไฟล์แม่แบบ Word สำหรับผู้ผ่านการคัดเลือก"
                  >
                    <i className="bi bi-download me-1 text-secondary"></i>แม่แบบ Word
                  </a>
                </div>
              </div>

              {/* ตารางแสดงรายชื่อผู้ผ่านการคัดเลือก */}
              {finalCandidates.length > 0 ? (
                <div className="table-responsive border rounded bg-white mb-3" style={{ maxHeight: '250px' }}>
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light text-muted sticky-top">
                      <tr>
                        <th className="py-2 px-3 text-center" style={{ width: '70px' }}>ลำดับ</th>
                        <th className="py-2 px-3">ชื่อ - นามสกุล</th>
                        <th className="py-2 px-3 text-center" style={{ width: '150px' }}>ผลการคัดเลือก</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalCandidates.map((cand, idx) => (
                        <tr key={cand.id || idx}>
                          <td className="text-center text-muted fw-medium py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3 fw-bold text-dark">
                            {cand.name}
                            {cand.roundNo && (
                              <span className="badge bg-light text-secondary border small ms-2 fw-normal">
                                รอบที่ {cand.roundNo}
                              </span>
                            )}
                          </td>
                          <td className="text-center py-2 px-3">
                            <span className="badge bg-success text-white px-2 py-1 fw-medium">
                              <i className="bi bi-trophy-fill me-1"></i>ผ่านการคัดเลือก (ได้งาน)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {/* แนบไฟล์ประกาศฉบับลงนาม (PDF) รอบสุดท้าย */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <label className="fw-bold small text-dark mb-0">
                    <i className="bi bi-paperclip me-1 text-danger"></i>
                    แนบไฟล์ประกาศผลการคัดเลือกฉบับทางการที่ลงนามแล้ว (PDF):
                  </label>
                  {finalAnnouncement.fileName && (
                    <span className="badge bg-success bg-opacity-10 text-success border small">
                      <i className="bi bi-check-lg me-1"></i>มีไฟล์แนบในระบบแล้ว
                    </span>
                  )}
                </div>

                {finalAnnouncement.fileName ? (
                  <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded border flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2 small">
                      <i className="bi bi-file-earmark-pdf-fill fs-5 text-danger"></i>
                      <span className="fw-medium text-dark">{finalAnnouncement.fileName}</span>
                    </div>
                    <div className="d-flex gap-2">
                      <a
                        href={finalAnnouncement.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-danger"
                      >
                        <i className="bi bi-eye me-1"></i>เปิดดูไฟล์ PDF
                      </a>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleDeleteSignedFile('final')}
                      >
                        <i className="bi bi-trash me-1"></i>ลบไฟล์
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      id="finalFileInput"
                      className="form-control form-control-sm bg-white"
                      style={{ maxWidth: '380px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-warning fw-medium shadow-sm text-dark"
                      onClick={() => {
                        const input = document.getElementById('finalFileInput');
                        if (input && input.files[0]) {
                          handleUploadSignedFile('final', null, input.files[0]);
                        } else {
                          alert('กรุณาเลือกไฟล์ PDF ที่ต้องการแนบก่อน');
                        }
                      }}
                    >
                      <i className="bi bi-upload me-1"></i>อัปโหลดไฟล์ประกาศฉบับลงนาม
                    </button>
                  </div>
                )}
              </div>



              {/* แถบปุ่มจัดการรอบสุดท้าย */}
              <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary shadow-sm px-3 fw-medium"
                  disabled={isSubmitting}
                  onClick={() => handleSaveAction({ target: 'final', isAnnounced: false })}
                >
                  <i className="bi bi-save me-1"></i>บันทึกข้อมูล (ไม่ประกาศ)
                </button>
                {finalAnnouncement.isAnnounced ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-warning shadow-sm px-3 fw-medium text-dark"
                    disabled={isSubmitting}
                    onClick={() => handleSaveAction({ target: 'final', isAnnounced: false })}
                  >
                    <i className="bi bi-eye-slash me-1"></i>ยกเลิกการประกาศผล (กลับเป็นแบบร่าง)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-warning shadow-sm px-4 fw-medium text-dark"
                    disabled={isSubmitting}
                    onClick={() => handleSaveAction({ target: 'final', isAnnounced: true })}
                  >
                    <i className="bi bi-trophy-fill me-1"></i>บันทึกและประกาศรายชื่อผู้ผ่านการคัดเลือก (รอบที่ {activeRound})
                  </button>
                )}
              </div>

              {/* แถบนำทางขั้นตอน (เมื่อดูทีละหัวข้อ) */}
              {activeTab !== 'all' && (
                <div className="d-flex justify-content-start align-items-center pt-3 mt-3 border-top bg-light p-3 rounded-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm fw-medium shadow-sm"
                    onClick={() => { setActiveTab('exams'); window.scrollTo({ top: 150, behavior: 'smooth' }); }}
                  >
                    <i className="bi bi-arrow-left me-1"></i> ย้อนกลับไป หัวข้อที่ ๑: ประกาศรายชื่อผู้มีสิทธิ์เข้าทดสอบแต่ละตำแหน่ง
                  </button>
                </div>
              )}
            </div>
          </div>
        )}



      </div>
    </div>
  );
}