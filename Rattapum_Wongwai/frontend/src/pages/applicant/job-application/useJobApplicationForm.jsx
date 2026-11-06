import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DEGREE_OPTIONS, RELIGION_OPTIONS } from './jobAppConstants';
import {
  getYesterdayStr,
  getMaxDobStr,
  sanitizeField,
  validateSingleField,
  validatePhonesList,
  validateEdusList,
  validateEngList
} from './jobAppValidation';

export function useJobApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. จำลองชื่อตำแหน่งงาน
  const [jobTitle, setJobTitle] = useState("กำลังโหลดข้อมูลตำแหน่งงาน...");

  // Fetch job title on mount & Check if already applied
  useEffect(() => {
    fetch(`http://localhost:3000/api/job-search/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setJobTitle(data.data.title);
        } else {
          setJobTitle("ไม่พบข้อมูลตำแหน่งงาน");
        }
      })
      .catch(err => {
        console.error("Error fetching job details:", err);
        setJobTitle("ไม่พบข้อมูลตำแหน่งงาน");
      });

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.citizenId && id) {
      const emailParam = currentUser.email ? `?email=${encodeURIComponent(currentUser.email.trim())}` : '';
      fetch(`http://localhost:3000/api/applications/check-status/${id}/${currentUser.citizenId}${emailParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.hasApplied) {
            const roundText = data.currentRound || data.application?.Round_no ? ` (รอบที่ ${data.currentRound || data.application?.Round_no})` : '';
            alert(`ท่านได้ยื่นสมัครในตำแหน่งนี้${roundText} เรียบร้อยแล้ว ไม่สามารถสมัครซ้ำได้`);
            navigate('/my-applications');
          }
        })
        .catch(err => console.error("Error checking applied status:", err));
    }

    fetch('http://localhost:3000/api/request-job/options')
      .then(res => res.json())
      .then(result => {
        if (result.success && result.engExamTypes && result.engExamTypes.length > 0) {
          setEngTestOptions(result.engExamTypes.map(e => e.name));
        }
      })
      .catch(err => console.error("Error fetching eng exam options:", err));
  }, [id, navigate]);

  // Multi-Step Form (Stepper 6 ขั้นตอน)
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // เอกสารแนบใน Step 6
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [files, setFiles] = useState({});
  const [extraDocFiles, setExtraDocFiles] = useState({});
  const [additionalDocs, setAdditionalDocs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3000/api/job-search/${id}/documents`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequiredDocs(data.documents || []);
        }
      })
      .catch(err => console.error("Error fetching documents:", err));
  }, [id]);

  const handleFileUpload = (e, fieldName) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => ({ ...prev, [fieldName]: e.target.files[0] }));
    }
  };

  const removeMainFile = (fieldName) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const addExtraDocFile = (docId) => {
    setExtraDocFiles(prev => ({
      ...prev,
      [docId]: [
        ...(prev[docId] || []),
        { id: Date.now() + Math.random(), file: null, name: "", size: "" }
      ]
    }));
  };

  const removeExtraDocFile = (docId, fileId) => {
    setExtraDocFiles(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).filter(f => f.id !== fileId)
    }));
  };

  const handleExtraDocFileChange = (docId, fileId, e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setExtraDocFiles(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).map(f => {
        if (f.id === fileId) {
          return {
            ...f,
            file: file,
            name: file ? file.name : "",
            size: file ? (file.size / 1024 < 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`) : ""
          };
        }
        return f;
      })
    }));
  };

  const addAdditionalDoc = () => {
    setAdditionalDocs(prev => [
      ...prev,
      { id: Date.now() + Math.random(), title: "", file: null, name: "", size: "" }
    ]);
  };

  const removeAdditionalDoc = (idToRemove) => {
    setAdditionalDocs(prev => prev.filter(d => d.id !== idToRemove));
  };

  const handleAdditionalDocChange = (docId, field, value) => {
    setAdditionalDocs(prev => prev.map(d => {
      if (d.id === docId) {
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const handleAdditionalDocFile = (docId, e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setAdditionalDocs(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          file: file,
          name: file ? file.name : "",
          size: file ? (file.size / 1024 < 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`) : ""
        };
      }
      return d;
    }));
  };

  const maxAllowedDateStr = getYesterdayStr();
  const maxDobStr = getMaxDobStr();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Accordion state
  const [expanded, setExpanded] = useState({
    s1: true,
    s2: false,
    s3: false,
    s4: false,
    s5: false
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Form values & errors
  const [formValues, setFormValues] = useState({
    citizenId: "",
    email: "",
    firstName: "",
    lastName: "",
    houseNo: "",
    villageNo: "",
    alley: "",
    street: "",
    fatherName: "",
    fatherJob: "",
    motherName: "",
    motherJob: "",
    spouseName: "",
    spouseJob: "",
    specialSkill: "",
    foreignLanguage: "",
    currentJob: "",
    workplace: "",
    workExperience: "",
    staffType: "",
    contractAgency: "",
    contractName: "",
    staffAffiliation: "",
    staffAffiliationIncome: ""
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [phoneErrors, setPhoneErrors] = useState({});
  const [eduErrors, setEduErrors] = useState({});
  const [engErrors, setEngErrors] = useState({});

  const [obligation, setObligation] = useState("ไม่มี");

  const handleFieldChange = (name, rawVal) => {
    const cleanVal = sanitizeField(name, rawVal);
    setFormValues(prev => ({ ...prev, [name]: cleanVal }));

    const el = document.getElementById(name);
    if (el && el.value !== cleanVal) {
      el.value = cleanVal;
    }

    const err = validateSingleField(name, cleanVal, obligation);
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const getInputClass = (name, isRequired = false) => {
    if (fieldErrors[name]) return 'border-ku-invalid is-invalid';
    const val = formValues[name];
    if (val && String(val).trim()) return 'border-ku-filled';
    return isRequired ? 'border-ku-required' : '';
  };

  const renderFieldError = (name) => {
    if (!fieldErrors[name]) return null;
    return (
      <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
        <i className="bi bi-exclamation-circle-fill me-1"></i>
        {fieldErrors[name]}
      </div>
    );
  };

  // DOB & Age
  const [dob, setDob] = useState("");
  const [age, setAge] = useState({ years: "", months: "" });

  const handleDobChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate && selectedDate > maxDobStr) {
      setDob(selectedDate);
      setFieldErrors(prev => ({
        ...prev,
        dob: "ผู้สมัครต้องมีอายุอย่างน้อย 18 ปีบริบูรณ์ และไม่สามารถเลือกวันเกิดในอนาคตได้"
      }));
      setAge({ years: "", months: "" });
      return;
    }
    setDob(selectedDate);
    setFieldErrors(prev => ({
      ...prev,
      dob: selectedDate ? "" : "กรุณาระบุวัน/เดือน/ปีเกิด"
    }));

    if (selectedDate) {
      const birthDate = new Date(selectedDate);
      const today = new Date();

      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();

      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
      }
      setAge({ years, months });
    } else {
      setAge({ years: "", months: "" });
    }
  };

  // Provinces & Address (sourced from DB)
  const [provinces, setProvinces] = useState([]);
  const [birthProvince, setBirthProvince] = useState("");
  const [addressDataMap, setAddressDataMap] = useState({});

  const [prefixType, setPrefixType] = useState("");
  const [customPrefix, setCustomPrefix] = useState("");

  const [nationalityType, setNationalityType] = useState("ไทย");
  const [customNationality, setCustomNationality] = useState("");

  const [religionType, setReligionType] = useState("");
  const [customReligion, setCustomReligion] = useState("");

  // Family Info
  const [fatherNationalityType, setFatherNationalityType] = useState("ไทย");
  const [customFatherNationality, setCustomFatherNationality] = useState("");
  const [fatherReligionType, setFatherReligionType] = useState("");
  const [customFatherReligion, setCustomFatherReligion] = useState("");

  const [motherNationalityType, setMotherNationalityType] = useState("ไทย");
  const [customMotherNationality, setCustomMotherNationality] = useState("");
  const [motherReligionType, setMotherReligionType] = useState("");
  const [customMotherReligion, setCustomMotherReligion] = useState("");

  const [spouseNationalityType, setSpouseNationalityType] = useState("");
  const [customSpouseNationality, setCustomSpouseNationality] = useState("");
  const [spouseReligionType, setSpouseReligionType] = useState("");
  const [customSpouseReligion, setCustomSpouseReligion] = useState("");

  const getPrefixVal = () => prefixType === "อื่นๆ" ? customPrefix : prefixType;
  const getNationalityVal = () => nationalityType === "อื่นๆ" ? customNationality : nationalityType;
  const getReligionVal = () => religionType === "อื่นๆ" ? customReligion : religionType;

  const getFatherNationalityVal = () => fatherNationalityType === "อื่นๆ" ? customFatherNationality : fatherNationalityType;
  const getFatherReligionVal = () => fatherReligionType === "อื่นๆ" ? customFatherReligion : fatherReligionType;

  const getMotherNationalityVal = () => motherNationalityType === "อื่นๆ" ? customMotherNationality : motherNationalityType;
  const getMotherReligionVal = () => motherReligionType === "อื่นๆ" ? customMotherReligion : motherReligionType;

  const getSpouseNationalityVal = () => spouseNationalityType === "อื่นๆ" ? customSpouseNationality : spouseNationalityType;
  const getSpouseReligionVal = () => spouseReligionType === "อื่นๆ" ? customSpouseReligion : spouseReligionType;

  useEffect(() => {
    fetch('http://localhost:3000/api/provinces')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setProvinces(data.data);
        }
      })
      .catch(err => console.error("Error fetching provinces from DB:", err));
  }, []);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedAmphoe, setSelectedAmphoe] = useState("");
  const [selectedTambon, setSelectedTambon] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [subdistrictId, setSubdistrictId] = useState(null);

  const handleProvinceChange = async (e) => {
    const prov = e.target.value;
    setSelectedProvince(prov);
    setSelectedAmphoe("");
    setSelectedTambon("");
    setZipcode("");
    setFieldErrors(prev => ({
      ...prev,
      selectedProvince: prov ? '' : 'กรุณาเลือกจังหวัดที่อยู่',
      selectedAmphoe: '',
      selectedTambon: ''
    }));

    if (prov && !addressDataMap[prov]) {
      try {
        const res = await fetch(`http://localhost:3000/api/provinces/hierarchy/${encodeURIComponent(prov)}`);
        const data = await res.json();
        if (data.success && data.data && Object.keys(data.data).length > 0) {
          setAddressDataMap(prev => ({ ...prev, [prov]: data.data }));
        }
      } catch (err) {
        console.error("Error fetching hierarchy from DB:", err);
      }
    }
  };

  const handleAmphoeChange = (e) => {
    const amp = e.target.value;
    setSelectedAmphoe(amp);
    setSelectedTambon("");
    setFieldErrors(prev => ({
      ...prev,
      selectedAmphoe: amp ? '' : 'กรุณาเลือกหรือระบุอำเภอ/เขต',
      selectedTambon: ''
    }));

    if (selectedProvince && addressDataMap[selectedProvince] && addressDataMap[selectedProvince][amp]) {
      const firstTambon = addressDataMap[selectedProvince][amp][0];
      if (firstTambon && firstTambon.zip) {
        setZipcode(firstTambon.zip);
      } else {
        setZipcode("");
      }
    } else {
      setZipcode("");
    }
  };

  const handleTambonChange = (e) => {
    const tambonName = e.target.value;
    setSelectedTambon(tambonName);
    setFieldErrors(prev => ({
      ...prev,
      selectedTambon: tambonName ? '' : 'กรุณาเลือกหรือระบุตำบล/แขวง'
    }));

    if (tambonName && selectedProvince && selectedAmphoe && addressDataMap[selectedProvince] && addressDataMap[selectedProvince][selectedAmphoe]) {
      const tambonList = addressDataMap[selectedProvince][selectedAmphoe];
      const foundTambon = tambonList.find(t => t.name === tambonName);
      if (foundTambon) {
        if (foundTambon.zip) {
          setZipcode(foundTambon.zip);
        }
        if (foundTambon.id) {
          setSubdistrictId(foundTambon.id);
        }
      }
    }
  };

  // Mobile phones
  const [mobilePhones, setMobilePhones] = useState([""]);

  const handleMobilePhoneChange = (index, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 10);
    const newPhones = [...mobilePhones];
    newPhones[index] = clean;
    setMobilePhones(newPhones);
    const errs = validatePhonesList(newPhones);
    setPhoneErrors(errs);
  };
  const addMobilePhone = () => {
    const newPhones = [...mobilePhones, ""];
    setMobilePhones(newPhones);
    const errs = validatePhonesList(newPhones);
    setPhoneErrors(errs);
  };
  const removeMobilePhone = (index) => {
    const newPhones = mobilePhones.filter((_, i) => i !== index);
    setMobilePhones(newPhones);
    const errs = validatePhonesList(newPhones);
    setPhoneErrors(errs);
  };

  // Education
  const [educations, setEducations] = useState([{ degree: "", major: "", gpa: "", university: "", country: "ไทย", approvalDate: "" }]);

  const handleEducationDegreeTypeChange = (index, value) => {
    const newEdu = [...educations];
    if (value === 'อื่นๆ') {
      const prevCustom = newEdu[index].customDegree || (!DEGREE_OPTIONS.includes(newEdu[index].degree) ? newEdu[index].degree : '');
      newEdu[index] = {
        ...newEdu[index],
        degreeType: 'อื่นๆ',
        isCustomDegree: true,
        degree: prevCustom || '',
        customDegree: prevCustom || ''
      };
    } else {
      newEdu[index] = {
        ...newEdu[index],
        degreeType: value,
        isCustomDegree: false,
        degree: value,
        customDegree: ''
      };
    }
    setEducations(newEdu);
    const errs = validateEdusList(newEdu, maxAllowedDateStr, dob);
    setEduErrors(errs);
  };

  const handleEducationCustomDegreeChange = (index, value) => {
    const cleanVal = value.replace(/[<>]/g, '').slice(0, 150);
    const newEdu = [...educations];
    newEdu[index] = {
      ...newEdu[index],
      degreeType: 'อื่นๆ',
      isCustomDegree: true,
      customDegree: cleanVal,
      degree: cleanVal
    };
    setEducations(newEdu);
    const errs = validateEdusList(newEdu, maxAllowedDateStr, dob);
    setEduErrors(errs);
  };

  const handleEducationChange = (index, field, value) => {
    let cleanVal = value;
    if (field === 'gpa') {
      let clean = value.replace(/[^0-9.]/g, '');
      const parts = clean.split('.');
      if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
      if (parts[1] && parts[1].length > 2) clean = parts[0] + '.' + parts[1].slice(0, 2);
      cleanVal = clean;
    } else if (['degree', 'major', 'university', 'country'].includes(field)) {
      cleanVal = value.replace(/[<>]/g, '').slice(0, 150);
    }
    const newEdu = [...educations];
    newEdu[index][field] = cleanVal;
    setEducations(newEdu);
    const errs = validateEdusList(newEdu, maxAllowedDateStr, dob);
    setEduErrors(errs);
  };

  const addEducation = () => {
    const newEdu = [...educations, { degree: "", major: "", gpa: "", university: "", country: "ไทย", approvalDate: "" }];
    setEducations(newEdu);
    const errs = validateEdusList(newEdu, maxAllowedDateStr, dob);
    setEduErrors(errs);
  };

  const removeEducation = (index) => {
    const newEdu = educations.filter((_, i) => i !== index);
    setEducations(newEdu);
    const errs = validateEdusList(newEdu, maxAllowedDateStr, dob);
    setEduErrors(errs);
  };

  // English tests
  const [engTests, setEngTests] = useState([]);
  const [engTestOptions, setEngTestOptions] = useState([]);

  const handleEngTestChange = (index, field, value) => {
    let cleanVal = value;
    if (field === 'score') {
      let clean = value.replace(/[^0-9.]/g, '');
      const parts = clean.split('.');
      if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
      cleanVal = clean.slice(0, 10);
    }
    const newTests = [...engTests];
    newTests[index][field] = cleanVal;
    setEngTests(newTests);
    const errs = validateEngList(newTests, maxAllowedDateStr, dob);
    setEngErrors(errs);
  };
  const addEngTest = () => setEngTests([...engTests, { testName: "", score: "", examDate: "" }]);
  const removeEngTest = (index) => setEngTests(engTests.filter((_, i) => i !== index));

  // Save Draft Modal states
  const [saveDraftModalOpen, setSaveDraftModalOpen] = useState(false);
  const [saveDraftStatus, setSaveDraftStatus] = useState('confirm'); // 'confirm' | 'saving' | 'success' | 'error' | 'warning'
  const [saveDraftWarningType, setSaveDraftWarningType] = useState(null); // 'credentials' | 'general'
  const [saveDraftMessage, setSaveDraftMessage] = useState('');

  // Draft operations - เปิด Popup แทน window.confirm และ alert
  const handleSaveDraft = () => {
    // ตรวจสอบเลขประจำตัวประชาชน และ อีเมล ต้องครบถ้วนก่อนจึงบันทึกแบบร่างได้
    const cid = (formValues.citizenId || document.getElementById('citizenId')?.value || "").trim();
    const em = (formValues.email || document.getElementById('email')?.value || "").trim();

    const isCidComplete = cid.length === 13 && /^\d{13}$/.test(cid);
    const isEmailComplete = em.length > 0 && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(em);

    if (!isCidComplete || !isEmailComplete) {
      setSaveDraftStatus('warning');
      setSaveDraftWarningType('credentials');
      setSaveDraftMessage("ต้องกรอกบัตรประชาชนและอีเมลให้ครบก่อน จึงบันทึกแบบร่างได้");
      setSaveDraftModalOpen(true);
      return;
    }

    if (dob && dob > maxDobStr) {
      setSaveDraftStatus('warning');
      setSaveDraftWarningType('general');
      setSaveDraftMessage("ผู้สมัครต้องมีอายุอย่างน้อย 18 ปีบริบูรณ์ และไม่สามารถเลือกวันเกิดในอนาคตได้");
      setSaveDraftModalOpen(true);
      return;
    }
    for (const edu of educations) {
      if (edu.approvalDate && edu.approvalDate > maxAllowedDateStr) {
        setSaveDraftStatus('warning');
        setSaveDraftWarningType('general');
        setSaveDraftMessage("วันที่ได้รับอนุมัติผลการศึกษาต้องเป็นวันที่ก่อนหน้าวันสมัคร (อย่างน้อย 1 วัน)");
        setSaveDraftModalOpen(true);
        return;
      }
    }
    for (const test of engTests) {
      if (test.examDate && test.examDate > maxAllowedDateStr) {
        setSaveDraftStatus('warning');
        setSaveDraftWarningType('general');
        setSaveDraftMessage("วันที่สอบภาษาอังกฤษต้องเป็นวันที่ก่อนหน้าวันสมัคร (อย่างน้อย 1 วัน)");
        setSaveDraftModalOpen(true);
        return;
      }
    }

    setSaveDraftStatus('confirm');
    setSaveDraftWarningType(null);
    setSaveDraftMessage("");
    setSaveDraftModalOpen(true);
  };

  const handleExecuteSaveDraft = async () => {
    setSaveDraftStatus('saving');
    const draftData = {
      currentStep: currentStep,
      maxStepReached: maxStepReached,
      citizenId: formValues.citizenId || document.getElementById('citizenId')?.value || "",
      prefix: getPrefixVal(),
      firstName: formValues.firstName || document.getElementById('firstName')?.value || "",
      lastName: formValues.lastName || document.getElementById('lastName')?.value || "",
      religion: getReligionVal(),
      nationality: getNationalityVal(),
      email: formValues.email || document.getElementById('email')?.value || "",
      dob: dob,
      ageYears: age.years,
      ageMonths: age.months,
      houseNo: formValues.houseNo || document.getElementById('houseNo')?.value || "",
      villageNo: formValues.villageNo || document.getElementById('villageNo')?.value || "",
      alley: formValues.alley || document.getElementById('alley')?.value || "",
      street: formValues.street || document.getElementById('street')?.value || "",
      birthProvince: birthProvince || selectedProvince,
      selectedProvince: selectedProvince,
      selectedAmphoe: selectedAmphoe,
      selectedTambon: selectedTambon,
      province: selectedProvince,
      district: selectedAmphoe,
      subdistrict: selectedTambon,
      zipcode: zipcode,
      postalCode: zipcode,
      subdistrictId: subdistrictId,
      mobilePhone: mobilePhones[0] || "",
      mobilePhones: mobilePhones,
      educations: educations,
      engTests: engTests,
      fatherName: formValues.fatherName || document.getElementById('fatherName')?.value || "",
      fatherNationality: getFatherNationalityVal(),
      fatherReligion: getFatherReligionVal(),
      fatherJob: formValues.fatherJob || document.getElementById('fatherJob')?.value || "",
      motherName: formValues.motherName || document.getElementById('motherName')?.value || "",
      motherNationality: getMotherNationalityVal(),
      motherReligion: getMotherReligionVal(),
      motherJob: formValues.motherJob || document.getElementById('motherJob')?.value || "",
      spouseName: formValues.spouseName || document.getElementById('spouseName')?.value || "",
      spouseNationality: getSpouseNationalityVal(),
      spouseReligion: getSpouseReligionVal(),
      spouseJob: formValues.spouseJob || document.getElementById('spouseJob')?.value || "",
      specialSkill: formValues.specialSkill || document.getElementById('specialSkill')?.value || "",
      foreignLanguage: formValues.foreignLanguage || document.getElementById('foreignLanguage')?.value || "",
      currentJob: formValues.currentJob || document.getElementById('currentJob')?.value || "",
      workplace: formValues.workplace || document.getElementById('workplace')?.value || "",
      workExperience: formValues.workExperience || document.getElementById('workExperience')?.value || "",
      obligation: obligation,
      contractAgency: formValues.contractAgency || document.getElementById('contractAgency')?.value || "",
      contractName: formValues.contractName || document.getElementById('contractName')?.value || "",
      staffType: formValues.staffType || (document.getElementById('staffType')?.value && document.getElementById('staffType')?.value !== 'ไม่ได้เป็น' ? document.getElementById('staffType')?.value : "") || "",
      staffAffiliation: formValues.staffAffiliation || document.getElementById('staffAffiliation')?.value || "",
      staffAffiliationIncome: formValues.staffAffiliationIncome || document.getElementById('staffAffiliationIncome')?.value || ""
    };

    try {
      const response = await fetch(`http://localhost:3000/api/applications/${id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      });
      const data = await response.json();
      if (data.success) {
        setSaveDraftStatus('success');
        setSaveDraftMessage(data.message || "บันทึกแบบร่างเรียบร้อยแล้ว!");
      } else {
        setSaveDraftStatus('error');
        setSaveDraftMessage(data.message || "ไม่สามารถบันทึกแบบร่างได้");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaveDraftStatus('error');
      setSaveDraftMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCloseSaveDraftModal = () => {
    setSaveDraftModalOpen(false);
    setSaveDraftStatus('confirm');
    setSaveDraftWarningType(null);
    setSaveDraftMessage('');
  };

  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [inputCitizenId, setInputCitizenId] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  const handleLoadDraft = async () => {
    if (!inputCitizenId.trim() || !inputEmail.trim()) {
      alert("กรุณากรอกทั้งเลขประจำตัวประชาชนและอีเมลก่อนกดดึงข้อมูล");
      return;
    }

    setIsLoadingDraft(true);
    try {
      const response = await fetch(`http://localhost:3000/api/applications/${id}/draft/${encodeURIComponent(inputCitizenId.trim())}?email=${encodeURIComponent(inputEmail.trim())}`);
      const data = await response.json();

      if (data.success && data.draft) {
        const draft = data.draft;
        if (draft.Citizen_id && document.getElementById('citizenId')) document.getElementById('citizenId').value = draft.Citizen_id || inputCitizenId.trim();
        if (draft.Email && document.getElementById('email')) document.getElementById('email').value = draft.Email || inputEmail.trim();
        if (draft.First_name && document.getElementById('firstName')) document.getElementById('firstName').value = draft.First_name || '';
        if (draft.Last_name && document.getElementById('lastName')) document.getElementById('lastName').value = draft.Last_name || '';

        if (draft.Prefix) {
          if (["นาย", "นาง", "นางสาว", "ดร.", "ผศ.ดร.", "รศ.ดร.", "ศ.ดร.", "อาจารย์", "ว่าที่ ร.ต."].includes(draft.Prefix)) {
            setPrefixType(draft.Prefix);
            setCustomPrefix("");
          } else {
            setPrefixType("อื่นๆ");
            setCustomPrefix(draft.Prefix);
          }
        }
        if (draft.Nationality) {
          if (["ไทย", "ลาว", "พม่า", "กัมพูชา", "จีน", "ญี่ปุ่น"].includes(draft.Nationality)) {
            setNationalityType(draft.Nationality);
            setCustomNationality("");
          } else {
            setNationalityType("อื่นๆ");
            setCustomNationality(draft.Nationality);
          }
        }
        if (draft.Religion) {
          if (["พุทธ", "คริสต์", "อิสลาม", "ฮินดู", "ซิกข์", "ไม่ระบุ"].includes(draft.Religion)) {
            setReligionType(draft.Religion);
            setCustomReligion("");
          } else {
            setReligionType("อื่นๆ");
            setCustomReligion(draft.Religion);
          }
        }

        if (document.getElementById('houseNo')) document.getElementById('houseNo').value = draft.House_no || '';
        if (document.getElementById('villageNo')) document.getElementById('villageNo').value = draft.Village_no || '';
        if (document.getElementById('alley')) document.getElementById('alley').value = draft.Alley || '';
        if (document.getElementById('street')) document.getElementById('street').value = draft.Street || '';

        if (draft.Birth_day) {
          try {
            const raw = String(draft.Birth_day).trim();
            const dStr = raw.includes('T') ? raw.split('T')[0] : (raw.includes(' ') ? raw.split(' ')[0] : raw);
            setDob(dStr);
          } catch (e) { }
        }
        if (draft.Age_year !== null && draft.Age_month !== null) {
          setAge({ years: draft.Age_year, months: draft.Age_month });
        }
        if (draft.Birth_province) {
          setBirthProvince(draft.Birth_province);
        }

        if (document.getElementById('fatherName')) document.getElementById('fatherName').value = draft.Father_name || '';
        if (draft.Father_nationality) {
          if (draft.Father_nationality === "ไทย") {
            setFatherNationalityType("ไทย");
            setCustomFatherNationality("");
          } else {
            setFatherNationalityType("อื่นๆ");
            setCustomFatherNationality(draft.Father_nationality);
          }
        }
        if (draft.Father_religion) {
          if (RELIGION_OPTIONS.includes(draft.Father_religion)) {
            setFatherReligionType(draft.Father_religion);
            setCustomFatherReligion("");
          } else {
            setFatherReligionType("อื่นๆ");
            setCustomFatherReligion(draft.Father_religion);
          }
        }
        if (document.getElementById('fatherJob')) document.getElementById('fatherJob').value = draft.Father_job || '';

        if (document.getElementById('motherName')) document.getElementById('motherName').value = draft.Mother_name || '';
        if (draft.Mother_nationality) {
          if (draft.Mother_nationality === "ไทย") {
            setMotherNationalityType("ไทย");
            setCustomMotherNationality("");
          } else {
            setMotherNationalityType("อื่นๆ");
            setCustomMotherNationality(draft.Mother_nationality);
          }
        }
        if (draft.Mother_religion) {
          if (RELIGION_OPTIONS.includes(draft.Mother_religion)) {
            setMotherReligionType(draft.Mother_religion);
            setCustomMotherReligion("");
          } else {
            setMotherReligionType("อื่นๆ");
            setCustomMotherReligion(draft.Mother_religion);
          }
        }
        if (document.getElementById('motherJob')) document.getElementById('motherJob').value = draft.Mother_job || '';

        if (document.getElementById('spouseName')) document.getElementById('spouseName').value = draft.Spouse_name || '';
        if (draft.Spouse_nationality) {
          if (draft.Spouse_nationality === "ไทย") {
            setSpouseNationalityType("ไทย");
            setCustomSpouseNationality("");
          } else {
            setSpouseNationalityType("อื่นๆ");
            setCustomSpouseNationality(draft.Spouse_nationality);
          }
        }
        if (draft.Spouse_religion) {
          if (RELIGION_OPTIONS.includes(draft.Spouse_religion)) {
            setSpouseReligionType(draft.Spouse_religion);
            setCustomSpouseReligion("");
          } else {
            setSpouseReligionType("อื่นๆ");
            setCustomSpouseReligion(draft.Spouse_religion);
          }
        }
        if (document.getElementById('spouseJob')) document.getElementById('spouseJob').value = draft.Spouse_job || '';

        if (document.getElementById('specialSkill')) document.getElementById('specialSkill').value = draft.Special_skill || '';
        if (document.getElementById('foreignLanguage')) document.getElementById('foreignLanguage').value = draft.Foreign_language || '';
        if (document.getElementById('currentJob')) document.getElementById('currentJob').value = draft.Current_job || '';
        if (document.getElementById('workplace')) document.getElementById('workplace').value = draft.Workplace || '';
        if (document.getElementById('workExperience')) document.getElementById('workExperience').value = draft.Work_experience || draft.workExperience || '';

        if (draft.Subdistrict_id) setSubdistrictId(draft.Subdistrict_id);
        const prov = draft.Province || draft.selectedProvince || draft.Province_name || draft.Birth_province;
        if (prov) {
          setSelectedProvince(prov);
          try {
            const res = await fetch(`http://localhost:3000/api/provinces/hierarchy/${encodeURIComponent(prov)}`);
            const hData = await res.json();
            if (hData.success && hData.data) {
              setAddressDataMap(prev => ({ ...prev, [prov]: hData.data }));
            }
          } catch (e) { }
        }
        if (draft.District || draft.selectedAmphoe || draft.District_name) {
          setSelectedAmphoe(draft.District || draft.selectedAmphoe || draft.District_name);
        }
        if (draft.Subdistrict || draft.selectedTambon || draft.Subdistrict_name) {
          setSelectedTambon(draft.Subdistrict || draft.selectedTambon || draft.Subdistrict_name);
        }
        if (draft.Postal_code || draft.zipcode) {
          setZipcode(draft.Postal_code || draft.zipcode);
        }

        if (draft.mobilePhones && Array.isArray(draft.mobilePhones) && draft.mobilePhones.length > 0) {
          setMobilePhones(draft.mobilePhones);
        }
        if (draft.educations && Array.isArray(draft.educations) && draft.educations.length > 0) {
          setEducations(draft.educations.map(e => {
            const deg = e.degree || e.Applied_degree || "";
            const isStd = DEGREE_OPTIONS.includes(deg);
            return {
              degree: deg,
              degreeType: isStd ? deg : (deg ? "อื่นๆ" : ""),
              isCustomDegree: !isStd && Boolean(deg),
              customDegree: isStd ? "" : deg,
              major: e.major || e.Major || "",
              gpa: (e.gpa !== undefined && e.gpa !== null && e.gpa !== '') ? String(e.gpa) : (e.Gpa !== null && e.Gpa !== undefined ? String(e.Gpa) : ""),
              university: e.university || e.Institute_name || "",
              country: e.country || e.Country_name || "ไทย",
              approvalDate: e.approvalDate ? (typeof e.approvalDate === 'string' ? (e.approvalDate.includes('T') ? e.approvalDate.split('T')[0] : e.approvalDate.split(' ')[0]) : e.approvalDate) : (e.Approve_date ? (typeof e.Approve_date === 'string' ? (e.Approve_date.includes('T') ? e.Approve_date.split('T')[0] : e.Approve_date.split(' ')[0]) : "") : "")
            };
          }));
        }
        if (draft.engTests && Array.isArray(draft.engTests)) {
          setEngTests(draft.engTests.map(t => ({
            testName: t.testName || t.name || "",
            score: t.score !== undefined && t.score !== null ? String(t.score) : "",
            examDate: t.examDate ? (typeof t.examDate === 'string' ? (t.examDate.includes('T') ? t.examDate.split('T')[0] : t.examDate.split(' ')[0]) : t.examDate) : ""
          })));
        }
        if (draft.Has_contract_obligation) {
          setObligation(draft.Has_contract_obligation);
        }
        if (draft.Contract_agency && document.getElementById('contractAgency')) {
          document.getElementById('contractAgency').value = draft.Contract_agency;
        }
        if (draft.Contract_name && document.getElementById('contractName')) {
          document.getElementById('contractName').value = draft.Contract_name;
        }
        if (draft.University_staff_affiliation && document.getElementById('staffAffiliation')) {
          document.getElementById('staffAffiliation').value = draft.University_staff_affiliation;
        }
        if (draft.University_staff_affiliation_income && document.getElementById('staffAffiliationIncome')) {
          document.getElementById('staffAffiliationIncome').value = draft.University_staff_affiliation_income;
        }
        if (draft.Staff_type && document.getElementById('staffType')) {
          document.getElementById('staffType').value = draft.Staff_type;
        }

        setFormValues({
          citizenId: draft.Citizen_id || inputCitizenId.trim() || '',
          email: draft.Email || inputEmail.trim() || '',
          firstName: draft.First_name || '',
          lastName: draft.Last_name || '',
          houseNo: draft.House_no || '',
          villageNo: draft.Village_no || '',
          alley: draft.Alley || '',
          street: draft.Street || '',
          fatherName: draft.Father_name || '',
          fatherJob: draft.Father_job || '',
          motherName: draft.Mother_name || '',
          motherJob: draft.Mother_job || '',
          spouseName: draft.Spouse_name || '',
          spouseJob: draft.Spouse_job || '',
          specialSkill: draft.Special_skill || '',
          foreignLanguage: draft.Foreign_language || '',
          currentJob: draft.Current_job || '',
          workplace: draft.Workplace || '',
          workExperience: draft.Work_experience || draft.workExperience || '',
          staffType: draft.Staff_type || '',
          contractAgency: draft.Contract_agency || '',
          contractName: draft.Contract_name || '',
          staffAffiliation: draft.University_staff_affiliation || '',
          staffAffiliationIncome: draft.University_staff_affiliation_income || ''
        });
        setFieldErrors({});
        setPhoneErrors({});
        setEduErrors({});
        setEngErrors({});

        // 📍 ตรวจสอบความสมบูรณ์ของแต่ละขั้นตอนแบบเรียงลำดับ (Sequential Check)
        // เพื่อป้องกันไม่ให้ขั้นตอนกระโดดข้ามขั้นที่ยังกรอกไม่เสร็จ
        
        // 1. ตรวจสอบขั้นตอนที่ 1: ข้อมูลส่วนตัว
        const isStep1Done = Boolean(
          (draft.Citizen_id || inputCitizenId) &&
          (draft.Email || inputEmail) &&
          (draft.First_name && String(draft.First_name).trim()) &&
          (draft.Last_name && String(draft.Last_name).trim()) &&
          (draft.Prefix && String(draft.Prefix).trim()) &&
          draft.Birth_day &&
          (draft.Nationality && String(draft.Nationality).trim()) &&
          (draft.Religion && String(draft.Religion).trim()) &&
          (draft.Birth_province || draft.Province)
        );

        // 2. ตรวจสอบขั้นตอนที่ 2: ที่อยู่และการติดต่อ (ต้องผ่านขั้น 1 ก่อน)
        const hasMobilePhone = Boolean(
          draft.mobilePhones && 
          Array.isArray(draft.mobilePhones) && 
          draft.mobilePhones.some(p => String(p || '').replace(/[^0-9]/g, '').length >= 9)
        );
        const isStep2Done = isStep1Done && Boolean(
          draft.House_no && String(draft.House_no).trim() &&
          (draft.Province || draft.selectedProvince || draft.Province_name) &&
          (draft.District || draft.selectedAmphoe || draft.District_name) &&
          (draft.Subdistrict || draft.selectedTambon || draft.Subdistrict_name) &&
          hasMobilePhone
        );

        // 3. ตรวจสอบขั้นตอนที่ 3: ข้อมูลครอบครัว (ต้องผ่านขั้น 1 และ 2 ก่อน)
        const isStep3Done = isStep2Done && Boolean(
          draft.Father_name && String(draft.Father_name).trim() &&
          draft.Mother_name && String(draft.Mother_name).trim()
        );

        // 4. ตรวจสอบขั้นตอนที่ 4: ประวัติการศึกษา (ต้องผ่านขั้น 1, 2, 3 ก่อน)
        const isStep4Done = isStep3Done && Boolean(
          draft.educations && 
          Array.isArray(draft.educations) && 
          draft.educations.length > 0 &&
          draft.educations.some(e => e && (e.degree || e.Applied_degree) && String(e.degree || e.Applied_degree).trim())
        );

        // 5. ตรวจสอบขั้นตอนที่ 5: ประวัติการทำงานและภาระผูกพัน (ต้องผ่านขั้น 1, 2, 3, 4 ก่อน)
        const isStep5Done = isStep4Done && Boolean(
          draft.Has_contract_obligation &&
          (draft.Has_contract_obligation === 'ไม่มี' || (draft.Contract_agency && draft.Contract_name))
        );

        // ลำดับขั้นตอนที่ควรแสดงผล: อยู่ที่ขั้นตอนแรกที่ยังกรอกไม่เสร็จเสมอ
        let targetStep = 1;
        if (isStep5Done) {
          targetStep = 6;
        } else if (isStep4Done) {
          targetStep = 5;
        } else if (isStep3Done) {
          targetStep = 4;
        } else if (isStep2Done) {
          targetStep = 3;
        } else if (isStep1Done) {
          targetStep = 2;
        } else {
          targetStep = 1;
        }

        // อัปเดตทั้ง currentStep และ maxStepReached ตามข้อมูลจริงที่ผ่านการตรวจสอบ
        setCurrentStep(targetStep);
        setMaxStepReached(targetStep);

        alert(data.message || "ดึงข้อมูลเรียบร้อยแล้ว!");
        setLoadModalOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(refreshInputBorders, 60);
      } else {
        alert(data.message || "ไม่พบแบบร่างหรือประวัติการสมัครเดิมที่ตรงกับเลขประจำตัวประชาชนและอีเมลนี้");
      }
    } catch (err) {
      console.error("Error loading draft:", err);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const refreshInputBorders = () => {
    ['citizenId', 'email', 'firstName', 'lastName', 'houseNo', 'fatherName', 'motherName'].forEach(elemId => {
      const el = document.getElementById(elemId);
      if (el) {
        if ((el.value || '').trim()) {
          el.classList.add('border-ku-filled');
          el.classList.remove('border-ku-required');
        } else {
          el.classList.add('border-ku-required');
          el.classList.remove('border-ku-filled');
        }
      }
    });
  };

  useEffect(() => {
    refreshInputBorders();
  }, [currentStep]);

  // Step validation
  const validateStep = async (stepNum) => {
    const newErrors = {};
    let firstInvalidId = null;

    if (stepNum === 1) {
      const cId = (formValues.citizenId || document.getElementById('citizenId')?.value || '').trim();
      const cIdErr = validateSingleField('citizenId', cId, obligation);
      if (cIdErr) {
        newErrors.citizenId = cIdErr;
        if (!firstInvalidId) firstInvalidId = 'citizenId';
      }

      const em = (formValues.email || document.getElementById('email')?.value || '').trim();
      const emErr = validateSingleField('email', em, obligation);
      if (emErr) {
        newErrors.email = emErr;
        if (!firstInvalidId) firstInvalidId = 'email';
      }

      if (!prefixType) {
        newErrors.prefixType = 'กรุณาเลือกคำนำหน้าชื่อ';
        if (!firstInvalidId) firstInvalidId = 'prefixType';
      } else if (prefixType === 'อื่นๆ') {
        const cpErr = !customPrefix.trim() ? 'กรุณาระบุคำนำหน้าชื่อ' : (customPrefix.trim().length < 2 ? 'คำนำหน้าต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (cpErr) {
          newErrors.customPrefix = cpErr;
          if (!firstInvalidId) firstInvalidId = 'customPrefix';
        }
      }

      const fn = (formValues.firstName || document.getElementById('firstName')?.value || '').trim();
      const fnErr = validateSingleField('firstName', fn, obligation);
      if (fnErr) {
        newErrors.firstName = fnErr;
        if (!firstInvalidId) firstInvalidId = 'firstName';
      }

      const ln = (formValues.lastName || document.getElementById('lastName')?.value || '').trim();
      const lnErr = validateSingleField('lastName', ln, obligation);
      if (lnErr) {
        newErrors.lastName = lnErr;
        if (!firstInvalidId) firstInvalidId = 'lastName';
      }

      if (!dob) {
        newErrors.dob = 'กรุณาระบุวัน/เดือน/ปีเกิด';
        if (!firstInvalidId) firstInvalidId = 'dob';
      } else if (dob > maxDobStr) {
        newErrors.dob = 'ผู้สมัครต้องมีอายุอย่างน้อย 18 ปีบริบูรณ์ และไม่สามารถเลือกวันเกิดในอนาคตได้';
        if (!firstInvalidId) firstInvalidId = 'dob';
      }

      if (!nationalityType) {
        newErrors.nationalityType = 'กรุณาเลือกสัญชาติ';
        if (!firstInvalidId) firstInvalidId = 'nationalityType';
      } else if (nationalityType === 'อื่นๆ') {
        const cnErr = !customNationality.trim() ? 'กรุณาระบุสัญชาติ' : (customNationality.trim().length < 2 ? 'สัญชาติต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (cnErr) {
          newErrors.customNationality = cnErr;
          if (!firstInvalidId) firstInvalidId = 'customNationality';
        }
      }

      if (!religionType) {
        newErrors.religionType = 'กรุณาเลือกศาสนา';
        if (!firstInvalidId) firstInvalidId = 'religionType';
      } else if (religionType === 'อื่นๆ') {
        const crErr = !customReligion.trim() ? 'กรุณาระบุศาสนา' : (customReligion.trim().length < 2 ? 'ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (crErr) {
          newErrors.customReligion = crErr;
          if (!firstInvalidId) firstInvalidId = 'customReligion';
        }
      }

      if (!birthProvince) {
        newErrors.birthProvince = 'กรุณาเลือกจังหวัดที่เกิด';
        if (!firstInvalidId) firstInvalidId = 'birthProvince';
      }

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...newErrors }));
        if (firstInvalidId) {
          const el = document.getElementById(firstInvalidId);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return false;
      }

      try {
        const res = await fetch(`http://localhost:3000/api/applications/check-status/${id}/${encodeURIComponent(cId)}`);
        const data = await res.json();
        if (data.success && data.hasApplied) {
          const roundText = data.currentRound || data.application?.Round_no ? ` (รอบที่ ${data.currentRound || data.application?.Round_no})` : '';
          const errMsg = `เลขประจำตัวประชาชน (${cId}) ได้ยื่นสมัครในตำแหน่งนี้${roundText} เรียบร้อยแล้ว ไม่สามารถยื่นสมัครซ้ำได้`;
          setFieldErrors(prev => ({ ...prev, citizenId: errMsg }));
          const el = document.getElementById('citizenId');
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return false;
        }
      } catch (e) {
        console.error("Error verifying citizen status:", e);
      }
    }

    if (stepNum === 2) {
      if (!selectedProvince) {
        newErrors.selectedProvince = 'กรุณาเลือกจังหวัดที่อยู่';
        if (!firstInvalidId) firstInvalidId = 'selectedProvince';
      }
      if (!selectedAmphoe) {
        newErrors.selectedAmphoe = 'กรุณาเลือกหรือระบุอำเภอ/เขต';
        if (!firstInvalidId) firstInvalidId = 'selectedAmphoe';
      }
      if (!selectedTambon) {
        newErrors.selectedTambon = 'กรุณาเลือกหรือระบุตำบล/แขวง';
        if (!firstInvalidId) firstInvalidId = 'selectedTambon';
      }

      const hn = (formValues.houseNo || document.getElementById('houseNo')?.value || '').trim();
      const hnErr = validateSingleField('houseNo', hn, obligation);
      if (hnErr) {
        newErrors.houseNo = hnErr;
        if (!firstInvalidId) firstInvalidId = 'houseNo';
      }

      const pErrors = validatePhonesList(mobilePhones);
      if (Object.keys(pErrors).length > 0) {
        if (!firstInvalidId) firstInvalidId = 'mobilePhone_0';
      }

      if (Object.keys(newErrors).length > 0 || Object.keys(pErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...newErrors }));
        if (firstInvalidId) {
          const el = document.getElementById(firstInvalidId);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return false;
      }
    }

    if (stepNum === 3) {
      const fn = (formValues.fatherName || document.getElementById('fatherName')?.value || '').trim();
      const fnErr = validateSingleField('fatherName', fn, obligation);
      if (fnErr) {
        newErrors.fatherName = fnErr;
        if (!firstInvalidId) firstInvalidId = 'fatherName';
      }

      if (!fatherNationalityType) {
        newErrors.fatherNationalityType = 'กรุณาระบุสัญชาติบิดา';
        if (!firstInvalidId) firstInvalidId = 'fatherNationalityType';
      } else if (fatherNationalityType === 'อื่นๆ') {
        const fnErr2 = !customFatherNationality.trim() ? 'กรุณาระบุสัญชาติบิดา' : (customFatherNationality.trim().length < 2 ? 'สัญชาติต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (fnErr2) {
          newErrors.customFatherNationality = fnErr2;
          if (!firstInvalidId) firstInvalidId = 'customFatherNationality';
        }
      }

      if (!fatherReligionType) {
        newErrors.fatherReligionType = 'กรุณาเลือกศาสนาบิดา';
        if (!firstInvalidId) firstInvalidId = 'fatherReligionType';
      } else if (fatherReligionType === 'อื่นๆ') {
        const frErr = !customFatherReligion.trim() ? 'กรุณาระบุศาสนาบิดา' : (customFatherReligion.trim().length < 2 ? 'ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (frErr) {
          newErrors.customFatherReligion = frErr;
          if (!firstInvalidId) firstInvalidId = 'customFatherReligion';
        }
      }

      const mn = (formValues.motherName || document.getElementById('motherName')?.value || '').trim();
      const mnErr = validateSingleField('motherName', mn, obligation);
      if (mnErr) {
        newErrors.motherName = mnErr;
        if (!firstInvalidId) firstInvalidId = 'motherName';
      }

      if (!motherNationalityType) {
        newErrors.motherNationalityType = 'กรุณาระบุสัญชาติมารดา';
        if (!firstInvalidId) firstInvalidId = 'motherNationalityType';
      } else if (motherNationalityType === 'อื่นๆ') {
        const mnErr2 = !customMotherNationality.trim() ? 'กรุณาระบุสัญชาติมารดา' : (customMotherNationality.trim().length < 2 ? 'สัญชาติต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (mnErr2) {
          newErrors.customMotherNationality = mnErr2;
          if (!firstInvalidId) firstInvalidId = 'customMotherNationality';
        }
      }

      if (!motherReligionType) {
        newErrors.motherReligionType = 'กรุณาเลือกศาสนามารดา';
        if (!firstInvalidId) firstInvalidId = 'motherReligionType';
      } else if (motherReligionType === 'อื่นๆ') {
        const mrErr = !customMotherReligion.trim() ? 'กรุณาระบุศาสนามารดา' : (customMotherReligion.trim().length < 2 ? 'ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (mrErr) {
          newErrors.customMotherReligion = mrErr;
          if (!firstInvalidId) firstInvalidId = 'customMotherReligion';
        }
      }

      const sp = (formValues.spouseName || document.getElementById('spouseName')?.value || '').trim();
      if (sp) {
        const spErr = validateSingleField('spouseName', sp, obligation);
        if (spErr) {
          newErrors.spouseName = spErr;
          if (!firstInvalidId) firstInvalidId = 'spouseName';
        }
      }

      if (spouseReligionType === 'อื่นๆ' && sp) {
        const srErr = !customSpouseReligion.trim() ? 'กรุณาระบุศาสนาคู่สมรส' : (customSpouseReligion.trim().length < 2 ? 'ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร' : '');
        if (srErr) {
          newErrors.customSpouseReligion = srErr;
          if (!firstInvalidId) firstInvalidId = 'customSpouseReligion';
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...newErrors }));
        if (firstInvalidId) {
          const el = document.getElementById(firstInvalidId);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return false;
      }
    }

    if (stepNum === 4) {
      const eErrors = validateEdusList(educations, maxAllowedDateStr, dob);
      const engErrList = validateEngList(engTests, maxAllowedDateStr, dob);

      if (Object.keys(eErrors).length > 0 || Object.keys(engErrList).length > 0) {
        const el = document.querySelector('.border-ku-invalid') || document.querySelector('.is-invalid');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
    }

    if (stepNum === 5) {
      if (!obligation) {
        newErrors.obligation = 'กรุณาเลือกเงื่อนไขภาระผูกพันการชดใช้ทุน';
        if (!firstInvalidId) firstInvalidId = 'obligation';
      } else if (obligation === 'มี') {
        const ca = (formValues.contractAgency || document.getElementById('contractAgency')?.value || '').trim();
        if (!ca) {
          newErrors.contractAgency = 'กรุณาระบุหน่วยงานที่ชดใช้ทุน';
          if (!firstInvalidId) firstInvalidId = 'contractAgency';
        }
        const cn = (formValues.contractName || document.getElementById('contractName')?.value || '').trim();
        if (!cn) {
          newErrors.contractName = 'กรุณาระบุชื่อสัญญารับทุน';
          if (!firstInvalidId) firstInvalidId = 'contractName';
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...newErrors }));
        if (firstInvalidId) {
          const el = document.getElementById(firstInvalidId);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return false;
      }
    }

    return true;
  };

  const handleInitiateSubmit = async () => {
    for (let s = 1; s <= 5; s++) {
      const valid = await validateStep(s);
      if (!valid) {
        setCurrentStep(s);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    for (const doc of requiredDocs) {
      if (!files['doc_' + doc.id]) {
        alert(`กรุณาแนบไฟล์เอกสาร: "${doc.name}" ให้ครบถ้วน`);
        setCurrentStep(6);
        return;
      }
    }

    for (let i = 0; i < additionalDocs.length; i++) {
      const ad = additionalDocs[i];
      if (!ad.file) {
        alert(`กรุณาเลือกไฟล์สำหรับเอกสารเพิ่มเติมลำดับที่ ${i + 1} หรือลบรายการนี้ออกหากไม่ต้องการแนบ`);
        setCurrentStep(6);
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleExecuteSubmit = async () => {
    setIsSubmitting(true);
    try {
      const applicantData = {
        dob,
        ageYears: age.years,
        ageMonths: age.months,
        birthProvince: birthProvince || selectedProvince,
        selectedProvince,
        selectedAmphoe,
        selectedTambon,
        province: selectedProvince,
        district: selectedAmphoe,
        subdistrict: selectedTambon,
        zipcode,
        postalCode: zipcode,
        subdistrictId,
        mobilePhone: mobilePhones[0] || "",
        mobilePhones,
        educations,
        engTests,
        obligation,
        prefix: getPrefixVal(),
        firstName: formValues.firstName || document.getElementById('firstName')?.value || "",
        lastName: formValues.lastName || document.getElementById('lastName')?.value || "",
        citizenId: formValues.citizenId || document.getElementById('citizenId')?.value || "",
        religion: getReligionVal(),
        nationality: getNationalityVal(),
        email: formValues.email || document.getElementById('email')?.value || "",
        houseNo: formValues.houseNo || document.getElementById('houseNo')?.value || "",
        villageNo: formValues.villageNo || document.getElementById('villageNo')?.value || "",
        alley: formValues.alley || document.getElementById('alley')?.value || "",
        street: formValues.street || document.getElementById('street')?.value || "",
        fatherName: formValues.fatherName || document.getElementById('fatherName')?.value || "",
        fatherNationality: getFatherNationalityVal(),
        fatherReligion: getFatherReligionVal(),
        fatherJob: formValues.fatherJob || document.getElementById('fatherJob')?.value || "",
        motherName: formValues.motherName || document.getElementById('motherName')?.value || "",
        motherNationality: getMotherNationalityVal(),
        motherReligion: getMotherReligionVal(),
        motherJob: formValues.motherJob || document.getElementById('motherJob')?.value || "",
        spouseName: formValues.spouseName || document.getElementById('spouseName')?.value || "",
        spouseNationality: getSpouseNationalityVal(),
        spouseReligion: getSpouseReligionVal(),
        spouseJob: formValues.spouseJob || document.getElementById('spouseJob')?.value || "",
        specialSkill: formValues.specialSkill || document.getElementById('specialSkill')?.value || "",
        foreignLanguage: formValues.foreignLanguage || document.getElementById('foreignLanguage')?.value || "",
        currentJob: formValues.currentJob || document.getElementById('currentJob')?.value || "",
        workplace: formValues.workplace || document.getElementById('workplace')?.value || "",
        workExperience: formValues.workExperience || document.getElementById('workExperience')?.value || "",
        staffType: formValues.staffType || document.getElementById('staffType')?.value || "",
        contractAgency: formValues.contractAgency || document.getElementById('contractAgency')?.value || "",
        contractName: formValues.contractName || document.getElementById('contractName')?.value || "",
        staffAffiliation: formValues.staffAffiliation || document.getElementById('staffAffiliation')?.value || "",
        staffAffiliationIncome: formValues.staffAffiliationIncome || document.getElementById('staffAffiliationIncome')?.value || ""
      };

      const formData = new FormData();
      for (const key in applicantData) {
        const val = applicantData[key];
        if (val === null || val === undefined) {
          continue;
        } else if (typeof val === 'object') {
          formData.append(key, JSON.stringify(val));
        } else {
          formData.append(key, val);
        }
      }

      const meta = [];

      for (const doc of requiredDocs) {
        const file = files['doc_' + doc.id];
        if (file) {
          const field = `doc_${doc.id}`;
          formData.append(field, file);
          meta.push({
            fieldname: field,
            docId: doc.id,
            customName: doc.name
          });
        }

        const extras = extraDocFiles[doc.id] || [];
        extras.forEach((extraItem, extraIdx) => {
          if (extraItem.file) {
            const field = `doc_${doc.id}_extra_${extraIdx}`;
            formData.append(field, extraItem.file);
            meta.push({
              fieldname: field,
              docId: doc.id,
              customName: `${doc.name} (ไฟล์ที่ ${extraIdx + 2})`
            });
          }
        });
      }

      additionalDocs.forEach((item, idx) => {
        if (item.file) {
          const field = `additional_doc_${idx}`;
          const title = (item.title || '').trim() || `เอกสารเพิ่มเติม ${idx + 1}`;
          formData.append(field, item.file);
          formData.append(`custom_name_${field}`, title);
          meta.push({
            fieldname: field,
            docId: 4,
            customName: title
          });
        }
      });

      formData.append('documents_meta', JSON.stringify(meta));

      const res = await fetch(`http://localhost:3000/api/applications/${id}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setShowConfirmModal(false);
        alert("สมัครสำเร็จ! ข้อมูลของคุณถูกส่งเข้าระบบเรียบร้อยแล้ว");
        navigate('/my-applications');
      } else {
        alert(data.message || "เกิดข้อผิดพลาดในการส่งใบสมัคร");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCitizenAndProceed = async (targetStep) => {
    if (targetStep > currentStep) {
      for (let s = currentStep; s < targetStep; s++) {
        const ok = await validateStep(s);
        if (!ok) {
          setCurrentStep(s);
          return;
        }
      }
    }
    setMaxStepReached(prev => Math.max(prev, targetStep));
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    id,
    jobTitle,
    currentStep,
    setCurrentStep,
    maxStepReached,
    validateCitizenAndProceed,
    expanded,
    toggleSection,
    formValues,
    handleFieldChange,
    fieldErrors,
    setFieldErrors,
    getInputClass,
    renderFieldError,
    prefixType,
    setPrefixType,
    customPrefix,
    setCustomPrefix,
    getPrefixVal,
    dob,
    handleDobChange,
    maxDobStr,
    age,
    nationalityType,
    setNationalityType,
    customNationality,
    setCustomNationality,
    religionType,
    setReligionType,
    customReligion,
    setCustomReligion,
    birthProvince,
    setBirthProvince,
    provinces,
    selectedProvince,
    handleProvinceChange,
    selectedAmphoe,
    handleAmphoeChange,
    setSelectedAmphoe,
    selectedTambon,
    handleTambonChange,
    setSelectedTambon,
    addressDataMap,
    zipcode,
    setZipcode,
    mobilePhones,
    phoneErrors,
    handleMobilePhoneChange,
    addMobilePhone,
    removeMobilePhone,
    fatherNationalityType,
    setFatherNationalityType,
    customFatherNationality,
    setCustomFatherNationality,
    fatherReligionType,
    setFatherReligionType,
    customFatherReligion,
    setCustomFatherReligion,
    motherNationalityType,
    setMotherNationalityType,
    customMotherNationality,
    setCustomMotherNationality,
    motherReligionType,
    setMotherReligionType,
    customMotherReligion,
    setCustomMotherReligion,
    spouseNationalityType,
    setSpouseNationalityType,
    customSpouseNationality,
    setCustomSpouseNationality,
    spouseReligionType,
    setSpouseReligionType,
    customSpouseReligion,
    setCustomSpouseReligion,
    educations,
    eduErrors,
    handleEducationDegreeTypeChange,
    handleEducationCustomDegreeChange,
    handleEducationChange,
    addEducation,
    removeEducation,
    maxAllowedDateStr,
    engTests,
    engTestOptions,
    engErrors,
    handleEngTestChange,
    addEngTest,
    removeEngTest,
    obligation,
    setObligation,
    requiredDocs,
    files,
    handleFileUpload,
    removeMainFile,
    extraDocFiles,
    addExtraDocFile,
    removeExtraDocFile,
    handleExtraDocFileChange,
    additionalDocs,
    addAdditionalDoc,
    removeAdditionalDoc,
    handleAdditionalDocChange,
    handleAdditionalDocFile,
    loadModalOpen,
    setLoadModalOpen,
    inputCitizenId,
    setInputCitizenId,
    inputEmail,
    setInputEmail,
    handleLoadDraft,
    isLoadingDraft,
    showConfirmModal,
    setShowConfirmModal,
    isSubmitting,
    handleSaveDraft,
    saveDraftModalOpen,
    setSaveDraftModalOpen,
    saveDraftStatus,
    setSaveDraftStatus,
    saveDraftWarningType,
    setSaveDraftWarningType,
    saveDraftMessage,
    handleExecuteSaveDraft,
    handleCloseSaveDraftModal,
    handleInitiateSubmit,
    handleExecuteSubmit
  };
}
