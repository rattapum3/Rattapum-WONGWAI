import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function RequestJob() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");

  const [submitType, setSubmitType] = useState("Pending");
  const submitTypeRef = useRef("Pending");
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const isHr = currentUser.role === 'หน่วยทรัพยากรมนุษย์และสวัสดิการ';
  const isFaculty = !isHr;

  const [options, setOptions] = useState({ positions: [], departments: [], faculties: [] });
  const [jobCategory, setJobCategory] = useState("");

  const [formData, setFormData] = useState({
    positionId: "",
    departmentId: "",
    amount: 1
  });

  const [selectedFaculty, setSelectedFaculty] = useState(currentUser.dept || "");

  const [customPosition, setCustomPosition] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");

  const [minEducation, setMinEducation] = useState("");
  const [selectedMajors, setSelectedMajors] = useState([]);

  const [customDegree, setCustomDegree] = useState("");
  const [isCustomMajor, setIsCustomMajor] = useState(false);
  const [customMajor, setCustomMajor] = useState("");

  // ความรู้ความสามารถพิเศษ หรือทักษะเฉพาะตำแหน่ง
  const [otherAbilities, setOtherAbilities] = useState([""]);

  const handleAbilityChange = (index, val) => {
    const list = [...otherAbilities];
    list[index] = sanitizeText(val, 255);
    setOtherAbilities(list);
  };
  const addAbility = () => setOtherAbilities(prev => [...prev, ""]);
  const removeAbility = (index) => {
    setOtherAbilities(prev => {
      if (prev.length > 1) return prev.filter((_, i) => i !== index);
      return [""];
    });
  };

  // ข้อความแจ้งเตือน Banner
  const [notification, setNotification] = useState(null);

  // State ตรวจสอบข้อผิดพลาดรายฟิลด์ (Validation Errors)
  const [formErrors, setFormErrors] = useState({
    jobCategory: '',
    position: '',
    faculty: '',
    department: '',
    amount: '',
    education: '',
    majors: ''
  });

  const [touchedFields, setTouchedFields] = useState({});

  const showNotification = (message, type = 'danger') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const academicDegrees = ["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"];
  const supportDegrees = [
    "มัธยมศึกษาตอนปลาย (ม.6)",
    "ประกาศนียบัตรวิชาชีพ (ปวช.)",
    "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
    "อนุปริญญา",
    "ปริญญาตรี",
    "ปริญญาโท",
    "ปริญญาเอก"
  ];
  const standardMajors = [
    "วิทยาการคอมพิวเตอร์",
    "เทคโนโลยีสารสนเทศ",
    "วิศวกรรมคอมพิวเตอร์",
    "ภาษาอังกฤษ",
    "บริหารธุรกิจ",
    "การจัดการทั่วไป",
    "รัฐศาสตร์ / รัฐประศาสนศาสตร์",
    "ไม่จำกัดสาขาวิชาเอก"
  ];

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/request-job/options');
        const result = await response.json();
        if (result.success) {
          const facultiesList = result.faculties || [];
          setOptions({
            positions: result.positions || [],
            departments: result.departments || [],
            faculties: facultiesList
          });

          // ถ้ามี currentUser.dept และเป็นคณะ ให้เลือกและล็อกตามสังกัดของตนเอง
          if (currentUser.dept && !editId) {
            setSelectedFaculty(currentUser.dept);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching options:', error);
      }
    };

    const fetchDraft = async () => {
      if (!editId) return;
      try {
        const response = await fetch(`http://localhost:3000/api/request-job/${editId}`);
        const result = await response.json();
        if (result.success) {
          const data = result.data;
          const status = data.status || '';
          setRequestStatus(status);
          const isDraft = status === 'RequestDraft' || status === 'Draft';
          if (!isDraft) {
            setIsReadOnly(true);
          }
          setJobCategory(data.jobCategory || "");
          setFormData({
            positionId: data.positionId || "",
            departmentId: data.departmentId || "",
            amount: data.amount || 1
          });

          const fetchedFaculty = data.facultyName || data.faculty || "";
          if (fetchedFaculty) {
            setSelectedFaculty(fetchedFaculty);
          }

          const standardDegreesList = [...academicDegrees, ...supportDegrees];
          const fetchedEduStr = data.minEducation || (Array.isArray(data.education) ? data.education[0] : (data.education || ""));

          if (standardDegreesList.includes(fetchedEduStr)) {
            setMinEducation(fetchedEduStr);
          } else if (fetchedEduStr) {
            setMinEducation("other");
            setCustomDegree(fetchedEduStr);
          }

          const fetchedMajors = data.majors || (data.major ? data.major.split(/,\s*/) : []);
          const matchedMajors = fetchedMajors.filter(m => standardMajors.includes(m));
          const unmatchedMajors = fetchedMajors.filter(m => !standardMajors.includes(m));

          setSelectedMajors(matchedMajors);
          if (unmatchedMajors.length > 0) {
            setIsCustomMajor(true);
            setCustomMajor(unmatchedMajors.join(', '));
          }

          if (data.otherAbilities && Array.isArray(data.otherAbilities) && data.otherAbilities.length > 0) {
            setOtherAbilities(data.otherAbilities);
          } else if (data.additionalSkills && typeof data.additionalSkills === 'string') {
            setOtherAbilities(data.additionalSkills.split(/,\s*/).filter(Boolean));
          }
        }
      } catch (error) {
        console.error('Error fetching draft:', error);
      }
    };

    fetchOptions().then(fetchDraft);
  }, [editId]);

  // ==========================================
  // 🛡️ Helper Sanitization & Real-time Validation
  // ==========================================
  const sanitizeText = (val, maxLength = 100) => {
    // ตัดอักขระพิเศษอันตรายออก อนุญาตภาษาไทย อังกฤษ ตัวเลข ช่องว่าง ขีด วงเล็บ ทับ
    return String(val || '').replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s\.\(\)\/\-\_]/g, '').slice(0, maxLength);
  };

  const sanitizeMajorText = (val, maxLength = 200) => {
    // สำหรับสาขาวิชาเอก: อนุญาตจุลภาค (,) ด้วยเพื่อคั่นหลายสาขา
    return String(val || '').replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s\.\(\)\/\-\_\,]/g, '').slice(0, maxLength);
  };

  const validateAll = () => {
    const errors = {};
    const touched = {
      jobCategory: true,
      position: true,
      faculty: true,
      department: true,
      amount: true,
      education: true,
      majors: true
    };

    // 1. สายงาน
    if (!jobCategory) {
      errors.jobCategory = 'กรุณาเลือกสายปฏิบัติงาน (สายวิชาการ หรือ สายสนับสนุน)';
    }

    // 2. ตำแหน่ง
    if (!formData.positionId) {
      errors.position = 'กรุณาเลือกตำแหน่งที่ต้องการรับสมัคร';
    } else if (formData.positionId === "other") {
      if (!customPosition.trim()) {
        errors.position = 'กรุณาระบุชื่อตำแหน่งที่ต้องการเพิ่มเติม';
      } else if (customPosition.trim().length < 2) {
        errors.position = `ชื่อตำแหน่งต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${customPosition.trim().length} ตัวอักษร)`;
      }
    }

    // 2.1 คณะ / สังกัด
    const activeFaculty = (isFaculty && currentUser.dept) ? currentUser.dept : selectedFaculty;
    if (!activeFaculty) {
      errors.faculty = 'กรุณาเลือกคณะ/หน่วยงานต้นสังกัด';
    }

    // 3. ภาควิชา
    if (!formData.departmentId) {
      errors.department = 'กรุณาเลือกภาควิชา/หน่วยงาน';
    } else if (formData.departmentId === "other") {
      if (!customDepartment.trim()) {
        errors.department = 'กรุณาระบุชื่อภาควิชาหรือหน่วยงานย่อยเพิ่มเติม';
      } else if (customDepartment.trim().length < 2) {
        errors.department = `ชื่อภาควิชา/หน่วยงานต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${customDepartment.trim().length} ตัวอักษร)`;
      }
    }

    // 4. จำนวนอัตรา
    const num = parseInt(formData.amount, 10);
    if (isNaN(num) || num < 1) {
      errors.amount = 'จำนวนอัตราที่รับต้องไม่ต่ำกว่า 1 อัตรา';
    } else if (num > 999) {
      errors.amount = 'จำนวนอัตราที่รับต้องไม่เกิน 999 อัตรา';
    }

    // 5. วุฒิการศึกษา
    const finalMinEdu = minEducation === "other" ? customDegree.trim() : minEducation;
    if (!finalMinEdu) {
      errors.education = 'กรุณาเลือกหรือระบุวุฒิการศึกษาขั้นต่ำที่ต้องการรับสมัคร';
    } else if (minEducation === "other" && customDegree.trim().length < 2) {
      errors.education = `วุฒิการศึกษาต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${customDegree.trim().length} ตัวอักษร)`;
    }

    // 6. สาขาวิชาเอก
    let totalMajorsCount = selectedMajors.length;
    if (isCustomMajor && customMajor.trim()) {
      const customList = customMajor.split(/,\s*/).map(m => m.trim()).filter(Boolean);
      totalMajorsCount += customList.length;
    }

    if (totalMajorsCount === 0) {
      errors.majors = 'กรุณาเลือกหรือระบุสาขาวิชาเอกที่ต้องการอย่างน้อย 1 สาขา';
    } else if (isCustomMajor && !customMajor.trim()) {
      errors.majors = 'กรุณาระบุชื่อสาขาวิชาเอกเพิ่มเติมในช่องที่กำหนด';
    }

    setTouchedFields(touched);
    setFormErrors(errors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const scrollToFirstError = (errors) => {
    const errorFieldMap = {
      jobCategory: 'field-jobCategory',
      position: 'field-position',
      faculty: 'field-faculty',
      department: 'field-department',
      amount: 'field-amount',
      education: 'field-education',
      majors: 'field-majors'
    };

    for (const key of Object.keys(errorFieldMap)) {
      if (errors[key]) {
        const el = document.getElementById(errorFieldMap[key]);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus({ preventScroll: true });
          return;
        }
      }
    }
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setJobCategory(val);
    setFormData(prev => ({ ...prev, positionId: "" }));
    setCustomPosition("");
    setMinEducation("");
    setCustomDegree("");
    setTouchedFields(prev => ({ ...prev, jobCategory: true, position: false, education: false }));
    setFormErrors(prev => ({ ...prev, jobCategory: '', position: '', education: '' }));
  };

  const handleMajorChange = (majorItem) => {
    let nextMajors = [];
    if (selectedMajors.includes(majorItem)) {
      nextMajors = selectedMajors.filter(m => m !== majorItem);
    } else {
      if (majorItem === "ไม่จำกัดสาขาวิชาเอก") {
        nextMajors = ["ไม่จำกัดสาขาวิชาเอก"];
        setIsCustomMajor(false);
        setCustomMajor("");
      } else {
        nextMajors = [...selectedMajors.filter(m => m !== "ไม่จำกัดสาขาวิชาเอก"), majorItem];
      }
    }
    setSelectedMajors(nextMajors);
    setTouchedFields(prev => ({ ...prev, majors: true }));
    setFormErrors(prev => ({
      ...prev,
      majors: (nextMajors.length === 0 && (!isCustomMajor || !customMajor.trim()))
        ? 'กรุณาเลือกหรือระบุสาขาวิชาเอกที่ต้องการอย่างน้อย 1 สาขา'
        : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isReadOnly) {
      showNotification("คำขอนี้ส่งไปยังหน่วยทรัพยากรมนุษย์แล้ว จึงไม่สามารถแก้ไขได้", "warning");
      return;
    }

    // ตรวจสอบความถูกต้องของทุกช่อง
    const validation = validateAll();
    if (!validation.isValid) {
      showNotification("กรุณาตรวจสอบและแก้ไขข้อมูลในช่องที่มีข้อความแจ้งเตือนสีแดงให้ถูกต้องครบถ้วน", "danger");
      scrollToFirstError(validation.errors);
      return;
    }

    const finalMinEdu = minEducation === "other" ? customDegree.trim() : minEducation;

    let finalMajors = [...selectedMajors];
    if (isCustomMajor && customMajor.trim() !== "") {
      const customList = customMajor.split(/,\s*/).map(m => m.trim()).filter(Boolean);
      finalMajors.push(...customList);
    }

    setIsSaving(true);

    const finalPosition = formData.positionId === "other" ? `NEW:${customPosition.trim()}` : formData.positionId;
    const finalDepartment = formData.departmentId === "other" ? `NEW:${customDepartment.trim()}` : formData.departmentId;

    const finalFaculty = (isFaculty && currentUser.dept) ? currentUser.dept : selectedFaculty;
    const cleanAbilities = otherAbilities.map(a => a.trim()).filter(Boolean);

    const requestData = {
      positionId: finalPosition,
      departmentId: finalDepartment,
      amount: parseInt(formData.amount, 10),
      education: finalMinEdu,
      major: finalMajors,
      otherAbilities: cleanAbilities,
      jobCategory: jobCategory,
      facultyName: finalFaculty,
      status: submitTypeRef.current
    };

    try {
      const url = editId ? `http://localhost:3000/api/request-job/${editId}` : 'http://localhost:3000/api/request-job';
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
      } else {
        showNotification(result.message || "เกิดข้อผิดพลาดในการส่งคำขอ", "danger");
      }
    } catch (error) {
      console.error("Save Error:", error);
      showNotification("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setJobCategory("");
    setFormData({ positionId: "", departmentId: "", amount: 1 });
    setSelectedFaculty((isFaculty && currentUser.dept) ? currentUser.dept : "");
    setCustomPosition("");
    setCustomDepartment("");
    setMinEducation("");
    setCustomDegree("");
    setSelectedMajors([]);
    setIsCustomMajor(false);
    setCustomMajor("");
    setOtherAbilities([""]);
    setSubmitType("Pending");
    setFormErrors({
      jobCategory: '', position: '', faculty: '', department: '', amount: '', education: '', majors: ''
    });
    setTouchedFields({});
    setNotification(null);
  };

  const activeFacultyName = (isFaculty && currentUser.dept) ? currentUser.dept : selectedFaculty;
  const filteredDepartments = options.departments.filter(dept => {
    if (!activeFacultyName) return true;
    if (!dept.facultyName) return false;
    const dbFaculty = dept.facultyName.trim();
    const userFaculty = activeFacultyName.trim();
    return dbFaculty === userFaculty || dbFaculty.includes(userFaculty) || userFaculty.includes(dbFaculty);
  });

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '960px' }}>

        <div className="mb-4">
          <h2 className="mb-1 fw-bold" style={{ color: '#006664' }}>
            <i className="bi bi-file-earmark-plus-fill me-2" style={{ color: '#03A96B' }}></i>แจ้งความจำนงขอเปิดรับสมัครบุคลากร
          </h2>
          <p className="text-muted fs-6">
            สำหรับคณะ/หน่วยงาน แจ้งความต้องการไปยังฝ่ายทรัพยากรมนุษย์ เพื่อร่างประกาศรับสมัคร
          </p>
        </div>

        {/* Banner แจ้งเตือนข้อผิดพลาดหรือผลการทำงาน */}
        {notification && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm d-flex align-items-center mb-4`} role="alert" style={{ borderRadius: '12px' }}>
            <i className={`bi ${notification.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5 me-2`}></i>
            <div className="flex-grow-1 fw-medium">{notification.message}</div>
            <button type="button" className="btn-close" onClick={() => setNotification(null)} aria-label="Close"></button>
          </div>
        )}

        {/* Banner เมื่อดูคำขอที่ส่งแล้ว (โหมดอ่านอย่างเดียว ไม่สามารถแก้ไขได้) */}
        {isReadOnly && !isSubmitted && (
          <div className="alert alert-secondary border shadow-sm d-flex align-items-center mb-4 p-3" style={{ borderRadius: '12px' }}>
            <i className="bi bi-lock-fill fs-3 text-secondary me-3"></i>
            <div className="flex-grow-1">
              <div className="fw-bold text-dark d-flex align-items-center gap-2 flex-wrap">
                <span>โหมดดูรายละเอียด: คำขอนี้ส่งไปยังหน่วยทรัพยากรมนุษย์แล้ว</span>
                <span className="badge bg-secondary">
                  {requestStatus === 'Processed' || requestStatus === 'รับเรื่องแล้ว' ? 'รับเรื่องแล้ว' : 'รอรับเรื่อง (ส่งแล้ว)'}
                </span>
              </div>
              <div className="small text-muted mt-1">
                <i className="bi bi-info-circle me-1"></i>การส่งคำร้องของทางคณะ/หน่วยงาน เมื่อส่งแล้วจะไม่สามารถแก้ไขได้ จะแก้ไขได้ก็ต่อเมื่อบันทึกเป็นแบบร่าง (Draft) ไว้เท่านั้น
              </div>
            </div>
            <Link to="/my-requests" className="btn btn-sm btn-outline-secondary px-3 ms-2 text-nowrap">
              <i className="bi bi-arrow-left me-1"></i>กลับหน้ารายการ
            </Link>
          </div>
        )}

        {isSubmitted ? (
          <div className="card border-0 shadow-sm text-center py-5 animate__animated animate__fadeIn" style={{ borderRadius: '16px' }}>
            <div className="card-body">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4.5rem' }}></i>
              <h3 className="mt-3 fw-bold text-dark">
                {(submitTypeRef.current === "RequestDraft" || submitTypeRef.current === "Draft") ? "บันทึกแบบร่างสำเร็จ" : "ส่งคำขอสำเร็จ"}
              </h3>
              <p className="text-muted fs-5 mb-4">
                {(submitTypeRef.current === "RequestDraft" || submitTypeRef.current === "Draft") ? (
                  <>
                    ข้อมูลคำขอเปิดรับสมัครของคุณถูกบันทึกเป็นแบบร่างเรียบร้อยแล้ว<br />
                    สถานะปัจจุบัน: <span className="badge bg-secondary mt-2 fs-6">แบบร่าง</span>
                  </>
                ) : (
                  <>
                    คำขอเปิดรับสมัครของคุณถูกส่งไปยัง <strong>หน่วยทรัพยากรมนุษย์และสวัสดิการ</strong> เรียบร้อยแล้ว<br />
                    สถานะปัจจุบัน: <span className="badge bg-warning text-dark mt-2 fs-6">รอรับเรื่อง</span>
                  </>
                )}
              </p>
              <button className="btn px-4 py-2 fw-bold text-white shadow-sm" style={{ backgroundColor: '#006664', borderRadius: '10px' }} onClick={handleReset}>
                <i className="bi bi-plus-circle me-2"></i>สร้างคำขอใหม่
              </button>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm border-0 animate__animated animate__fadeIn" style={{ borderTop: '4px solid #006664', borderRadius: '16px', overflow: 'hidden' }}>
            <div className="card-body p-4 p-md-5 bg-white">
              <form onSubmit={handleSubmit} noValidate>

                {/* ส่วนที่ 1: ข้อมูลตำแหน่งและสังกัด */}
                <h5 className="fw-bold text-dark mb-4 border-bottom pb-2 d-flex align-items-center" style={{ color: '#006664' }}>
                  <i className="bi bi-briefcase-fill me-2" style={{ color: '#03A96B' }}></i>
                  1. ข้อมูลตำแหน่งและสังกัด
                </h5>

                <div className="row g-4 mb-5">

                  {/* 1.1 สายปฏิบัติงาน */}
                  <div className="col-md-12 mb-2" id="field-jobCategory">
                    <label className="form-label fw-bold fs-6">สายปฏิบัติงาน <span className="text-danger">*</span></label>
                    <div className={`d-flex gap-4 p-3 bg-light rounded border ${formErrors.jobCategory && touchedFields.jobCategory ? 'border-danger' : ''}`}>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="jobCategory" id="catAcademic" value="สายวิชาการ" checked={jobCategory === "สายวิชาการ"} disabled={isReadOnly} onChange={handleCategoryChange} />
                        <label className="form-check-label fw-medium text-primary" htmlFor="catAcademic" style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                          <i className="bi bi-mortarboard me-1"></i>สายวิชาการ (อาจารย์ / คณาจารย์ประจำ)
                        </label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="jobCategory" id="catSupport" value="สายสนับสนุน" checked={jobCategory === "สายสนับสนุน"} disabled={isReadOnly} onChange={handleCategoryChange} />
                        <label className="form-check-label fw-medium text-success" htmlFor="catSupport" style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
                          <i className="bi bi-gear-fill me-1"></i>สายสนับสนุน (เจ้าหน้าที่ / บุคลากรสนับสนุน)
                        </label>
                      </div>
                    </div>
                    {formErrors.jobCategory && touchedFields.jobCategory && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.jobCategory}
                      </div>
                    )}
                  </div>

                  {/* 1.2 ตำแหน่งที่ต้องการรับสมัคร */}
                  <div className="col-md-6" id="field-position">
                    <label className="form-label fw-medium">ตำแหน่งที่ต้องการรับสมัคร <span className="text-danger">*</span></label>
                    <select
                      className={`form-select mb-2 ${formErrors.position && touchedFields.position ? 'is-invalid border-danger' : formData.positionId ? 'is-valid border-success' : ''}`}
                      value={formData.positionId}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, positionId: val });
                        setTouchedFields(prev => ({ ...prev, position: true }));
                        if (val !== "other") {
                          setFormErrors(prev => ({ ...prev, position: val ? '' : 'กรุณาเลือกตำแหน่งที่ต้องการรับสมัคร' }));
                        }
                      }}
                    >
                      <option value="">-- เลือกตำแหน่ง --</option>
                      {!jobCategory ? (
                        <option value="" disabled>-- กรุณาเลือกสายงานด้านบนก่อน --</option>
                      ) : (
                        <>
                          {options.positions.filter(pos => pos.type === jobCategory).map(pos => (
                            <option key={pos.id} value={pos.id}>{pos.name}</option>
                          ))}
                          <option value="other" className="fw-bold text-primary">+ อื่นๆ (ระบุตำแหน่งใหม่)</option>
                        </>
                      )}
                    </select>

                    {formData.positionId === "other" && (
                      <div className="mt-1">
                        <input
                          type="text"
                          className={`form-control ${formErrors.position && touchedFields.position ? 'is-invalid border-danger' : customPosition ? 'is-valid border-success' : 'border-primary'}`}
                          placeholder="พิมพ์ชื่อตำแหน่งที่ต้องการ เช่น นักวิชาการคอมพิวเตอร์..."
                          maxLength={100}
                          value={customPosition}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const val = sanitizeText(e.target.value, 100);
                            setCustomPosition(val);
                            setTouchedFields(prev => ({ ...prev, position: true }));
                            setFormErrors(prev => ({
                              ...prev,
                              position: !val.trim()
                                ? 'กรุณาระบุชื่อตำแหน่งที่ต้องการเพิ่มเติม'
                                : val.trim().length < 2
                                  ? `ชื่อตำแหน่งต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${val.trim().length} ตัวอักษร)`
                                  : ''
                            }));
                          }}
                        />
                      </div>
                    )}

                    {formErrors.position && touchedFields.position && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.position}
                      </div>
                    )}
                  </div>

                  {/* 1.3 สังกัดคณะ/หน่วยงาน */}
                  <div className="col-md-6" id="field-faculty">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-medium mb-0">
                        สังกัดคณะ/หน่วยงาน <span className="text-danger">*</span>
                      </label>
                    </div>
                    <select
                      className={`form-select mb-1 ${formErrors.faculty && touchedFields.faculty ? 'is-invalid border-danger' : selectedFaculty ? 'is-valid border-success' : ''}`}
                      value={selectedFaculty}
                      disabled={isReadOnly || (isFaculty && Boolean(currentUser.dept))}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedFaculty(val);
                        setTouchedFields(prev => ({ ...prev, faculty: true }));
                        setFormErrors(prev => ({ ...prev, faculty: val ? '' : 'กรุณาเลือกคณะ/หน่วยงาน' }));
                      }}
                    >
                      <option value="">-- เลือกคณะ / หน่วยงาน --</option>
                      {(options.faculties || []).map(fac => {
                        const fName = fac.Faculty_name || fac.name;
                        return <option key={fac.id || fac.Faculty_id || fName} value={fName}>{fName}</option>;
                      })}
                    </select>

                    {formErrors.faculty && touchedFields.faculty && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.faculty}
                      </div>
                    )}
                  </div>

                  {/* 1.4 ภาควิชา / หน่วยงาน */}
                  <div className="col-md-8" id="field-department">
                    <label className="form-label fw-medium">ภาควิชา / หน่วยงาน <span className="text-danger">*</span></label>
                    <select
                      className={`form-select mb-2 ${formErrors.department && touchedFields.department ? 'is-invalid border-danger' : formData.departmentId ? 'is-valid border-success' : ''}`}
                      value={formData.departmentId}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, departmentId: val });
                        setTouchedFields(prev => ({ ...prev, department: true }));
                        if (val !== "other") {
                          setFormErrors(prev => ({ ...prev, department: val ? '' : 'กรุณาเลือกภาควิชา/หน่วยงาน' }));
                        }
                      }}
                    >
                      <option value="">-- เลือกสังกัดย่อย --</option>
                      {filteredDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                      <option value="other" className="fw-bold text-primary">+ อื่นๆ (ระบุหน่วยงานใหม่)</option>
                    </select>

                    {formData.departmentId === "other" && (
                      <div className="mt-1">
                        <input
                          type="text"
                          className={`form-control ${formErrors.department && touchedFields.department ? 'is-invalid border-danger' : customDepartment ? 'is-valid border-success' : 'border-primary'}`}
                          placeholder="พิมพ์ชื่อภาควิชา หรือ หน่วยงานย่อย..."
                          maxLength={100}
                          value={customDepartment}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const val = sanitizeText(e.target.value, 100);
                            setCustomDepartment(val);
                            setTouchedFields(prev => ({ ...prev, department: true }));
                            setFormErrors(prev => ({
                              ...prev,
                              department: !val.trim()
                                ? 'กรุณาระบุชื่อภาควิชาหรือหน่วยงานย่อยเพิ่มเติม'
                                : val.trim().length < 2
                                  ? `ชื่อภาควิชา/หน่วยงานต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${val.trim().length} ตัวอักษร)`
                                  : ''
                            }));
                          }}
                        />
                      </div>
                    )}

                    {formErrors.department && touchedFields.department && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.department}
                      </div>
                    )}
                  </div>

                  {/* 1.5 จำนวนที่รับ */}
                  <div className="col-md-4" id="field-amount">
                    <label className="form-label fw-medium mb-1">จำนวนที่รับ (อัตรา) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input
                        type="number"
                        className={`form-control ${formErrors.amount && touchedFields.amount ? 'is-invalid border-danger' : formData.amount >= 1 ? 'is-valid border-success' : ''}`}
                        min="1"
                        max="999"
                        placeholder="1"
                        value={formData.amount}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          const num = parseInt(val, 10);
                          setFormData({ ...formData, amount: val });
                          setTouchedFields(prev => ({ ...prev, amount: true }));
                          setFormErrors(prev => ({
                            ...prev,
                            amount: isNaN(num) || num < 1 ? 'จำนวนอัตราที่รับต้องไม่ต่ำกว่า 1 อัตรา' : ''
                          }));
                        }}
                      />
                      <span className="input-group-text bg-light text-muted">อัตรา</span>
                    </div>
                    {formErrors.amount && touchedFields.amount && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.amount}
                      </div>
                    )}
                  </div>
                </div>

                {/* ส่วนที่ 2: คุณสมบัติของผู้สมัคร */}
                <h5 className="fw-bold text-dark mb-4 border-bottom pb-2 d-flex align-items-center" style={{ color: '#006664' }}>
                  <i className="bi bi-mortarboard-fill me-2" style={{ color: '#03A96B' }}></i>
                  2. คุณสมบัติของผู้สมัคร
                </h5>

                <div className="row g-4 mb-4">

                  {/* 2.1 วุฒิการศึกษาขั้นต่ำ */}
                  <div className="col-md-12" id="field-education">
                    <label className="form-label fw-medium d-block mb-2">
                      ระดับวุฒิการศึกษาขั้นต่ำที่รับสมัคร (เลือกเพียง 1 ระดับ) <span className="text-danger">*</span>
                    </label>
                    {!jobCategory ? (
                      <div className="alert alert-secondary py-2 small d-flex align-items-center">
                        <i className="bi bi-info-circle me-2"></i>กรุณาเลือกสายปฏิบัติงานในหัวข้อที่ 1 เพื่อระบุวุฒิการศึกษา
                      </div>
                    ) : (
                      <div className={`d-flex flex-wrap gap-3 p-3 bg-light rounded border align-items-center ${formErrors.education && touchedFields.education ? 'border-danger' : ''}`}>
                        {(jobCategory === "สายวิชาการ" ? academicDegrees : supportDegrees).map((degree, index) => (
                          <div className="form-check form-check-inline m-0" key={index}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="minEducationRadio"
                              id={`degree-${index}`}
                              value={degree}
                              checked={minEducation === degree}
                              disabled={isReadOnly}
                              onChange={() => {
                                setMinEducation(degree);
                                setTouchedFields(prev => ({ ...prev, education: true }));
                                setFormErrors(prev => ({ ...prev, education: '' }));
                              }}
                            />
                            <label className="form-check-label fw-medium" htmlFor={`degree-${index}`} style={{ cursor: 'pointer' }}>{degree}</label>
                          </div>
                        ))}
                        <div className="d-flex align-items-center gap-2">
                          <div className="form-check form-check-inline m-0">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="minEducationRadio"
                              id="degree-other"
                              value="other"
                              checked={minEducation === "other"}
                              disabled={isReadOnly}
                              onChange={() => {
                                setMinEducation("other");
                                setTouchedFields(prev => ({ ...prev, education: true }));
                                setFormErrors(prev => ({
                                  ...prev,
                                  education: !customDegree.trim() ? 'กรุณาระบุวุฒิการศึกษาขั้นต่ำเอง' : ''
                                }));
                              }}
                            />
                            <label className="form-check-label fw-bold text-primary" htmlFor="degree-other" style={{ cursor: 'pointer' }}>+ อื่นๆ (ระบุวุฒิขั้นต่ำเอง)</label>
                          </div>
                          {minEducation === "other" && (
                            <div className="d-flex align-items-center gap-1">
                              <input
                                type="text"
                                className={`form-control form-control-sm ${formErrors.education && touchedFields.education ? 'is-invalid border-danger' : customDegree ? 'is-valid border-success' : 'border-primary'}`}
                                style={{ minWidth: '220px' }}
                                placeholder="พิมพ์วุฒิการศึกษาขั้นต่ำ..."
                                maxLength={100}
                                value={customDegree}
                                disabled={isReadOnly}
                                onChange={(e) => {
                                  const val = sanitizeText(e.target.value, 100);
                                  setCustomDegree(val);
                                  setTouchedFields(prev => ({ ...prev, education: true }));
                                  setFormErrors(prev => ({
                                    ...prev,
                                    education: !val.trim()
                                      ? 'กรุณาระบุวุฒิการศึกษาขั้นต่ำ'
                                      : val.trim().length < 2
                                        ? `วุฒิการศึกษาต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${val.trim().length} ตัวอักษร)`
                                        : ''
                                  }));
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {formErrors.education && touchedFields.education && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.education}
                      </div>
                    )}
                  </div>

                  {/* 2.2 สาขาวิชาเอก */}
                  <div className="col-md-12" id="field-majors">
                    <label className="form-label fw-medium d-block mb-2">
                      สาขาวิชาเอกของผู้สมัครที่ต้องการ (เลือกได้มากกว่า 1 สาขา) <span className="text-danger">*</span>
                    </label>
                    <div className={`d-flex flex-wrap gap-3 p-3 bg-light rounded border align-items-center ${formErrors.majors && touchedFields.majors ? 'border-danger' : ''}`}>
                      {standardMajors.map((mItem, index) => (
                        <div className="form-check form-check-inline m-0" key={index}>
                          <input className="form-check-input" type="checkbox" id={`major-${index}`} checked={selectedMajors.includes(mItem)} disabled={isReadOnly} onChange={() => handleMajorChange(mItem)} />
                          <label className="form-check-label fw-medium" htmlFor={`major-${index}`} style={{ cursor: 'pointer' }}>{mItem}</label>
                        </div>
                      ))}
                      <div className="d-flex align-items-center gap-2">
                        <div className="form-check form-check-inline m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="major-other"
                            checked={isCustomMajor}
                            disabled={isReadOnly}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsCustomMajor(checked);
                              setTouchedFields(prev => ({ ...prev, majors: true }));
                              if (!checked && selectedMajors.length > 0) {
                                setFormErrors(prev => ({ ...prev, majors: '' }));
                              }
                            }}
                          />
                          <label className="form-check-label fw-bold text-primary" htmlFor="major-other" style={{ cursor: 'pointer' }}>+ อื่นๆ (ระบุสาขาวิชาเอง)</label>
                        </div>
                        {isCustomMajor && (
                          <div className="d-flex align-items-center gap-1">
                            <input
                              type="text"
                              className={`form-control form-control-sm ${formErrors.majors && touchedFields.majors && !customMajor.trim() ? 'is-invalid border-danger' : customMajor ? 'is-valid border-success' : 'border-primary'}`}
                              style={{ minWidth: '240px' }}
                              placeholder="เช่น วิทยาการข้อมูล, ปัญญาประดิษฐ์ (คั่นด้วยจุลภาค)"
                              maxLength={200}
                              value={customMajor}
                              disabled={isReadOnly}
                              onChange={(e) => {
                                const val = sanitizeMajorText(e.target.value, 200);
                                setCustomMajor(val);
                                setTouchedFields(prev => ({ ...prev, majors: true }));
                                setFormErrors(prev => ({
                                  ...prev,
                                  majors: !val.trim() && selectedMajors.length === 0
                                    ? 'กรุณาระบุชื่อสาขาวิชาเอกเพิ่มเติม'
                                    : ''
                                }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {formErrors.majors && touchedFields.majors && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.majors}
                      </div>
                    )}
                  </div>

                  {/* 2.3 ความรู้ความสามารถพิเศษ หรือทักษะเฉพาะตำแหน่ง */}
                  <div className="col-md-12" id="field-abilities">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-medium mb-0">
                        <i className="bi bi-stars text-warning me-1"></i>
                        ความรู้ความสามารถพิเศษ หรือทักษะเฉพาะตำแหน่ง (ถ้ามี)
                      </label>
                      <span className="text-muted small">เช่น ทักษะโปรแกรมมิ่ง, ภาษาต่างประเทศ, การใช้เครื่องมือวิจัย</span>
                    </div>
                    {otherAbilities.map((item, index) => (
                      <div className="input-group mb-2 shadow-sm" key={index}>
                        <span className="input-group-text bg-light">{index + 1}</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ระบุความรู้ความสามารถพิเศษ หรือทักษะเฉพาะตำแหน่ง"
                          maxLength={255}
                          value={item}
                          disabled={isReadOnly}
                          onChange={(e) => handleAbilityChange(index, e.target.value)}
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeAbility(index)}
                            disabled={otherAbilities.length === 1 && !item}
                            title="ลบ"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    {!isReadOnly && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mt-1 fw-bold"
                        onClick={addAbility}
                      >
                        <i className="bi bi-plus-circle me-1"></i>เพิ่มความรู้ความสามารถ / ทักษะเฉพาะตำแหน่ง
                      </button>
                    )}
                  </div>

                </div>

                {/* ปุ่มบันทึกหรือปุ่มย้อนกลับ */}
                {isReadOnly ? (
                  <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top flex-wrap gap-2">
                    <span className="text-muted small">
                      <i className="bi bi-lock-fill text-secondary me-1"></i> คำขอนี้ส่งไปยังหน่วยทรัพยากรมนุษย์แล้ว ไม่สามารถแก้ไขได้
                    </span>
                    <Link to="/my-requests" className="btn btn-secondary px-4 fw-medium shadow-sm" style={{ borderRadius: '8px' }}>
                      <i className="bi bi-arrow-left me-1"></i> ย้อนกลับไปหน้ารายการคำขอ
                    </Link>
                  </div>
                ) : (
                  <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top flex-wrap">
                    <button type="button" className="btn btn-light border px-4" onClick={handleReset} style={{ borderRadius: '8px' }}>
                      ล้างข้อมูล
                    </button>

                    <button
                      type="submit"
                      className="btn btn-outline-secondary px-4 fw-medium shadow-sm"
                      onClick={() => { submitTypeRef.current = "RequestDraft"; setSubmitType("RequestDraft"); }}
                      disabled={isSaving}
                      style={{ borderRadius: '8px' }}
                    >
                      <i className="bi bi-file-earmark-text me-2"></i>บันทึกแบบร่าง
                    </button>

                    <button
                      type="submit"
                      className="btn px-4 text-white fw-bold shadow-sm d-flex align-items-center"
                      onClick={() => { submitTypeRef.current = "Pending"; setSubmitType("Pending"); }}
                      disabled={isSaving}
                      style={{ backgroundColor: '#006664', borderRadius: '8px' }}
                    >
                      {isSaving && submitTypeRef.current === "Pending" ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>กำลังประมวลผล...</>
                      ) : (
                        <><i className="bi bi-send-fill me-2"></i>ส่งคำขอเปิดรับสมัคร</>
                      )}
                    </button>
                  </div>
                )}

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}