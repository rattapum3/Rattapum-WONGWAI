import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportSummary() {
  // ดึง ID ของตำแหน่งมาจาก URL (เช่น /report/all หรือ /report/19)
  const { id } = useParams();
  const [currentStats, setCurrentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('monthly'); // 'monthly' (ใน 1 เดือน) | 'yearly' (12 เดือน)
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [chartLoading, setChartLoading] = useState(false);

  const thaiMonthsList = [
    { num: 1, name: 'มกราคม', short: 'ม.ค.' },
    { num: 2, name: 'กุมภาพันธ์', short: 'ก.พ.' },
    { num: 3, name: 'มีนาคม', short: 'มี.ค.' },
    { num: 4, name: 'เมษายน', short: 'เม.ย.' },
    { num: 5, name: 'พฤษภาคม', short: 'พ.ค.' },
    { num: 6, name: 'มิถุนายน', short: 'มิ.ย.' },
    { num: 7, name: 'กรกฎาคม', short: 'ก.ค.' },
    { num: 8, name: 'สิงหาคม', short: 'ส.ค.' },
    { num: 9, name: 'กันยายน', short: 'ก.ย.' },
    { num: 10, name: 'ตุลาคม', short: 'ต.ค.' },
    { num: 11, name: 'พฤศจิกายน', short: 'พ.ย.' },
    { num: 12, name: 'ธันวาคม', short: 'ธ.ค.' }
  ];

  useEffect(() => {
    fetchSummaryData();
  }, [id]);

  const fetchSummaryData = async (targetYear = null, targetMonth = null, targetMode = null, isSubsequent = false) => {
    try {
      if (isSubsequent) {
        setChartLoading(true);
      } else {
        setLoading(true);
      }
      const yr = targetYear !== null ? targetYear : selectedYear;
      const mo = targetMonth !== null ? targetMonth : selectedMonth;
      const md = targetMode !== null ? targetMode : chartMode;

      let url = `http://localhost:3000/api/reports/summary/${id || 'all'}`;
      const params = [];
      if (md) params.push(`mode=${md}`);
      if (yr) params.push(`year=${yr}`);
      if (mo && md === 'monthly') params.push(`month=${mo}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCurrentStats(data.data);
        if (!selectedYear && data.data.selectedYear) {
          setSelectedYear(data.data.selectedYear);
        }
        if (!selectedMonth && data.data.selectedMonth) {
          setSelectedMonth(data.data.selectedMonth);
        }
      }
    } catch (error) {
      console.error('Error fetching report summary:', error);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setChartMode(newMode);
    fetchSummaryData(selectedYear, selectedMonth, newMode, true);
  };

  const handleYearChange = (newYear) => {
    const y = Number(newYear);
    setSelectedYear(y);
    fetchSummaryData(y, selectedMonth, chartMode, true);
  };

  const handleMonthChange = (newMonth) => {
    const m = Number(newMonth);
    setSelectedMonth(m);
    fetchSummaryData(selectedYear, m, 'monthly', true);
  };

  // Custom Tooltip สำหรับกราฟเวลานำเมาส์ไปชี้
  const CustomTooltip = ({ active, payload, label, mode }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload || {};
      const title = mode === 'monthly'
        ? (point.dateFullThai || `วันที่ ${label} ${currentStats?.selectedMonthName || ''}`)
        : `เดือน${point.monthFull || label} พ.ศ. ${currentStats?.selectedYearBE || ''}`;

      return (
        <div className="bg-white p-3 border shadow-sm rounded-3">
          <p className="fw-bold mb-1" style={{ color: mode === 'yearly' ? '#006664' : '#03A96B' }}>
            <i className="bi bi-calendar-event me-1"></i>
            {title}
          </p>
          <p className="mb-0 text-dark">
            ผู้สมัคร: <span className="fw-bold fs-5 text-primary">{payload[0].value}</span> คน
          </p>
        </div>
      );
    }
    return null;
  };

  // Component ย่อยสำหรับการ์ดสถิติแต่ละขั้นตอน
  const StatCard = ({ title, data, icon }) => {
    const safeData = data || { pass: 0, fail: 0, waiting: 0, pending: 0 };
    const passCount = safeData.pass || 0;
    const failCount = safeData.fail || 0;
    const waitingCount = safeData.waiting ?? safeData.pending ?? 0;
    const isFinalStage = safeData.key === 'finalSelection' || title.includes('สรุปผลการคัดเลือก');

    // คำนวณเปอร์เซ็นต์เฉพาะผู้ที่ได้รับการประเมินแล้ว (ไม่นำผู้ที่รอตรวจสอบมาคิด)
    const evaluatedTotal = passCount + failCount;

    const calcPercent = (count, total) => {
      if (!total || total === 0) return 0;
      const raw = (count / total) * 100;
      return Number.isInteger(raw) ? raw : Number(raw.toFixed(1));
    };

    const passPercent = calcPercent(passCount, evaluatedTotal);
    const failPercent = evaluatedTotal > 0
      ? (Number.isInteger(passPercent) ? 100 - passPercent : Number((100 - passPercent).toFixed(1)))
      : 0;

    return (
      <div className="card border-0 shadow-sm h-100 rounded-4 bg-white" style={isFinalStage ? { borderTop: '4px solid #006664' } : {}}>
        <div className="card-body p-4 d-flex flex-column justify-content-between">
          <div>
            <div className="d-flex align-items-center mb-3">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${isFinalStage ? 'bg-warning bg-opacity-20 text-warning-emphasis' : 'bg-success bg-opacity-10 text-success'}`}
                style={{ width: '45px', height: '45px', minWidth: '45px' }}
              >
                <i className={`bi ${icon} fs-5`}></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark" style={{ lineHeight: '1.4' }}>{title}</h6>
                {isFinalStage && (
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    อิงผู้ผ่านจริง & ผลรวมไม่ผ่านทุกประเภทการสอบ
                  </span>
                )}
              </div>
            </div>

            <div className="row text-center mb-3 g-2">
              {/* ผ่าน (แสดงเป็นเปอร์เซ็นต์) */}
              <div className="col-6">
                <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                  <div className="small text-success fw-bold mb-1" style={{ fontSize: isFinalStage ? '0.75rem' : '0.82rem' }}>
                    <i className={`bi ${isFinalStage ? 'bi-trophy-fill' : 'bi-check-circle'} me-1`}></i>
                    {isFinalStage ? 'ผ่าน (ได้งานจริง)' : 'ผ่าน'}
                  </div>
                  <div>
                    <h4 className="fw-bold text-success mb-0" style={{ fontSize: '1.45rem' }}>
                      {passPercent}%
                    </h4>
                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {passCount} คน
                    </div>
                  </div>
                </div>
              </div>

              {/* ไม่ผ่าน (แสดงเป็นเปอร์เซ็นต์) */}
              <div className="col-6">
                <div className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#ffebee', border: '1px solid #ffcdd2' }}>
                  <div className="small text-danger fw-bold mb-1" style={{ fontSize: isFinalStage ? '0.75rem' : '0.82rem' }}>
                    <i className="bi bi-x-circle me-1"></i>
                    {isFinalStage ? 'ไม่ผ่าน (ทุกประเภทสอบ)' : 'ไม่ผ่าน'}
                  </div>
                  <div>
                    <h4 className="fw-bold text-danger mb-0" style={{ fontSize: '1.45rem' }}>
                      {failPercent}%
                    </h4>
                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {failCount} คน
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* แถบ Progress Bar สัดส่วน ผ่าน vs ไม่ผ่าน (จากคนที่ได้รับการประเมินแล้ว) */}
            <div className="progress mt-2 bg-light shadow-none" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              {evaluatedTotal > 0 ? (
                <>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${passPercent}%` }}
                    title={`ผ่าน ${passPercent}% (${passCount} คน)`}
                  ></div>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={{ width: `${failPercent}%` }}
                    title={`ไม่ผ่าน ${failPercent}% (${failCount} คน)`}
                  ></div>
                </>
              ) : (
                <div
                  className="progress-bar bg-secondary bg-opacity-25"
                  role="progressbar"
                  style={{ width: '100%' }}
                  title="ยังไม่มีผู้ได้รับการประเมินผล"
                ></div>
              )}
            </div>

            {/* แสดงจำนวนผู้ที่รอผล/อยู่ระหว่างขั้นตอน */}
            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top small text-muted" style={{ fontSize: '0.78rem' }}>
              <span>{isFinalStage ? 'อยู่ระหว่างการคัดเลือก / รอผล:' : 'รอการประเมิน / รอสอบ:'}</span>
              <span className="fw-bold text-dark">{waitingCount} คน</span>
            </div>

          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container-fluid py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
        <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
        <h5 className="text-muted fw-normal">กำลังโหลดข้อมูลสถิติรายงาน...</h5>
      </div>
    );
  }

  if (!currentStats) {
    return (
      <div className="container-fluid py-5 text-center" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
        <div className="py-5 fs-5 text-danger">ไม่พบข้อมูลรายงานตำแหน่งนี้</div>
        <Link to="/reports" className="btn btn-outline-secondary mt-3">กลับหน้ารายการรายงาน</Link>
      </div>
    );
  }

  const isAll = id === 'all' || !id;

  // สร้างรายการขั้นตอนการประเมินที่มีการจัดสอบจริงในตำแหน่งนี้ตามลำดับที่กำหนดไว้จริง
  let evaluationStages = [];
  if (currentStats.stages && Array.isArray(currentStats.stages) && currentStats.stages.length > 0) {
    evaluationStages = currentStats.stages;
  } else {
    // Fallback หากไม่มี stages
    if (currentStats.preliminary && currentStats.preliminary.hasExam !== false) {
      evaluationStages.push({
        key: 'preliminary',
        name: 'การคัดเลือกคุณสมบัติเบื้องต้น',
        pass: currentStats.preliminary.pass,
        fail: currentStats.preliminary.fail,
        waiting: currentStats.preliminary.waiting ?? currentStats.preliminary.pending ?? 0,
        icon: 'bi-person-vcard'
      });
    }
    if (currentStats.writtenExam && currentStats.writtenExam.hasExam) {
      evaluationStages.push({
        key: 'writtenExam',
        name: 'การทดสอบข้อเขียน',
        pass: currentStats.writtenExam.pass,
        fail: currentStats.writtenExam.fail,
        waiting: currentStats.writtenExam.waiting ?? 0,
        icon: 'bi-pencil-square'
      });
    }
    if (currentStats.interview && currentStats.interview.hasExam) {
      evaluationStages.push({
        key: 'interview',
        name: 'การสอบสัมภาษณ์',
        pass: currentStats.interview.pass,
        fail: currentStats.interview.fail,
        waiting: currentStats.interview.waiting ?? 0,
        icon: 'bi-mic'
      });
    }
    if (currentStats.teachingDemo && currentStats.teachingDemo.hasExam) {
      evaluationStages.push({
        key: 'teachingDemo',
        name: 'การทดสอบสาธิตการสอน',
        pass: currentStats.teachingDemo.pass,
        fail: currentStats.teachingDemo.fail,
        waiting: currentStats.teachingDemo.waiting ?? 0,
        icon: 'bi-easel'
      });
    }
    if (currentStats.psychology && currentStats.psychology.hasExam) {
      evaluationStages.push({
        key: 'psychology',
        name: 'การทดสอบจิตวิทยา',
        pass: currentStats.psychology.pass,
        fail: currentStats.psychology.fail,
        waiting: currentStats.psychology.waiting ?? 0,
        icon: 'bi-clipboard-heart'
      });
    }
    if (currentStats.finalSelection && currentStats.finalSelection.hasExam !== false) {
      evaluationStages.push({
        key: 'finalSelection',
        name: 'สรุปผลการคัดเลือก (ได้งาน)',
        pass: currentStats.finalSelection.pass,
        fail: currentStats.finalSelection.fail,
        waiting: currentStats.finalSelection.waiting ?? 0,
        icon: 'bi-award-fill'
      });
    }
  }

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '1100px' }}>

        {/* ส่วนหัวหน้าจอ */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <Link to="/reports" className="btn btn-outline-secondary btn-sm rounded-circle px-2 shadow-sm" style={{ border: 'none', background: '#fff', color: '#333' }}>
              <i className="bi bi-arrow-left fs-5"></i>
            </Link>
            <div>
              <h2 className="fw-bold mb-0" style={{ color: '#006664' }}>
                <i className="bi bi-bar-chart-fill me-2"></i>สถิติรายงานสรุปผลการรับสมัคร
              </h2>
              <p className="text-muted small mb-0">
                {isAll ? 'ภาพรวมสถิติการรับสมัครบุคลากรทุกตำแหน่งในระบบ' : `รายละเอียดสถิติของตำแหน่ง ${currentStats.title}`}
              </p>
            </div>
          </div>
          <Link to="/reports" className="btn btn-outline-secondary btn-sm px-3 shadow-sm rounded-3">
            <i className="bi bi-list-ul me-1"></i>กลับหน้ารายการ
          </Link>
        </div>

        {/* การ์ดแบนเนอร์แสดงยอดผู้สมัครและข้อมูลตำแหน่งครบถ้วน */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #006664 0%, #03A96B 100%)' }}>
          <div className="card-body p-4 p-md-5 text-white position-relative">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {isAll ? (
                    <span className="badge bg-white bg-opacity-25 text-white px-3 py-1 rounded-pill">
                      <i className="bi bi-pie-chart-fill me-1"></i>รายงานภาพรวมทั้งระบบ
                    </span>
                  ) : (
                    <>
                      {currentStats.facultyName && (
                        <span className="badge bg-white bg-opacity-25 text-white px-3 py-1 rounded-pill">
                          <i className="bi bi-building me-1"></i>คณะ: {currentStats.facultyName}
                        </span>
                      )}
                      {currentStats.departmentName && (
                        <span className="badge bg-white bg-opacity-25 text-white px-3 py-1 rounded-pill">
                          <i className="bi bi-diagram-3 me-1"></i>ภาควิชา/หน่วยงาน: {currentStats.departmentName}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <h2 className="fw-bold mb-1 text-white">
                  <span className="fs-6 opacity-75 fw-normal d-block mb-1">
                    <i className="bi bi-briefcase me-1"></i>ตำแหน่งที่เปิดรับสมัคร
                  </span>
                  {currentStats.title}
                </h2>
              </div>
              <span className={`badge rounded-pill px-3 py-2 fs-6 shadow-sm ${currentStats.status === 'กำลังเปิดรับสมัคร' ? 'bg-warning text-dark fw-bold' : 'bg-dark text-white border border-light border-opacity-25'}`}>
                {currentStats.status}
              </span>
            </div>

            <div className="row g-4 mt-2 pt-3 border-top border-white border-opacity-25 align-items-center">
              <div className="col-6 col-md-3 text-center text-md-start">
                <span className="text-white-50 small d-block">
                  จำนวนผู้สมัคร ({chartMode === 'monthly' ? 'เดือนนี้' : 'ปีนี้'})
                </span>
                <h1 className="display-5 fw-bold mb-0 text-white">
                  {currentStats.totalApplicants} <span className="fs-6 fw-normal opacity-75">คน</span>
                </h1>
                {currentStats.totalApplicantsAllTime !== undefined && (
                  <span className="badge bg-white bg-opacity-20 text-white small mt-1" style={{ fontSize: '0.75rem' }}>
                    ทั้งหมดในระบบ: {currentStats.totalApplicantsAllTime} คน
                  </span>
                )}
              </div>

              <div className="col-6 col-md-3 text-center">
                <span className="text-white-50 small d-block">
                  รอตรวจสอบเบื้องต้น (คณะ/หน่วยงาน)
                </span>
                <h3 className="fw-bold mb-0 text-white mt-1">
                  {currentStats.pendingFacultyReview ?? currentStats.pendingApplicants ?? 0} <span className="fs-6 fw-normal opacity-75">คน</span>
                </h3>
                <span className="badge bg-white bg-opacity-20 text-white small mt-1" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-hourglass-split me-1 text-warning"></i>รอคณะตรวจคุณสมบัติ
                </span>
              </div>

              <div className="col-6 col-md-3 text-center">
                <span className="text-white-50 small d-block">
                  รอจัดสอบโดยหน่วยทรัพยากรมนุษย์และสวัสดิการ
                </span>
                <h3 className="fw-bold mb-0 text-white mt-1">
                  {currentStats.waitingExamHr ?? 0} <span className="fs-6 fw-normal opacity-75">คน</span>
                </h3>
                <span className="badge bg-white bg-opacity-20 text-white small mt-1" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-calendar-check me-1 text-info"></i>ผ่านเบื้องต้น รอจัดสอบ
                </span>
              </div>

              {!isAll ? (
                <div className="col-6 col-md-3 text-center text-md-end">
                  <span className="text-white-50 small d-block">
                    อัตราที่เปิดรับ: <strong className="text-white">{currentStats.totalPosition || 1} อัตรา</strong>
                  </span>
                  <div className="text-white-50 small mt-1" style={{ fontSize: '0.78rem' }}>
                    <i className="bi bi-calendar-range me-1"></i>{currentStats.dateRange || 'ยังไม่กำหนดช่วงเวลา'}
                  </div>
                </div>
              ) : (
                <div className="col-6 col-md-3 text-center text-md-end">
                  <span className="text-white-50 small d-block">จำนวนตำแหน่งงานทั้งหมด</span>
                  <h3 className="fw-bold mb-0 text-white mt-1">
                    {currentStats.totalJobs || '-'} <span className="fs-6 fw-normal opacity-75">ตำแหน่ง</span>
                  </h3>
                  <span className="badge bg-white bg-opacity-20 text-white small mt-1" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-briefcase me-1"></i>รวมทุกประกาศในระบบ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* กราฟแสดงสถิติผู้สมัคร: รายเดือน (ใน 1 เดือน) และ รายปี (12 เดือน) */}
        <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '14px' }}>
          <div className="card-header bg-white py-3 border-bottom-0">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: '38px', height: '38px' }}>
                  <i className={`bi ${chartMode === 'monthly' ? 'bi-calendar-month' : 'bi-calendar3'} fs-5`}></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">
                    {chartMode === 'monthly'
                      ? `สถิติแนวโน้มผู้สมัครรายเดือน (ใน 1 เดือน: ${currentStats.selectedMonthName} พ.ศ. ${currentStats.selectedYearBE})`
                      : `สถิติแนวโน้มผู้สมัครรายปี (12 เดือน: ประจำปี พ.ศ. ${currentStats.selectedYearBE})`}
                  </h6>
                  <span className="text-muted small">
                    {chartMode === 'monthly' ? 'แสดงจำนวนผู้สมัครแยกตามวัน ภายในเดือนที่เลือก' : 'แสดงจำนวนผู้สมัครทั้ง 12 เดือน (ม.ค. - ธ.ค.) ในปีที่เลือก'}
                  </span>
                </div>
              </div>

              {/* ปุ่มสลับโหมด เดือน (ใน 1 เดือน) / ปี (12 เดือน) */}
              <div className="btn-group shadow-sm p-1 bg-light rounded-pill" role="group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-bold ${chartMode === 'monthly' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted border-0'}`}
                  onClick={() => handleModeChange('monthly')}
                >
                  <i className="bi bi-calendar-month me-1"></i>รายเดือน (ใน 1 เดือน)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 fw-bold ${chartMode === 'yearly' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted border-0'}`}
                  onClick={() => handleModeChange('yearly')}
                >
                  <i className="bi bi-calendar3 me-1"></i>รายปี (12 เดือน)
                </button>
              </div>
            </div>

            {/* แถบตัวกรองและสรุปยอด */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top">
              <div className="d-flex align-items-center flex-wrap gap-3">
                {chartMode === 'monthly' && (
                  <div className="d-flex align-items-center">
                    <label className="small text-muted fw-bold me-2 text-nowrap">
                      <i className="bi bi-calendar2-event me-1"></i>เลือกเดือน:
                    </label>
                    <select
                      className="form-select form-select-sm shadow-none"
                      style={{ borderRadius: '8px', minWidth: '130px', borderColor: '#03A96B' }}
                      value={selectedMonth || currentStats.selectedMonth || ''}
                      onChange={(e) => handleMonthChange(e.target.value)}
                    >
                      {thaiMonthsList.map(m => (
                        <option key={m.num} value={m.num}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="d-flex align-items-center">
                  <label className="small text-muted fw-bold me-2 text-nowrap">
                    <i className="bi bi-calendar3 me-1"></i>เลือกปี:
                  </label>
                  <select
                    className="form-select form-select-sm shadow-none"
                    style={{ borderRadius: '8px', minWidth: '130px' }}
                    value={selectedYear || currentStats.selectedYear || ''}
                    onChange={(e) => handleYearChange(e.target.value)}
                  >
                    {(currentStats.availableYears || []).map(y => (
                      <option key={y.ceYear} value={y.ceYear}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                {chartMode === 'monthly' ? (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fs-6 fw-bold">
                    <i className="bi bi-person-check-fill me-1"></i>ยอดผู้สมัครในเดือนนี้: {currentStats.monthlyTotal || 0} คน
                  </span>
                ) : (
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fs-6 fw-bold">
                    <i className="bi bi-people-fill me-1"></i>ยอดผู้สมัครทั้งปี 12 เดือน: {currentStats.yearlyTotal || 0} คน
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="card-body p-4 pt-2 position-relative">
            {chartLoading && (
              <div className="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center z-1" style={{ borderRadius: '14px' }}>
                <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
                <span className="small text-muted">กำลังโหลดข้อมูล...</span>
              </div>
            )}

            {chartMode === 'monthly' ? (
              <div style={{ width: '100%', height: 290 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={currentStats.monthlyDailyApplicants || []}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6c757d', fontSize: 12 }}
                      dy={10}
                      interval={0}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 13 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip mode="monthly" />} cursor={{ fill: '#f4f7f6' }} />
                    <Bar dataKey="applicants" fill="#03A96B" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ width: '100%', height: 290 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={currentStats.yearlyApplicants || []}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6c757d', fontSize: 13 }}
                      dy={10}
                      interval={0}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6c757d', fontSize: 13 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip mode="yearly" />} cursor={{ fill: '#f4f7f6' }} />
                    <Bar dataKey="applicants" fill="#006664" radius={[6, 6, 0, 0]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* สถิติขั้นตอนการคัดเลือกที่มีจริงในตำแหน่งนี้ */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-0">
              <i className="bi bi-clipboard-data-fill text-success me-2"></i>สรุปผลการประเมินแยกตามขั้นตอน
            </h5>
            <span className="text-muted small">
              {chartMode === 'monthly'
                ? `สรุปผลการประเมินของผู้สมัคร ประจำเดือน${currentStats?.selectedMonthName || ''} พ.ศ. ${currentStats?.selectedYearBE || ''} (อิงตามเดือนที่เลือก)`
                : `สรุปผลการประเมินของผู้สมัคร ประจำปี พ.ศ. ${currentStats?.selectedYearBE || ''} (อิงตามปี 12 เดือนที่เลือก)`}
              {' '}
              <span className="text-success fw-medium">
                (คิดสัดส่วน % จากผู้ที่ได้รับการประเมินผลแล้ว)
              </span>
            </span>
          </div>
          <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small shadow-sm">
            <i className={`bi ${chartMode === 'monthly' ? 'bi-calendar2-month text-success' : 'bi-calendar3 text-primary'} me-1`}></i>
            {chartMode === 'monthly'
              ? `อิงตามเดือน: ${currentStats?.selectedMonthName || ''} ${currentStats?.selectedYearBE || ''}`
              : `อิงตามปี: พ.ศ. ${currentStats?.selectedYearBE || ''}`}
          </span>
        </div>

        <div className="row g-4 mb-5">
          {evaluationStages.map((stage, idx) => (
            <div key={stage.key || idx} className={evaluationStages.length <= 2 ? "col-md-6" : (evaluationStages.length === 4 ? "col-md-6 col-lg-3" : "col-md-4")}>
              <StatCard
                title={`${idx + 1}. ${stage.name}`}
                data={stage.data || stage}
                icon={stage.icon}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}