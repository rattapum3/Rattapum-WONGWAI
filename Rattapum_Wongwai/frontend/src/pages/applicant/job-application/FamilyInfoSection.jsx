import React from 'react';

export default function FamilyInfoSection({
  currentStep,
  expanded,
  toggleSection,
  formValues,
  handleFieldChange,
  getInputClass,
  renderFieldError,
  fieldErrors,
  setFieldErrors,
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
  setCustomSpouseReligion
}) {
  return (
    <div className={`card shadow-sm border-0 mb-4 ${currentStep === 3 ? 'd-block' : 'd-none'}`} style={{ borderTop: '4px solid #03A96B' }}>
      <div
        className="card-header bg-white py-3 d-flex justify-content-between align-items-center"
        onClick={() => toggleSection('s3')}
        style={{ cursor: 'pointer' }}
      >
        <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-people-fill me-2 text-success"></i>3. ข้อมูลครอบครัว</h5>
        <i className={`bi fs-5 ${expanded.s3 ? 'bi-chevron-up text-secondary' : 'bi-chevron-down text-primary'}`}></i>
      </div>

      <div className="card-body p-4 animate__animated animate__fadeIn d-block">
        <h6 className="fw-bold text-secondary mb-3">ข้อมูลบิดา</h6>
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label">ชื่อบิดา <span className="text-danger">*</span></label>
            <input
              type="text"
              id="fatherName"
              className={`form-control ${getInputClass('fatherName', true)}`}
              value={formValues.fatherName || ''}
              onChange={e => handleFieldChange('fatherName', e.target.value)}
              maxLength="80"
              placeholder="ระบุชื่อ-นามสกุลบิดา (ตัวอักษรเท่านั้น)"
              required
            />
            {renderFieldError('fatherName')}
          </div>
          <div className="col-md-3">
            <label className="form-label">สัญชาติบิดา <span className="text-danger">*</span></label>
            <select
              id="fatherNationalityType"
              className={`form-select ${fatherNationalityType ? 'border-ku-filled' : (fieldErrors.fatherNationalityType ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
              value={fatherNationalityType}
              onChange={e => {
                setFatherNationalityType(e.target.value);
                if (e.target.value !== "อื่นๆ") setCustomFatherNationality("");
                setFieldErrors(prev => ({
                  ...prev,
                  fatherNationalityType: e.target.value ? '' : 'กรุณาระบุสัญชาติบิดา',
                  customFatherNationality: ''
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
            {renderFieldError('fatherNationalityType')}
            {fatherNationalityType === "อื่นๆ" && (
              <>
                <input
                  type="text"
                  id="customFatherNationality"
                  className={`form-control mt-2 animate__animated animate__fadeIn ${customFatherNationality ? 'border-ku-filled' : (fieldErrors.customFatherNationality ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                  placeholder="พิมพ์สัญชาติ (ตัวอักษร)"
                  value={customFatherNationality}
                  maxLength="30"
                  onChange={e => {
                    const clean = e.target.value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 30);
                    setCustomFatherNationality(clean);
                    setFieldErrors(prev => ({
                      ...prev,
                      customFatherNationality: clean.trim().length >= 2 ? '' : 'สัญชาติต้องมีอย่างน้อย 2 ตัวอักษร'
                    }));
                  }}
                  required
                />
                {renderFieldError('customFatherNationality')}
              </>
            )}
          </div>
          <div className="col-md-3">
            <label className="form-label">ศาสนาบิดา <span className="text-danger">*</span></label>
            <select
              id="fatherReligionType"
              className={`form-select ${fatherReligionType ? 'border-ku-filled' : (fieldErrors.fatherReligionType ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
              value={fatherReligionType}
              onChange={e => {
                const val = e.target.value;
                setFatherReligionType(val);
                if (val !== "อื่นๆ") setCustomFatherReligion("");
                setFieldErrors(prev => ({
                  ...prev,
                  fatherReligionType: val ? '' : 'กรุณาเลือกศาสนาบิดา',
                  customFatherReligion: ''
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
              <option value="ไม่ระบุ">ไม่ระบุ</option>
              <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุ)</option>
            </select>
            {renderFieldError('fatherReligionType')}
            {fatherReligionType === "อื่นๆ" && (
              <>
                <input
                  type="text"
                  id="customFatherReligion"
                  className={`form-control mt-2 animate__animated animate__fadeIn ${customFatherReligion ? 'border-ku-filled' : (fieldErrors.customFatherReligion ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                  placeholder="พิมพ์ศาสนา (ตัวอักษร)"
                  value={customFatherReligion}
                  maxLength="30"
                  onChange={e => {
                    const clean = e.target.value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 30);
                    setCustomFatherReligion(clean);
                    setFieldErrors(prev => ({
                      ...prev,
                      customFatherReligion: clean.trim().length >= 2 ? '' : 'ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร'
                    }));
                  }}
                  required
                />
                {renderFieldError('customFatherReligion')}
              </>
            )}
          </div>
          <div className="col-md-3">
            <label className="form-label">อาชีพบิดา</label>
            <input
              type="text"
              id="fatherJob"
              className={`form-control ${getInputClass('fatherJob', false)}`}
              value={formValues.fatherJob || ''}
              onChange={e => handleFieldChange('fatherJob', e.target.value)}
              maxLength="100"
              placeholder="ระบุอาชีพ"
            />
          </div>
        </div>

        <h6 className="fw-bold text-secondary mb-3">ข้อมูลมารดา</h6>
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label">ชื่อมารดา <span className="text-danger">*</span></label>
            <input
              type="text"
              id="motherName"
              className={`form-control ${getInputClass('motherName', true)}`}
              value={formValues.motherName || ''}
              onChange={e => handleFieldChange('motherName', e.target.value)}
              maxLength="80"
              placeholder="ระบุชื่อ-นามสกุลมารดา (ตัวอักษรเท่านั้น)"
              required
            />
            {renderFieldError('motherName')}
          </div>
          <div className="col-md-3">
            <label className="form-label">สัญชาติมารดา <span className="text-danger">*</span></label>
            <select
              id="motherNationalityType"
              className={`form-select ${motherNationalityType ? 'border-ku-filled' : (fieldErrors.motherNationalityType ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
              value={motherNationalityType}
              onChange={e => {
                setMotherNationalityType(e.target.value);
                if (e.target.value !== "อื่นๆ") setCustomMotherNationality("");
                setFieldErrors(prev => ({
                  ...prev,
                  motherNationalityType: e.target.value ? '' : 'กรุณาระบุสัญชาติมารดา',
                  customMotherNationality: ''
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
            {renderFieldError('motherNationalityType')}
            {motherNationalityType === "อื่นๆ" && (
              <>
                <input
                  type="text"
                  id="customMotherNationality"
                  className={`form-control mt-2 animate__animated animate__fadeIn ${customMotherNationality ? 'border-ku-filled' : (fieldErrors.customMotherNationality ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                  placeholder="พิมพ์สัญชาติ (ตัวอักษร)"
                  value={customMotherNationality}
                  maxLength="30"
                  onChange={e => {
                    const clean = e.target.value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 30);
                    setCustomMotherNationality(clean);
                    setFieldErrors(prev => ({
                      ...prev,
                      customMotherNationality: clean.trim().length >= 2 ? '' : 'สัญชาติต้องมีอย่างน้อย 2 ตัวอักษร'
                    }));
                  }}
                  required
                />
                {renderFieldError('customMotherNationality')}
              </>
            )}
          </div>
          <div className="col-md-3">
            <label className="form-label">ศาสนามารดา <span className="text-danger">*</span></label>
            <select
              id="motherReligionType"
              className={`form-select ${motherReligionType ? 'border-ku-filled' : (fieldErrors.motherReligionType ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
              value={motherReligionType}
              onChange={e => {
                const val = e.target.value;
                setMotherReligionType(val);
                if (val !== "อื่นๆ") setCustomMotherReligion("");
                setFieldErrors(prev => ({
                  ...prev,
                  motherReligionType: val ? '' : 'กรุณาเลือกศาสนามารดา',
                  customMotherReligion: ''
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
              <option value="ไม่ระบุ">ไม่ระบุ</option>
              <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุ)</option>
            </select>
            {renderFieldError('motherReligionType')}
            {motherReligionType === "อื่นๆ" && (
              <>
                <input
                  type="text"
                  id="customMotherReligion"
                  className={`form-control mt-2 animate__animated animate__fadeIn ${customMotherReligion ? 'border-ku-filled' : (fieldErrors.customMotherReligion ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                  placeholder="พิมพ์ศาสนา (ตัวอักษร)"
                  value={customMotherReligion}
                  maxLength="30"
                  onChange={e => {
                    const clean = e.target.value.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '').slice(0, 30);
                    setCustomMotherReligion(clean);
                    setFieldErrors(prev => ({
                      ...prev,
                      customMotherReligion: clean.trim().length >= 2 ? '' : 'ศาสนาต้องมีอย่างน้อย 2 ตัวอักษร'
                    }));
                  }}
                  required
                />
                {renderFieldError('customMotherReligion')}
              </>
            )}
          </div>
          <div className="col-md-3">
            <label className="form-label">อาชีพมารดา</label>
            <input
              type="text"
              id="motherJob"
              className={`form-control ${getInputClass('motherJob', false)}`}
              value={formValues.motherJob || ''}
              onChange={e => handleFieldChange('motherJob', e.target.value)}
              maxLength="100"
              placeholder="ระบุอาชีพ"
            />
          </div>
        </div>

        <h6 className="fw-bold text-secondary mb-3">ข้อมูลคู่สมรส (ถ้ามี)</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">ชื่อคู่สมรส</label>
            <input
              type="text"
              id="spouseName"
              className={`form-control ${getInputClass('spouseName', false)}`}
              value={formValues.spouseName || ''}
              onChange={e => handleFieldChange('spouseName', e.target.value)}
              maxLength="80"
              placeholder="ระบุชื่อ-นามสกุล (ตัวอักษรเท่านั้น)"
            />
            {renderFieldError('spouseName')}
          </div>
          <div className="col-md-3">
            <label className="form-label">สัญชาติคู่สมรส</label>
            <select
              className="form-select"
              value={spouseNationalityType}
              onChange={e => {
                setSpouseNationalityType(e.target.value);
                if (e.target.value !== "อื่นๆ") setCustomSpouseNationality("");
              }}
            >
              <option value="">เลือกสัญชาติ</option>
              <option value="ไทย">ไทย</option>
              <option value="ลาว">ลาว</option>
              <option value="พม่า">พม่า</option>
              <option value="กัมพูชา">กัมพูชา</option>
              <option value="จีน">จีน</option>
              <option value="ญี่ปุ่น">ญี่ปุ่น</option>
              <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุ)</option>
            </select>
            {spouseNationalityType === "อื่นๆ" && (
              <input type="text" className="form-control mt-2" placeholder="พิมพ์สัญชาติ" value={customSpouseNationality} onChange={e => setCustomSpouseNationality(e.target.value)} />
            )}
          </div>
          <div className="col-md-3">
            <label className="form-label">ศาสนาคู่สมรส</label>
            <select
              className="form-select"
              value={spouseReligionType}
              onChange={e => {
                setSpouseReligionType(e.target.value);
                if (e.target.value !== "อื่นๆ") setCustomSpouseReligion("");
              }}
            >
              <option value="">เลือกศาสนา</option>
              <option value="พุทธ">พุทธ</option>
              <option value="คริสต์">คริสต์</option>
              <option value="อิสลาม">อิสลาม</option>
              <option value="ฮินดู">ฮินดู</option>
              <option value="ซิกข์">ซิกข์</option>
              <option value="ไม่ระบุ">ไม่ระบุ</option>
              <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุ)</option>
            </select>
            {spouseReligionType === "อื่นๆ" && (
              <input type="text" className="form-control mt-2" placeholder="พิมพ์ศาสนา" value={customSpouseReligion} onChange={e => setCustomSpouseReligion(e.target.value)} />
            )}
          </div>
          <div className="col-md-3">
            <label className="form-label">อาชีพคู่สมรส</label>
            <input
              type="text"
              id="spouseJob"
              className={`form-control ${getInputClass('spouseJob', false)}`}
              value={formValues.spouseJob || ''}
              onChange={e => handleFieldChange('spouseJob', e.target.value)}
              maxLength="100"
              placeholder="ระบุอาชีพ"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
