import React from 'react';

export default function GeneralInfoSection({
  openAccordion,
  toggleAccordion,
  isFromRequest,
  jobCategory,
  handleCategoryChange,
  generalInfo,
  handleGeneralInfoChange,
  positionSuggestions,
  isCustomPositionSelected,
  customPosition,
  handlePositionDropdownChange,
  handleCustomPositionChange,
  facultyOptions,
  isCustomFacultySelected,
  customFaculty,
  handleFacultyDropdownChange,
  handleCustomFacultyChange,
  departmentOptions,
  formErrors,
  touchedFields,
  getInputClass
}) {
  return (
    <div className="accordion-item border">
      <h2 className="accordion-header">
        <button
          className={`accordion-button fw-bold ${openAccordion === 1 ? 'text-success' : 'collapsed'}`}
          type="button"
          onClick={() => toggleAccordion(1)}
        >
          <i className="bi bi-info-circle-fill me-2" style={{ color: '#03A96B' }}></i>
          1. ข้อมูลทั่วไปและตำแหน่งงานที่รับสมัคร
        </button>
      </h2>
      <div className={`accordion-collapse collapse ${openAccordion === 1 ? 'show' : ''}`}>
        <div className="accordion-body bg-white pb-4">

          <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">ข้อมูลตำแหน่งงาน</h6>
          <div className="row g-4 mb-4">

            {/* สายปฏิบัติงาน */}
            <div className="col-md-12 mb-2">
              <label className="form-label fw-bold fs-6">
                สายปฏิบัติงาน <span className="text-danger">*</span>
              </label>
              <div className={`d-flex gap-4 p-3 bg-light rounded border ${isFromRequest ? 'border-secondary-subtle opacity-75' : ''}`}>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="jobCat"
                    id="catAcad"
                    value="สายวิชาการ"
                    checked={jobCategory === "สายวิชาการ"}
                    onChange={handleCategoryChange}
                    disabled={isFromRequest}
                  />
                  <label
                    className={`form-check-label fw-medium ${isFromRequest ? 'text-muted' : 'text-primary'}`}
                    htmlFor="catAcad"
                    style={{ cursor: isFromRequest ? 'not-allowed' : 'pointer' }}
                  >
                    <i className="bi bi-book-half me-2"></i>สายวิชาการ
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="jobCat"
                    id="catSup"
                    value="สายสนับสนุน"
                    checked={jobCategory === "สายสนับสนุน"}
                    onChange={handleCategoryChange}
                    disabled={isFromRequest}
                  />
                  <label
                    className={`form-check-label fw-medium ${isFromRequest ? 'text-muted' : 'text-success'}`}
                    htmlFor="catSup"
                    style={{ cursor: isFromRequest ? 'not-allowed' : 'pointer' }}
                  >
                    <i className="bi bi-person-workspace me-2"></i>สายสนับสนุน
                  </label>
                </div>
              </div>
            </div>

            {/* ชื่อตำแหน่ง */}
            <div className="col-md-6" id="field-jobTitle">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-medium mb-0">
                  ชื่อตำแหน่งที่รับสมัคร <span className="text-danger">*</span>
                </label>
              </div>
              <select
                className={`form-select mb-1 ${isFromRequest ? 'bg-light text-secondary border-secondary-subtle' : getInputClass(generalInfo.jobTitle, formErrors.jobTitle && touchedFields.jobTitle)}`}
                value={
                  isCustomPositionSelected || (generalInfo.jobTitle && !positionSuggestions.some(p => (p.name || p.Position_name) === generalInfo.jobTitle))
                    ? 'other'
                    : (generalInfo.jobTitle || '')
                }
                onChange={e => handlePositionDropdownChange(e.target.value)}
                disabled={isFromRequest}
              >
                <option value="">-- เลือกตำแหน่งที่รับสมัคร --</option>
                {positionSuggestions
                  .filter(p => !p.type || p.type.trim() === jobCategory.trim())
                  .map((pos, idx) => {
                    const pName = pos.name || pos.Position_name;
                    return <option key={idx} value={pName}>{pName}</option>;
                  })}
                <option value="other" className="fw-bold text-primary">+ อื่นๆ (พิมพ์ระบุตำแหน่งเอง)</option>
              </select>

              {(isCustomPositionSelected || (generalInfo.jobTitle && !positionSuggestions.some(p => (p.name || p.Position_name) === generalInfo.jobTitle))) && (
                <div className="mt-2">
                  <input
                    type="text"
                    className={`form-control ${isFromRequest ? 'bg-light text-secondary border-secondary-subtle' : getInputClass(customPosition || generalInfo.jobTitle, formErrors.jobTitle && touchedFields.jobTitle)}`}
                    placeholder="พิมพ์ชื่อตำแหน่ง เช่น นักวิชาการคอมพิวเตอร์, อาจารย์..."
                    maxLength={100}
                    value={customPosition || generalInfo.jobTitle}
                    onChange={e => handleCustomPositionChange(e.target.value)}
                    disabled={isFromRequest}
                  />
                </div>
              )}

              {formErrors.jobTitle && touchedFields.jobTitle && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.jobTitle}
                </div>
              )}
            </div>

            {/* จำนวนอัตรา */}
            <div className="col-md-3" id="field-amount">
              <label className="form-label fw-medium mb-1">
                จำนวนอัตราที่รับ <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className={`form-control ${isFromRequest ? 'bg-light text-secondary border-secondary-subtle' : getInputClass(generalInfo.amount, formErrors.amount && touchedFields.amount)}`}
                min="1"
                max="999"
                value={generalInfo.amount}
                onChange={e => handleGeneralInfoChange('amount', e.target.value)}
                disabled={isFromRequest}
              />
              {formErrors.amount && touchedFields.amount && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.amount}
                </div>
              )}
            </div>

            {/* รอบที่รับสมัคร */}
            <div className="col-md-3" id="field-roundNo">
              <label className="form-label fw-medium mb-1">รอบที่รับสมัคร <span className="text-danger">*</span></label>
              <input
                type="number"
                className={`form-control ${getInputClass(generalInfo.roundNo, formErrors.roundNo && touchedFields.roundNo)}`}
                min="1"
                max="99"
                value={generalInfo.roundNo}
                onChange={e => handleGeneralInfoChange('roundNo', e.target.value)}
              />
              {formErrors.roundNo && touchedFields.roundNo && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.roundNo}
                </div>
              )}
            </div>

            {/* คณะ/สังกัด */}
            <div className="col-md-6" id="field-faculty">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-medium mb-0">
                  คณะ / สังกัดหน่วยงาน <span className="text-danger">*</span>
                </label>
              </div>
              <select
                className={`form-select mb-1 ${isFromRequest ? 'bg-light text-secondary border-secondary-subtle' : getInputClass(generalInfo.faculty, formErrors.faculty && touchedFields.faculty)}`}
                value={isCustomFacultySelected || (!facultyOptions.some(f => (f.Faculty_name || f.name) === generalInfo.faculty) && generalInfo.faculty) ? (isFromRequest ? (generalInfo.faculty || '') : 'other') : (generalInfo.faculty || '')}
                onChange={e => handleFacultyDropdownChange(e.target.value)}
                disabled={isFromRequest}
              >
                <option value="">-- เลือกคณะ / สังกัดหน่วยงาน --</option>
                {facultyOptions.map((fac, idx) => {
                  const fName = fac.Faculty_name || fac.name;
                  return <option key={idx} value={fName}>{fName}</option>;
                })}
                {generalInfo.faculty && !facultyOptions.some(f => (f.Faculty_name || f.name) === generalInfo.faculty) && (
                  <option value={generalInfo.faculty}>{generalInfo.faculty}</option>
                )}
              </select>

              {isCustomFacultySelected && !isFromRequest && (
                <div className="mt-2">
                  <input
                    type="text"
                    className={`form-control ${getInputClass(customFaculty || generalInfo.faculty, formErrors.faculty && touchedFields.faculty)}`}
                    placeholder="พิมพ์ชื่อคณะ หรือ หน่วยงาน เช่น วิทยาลัยนานาชาติ..."
                    maxLength={100}
                    value={customFaculty || generalInfo.faculty}
                    onChange={e => handleCustomFacultyChange(e.target.value)}
                  />
                </div>
              )}

              {formErrors.faculty && touchedFields.faculty && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.faculty}
                </div>
              )}
            </div>

            {/* ภาควิชา/งาน */}
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-medium mb-0">
                  ภาควิชา / งาน (ถ้ามี)
                </label>
              </div>
              <input
                type="text"
                className={`form-control ${isFromRequest ? 'bg-light text-secondary border-secondary-subtle' : ''}`}
                list={isFromRequest ? undefined : "deptSuggestionsList"}
                placeholder="เช่น ภาควิชาการจัดการ หรือ สำนักงานเลขานุการ"
                maxLength={100}
                value={generalInfo.department}
                onChange={e => handleGeneralInfoChange('department', e.target.value)}
                disabled={isFromRequest}
              />
              <datalist id="deptSuggestionsList">
                {departmentOptions.map((dept, idx) => (
                  <option key={idx} value={dept.Department_name || dept.name} />
                ))}
              </datalist>
            </div>

            {/* เงินเดือน */}
            <div className="col-md-6">
              <label className="form-label fw-medium mb-1">อัตราเงินเดือนเริ่มต้น (บาท)</label>
              <input type="text" className="form-control" placeholder="เช่น 26,250" value={generalInfo.salaryMaster} onChange={e => handleGeneralInfoChange('salaryMaster', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium mb-1">อัตราเงินเดือนกรณีวุฒิ ป.เอก (บาท, ถ้ามี)</label>
              <input type="text" className="form-control" placeholder="เช่น 31,500" value={generalInfo.salaryPhd} onChange={e => handleGeneralInfoChange('salaryPhd', e.target.value)} />
            </div>
          </div>

          <h6 className="fw-bold text-secondary mb-3 border-bottom pb-2">ข้อมูลการประกาศรับสมัคร</h6>
          <div className="row g-3">

            {/* หัวข้อประกาศ */}
            <div className="col-md-12" id="field-postTitle">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-medium mb-0">หัวข้อประกาศ (พาดหัวบนสุดของเอกสาร) <span className="text-danger">*</span></label>
              </div>
              <input
                type="text"
                className={`form-control ${getInputClass(generalInfo.postTitle, formErrors.postTitle && touchedFields.postTitle)}`}
                maxLength={255}
                value={generalInfo.postTitle}
                onChange={e => handleGeneralInfoChange('postTitle', e.target.value)}
              />
              {formErrors.postTitle && touchedFields.postTitle && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.postTitle}
                </div>
              )}
            </div>

            {/* ย่อหน้าเกริ่นนำ */}
            <div className="col-md-12" id="field-postDetails">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-medium mb-0">ย่อหน้าเกริ่นนำประกาศ <span className="text-danger">*</span></label>

              </div>
              <textarea
                className={`form-control ${getInputClass(generalInfo.postDetails, formErrors.postDetails && touchedFields.postDetails)} text-muted`}
                rows="5"
                style={{ resize: 'vertical', minHeight: '130px' }}
                value={generalInfo.postDetails}
                onChange={e => handleGeneralInfoChange('postDetails', e.target.value)}
              ></textarea>
              {formErrors.postDetails && touchedFields.postDetails && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.postDetails}
                </div>
              )}
            </div>

            {/* วันที่เปิดรับสมัคร */}
            <div className="col-md-6" id="field-openDate">
              <label className="form-label fw-medium mb-1">วันที่เปิดรับสมัคร <span className="text-danger">*</span></label>
              <input
                type="date"
                className={`form-control ${getInputClass(generalInfo.openDate, formErrors.openDate && touchedFields.openDate)}`}
                value={generalInfo.openDate}
                onChange={e => handleGeneralInfoChange('openDate', e.target.value)}
              />
              {formErrors.openDate && touchedFields.openDate && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.openDate}
                </div>
              )}
            </div>

            {/* วันที่ปิดรับสมัคร */}
            <div className="col-md-6" id="field-closeDate">
              <label className="form-label fw-medium mb-1">วันที่ปิดรับสมัคร <span className="text-danger">*</span></label>
              <input
                type="date"
                className={`form-control ${getInputClass(generalInfo.closeDate, formErrors.closeDate && touchedFields.closeDate)}`}
                min={generalInfo.openDate || undefined}
                value={generalInfo.closeDate}
                onChange={e => handleGeneralInfoChange('closeDate', e.target.value)}
              />
              {formErrors.closeDate && touchedFields.closeDate && (
                <div className="text-danger small mt-1 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.closeDate}
                </div>
              )}
            </div>

            <div className="col-md-12">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-medium mb-0">รายละเอียดผู้สมัคร</label>

              </div>
              <textarea
                className={`form-control ${getInputClass(generalInfo.applicantDetails, formErrors.applicantDetails && touchedFields.applicantDetails)} text-muted`}
                rows="4"
                style={{ resize: 'vertical', minHeight: '100px' }}
                value={generalInfo.applicantDetails}
                onChange={e => handleGeneralInfoChange('applicantDetails', e.target.value)}
              ></textarea>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
