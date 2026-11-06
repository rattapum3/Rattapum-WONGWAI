import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  formatLocalDateYMD,
  formatDateStr,
  academicDegrees,
  supportDegrees,
  sanitizeText,
  sanitizeNumberOnly,
  sanitizeSalary
} from './job-posting-form/jobPostingUtils';
import GeneralInfoSection from './job-posting-form/GeneralInfoSection';
import QualificationsSection from './job-posting-form/QualificationsSection';
import SelectionExamsSection from './job-posting-form/SelectionExamsSection';
import DocumentsSection from './job-posting-form/DocumentsSection';
import AnnouncementDocSection from './job-posting-form/AnnouncementDocSection';
import ActionConfirmModal from './job-posting-form/ActionConfirmModal';
import JobPostingStyles from './job-posting-form/JobPostingStyles';

export default function JobPostingForm({ mode = 'new', id = null }) {
  const navigate = useNavigate();

  // ตรวจสอบว่าเป็นโหมดสร้างประกาศจากคำขอของคณะ/หน่วยงานหรือไม่
  const isFromRequest = mode === 'from-request' || (Boolean(id) && id !== 'new');

  // State การทำงานและ UI
  const [currentRecruitmentId, setCurrentRecruitmentId] = useState(id && id !== 'new' ? id : null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [loadingData, setLoadingData] = useState(mode !== 'new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(1);

  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  // ข้อความแจ้งเตือน Banner Notification
  const [notification, setNotification] = useState(null);

  // Modal ยืนยันการกระทำ (Confirm Modal)
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    confirmVariant: 'primary',
    onConfirm: null
  });

  const showNotification = (message, type = 'danger') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const getInputClass = (val, hasError = false) => {
    if (hasError) return 'border-ku-invalid is-invalid';
    if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '0') return 'border-ku-filled';
    return 'border-ku-required';
  };

  // ตัวเลือกจาก Backend Master Data
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [customFaculty, setCustomFaculty] = useState("");
  const [isCustomFacultySelected, setIsCustomFacultySelected] = useState(false);
  const [positionSuggestions, setPositionSuggestions] = useState([]);
  const [customPosition, setCustomPosition] = useState("");
  const [isCustomPositionSelected, setIsCustomPositionSelected] = useState(false);
  const [docMasterList, setDocMasterList] = useState([]);
  const [engTestOptions, setEngTestOptions] = useState([]);
  const [examTypeOptions, setExamTypeOptions] = useState([]);

  // ==========================================
  // 1. หมวดข้อมูลตำแหน่งและรายละเอียดประกาศ
  // ==========================================
  const [jobCategory, setJobCategory] = useState("สายวิชาการ");
  const [generalInfo, setGeneralInfo] = useState({
    jobTitle: "",
    faculty: "",
    department: "",
    amount: "1",
    roundNo: "1",
    salaryMaster: "",
    salaryPhd: "",
    postTitle: "รับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัยกลุ่มวิชาการ ประเภทคณาจารย์ประจำ",
    postDetails: "ด้วยมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร ประสงค์รับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัยกลุ่มวิชาการ ประเภทคณาจารย์ประจำ ตามความในข้อ ๗ (๔) ข้อ ๑๖ และข้อ ๗๐ แห่งข้อบังคับมหาวิทยาลัยเกษตรศาสตร์ ว่าด้วยการบริหารงานบุคคลสำหรับพนักงานมหาวิทยาลัย พ.ศ. ๒๕๕๘ ลงวันที่ ๓๐ ตุลาคม พ.ศ. ๒๕๕๘ ประกอบกับประกาศคณะกรรมการบริหารมหาวิทยาลัยเกษตรศาสตร์ เรื่องหลักเกณฑ์และวิธีการคัดเลือกพนักงานมหาวิทยาลัยกลุ่มวิชาการ ประเภทคณาจารย์ประจำ ลงวันที่ ๒๑ พฤศจิกายน พ.ศ. ๒๕๖๖ จึงประกาศรับสมัครคัดเลือกพนักงานมหาวิทยาลัยกลุ่มวิชาการประเภทคณาจารย์ประจำ",
    openDate: "",
    closeDate: "",
    applicantDetails: "ผู้สมัครเข้ารับการคัดเลือกจะต้องมีคุณสมบัติทั่วไปและลักษณะต้องห้ามของพนักงานมหาวิทยาลัยตามข้อ ๖ แห่งข้อบังคับมหาวิทยาลัยเกษตรศาสตร์ ว่าด้วยการบริหารงานบุคคลพนักงานมหาวิทยาลัยของมหาวิทยาลัยเกษตรศาสตร์ พ.ศ. ๒๕๕๘ ลงวันที่ ๓๐ ตุลาคม พ.ศ. ๒๕๕๘ ดังนี้",
  });

  // ตัวเลือกวุฒิการศึกษา (เลือกได้ 1 อัน)
  const [selectedDegree, setSelectedDegree] = useState("");
  const [customDegree, setCustomDegree] = useState("");
  const [majorsList, setMajorsList] = useState([""]);

  // ==========================================
  // 2. หมวดคุณสมบัติและงาน
  // ==========================================
  const [generalQuals, setGeneralQuals] = useState([
    "มีอายุไม่ต่ำกว่าสิบแปดปีและไม่เกินหกสิบปีบริบูรณ์ ยกเว้นพนักงานมหาวิทยาลัยที่บรรจุตามข้อ ๒๑ ข้อ ๒๒ และ ๒๔ วรรคสอง วรรคสาม และวรรคห้า",
    "เป็นผู้เลื่อมใสในการปกครองระบอบประชาธิปไตยอันมีพระมหากษัตริย์ทรงเป็นประมุข",
    "เป็นผู้มีสุขภาพแข็งแรงและไม่เป็นโรคต้องห้ามตามที่ ก.บ.ม. กำหนด"
  ]);
  const [prohibitedTraits, setProhibitedTraits] = useState([
    "เป็นผู้ดำรงตำแหน่งข้าราชการการเมือง กรรมการบริหารพรรคการเมืองหรือเจ้าหน้าที่ในพรรคทางการเมือง",
    "เป็นคนวิกลจริตหรือจิตฟั่นเฟือนไม่สมประกอบ หรือ เป็นคนไร้ความสามารถหรือเสมือนไร้ความสามารถ หรือเป็นโรคที่ ก.บ.ม. กำหนด",
    "เป็นผู้อยู่ในระหว่างถูกสั่งพักงาน หรือถูกสั่งให้ออกจากงานไว้ก่อน",
    "เป็นผู้บกพร่องในศีลธรรมอันดี",
    "เป็นบุคคลล้มละลาย",
    "เคยถูกจำคุกโดยคำพิพากษาถึงที่สุดให้จำคุก เว้นแต่เป็นโทษสำหรับความผิดที่กระทำโดยประมาทหรือความผิดลหุโทษ",
    "เคยถูกลงโทษให้ออก ปลดออก หรือไล่ออกจากส่วนราชการ รัฐวิสาหกิจ หน่วยงานอื่นของรัฐ องค์การมหาชน หน่วยงานเอกชน หรือองค์การระหว่างประเทศ",
    "เคยถูกเลิกจ้าง ลงโทษให้ออก ปลดออก หรือไล่ออก เพราะกระทำผิดวินัยตามข้อบังคับนี้ หรือกฎหมายอื่น",
    "เป็นผู้เคยกระทำการทุจริตในการสอบเข้ารับราชการหรือเข้าปฏิบัติงานในหน่วยงานของรัฐ"
  ]);
  const [jobResponsibilities, setJobResponsibilities] = useState([
    "ปฏิบัติงานสอนในรายวิชาที่เกี่ยวข้องและสาขาวิชาที่สังกัด",
    "ดำเนินการวิจัยและสร้างสรรค์ผลงานทางวิชาการ",
    "บริการวิชาการแก่สังคมและทำนุบำรุงศิลปวัฒนธรรม",
    "ปฏิบัติงานอื่นๆ ตามที่มหาวิทยาลัยหรือคณะมอบหมาย"
  ]);
  const [otherAbilities, setOtherAbilities] = useState([
    "มีความรู้ความสามารถในการใช้ภาษาอังกฤษเพื่อการสื่อสารและการสอนได้เป็นอย่างดี",
    "มีความสามารถในการประยุกต์ใช้เทคโนโลยีสารสนเทศในการจัดการเรียนการสอน"
  ]);
  const [engTests, setEngTests] = useState([
    { testName: "TOEIC", minScore: "500" }
  ]);

  // ==========================================
  // 3. หมวดขั้นตอน เงื่อนไข และเอกสาร
  // ==========================================
  const [feeDetails, setFeeDetails] = useState("ค่าธรรมเนียมการสมัครสอบ จำนวน 500 บาท");
  const [appConditions, setAppConditions] = useState("ผู้สมัครเข้ารับการคัดเลือกจะต้องรับผิดชอบในการตรวจสอบและรับรองตนเองว่าเป็นผู้มีคุณสมบัติทั่วไปและคุณสมบัติเฉพาะตรงตามประกาศรับสมัคร โดยต้องกรอกรายละเอียดต่าง ๆ ในใบสมัครพร้อมทั้งยื่นเอกสารในการรับสมัครให้ถูกต้องครบถ้วน ในกรณีที่มีความผิดพลาดอันเกิดจากผู้สมัครไม่ว่าด้วยเหตุใด ๆ หรือวุฒิการศึกษาไม่ตรงตามวุฒิของตำแหน่งที่สมัครอันมีผลทำให้ผู้สมัครไม่มีสิทธิ์สมัครตามประกาศรับสมัครดังกล่าว ให้ถือว่าการรับสมัครและการได้รับเข้าคัดเลือกครั้งนี้เป็นโมฆะสำหรับผู้นั้น และไม่มีการคืนค่าธรรมเนียมในการสมัครสอบ");
  const [appSteps, setAppSteps] = useState([
    "กรอกใบสมัครทางระบบออนไลน์ให้ครบถ้วนสมบูรณ์",
    "ชำระค่าธรรมเนียมการสมัครสอบตามที่ระบุในประกาศ",
    "แนบเอกสารหลักฐานประกอบการสมัครให้ถูกต้องครบถ้วน"
  ]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [existingAnnouncementFile, setExistingAnnouncementFile] = useState(null);

  // ==========================================
  // 4. หมวดการสอบ
  // ==========================================
  const [exams, setExams] = useState([
    { type: "สอบสัมภาษณ์", details: "ประเมินความเหมาะสมกับตำแหน่ง บุคลิกภาพ และทัศนคติ (100 คะแนน)" }
  ]);

  // ==========================================
  // 🛡️ State และ Logic สำหรับ Validation
  // ==========================================
  const [formErrors, setFormErrors] = useState({
    jobTitle: '',
    faculty: '',
    department: '',
    amount: '',
    roundNo: '',
    openDate: '',
    closeDate: '',
    postTitle: '',
    postDetails: '',
    degrees: '',
    majors: '',
    exams: ''
  });

  const [touchedFields, setTouchedFields] = useState({});

  // ตรวจสอบความถูกต้องรายฟิลด์แบบ Real-time
  const validateField = (name, value, currentGeneral = generalInfo) => {
    let err = '';
    const trimmed = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'jobTitle':
        if (!trimmed) {
          err = 'กรุณาระบุชื่อตำแหน่งที่รับสมัคร';
        } else if (trimmed.length < 2) {
          err = `ชื่อตำแหน่งต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${trimmed.length} ตัวอักษร)`;
        }
        break;

      case 'faculty':
        if (!trimmed) {
          err = 'กรุณาระบุคณะ / สังกัดหน่วยงาน';
        }
        break;

      case 'amount':
        const numAmount = parseInt(trimmed, 10);
        if (isNaN(numAmount) || numAmount < 1) {
          err = 'จำนวนอัตราที่รับต้องไม่ต่ำกว่า 1 อัตรา';
        } else if (numAmount > 999) {
          err = 'จำนวนอัตราที่รับต้องไม่เกิน 999 อัตรา';
        }
        break;

      case 'roundNo':
        const numRound = parseInt(trimmed, 10);
        if (isNaN(numRound) || numRound < 1) {
          err = 'รอบที่รับสมัครต้องไม่ต่ำกว่า 1';
        } else if (numRound > 99) {
          err = 'รอบที่รับสมัครต้องไม่เกิน 99';
        }
        break;

      case 'openDate':
        if (!trimmed) {
          err = 'กรุณาระบุวันที่เปิดรับสมัคร';
        }
        break;

      case 'closeDate':
        if (!trimmed) {
          err = 'กรุณาระบุวันที่ปิดรับสมัคร';
        } else if (currentGeneral.openDate && trimmed < currentGeneral.openDate) {
          err = 'วันที่ปิดรับสมัครต้องไม่น้อยกว่าวันที่เปิดรับสมัคร';
        }
        break;

      case 'postTitle':
        if (!trimmed) {
          err = 'กรุณาระบุหัวข้อประกาศรับสมัคร';
        } else if (trimmed.length < 5) {
          err = `หัวข้อประกาศต้องมีความยาวอย่างน้อย 5 ตัวอักษร (ปัจจุบัน ${trimmed.length} ตัวอักษร)`;
        }
        break;

      case 'postDetails':
        if (!trimmed) {
          err = 'กรุณาระบุย่อหน้าเกริ่นนำประกาศ';
        } else if (trimmed.length < 10) {
          err = 'ย่อหน้าเกริ่นนำต้องมีความยาวอย่างน้อย 10 ตัวอักษร';
        }
        break;

      default:
        break;
    }

    return err;
  };

  const handleGeneralInfoChange = (field, rawValue) => {
    let sanitizedVal = rawValue;
    if (field === 'jobTitle' || field === 'faculty' || field === 'department') {
      sanitizedVal = sanitizeText(rawValue, 100);
    } else if (field === 'amount') {
      sanitizedVal = sanitizeNumberOnly(rawValue, 3);
    } else if (field === 'roundNo') {
      sanitizedVal = sanitizeNumberOnly(rawValue, 2);
    } else if (field === 'salaryMaster' || field === 'salaryPhd') {
      sanitizedVal = sanitizeSalary(rawValue);
    } else if (field === 'postTitle') {
      sanitizedVal = sanitizeText(rawValue, 255);
    }

    const updatedGeneral = { ...generalInfo, [field]: sanitizedVal };
    setGeneralInfo(updatedGeneral);

    setTouchedFields(prev => ({ ...prev, [field]: true }));

    const err = validateField(field, sanitizedVal, updatedGeneral);
    setFormErrors(prev => {
      const next = { ...prev, [field]: err };
      if (field === 'openDate' && generalInfo.closeDate) {
        next.closeDate = validateField('closeDate', generalInfo.closeDate, updatedGeneral);
      }
      return next;
    });
  };

  // ตรวจสอบความถูกต้องทุกช่องก่อนบันทึก
  const validateAllSections = () => {
    const errors = {};
    const touched = {};

    ['jobTitle', 'faculty', 'amount', 'roundNo', 'openDate', 'closeDate', 'postTitle', 'postDetails'].forEach(k => {
      errors[k] = validateField(k, generalInfo[k], generalInfo);
      touched[k] = true;
    });

    // วุฒิการศึกษา (เลือกได้แค่ 1 อัน)
    const effectiveDegree = selectedDegree === 'other' ? customDegree.trim() : (selectedDegree || '');
    if (!effectiveDegree) {
      errors.degrees = 'กรุณาเลือกระดับการศึกษา 1 ระดับ หรือพิมพ์ระบุวุฒิอื่นๆ';
    }

    // สาขาวิชา
    const validMajors = majorsList.map(m => m.trim()).filter(Boolean);
    if (validMajors.length === 0) {
      errors.majors = 'กรุณาระบุสาขาวิชาที่เปิดรับอย่างน้อย 1 สาขา';
    }

    // วิธีการคัดเลือก (ถ้ามีรายการ ต้องเลือกประเภทการสอบให้ครบ)
    const invalidExams = exams.filter(e => !e.type || !e.type.trim());
    if (invalidExams.length > 0) {
      errors.exams = 'กรุณาระบุประเภทการสอบให้ครบทุกรายการ หรือลบรายการที่ไม่ใช้ออก';
    }

    setTouchedFields(prev => ({ ...prev, ...touched, degrees: true, majors: true, exams: true }));
    setFormErrors(errors);

    const hasErrors = Object.values(errors).some(e => !!e);
    return {
      isValid: !hasErrors,
      errors
    };
  };

  // เลื่อนหน้าจอไปยัง Accordion และฟิลด์แรกที่มี Error
  const scrollToFirstError = (errors) => {
    if (errors.jobTitle || errors.faculty || errors.amount || errors.roundNo || errors.openDate || errors.closeDate || errors.postTitle || errors.postDetails) {
      setOpenAccordion(1);
      setTimeout(() => {
        const firstField = ['jobTitle', 'amount', 'roundNo', 'faculty', 'openDate', 'closeDate', 'postTitle', 'postDetails'].find(f => errors[f]);
        const el = document.getElementById(`field-${firstField}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus({ preventScroll: true });
        }
      }, 150);
      return;
    }

    if (errors.degrees || errors.majors) {
      setOpenAccordion(2);
      setTimeout(() => {
        const el = document.getElementById(errors.degrees ? 'field-degrees' : 'field-majors');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return;
    }

    if (errors.exams) {
      setOpenAccordion(3);
      setTimeout(() => {
        const el = document.getElementById('field-exams');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  };

  // ==========================================
  // โหลดตัวเลือกจาก Database (Master Options & Faculties)
  // ==========================================
  useEffect(() => {
    fetch('http://localhost:3000/api/request-job/options')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          if (result.faculties && result.faculties.length > 0) {
            setFacultyOptions(result.faculties);
          }
          if (result.departments && result.departments.length > 0) {
            setAllDepartments(result.departments);
          }
          if (result.documents) setDocMasterList(result.documents);
          if (result.positions) setPositionSuggestions(result.positions);
          if (result.engExamTypes && result.engExamTypes.length > 0) {
            setEngTestOptions(result.engExamTypes.map(e => e.name));
          }
          if (result.examTypes && result.examTypes.length > 0) {
            setExamTypeOptions(result.examTypes.map(e => e.name));
          }
        }
      })
      .catch(err => console.error("Failed to fetch options:", err));

    fetch('http://localhost:3000/api/faculties')
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setFacultyOptions(result.data);
        }
      })
      .catch(err => console.error("Failed to fetch faculties:", err));
  }, []);

  // ตั้งค่าเริ่มต้นของเอกสารถ้าโหมดสร้างใหม่
  useEffect(() => {
    if (mode === 'new' && selectedDocs.length === 0 && docMasterList.length > 0) {
      const defaultDocs = docMasterList.map(d => ({
        docId: d.id,
        docName: d.name,
        docDetail: d.defaultDetail || ""
      }));
      setSelectedDocs(defaultDocs);
    }
  }, [docMasterList, mode]);

  // ==========================================
  // โหลดข้อมูลเมื่อเป็นโหมด from-request หรือ edit
  // ==========================================
  useEffect(() => {
    if (id && mode !== 'new') {
      fetchJobDetails();
    } else {
      setLoadingData(false);
    }
  }, [id, mode]);

  const fetchJobDetails = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`http://localhost:3000/api/request-job/${id}`);
      const result = await response.json();
      if (result.success && result.data) {
        const item = result.data;

        const cat = item.jobCategory || item.category || "สายวิชาการ";
        setJobCategory(cat);

        const fetchedEduStr = item.minEducation || (Array.isArray(item.education) ? item.education[0] : (item.education || ""));
        const degreesArr = fetchedEduStr ? fetchedEduStr.split(/ หรือ |,\s*/) : [];
        const allStdDegrees = [...academicDegrees, ...supportDegrees];
        const matched = [];
        const customParts = [];
        degreesArr.forEach(d => {
          const trimmed = d.trim();
          if (allStdDegrees.includes(trimmed)) {
            matched.push(trimmed);
          } else if (trimmed) {
            customParts.push(trimmed);
          }
        });
        if (matched.length > 0) {
          setSelectedDegree(matched[0]);
          setCustomDegree("");
        } else if (customParts.length > 0) {
          setSelectedDegree("other");
          setCustomDegree(customParts.join(', '));
        } else {
          setSelectedDegree("");
          setCustomDegree("");
        }

        const fetchedMajorsList = item.majors && item.majors.length > 0
          ? item.majors
          : (typeof item.major === 'string' ? item.major.split(/,\s*/) : (Array.isArray(item.major) ? item.major : [""]));
        setMajorsList(fetchedMajorsList.length > 0 ? fetchedMajorsList : [""]);

        let openD = formatDateStr(item.openDate);
        let closeD = formatDateStr(item.closeDate);

        const loadedJobTitle = item.jobTitle || item.positionName || "";
        const loadedFaculty = item.faculty || item.facultyName || "";
        const loadedDepartment = item.department || item.departmentName || "";

        setGeneralInfo({
          jobTitle: loadedJobTitle,
          faculty: loadedFaculty,
          department: loadedDepartment,
          amount: String(item.amount || item.totalPosition || 1),
          roundNo: String(item.roundNo || 1),
          salaryMaster: item.salaryMaster ? String(item.salaryMaster) : (item.salaryMin ? Number(item.salaryMin).toLocaleString() : ""),
          salaryPhd: item.salaryPhd ? String(item.salaryPhd) : (item.salaryMax ? Number(item.salaryMax).toLocaleString() : ""),
          postTitle: item.postTitle || item.announcementName || (cat === 'สายวิชาการ' ? "รับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัยกลุ่มวิชาการ ประเภทคณาจารย์ประจำ" : "รับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัยกลุ่มสนับสนุน"),
          postDetails: item.postDetails || item.announcementDetail || "ด้วยมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร ประสงค์รับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัยกลุ่มวิชาการ ประเภทคณาจารย์ประจำ ตามความในข้อ ๗ (๔) ข้อ ๑๖ และข้อ ๗๐ แห่งข้อบังคับมหาวิทยาลัยเกษตรศาสตร์ ว่าด้วยการบริหารงานบุคคลสำหรับพนักงานมหาวิทยาลัย พ.ศ. ๒๕๕๘ ลงวันที่ ๓๐ ตุลาคม พ.ศ. ๒๕๕๘ ประกอบกับประกาศคณะกรรมการบริหารมหาวิทยาลัยเกษตรศาสตร์ เรื่องหลักเกณฑ์และวิธีการคัดเลือกพนักงานมหาวิทยาลัยกลุ่มวิชาการ ประเภทคณาจารย์ประจำ ลงวันที่ ๒๑ พฤศจิกายน พ.ศ. ๒๕๖๖ จึงประกาศรับสมัครคัดเลือกพนักงานมหาวิทยาลัยกลุ่มวิชาการประเภทคณาจารย์ประจำ",
          openDate: openD,
          closeDate: closeD,
          applicantDetails: item.applicantDetails || "ผู้สมัครเข้ารับการคัดเลือกจะต้องมีคุณสมบัติทั่วไปและลักษณะต้องห้ามของพนักงานมหาวิทยาลัยตามข้อ ๖ แห่งข้อบังคับมหาวิทยาลัยเกษตรศาสตร์ ว่าด้วยการบริหารงานบุคคลพนักงานมหาวิทยาลัยของมหาวิทยาลัยเกษตรศาสตร์ พ.ศ. ๒๕๕๘ ลงวันที่ ๓๐ ตุลาคม พ.ศ. ๒๕๕๘ ดังนี้",
        });

        if (loadedJobTitle) {
          const isKnownPos = positionSuggestions.some(p => (p.name || p.Position_name) === loadedJobTitle);
          if (!isKnownPos && positionSuggestions.length > 0) {
            setIsCustomPositionSelected(true);
            setCustomPosition(loadedJobTitle);
          }
        }

        if (loadedFaculty) {
          const isKnown = facultyOptions.some(f => (f.Faculty_name || f.name) === loadedFaculty);
          if (!isKnown && facultyOptions.length > 0) {
            setIsCustomFacultySelected(true);
            setCustomFaculty(loadedFaculty);
          }
        }

        if (item.jobResponsibilities && item.jobResponsibilities.length > 0) {
          setJobResponsibilities(item.jobResponsibilities);
        } else if (item.responsibilities && item.responsibilities.length > 0) {
          setJobResponsibilities(item.responsibilities);
        }

        if (item.prohibitedTraits && item.prohibitedTraits.length > 0) {
          setProhibitedTraits(item.prohibitedTraits);
        }
        if (item.generalQuals && item.generalQuals.length > 0) {
          setGeneralQuals(item.generalQuals);
        }
        if (item.otherAbilities && item.otherAbilities.length > 0) {
          setOtherAbilities(item.otherAbilities);
        } else if (item.additionalSkills && typeof item.additionalSkills === 'string' && item.additionalSkills.trim()) {
          const parsedSkills = item.additionalSkills.split(/,\s*/).map(s => s.trim()).filter(Boolean);
          setOtherAbilities(parsedSkills.length > 0 ? parsedSkills : [""]);
        } else {
          setOtherAbilities([""]);
        }
        if (item.appSteps && item.appSteps.length > 0) {
          setAppSteps(item.appSteps);
        }
        if (item.appConditions) {
          setAppConditions(item.appConditions);
        }
        if (item.feeDetails) {
          setFeeDetails(item.feeDetails);
        }
        if (item.engTests && item.engTests.length > 0) {
          setEngTests(item.engTests);
        }
        if (item.exams && item.exams.length > 0) {
          setExams(item.exams);
        }
        if (item.documentsList && item.documentsList.length > 0) {
          setSelectedDocs(item.documentsList.map(d => ({
            docId: d.docId || d.id,
            docName: d.docName || d.name,
            docDetail: d.docDetail || d.detail || ""
          })));
        }

        if (item.announcementFile) {
          setExistingAnnouncementFile(item.announcementFile);
        }

        if (item.id) {
          setCurrentRecruitmentId(item.id);
        }

        if (item.status === 'HR_Draft') {
          setIsDraftSaved(true);
        } else {
          setIsDraftSaved(false);
        }
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      showNotification("ไม่สามารถดึงข้อมูลได้: " + err.message, "danger");
    } finally {
      setLoadingData(false);
    }
  };

  const handleFacultyDropdownChange = (val) => {
    if (isFromRequest) return;
    setTouchedFields(prev => ({ ...prev, faculty: true }));
    if (val === 'other') {
      setIsCustomFacultySelected(true);
      const cleanVal = customFaculty.trim();
      setGeneralInfo(prev => ({ ...prev, faculty: cleanVal }));
      setFormErrors(prev => ({ ...prev, faculty: cleanVal ? '' : 'กรุณาระบุคณะ / สังกัดหน่วยงาน' }));
      setDepartmentOptions([]);
    } else {
      setIsCustomFacultySelected(false);
      setCustomFaculty("");
      setGeneralInfo(prev => ({ ...prev, faculty: val }));
      setFormErrors(prev => ({ ...prev, faculty: val ? '' : 'กรุณาระบุคณะ / สังกัดหน่วยงาน' }));

      const matchedFac = facultyOptions.find(f => (f.Faculty_name || f.name) === val);
      if (val) {
        const filtered = allDepartments.filter(d =>
          (d.facultyName && d.facultyName.trim() === val.trim()) ||
          (matchedFac && (d.facultyId === matchedFac.id || d.facultyId === matchedFac.Faculty_id))
        );
        setDepartmentOptions(filtered);
      } else {
        setDepartmentOptions([]);
      }
    }
  };

  const handleCustomFacultyChange = (val) => {
    if (isFromRequest) return;
    const sanitized = sanitizeText(val, 100);
    setCustomFaculty(sanitized);
    setGeneralInfo(prev => ({ ...prev, faculty: sanitized }));
    setTouchedFields(prev => ({ ...prev, faculty: true }));
    setFormErrors(prev => ({
      ...prev,
      faculty: !sanitized.trim()
        ? 'กรุณาระบุคณะ / สังกัดหน่วยงาน'
        : sanitized.trim().length < 2
          ? `ชื่อคณะ/สังกัดต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${sanitized.trim().length} ตัวอักษร)`
          : ''
    }));
  };

  const handlePositionDropdownChange = (val) => {
    if (isFromRequest) return;
    setTouchedFields(prev => ({ ...prev, jobTitle: true }));
    if (val === 'other') {
      setIsCustomPositionSelected(true);
      const cleanVal = customPosition.trim();
      setGeneralInfo(prev => ({ ...prev, jobTitle: cleanVal }));
      setFormErrors(prev => ({ ...prev, jobTitle: cleanVal ? '' : 'กรุณาระบุชื่อตำแหน่งที่รับสมัคร' }));
    } else {
      setIsCustomPositionSelected(false);
      setCustomPosition("");
      setGeneralInfo(prev => ({ ...prev, jobTitle: val }));
      setFormErrors(prev => ({ ...prev, jobTitle: val ? '' : 'กรุณาระบุชื่อตำแหน่งที่รับสมัคร' }));
    }
  };

  const handleCustomPositionChange = (val) => {
    if (isFromRequest) return;
    const sanitized = sanitizeText(val, 100);
    setCustomPosition(sanitized);
    setGeneralInfo(prev => ({ ...prev, jobTitle: sanitized }));
    setTouchedFields(prev => ({ ...prev, jobTitle: true }));
    setFormErrors(prev => ({
      ...prev,
      jobTitle: !sanitized.trim()
        ? 'กรุณาระบุชื่อตำแหน่งที่รับสมัคร'
        : sanitized.trim().length < 2
          ? `ชื่อตำแหน่งต้องมีความยาวอย่างน้อย 2 ตัวอักษร (ปัจจุบัน ${sanitized.trim().length} ตัวอักษร)`
          : ''
    }));
  };

  const handleCategoryChange = (e) => {
    if (isFromRequest) return;
    const cat = e.target.value;
    setJobCategory(cat);
    setSelectedDegree("");
    setCustomDegree("");
    if (cat === "สายวิชาการ") {
      setGeneralInfo(prev => ({
        ...prev,
        postTitle: "รับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัยกลุ่มวิชาการ ประเภทคณาจารย์ประจำ",
      }));
    } else {
      setGeneralInfo(prev => ({
        ...prev,
        postTitle: "รับสมัครบุคคลเพื่อคัดเลือกเป็นพนักงานมหาวิทยาลัยกลุ่มสนับสนุน",
      }));
    }
  };

  const handleDegreeChange = (degree) => {
    if (isFromRequest) return;
    setSelectedDegree(degree);
    setTouchedFields(prev => ({ ...prev, degrees: true }));
    setFormErrors(prev => ({ ...prev, degrees: '' }));
  };

  // Helper สำหรับ Dynamic Lists
  const handleListChange = (index, value, listState, setListState) => {
    const newList = [...listState];
    newList[index] = sanitizeText(value, 200);
    setListState(newList);
  };
  const addListItem = (listState, setListState) => setListState([...listState, ""]);
  const removeListItem = (index, listState, setListState) => {
    if (listState.length > 1) {
      setListState(listState.filter((_, i) => i !== index));
    } else {
      setListState([""]);
    }
  };
  const moveListItem = (index, direction, listState, setListState) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === listState.length - 1)) return;
    const newList = [...listState];
    const temp = newList[index];
    newList[index] = newList[index + direction];
    newList[index + direction] = temp;
    setListState(newList);
  };

  // เอกสารแนบ
  const addDocItem = () => {
    const defaultDoc = docMasterList[0] || { id: 4, name: "เอกสารอื่นๆ", defaultDetail: "" };
    setSelectedDocs([...selectedDocs, {
      docId: defaultDoc.id,
      docName: defaultDoc.name,
      docDetail: ""
    }]);
  };
  const updateDocId = (index, newDocId) => {
    const matched = docMasterList.find(d => String(d.id) === String(newDocId));
    const newDocs = [...selectedDocs];
    if (matched) {
      newDocs[index] = {
        docId: matched.id,
        docName: matched.name,
        docDetail: matched.defaultDetail || ""
      };
    } else {
      newDocs[index].docId = newDocId;
    }
    setSelectedDocs(newDocs);
  };
  const updateDocDetail = (index, detailText) => {
    const newDocs = [...selectedDocs];
    newDocs[index].docDetail = sanitizeText(detailText, 200);
    setSelectedDocs(newDocs);
  };
  const removeDocItem = (index) => {
    setSelectedDocs(selectedDocs.filter((_, i) => i !== index));
  };

  // ภาษาอังกฤษ
  const addEngTest = () => setEngTests([...engTests, { testName: "", minScore: "" }]);
  const updateEngTest = (index, field, value) => {
    const newTests = [...engTests];
    newTests[index][field] = field === 'minScore' ? sanitizeNumberOnly(value, 4) : value;
    setEngTests(newTests);
  };
  const removeEngTest = (index) => setEngTests(engTests.filter((_, i) => i !== index));

  // การสอบ
  const addExam = () => setExams([...exams, { type: "", details: "" }]);
  const updateExam = (index, field, value) => {
    const newExams = [...exams];
    newExams[index][field] = sanitizeText(value, 200);
    setExams(newExams);
  };
  const removeExam = (index) => setExams(exams.filter((_, i) => i !== index));
  const moveExam = (index, direction) => moveListItem(index, direction, exams, setExams);

  // ==========================================
  // ส่งออกเป็นไฟล์ PDF / Word (Preview)
  // ==========================================
  const prepareExportPayload = () => {
    const activeDegree = selectedDegree === 'other' ? customDegree.trim() : (selectedDegree || '');
    const finalEducationStr = activeDegree || 'ไม่จำกัดวุฒิ';
    const cleanMajors = majorsList.map(m => m.trim()).filter(Boolean);
    const cleanResponsibilities = jobResponsibilities.map(r => r.trim()).filter(Boolean);
    const cleanProhibited = prohibitedTraits.map(p => p.trim()).filter(Boolean);
    const cleanQuals = generalQuals.map(q => q.trim()).filter(Boolean);
    const cleanAbilities = otherAbilities.map(a => a.trim()).filter(Boolean);
    const cleanSteps = appSteps.map(s => s.trim()).filter(Boolean);
    const cleanEngTests = engTests.filter(t => t.testName && t.minScore !== '');
    const cleanExams = exams.filter(e => e.type && e.type.trim());
    const docList = selectedDocs.map(d => ({
      docName: d.docName || d.name,
      docDetail: d.docDetail || d.detail || ""
    }));

    const activeId = currentRecruitmentId || (id && id !== 'new' ? id : undefined);
    return {
      id: activeId,
      recruitmentId: activeId,
      generalInfo: {
        ...generalInfo,
        jobCategory
      },
      jobTitle: generalInfo.jobTitle,
      faculty: generalInfo.faculty,
      department: generalInfo.department,
      amount: generalInfo.amount,
      roundNo: generalInfo.roundNo,
      salaryMin: generalInfo.salaryMaster ? generalInfo.salaryMaster.replace(/,/g, '') : null,
      salaryMax: generalInfo.salaryPhd ? generalInfo.salaryPhd.replace(/,/g, '') : null,
      openDate: generalInfo.openDate,
      closeDate: generalInfo.closeDate,
      postTitle: generalInfo.postTitle,
      postDetails: generalInfo.postDetails,
      applicantDetail: generalInfo.applicantDetails,
      applicantDetails: generalInfo.applicantDetails,
      appConditions: appConditions,
      feeDetails: feeDetails,
      reqEducation: finalEducationStr,
      minEducation: finalEducationStr,
      majors: cleanMajors,
      jobResponsibilities: cleanResponsibilities,
      prohibitedTraits: cleanProhibited,
      generalQuals: cleanQuals,
      otherAbilities: cleanAbilities,
      appSteps: cleanSteps,
      engTests: cleanEngTests,
      exams: cleanExams,
      documentsList: docList
    };
  };

  const handleGeneratePDF = async () => {
    if (!isDraftSaved) {
      showNotification('ยังไม่ได้บันทึกแบบร่าง กรุณากดปุ่ม "บันทึกแบบร่าง" ก่อนดาวน์โหลดเอกสาร PDF', 'warning');
      return;
    }
    try {
      setIsGeneratingPdf(true);
      const payload = prepareExportPayload();
      const response = await fetch('http://localhost:3000/api/export/job-announcement/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'ไม่สามารถสร้างเอกสาร PDF ได้');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ร่างประกาศ_${generalInfo.jobTitle || 'ตำแหน่ง'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('เกิดข้อผิดพลาดในการสร้างเอกสาร PDF: ' + error.message, 'danger');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateWord = async () => {
    if (!isDraftSaved) {
      showNotification('ยังไม่ได้บันทึกแบบร่าง กรุณากดปุ่ม "บันทึกแบบร่าง" ก่อนดาวน์โหลดเอกสาร Word', 'warning');
      return;
    }
    try {
      setIsGeneratingWord(true);
      const payload = prepareExportPayload();
      const response = await fetch('http://localhost:3000/api/export/job-announcement/preview-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'ไม่สามารถสร้างเอกสาร Word ได้');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ร่างประกาศ_${generalInfo.jobTitle || 'ตำแหน่ง'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Word:', error);
      showNotification('เกิดข้อผิดพลาดในการสร้างไฟล์ Word: ' + error.message, 'danger');
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // ==========================================
  // บันทึกและเผยแพร่ข้อมูล (Save & Publish Handler)
  // ==========================================
  const handleSaveJobPosting = async (publishMode) => {
    // ต้องกดบันทึกแบบร่างก่อนเผยแพร่
    if (publishMode === 'Processed' && !isDraftSaved) {
      showNotification('ยังไม่ได้บันทึกแบบร่าง กรุณากดปุ่ม "บันทึกแบบร่าง" ก่อนทำการเผยแพร่ประกาศ', 'warning');
      return;
    }

    // ตรวจสอบความถูกต้องทุกช่อง
    const validation = validateAllSections();
    if (!validation.isValid) {
      showNotification("กรุณาตรวจสอบและแก้ไขข้อมูลในช่องที่มีข้อความแจ้งเตือนสีแดงให้ถูกต้องครบถ้วน", "danger");
      scrollToFirstError(validation.errors);
      return;
    }

    // กรณีเผยแพร่จริง แต่ยังไม่ได้แนบไฟล์ PDF ให้ถามยืนยันผ่าน Modal
    if (publishMode === 'Processed' && !uploadedFile && !existingAnnouncementFile) {
      setConfirmModal({
        show: true,
        title: "ยังไม่ได้แนบไฟล์ประกาศ PDF ฉบับทางการ",
        message: "คุณยังไม่ได้แนบไฟล์ประกาศ PDF ที่ลงนามแล้ว คุณต้องการเผยแพร่ประกาศนี้ขึ้นเว็บไซต์ทันทีหรือไม่?\n(สามารถมาอัปโหลดไฟล์ประกาศเพิ่มเติมภายหลังได้)",
        confirmText: "เผยแพร่ทันที",
        confirmVariant: "warning",
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, show: false }));
          await executeSave(publishMode);
        }
      });
      return;
    }

    await executeSave(publishMode);
  };

  const executeSave = async (publishMode) => {
    setIsSubmitting(true);
    try {
      const activeDegree = selectedDegree === 'other' ? customDegree.trim() : (selectedDegree || '');
      const finalEducationStr = activeDegree || 'ไม่จำกัดวุฒิ';
      const cleanMajors = majorsList.map(m => m.trim()).filter(Boolean);
      const cleanResponsibilities = jobResponsibilities.map(r => r.trim()).filter(Boolean);
      const cleanProhibited = prohibitedTraits.map(p => p.trim()).filter(Boolean);
      const cleanQuals = generalQuals.map(q => q.trim()).filter(Boolean);
      const cleanAbilities = otherAbilities.map(a => a.trim()).filter(Boolean);
      const cleanSteps = appSteps.map(s => s.trim()).filter(Boolean);
      const cleanEngTests = engTests.filter(t => t.testName && t.minScore !== '');
      const cleanExams = exams.filter(e => e.type && e.type.trim());

      const formData = new FormData();
      formData.append('generalInfo', JSON.stringify({
        ...generalInfo,
        jobCategory,
        salaryMin: generalInfo.salaryMaster ? generalInfo.salaryMaster.replace(/,/g, '') : null,
        salaryMax: generalInfo.salaryPhd ? generalInfo.salaryPhd.replace(/,/g, '') : null,
      }));
      formData.append('jobTitle', generalInfo.jobTitle.trim());
      formData.append('faculty', generalInfo.faculty.trim());
      formData.append('department', generalInfo.department.trim());
      formData.append('jobCategory', jobCategory);
      formData.append('reqEducation', finalEducationStr);
      formData.append('selectedDegrees', JSON.stringify(activeDegree ? [activeDegree] : []));
      formData.append('reqMajor', cleanMajors.join(', '));
      formData.append('majorsList', JSON.stringify(cleanMajors));
      formData.append('jobResponsibilities', JSON.stringify(cleanResponsibilities));
      formData.append('prohibitedTraits', JSON.stringify(cleanProhibited));
      formData.append('generalQuals', JSON.stringify(cleanQuals));
      formData.append('otherAbilities', JSON.stringify(cleanAbilities));
      formData.append('engTests', JSON.stringify(cleanEngTests));
      formData.append('exams', JSON.stringify(cleanExams));
      formData.append('feeDetails', feeDetails);
      formData.append('appConditions', appConditions);
      formData.append('appSteps', JSON.stringify(cleanSteps));
      formData.append('documentsList', JSON.stringify(selectedDocs));
      formData.append('documents', JSON.stringify(selectedDocs.map(d => `${d.docName || d.name}: ${d.docDetail || d.detail || ''}`)));
      formData.append('publishMode', publishMode);

      if (uploadedFile) {
        formData.append('announcementFile', uploadedFile);
      }

      const activeId = currentRecruitmentId || (id && id !== 'new' ? id : null);
      const targetUrl = activeId
        ? `http://localhost:3000/api/job-posting/${activeId}`
        : 'http://localhost:3000/api/job-posting/new';

      const res = await fetch(targetUrl, {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (result.success) {
        if (publishMode === 'HR_Draft') {
          setIsDraftSaved(true);
          const savedId = result.recruitmentId || activeId;
          if (savedId) {
            setCurrentRecruitmentId(savedId);
            window.history.replaceState(null, '', `/create-job/${savedId}`);
          }
          showNotification(result.message || "บันทึกแบบร่างสำเร็จเรียบร้อยแล้ว คุณสามารถดาวน์โหลด Word/PDF หรือดำเนินการต่อได้", "success");
        } else {
          showNotification(result.message || "เผยแพร่ประกาศรับสมัครงานสำเร็จ!", "success");
          setTimeout(() => {
            navigate('/manage-jobs');
          }, 1200);
        }
      } else {
        showNotification("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: " + result.message, "danger");
      }
    } catch (err) {
      console.error('Error saving job posting:', err);
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fs-5">กำลังโหลดข้อมูลประกาศรับสมัครงาน...</p>
      </div>
    );
  }

  // กำหนดข้อความ Header ตาม Mode
  const getHeaderInfo = () => {
    if (mode === 'from-request') {
      return {
        title: "สร้างประกาศรับสมัครงาน (จากคำขอของคณะ/หน่วยงาน)",
        subtitle: `สร้างประกาศรับสมัครงานโดยอิงจากข้อมูลคำขอเปิดรับสมัคร (รหัสคำขอ #${id}) พร้อมการตรวจสอบความถูกต้องแบบ Real-time`,
        backUrl: "/job-requests"
      };
    }
    return {
      title: "สร้างและเผยแพร่ประกาศรับสมัครงานใหม่",
      backUrl: "/manage-jobs"
    };
  };

  const header = getHeaderInfo();

  return (
    <div className="container-fluid py-4 position-relative" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '1050px' }}>

        {/* ปุ่มย้อนกลับและหัวข้อ */}
        <div className="mb-4 d-flex align-items-start gap-3">
          <Link to={header.backUrl} className="btn btn-white btn-sm rounded-circle px-2 mt-1 shadow-sm border" style={{ width: '40px', height: '40px' }} title="ย้อนกลับ">
            <i className="bi bi-arrow-left fs-5 text-dark"></i>
          </Link>
          <div>
            <h2 className="mb-1 fw-bold" style={{ color: '#006664' }}>
              <i className="bi bi-megaphone-fill me-2" style={{ color: '#03A96B' }}></i>{header.title}
            </h2>
            <p className="text-muted fs-6 mb-0">{header.subtitle}</p>
          </div>
        </div>

        {/* Banner ข้อความแจ้งเตือน */}
        {notification && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm d-flex align-items-center mb-4`} role="alert" style={{ borderRadius: '12px' }}>
            <i className={`bi ${notification.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5 me-2`}></i>
            <div className="flex-grow-1 fw-medium">{notification.message}</div>
            <button type="button" className="btn-close" onClick={() => setNotification(null)} aria-label="Close"></button>
          </div>
        )}

        <div className="card shadow-sm border-0 mb-4" style={{ borderTop: '4px solid #006664', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-body p-4 p-md-5 bg-white">

            <h5 className="fw-bold text-dark mb-4 pb-2 border-bottom d-flex align-items-center" style={{ color: '#006664' }}>
              <span className="badge me-2 text-white" style={{ backgroundColor: '#006664' }}>ฟอร์มข้อมูล</span>
              กรอกรายละเอียดประกาศรับสมัครงาน
            </h5>

            <div className="accordion mb-4 shadow-sm" id="jobPostingAccordion">
              <GeneralInfoSection
                openAccordion={openAccordion}
                toggleAccordion={toggleAccordion}
                isFromRequest={isFromRequest}
                jobCategory={jobCategory}
                handleCategoryChange={handleCategoryChange}
                generalInfo={generalInfo}
                handleGeneralInfoChange={handleGeneralInfoChange}
                positionSuggestions={positionSuggestions}
                isCustomPositionSelected={isCustomPositionSelected}
                customPosition={customPosition}
                handlePositionDropdownChange={handlePositionDropdownChange}
                handleCustomPositionChange={handleCustomPositionChange}
                facultyOptions={facultyOptions}
                isCustomFacultySelected={isCustomFacultySelected}
                customFaculty={customFaculty}
                handleFacultyDropdownChange={handleFacultyDropdownChange}
                handleCustomFacultyChange={handleCustomFacultyChange}
                departmentOptions={departmentOptions}
                formErrors={formErrors}
                touchedFields={touchedFields}
                getInputClass={getInputClass}
              />

              <QualificationsSection
                openAccordion={openAccordion}
                toggleAccordion={toggleAccordion}
                isFromRequest={isFromRequest}
                jobCategory={jobCategory}
                selectedDegree={selectedDegree}
                setSelectedDegree={setSelectedDegree}
                customDegree={customDegree}
                setCustomDegree={setCustomDegree}
                handleDegreeChange={handleDegreeChange}
                majorsList={majorsList}
                setMajorsList={setMajorsList}
                jobResponsibilities={jobResponsibilities}
                setJobResponsibilities={setJobResponsibilities}
                generalQuals={generalQuals}
                setGeneralQuals={setGeneralQuals}
                prohibitedTraits={prohibitedTraits}
                setProhibitedTraits={setProhibitedTraits}
                otherAbilities={otherAbilities}
                setOtherAbilities={setOtherAbilities}
                engTests={engTests}
                setEngTests={setEngTests}
                engTestOptions={engTestOptions}
                addEngTest={addEngTest}
                updateEngTest={updateEngTest}
                removeEngTest={removeEngTest}
                handleListChange={handleListChange}
                addListItem={addListItem}
                removeListItem={removeListItem}
                moveListItem={moveListItem}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                setTouchedFields={setTouchedFields}
                getInputClass={getInputClass}
              />

              <SelectionExamsSection
                openAccordion={openAccordion}
                toggleAccordion={toggleAccordion}
                exams={exams}
                examTypeOptions={examTypeOptions}
                addExam={addExam}
                updateExam={updateExam}
                removeExam={removeExam}
                moveExam={moveExam}
                appSteps={appSteps}
                setAppSteps={setAppSteps}
                handleListChange={handleListChange}
                addListItem={addListItem}
                removeListItem={removeListItem}
                moveListItem={moveListItem}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
              />

              <DocumentsSection
                openAccordion={openAccordion}
                toggleAccordion={toggleAccordion}
                selectedDocs={selectedDocs}
                setSelectedDocs={setSelectedDocs}
                docMasterList={docMasterList}
                updateDocId={updateDocId}
                updateDocDetail={updateDocDetail}
                removeDocItem={removeDocItem}
                addDocItem={addDocItem}
                moveListItem={moveListItem}
                feeDetails={feeDetails}
                setFeeDetails={setFeeDetails}
                appConditions={appConditions}
                setAppConditions={setAppConditions}
              />

              <AnnouncementDocSection
                openAccordion={openAccordion}
                toggleAccordion={toggleAccordion}
                handleGenerateWord={handleGenerateWord}
                isGeneratingWord={isGeneratingWord}
                handleGeneratePDF={handleGeneratePDF}
                isGeneratingPdf={isGeneratingPdf}
                existingAnnouncementFile={existingAnnouncementFile}
                showNotification={showNotification}
                setUploadedFile={setUploadedFile}
                backUrl={header.backUrl}
                isSubmitting={isSubmitting}
                handleSaveJobPosting={handleSaveJobPosting}
                isDraftSaved={isDraftSaved}
              />
            </div>

          </div>
        </div>
      </div>

      <ActionConfirmModal
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
      />

      <JobPostingStyles />
    </div>
  );
}
