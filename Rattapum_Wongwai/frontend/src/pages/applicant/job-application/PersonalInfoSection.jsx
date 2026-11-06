import React from 'react';

export default function PersonalInfoSection({
  currentStep,
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
  provinces = []
}) {
  return (
    <>
      {/* ส่วนที่ 0: ระบบกรอกเลขประจำตัวประชาชนและอีเมล (แสดงเฉพาะใน Step 1) */}
      <div className={`card shadow-sm border-0 mb-4 ${currentStep === 1 ? 'd-block' : 'd-none'}`} style={{ borderRadius: '12px', backgroundColor: '#f8f9fa' }}>
        <div className="card-body p-4">
          <div className="row g-3 align-items-start">
            <div className="col-md-6">
              <label className="form-label fw-medium">เลขประจำตัวประชาชน <span className="text-danger">*</span></label>
              <input
                type="text"
                id="citizenId"
                className={`form-control ${getInputClass('citizenId', true)}`}
                maxLength="13"
                value={formValues.citizenId}
                placeholder="ระบุเลขประจำตัวประชาชน 13 หลัก (เฉพาะตัวเลข)"
                onChange={(e) => handleFieldChange('citizenId', e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center mt-1">
                <div>{renderFieldError('citizenId')}</div>
                <span className={`small ms-auto ${formValues.citizenId.length === 13 ? 'text-success fw-bold' : 'text-muted'}`}>
                  {formValues.citizenId.length}/13 หลัก
                </span>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">อีเมล (E-mail) <span className="text-danger">*</span></label>
              <input
                type="email"
                id="email"
                className={`form-control ${getInputClass('email', true)}`}
                maxLength="100"
                value={formValues.email}
                placeholder="example@gmail.com (ห้ามใช้อักษรไทยและช่องว่าง)"
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
              {renderFieldError('email')}
            </div>
          </div>
        </div>
      </div>

      {/* หมวดที่ 1: ข้อมูลส่วนบุคคล */}
      <div className={`card shadow-sm border-0 mb-4 ${currentStep === 1 ? 'd-block' : 'd-none'}`} style={{ borderTop: '4px solid #03A96B' }}>
        <div
          className="card-header bg-white py-3 d-flex justify-content-between align-items-center"
          onClick={() => toggleSection('s1')}
          style={{ cursor: 'pointer' }}
        >
          <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-person-fill me-2 text-success"></i>1. ข้อมูลส่วนบุคคล</h5>
          <i className={`bi fs-5 ${expanded.s1 ? 'bi-chevron-up text-secondary' : 'bi-chevron-down text-primary'}`}></i>
        </div>

        <div className="card-body p-4 animate__animated animate__fadeIn d-block">
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">คำนำหน้าชื่อ <span className="text-danger">*</span></label>
              <select
                id="prefixType"
                className={`form-select ${prefixType ? 'border-ku-filled' : (fieldErrors.prefixType ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                value={prefixType}
                onChange={e => {
                  const val = e.target.value;
                  setPrefixType(val);
                  if (val !== "อื่นๆ") setCustomPrefix("");
                  setFieldErrors(prev => ({
                    ...prev,
                    prefixType: val ? '' : 'กรุณาเลือกคำนำหน้าชื่อ',
                    customPrefix: ''
                  }));
                }}
                required
              >
                <option value="">เลือก</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="ดร.">ดร.</option>
                <option value="ผศ.ดร.">ผศ.ดร.</option>
                <option value="รศ.ดร.">รศ.ดร.</option>
                <option value="ศ.ดร.">ศ.ดร.</option>
                <option value="อาจารย์">อาจารย์</option>
                <option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option>
                <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุ)</option>
              </select>
              {renderFieldError('prefixType')}
              {prefixType === "อื่นๆ" && (
                <>
                  <input
                    type="text"
                    id="customPrefix"
                    className={`form-control mt-2 animate__animated animate__fadeIn ${customPrefix ? 'border-ku-filled' : (fieldErrors.customPrefix ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                    placeholder="พิมพ์คำนำหน้า (ตัวอักษร)"
                    maxLength="30"
                    value={customPrefix}
                    onChange={e => {
                      const clean = e.target.value.replace(/[^a-zA-Z\u0E00-\u0E7F.]/g, '').slice(0, 30);
                      setCustomPrefix(clean);
                      setFieldErrors(prev => ({
                        ...prev,
                        customPrefix: clean.trim().length >= 2 ? '' : 'คำนำหน้าต้องมีอย่างน้อย 2 ตัวอักษร'
                      }));
                    }}
                    required
                  />
                  {renderFieldError('customPrefix')}
                </>
              )}
            </div>
            <div className="col-md-5">
              <label className="form-label">ชื่อจริง <span className="text-danger">*</span></label>
              <input
                type="text"
                id="firstName"
                className={`form-control ${getInputClass('firstName', true)}`}
                maxLength="50"
                value={formValues.firstName}
                placeholder="ระบุชื่อจริง (ตัวอักษรเท่านั้น ห้ามมีตัวเลข)"
                required
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
              />
              {renderFieldError('firstName')}
            </div>
            <div className="col-md-5">
              <label className="form-label">นามสกุล <span className="text-danger">*</span></label>
              <input
                type="text"
                id="lastName"
                className={`form-control ${getInputClass('lastName', true)}`}
                maxLength="50"
                value={formValues.lastName}
                placeholder="ระบุนามสกุล (ตัวอักษรเท่านั้น ห้ามมีตัวเลข)"
                required
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
              />
              {renderFieldError('lastName')}
            </div>

            <div className="col-md-4">
              <label className="form-label fw-medium">วัน/เดือน/ปีเกิด (เลือกปฏิทิน) <span className="text-danger">*</span></label>
              <input
                type="date"
                id="dob"
                className={`form-control ${dob ? (fieldErrors.dob ? 'border-ku-invalid is-invalid' : 'border-ku-filled') : (fieldErrors.dob ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                max={maxDobStr}
                value={dob}
                onChange={handleDobChange}
                required
              />
              {renderFieldError('dob')}
            </div>
            <div className="col-md-2">
              <label className="form-label">อายุ (ปี)</label>
              <input type="text" className="form-control bg-light" value={age.years} readOnly placeholder="อัตโนมัติ" />
            </div>
            <div className="col-md-2">
              <label className="form-label">อายุ (เดือน)</label>
              <input type="text" className="form-control bg-light" value={age.months} readOnly placeholder="อัตโนมัติ" />
            </div>

            <div className="col-md-4">
              <label className="form-label">สัญชาติ <span className="text-danger">*</span></label>
              <select
                id="nationalityType"
                className={`form-select ${nationalityType ? 'border-ku-filled' : (fieldErrors.nationalityType ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                value={nationalityType}
                onChange={e => {
                  const val = e.target.value;
                  setNationalityType(val);
                  if (val !== "อื่นๆ") setCustomNationality("");
                  setFieldErrors(prev => ({
                    ...prev,
                    nationalityType: val ? '' : 'กรุณาเลือกสัญชาติ',
                    customNationality: ''
                  }));
                }}
                required
              >
                <option value="ไทย">ไทย</option>
                <option value="ลาว">ลาว</option>
                <option value="พม่า">พม่า</option>
                <option value="กัมพูชา">กัมพูชา</option>
                <option value="จีน">จีน</option>
                <option value="ญี่ปุ่น">ญี่ปุ่น</option>
                <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุ)</option>
              </select>
              {renderFieldError('nationalityType')}
              {nationalityType === "อื่นๆ" && (
                <>
                  <input
                    type="text"
                    id="customNationality"
                    className={`form-control mt-2 animate__animated animate__fadeIn ${customNationality ? 'border-ku-filled' : (fieldErrors.customNationality ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                    placeholder="พิมพ์สัญชาติ (ตัวอักษร)"
                    maxLength="30"
                    value={customNationality}
                    onChange={e => {
                      const clean = e.target.value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 30);
                      setCustomNationality(clean);
                      setFieldErrors(prev => ({
                        ...prev,
                        customNationality: clean.trim().length >= 2 ? '' : 'สัญชาติต้องมีอย่างน้อย 2 ตัวอักษร'
                      }));
                    }}
                    required
                  />
                  {renderFieldError('customNationality')}
                </>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label">ศาสนา <span className="text-danger">*</span></label>
              <select
                id="religionType"
                className={`form-select ${religionType ? 'border-ku-filled' : (fieldErrors.religionType ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                value={religionType}
                onChange={e => {
                  const val = e.target.value;
                  setReligionType(val);
                  if (val !== "อื่นๆ") setCustomReligion("");
                  setFieldErrors(prev => ({
                    ...prev,
                    religionType: val ? '' : 'กรุณาเลือกศาสนา',
                    customReligion: ''
                  }));
                }}
                required
              >
                <option value="">เลือกศาสนา</option>
                <option value="พุทธ">พุทธ</option>
                <option value="คริสต์">คริสต์</option>
                <option value="อิสลาม">อิสลาม</option>
                <option value="ฮินดู">ฮินดู</option>
                <option value="ซิกข์">ซิกข์</option>
                <option value="ไม่ระบุ">ไม่นับถือ / ไม่ระบุ</option>
                <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุ)</option>
              </select>
              {renderFieldError('religionType')}
              {religionType === "อื่นๆ" && (
                <>
                  <input
                    type="text"
                    id="customReligion"
                    className={`form-control mt-2 animate__animated animate__fadeIn ${customReligion ? 'border-ku-filled' : (fieldErrors.customReligion ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                    placeholder="พิมพ์ศาสนา (ตัวอักษร)"
                    maxLength="30"
                    value={customReligion}
                    onChange={e => {
                      const clean = e.target.value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 30);
                      setCustomReligion(clean);
                      setFieldErrors(prev => ({
                        ...prev,
                        customReligion: clean.trim().length >= 2 ? '' : 'ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร'
                      }));
                    }}
                    required
                  />
                  {renderFieldError('customReligion')}
                </>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label">จังหวัดที่เกิด <span className="text-danger">*</span></label>
              <select
                id="birthProvince"
                className={`form-select ${birthProvince ? 'border-ku-filled' : (fieldErrors.birthProvince ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                value={birthProvince}
                onChange={e => {
                  setBirthProvince(e.target.value);
                  setFieldErrors(prev => ({ ...prev, birthProvince: e.target.value ? '' : 'กรุณาเลือกจังหวัดที่เกิด' }));
                }}
                required
              >
                <option value="">เลือกจังหวัด</option>
                {provinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
                {birthProvince && !provinces.includes(birthProvince) && (
                  <option key={birthProvince} value={birthProvince}>{birthProvince}</option>
                )}
              </select>
              {renderFieldError('birthProvince')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
