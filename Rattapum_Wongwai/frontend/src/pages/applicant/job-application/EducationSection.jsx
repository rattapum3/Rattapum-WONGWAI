import React from 'react';

export default function EducationSection({
  currentStep,
  expanded,
  toggleSection,
  educations = [],
  eduErrors = {},
  handleEducationDegreeTypeChange,
  handleEducationCustomDegreeChange,
  handleEducationChange,
  addEducation,
  removeEducation,
  DEGREE_OPTIONS = [],
  maxAllowedDateStr,
  engTests = [],
  engTestOptions = [],
  engErrors = {},
  handleEngTestChange,
  addEngTest,
  removeEngTest,
  formValues,
  handleFieldChange,
  getInputClass,
  renderFieldError
}) {
  return (
    <div className={`card shadow-sm border-0 mb-4 ${currentStep === 4 ? 'd-block' : 'd-none'}`} style={{ borderTop: '4px solid #03A96B' }}>
      <div
        className="card-header bg-white py-3 d-flex justify-content-between align-items-center"
        onClick={() => toggleSection('s4')}
        style={{ cursor: 'pointer' }}
      >
        <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-mortarboard-fill me-2 text-success"></i>4. ประวัติการศึกษาและความสามารถ</h5>
        <i className={`bi fs-5 ${expanded.s4 ? 'bi-chevron-up text-secondary' : 'bi-chevron-down text-primary'}`}></i>
      </div>

      <div className="card-body p-4 animate__animated animate__fadeIn d-block">

        <div className="d-flex justify-content-between align-items-end mb-3">
          <h6 className="fw-bold text-secondary mb-0">ข้อมูลการศึกษา</h6>
        </div>

        {/* วนลูปแสดงข้อมูลวุฒิการศึกษา */}
        {educations.map((edu, index) => (
          <div key={`edu-${index}`} className="p-4 bg-light rounded border mb-4 position-relative">
            {educations.length > 1 && (
              <button type="button" className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-3" onClick={() => removeEducation(index)}>
                <i className="bi bi-trash me-1"></i>ลบ
              </button>
            )}
            <div className="fw-bold text-primary mb-3"><i className="bi bi-award-fill me-2"></i>วุฒิการศึกษาที่ {index + 1}</div>
            
            {eduErrors[index]?.duplicate && (
              <div className="alert alert-danger py-2 px-3 small mb-3 animate__animated animate__fadeIn">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>{eduErrors[index].duplicate}
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">ระดับวุฒิการศึกษา <span className="text-danger">*</span></label>
                {(() => {
                  const isStandard = DEGREE_OPTIONS.includes(edu.degree);
                  const isCustom = edu.isCustomDegree || (Boolean(edu.degree) && !isStandard) || edu.degreeType === 'อื่นๆ';
                  const currentSelectVal = isCustom ? 'อื่นๆ' : (isStandard ? edu.degree : '');
                  const customVal = edu.customDegree !== undefined ? edu.customDegree : (isStandard ? '' : (edu.degree || ''));

                  return (
                    <>
                      <select
                        id={`edu-degree-select-${index}`}
                        className={`form-select bg-white ${eduErrors[index]?.degree && !currentSelectVal ? 'border-ku-invalid is-invalid' : (currentSelectVal ? 'border-ku-filled' : 'border-ku-required')}`}
                        value={currentSelectVal}
                        onChange={(e) => handleEducationDegreeTypeChange(index, e.target.value)}
                        required
                      >
                        <option value="">-- เลือกระดับวุฒิการศึกษา --</option>
                        {DEGREE_OPTIONS.map((deg) => (
                          <option key={deg} value={deg}>{deg}</option>
                        ))}
                        <option value="อื่นๆ" className="fw-bold text-primary">+ อื่นๆ (พิมพ์ระบุวุฒิเอง)</option>
                      </select>

                      {isCustom && (
                        <div className="mt-2 animate__animated animate__fadeIn">
                          <input
                            type="text"
                            id={`edu-degree-custom-${index}`}
                            className={`form-control bg-white ${eduErrors[index]?.degree ? 'border-ku-invalid is-invalid' : (customVal.trim() ? 'border-ku-filled' : 'border-ku-required')}`}
                            placeholder="พิมพ์ระบุระดับวุฒิการศึกษา (เช่น ประกาศนียบัตรบัณฑิต, แพทย์เฉพาะทาง)"
                            value={customVal}
                            maxLength="150"
                            onChange={(e) => handleEducationCustomDegreeChange(index, e.target.value)}
                            list="degree-custom-suggestions"
                            required
                          />
                        </div>
                      )}

                      {eduErrors[index]?.degree && (
                        <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                          <i className="bi bi-exclamation-circle-fill me-1"></i>{eduErrors[index].degree}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="col-md-4">
                <label className="form-label">สาขาวิชาเอก <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control bg-white ${eduErrors[index]?.major ? 'border-ku-invalid is-invalid' : ((edu.major || '').trim() ? 'border-ku-filled' : 'border-ku-required')}`}
                  placeholder="เช่น ภาษาอังกฤษธุรกิจ"
                  value={edu.major}
                  maxLength="150"
                  onChange={(e) => handleEducationChange(index, 'major', e.target.value)}
                  required
                />
                {eduErrors[index]?.major && (
                  <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                    <i className="bi bi-exclamation-circle-fill me-1"></i>{eduErrors[index].major}
                  </div>
                )}
              </div>
              <div className="col-md-2">
                <label className="form-label">เกรดเฉลี่ยสะสม <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control bg-white ${eduErrors[index]?.gpa ? 'border-ku-invalid is-invalid' : ((edu.gpa || '').trim() ? 'border-ku-filled' : 'border-ku-required')}`}
                  placeholder="เช่น 3.50"
                  value={edu.gpa}
                  maxLength="4"
                  onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)}
                  required
                />
                {eduErrors[index]?.gpa && (
                  <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                    <i className="bi bi-exclamation-circle-fill me-1"></i>{eduErrors[index].gpa}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">ชื่อสถานศึกษา <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control bg-white ${eduErrors[index]?.university ? 'border-ku-invalid is-invalid' : ((edu.university || '').trim() ? 'border-ku-filled' : 'border-ku-required')}`}
                  placeholder="ระบุชื่อเต็มมหาวิทยาลัย"
                  value={edu.university}
                  maxLength="150"
                  onChange={(e) => handleEducationChange(index, 'university', e.target.value)}
                  required
                />
                {eduErrors[index]?.university && (
                  <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                    <i className="bi bi-exclamation-circle-fill me-1"></i>{eduErrors[index].university}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">ประเทศ <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control bg-white ${eduErrors[index]?.country ? 'border-ku-invalid is-invalid' : ((edu.country || '').trim() ? 'border-ku-filled' : 'border-ku-required')}`}
                  placeholder="เช่น ไทย, สหรัฐอเมริกา"
                  value={edu.country}
                  maxLength="100"
                  onChange={(e) => handleEducationChange(index, 'country', e.target.value)}
                  required
                />
                {eduErrors[index]?.country && (
                  <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                    <i className="bi bi-exclamation-circle-fill me-1"></i>{eduErrors[index].country}
                  </div>
                )}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-medium">ได้รับอนุมัติผลการศึกษาเมื่อ <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className={`form-control bg-white ${eduErrors[index]?.approvalDate ? 'border-ku-invalid is-invalid' : ((edu.approvalDate || '').trim() ? 'border-ku-filled' : 'border-ku-required')}`}
                  max={maxAllowedDateStr}
                  value={edu.approvalDate}
                  onChange={(e) => handleEducationChange(index, 'approvalDate', e.target.value)}
                  required
                />
                {eduErrors[index]?.approvalDate && (
                  <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                    <i className="bi bi-exclamation-circle-fill me-1"></i>{eduErrors[index].approvalDate}
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}

        <div className="text-center mb-4">
          <button type="button" className="btn btn-outline-primary" onClick={addEducation}>
            <i className="bi bi-plus-circle-fill me-2"></i>เพิ่มวุฒิการศึกษาอีก
          </button>
        </div>

        <hr className="text-muted opacity-25 my-4" />

        <h6 className="fw-bold text-secondary mb-3">ผลการทดสอบภาษาอังกฤษ (ถ้ามี)</h6>
        <div className="row g-3 mb-4">
          <div className="col-md-12">
            {engTests.map((test, index) => (
              <div className="mb-2" key={`eng-${index}`}>
                <div className="row g-2 align-items-center">
                  <div className="col-md-5 col-12">
                    <select
                      className={`form-select bg-white ${engErrors[index]?.testName ? 'border-ku-invalid is-invalid' : ''}`}
                      value={test.testName}
                      onChange={(e) => handleEngTestChange(index, 'testName', e.target.value)}
                    >
                      <option value="">เลือกประเภทการทดสอบ</option>
                      {engTestOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {test.testName && !engTestOptions.includes(test.testName) && (
                        <option value={test.testName}>{test.testName}</option>
                      )}
                    </select>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted small">คะแนน</span>
                      <input
                        type="text"
                        className="form-control bg-white"
                        placeholder="เช่น 550"
                        value={test.score}
                        maxLength="10"
                        onChange={(e) => handleEngTestChange(index, 'score', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted small">วันที่สอบ</span>
                      <input
                        type="date"
                        className={`form-control bg-white ${engErrors[index]?.examDate ? 'border-ku-invalid is-invalid' : ''}`}
                        max={maxAllowedDateStr}
                        value={test.examDate || ''}
                        onChange={(e) => handleEngTestChange(index, 'examDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-1 col-12 text-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger w-100"
                      onClick={() => removeEngTest(index)}
                      disabled={engTests.length === 1}
                      title="ลบรายการ"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                {(engErrors[index]?.testName || engErrors[index]?.examDate) && (
                  <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {engErrors[index]?.testName || engErrors[index]?.examDate}
                  </div>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-primary mt-1" onClick={addEngTest}>
              <i className="bi bi-plus-circle me-1"></i>เพิ่มผลการทดสอบภาษาอังกฤษ
            </button>
          </div>
        </div>

        <hr className="text-muted opacity-25 my-4" />

        <h6 className="fw-bold text-secondary mb-3">ความสามารถพิเศษและภาษาอื่นๆ</h6>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">ความรู้ความสามารถพิเศษ</label>
            <textarea
              id="specialSkill"
              className={`form-control ${getInputClass('specialSkill', false)}`}
              rows="3"
              value={formValues.specialSkill || ''}
              onChange={e => handleFieldChange('specialSkill', e.target.value)}
              maxLength="500"
              placeholder="ระบุความสามารถ เช่น การใช้โปรแกรมเฉพาะทาง หรือ ทักษะอื่นๆ"
            ></textarea>
            {renderFieldError('specialSkill')}
          </div>
          <div className="col-md-6">
            <label className="form-label">ความรู้ภาษาต่างประเทศ (ภาษาใด เพียงใด)</label>
            <textarea
              id="foreignLanguage"
              className={`form-control ${getInputClass('foreignLanguage', false)}`}
              rows="3"
              value={formValues.foreignLanguage || ''}
              onChange={e => handleFieldChange('foreignLanguage', e.target.value)}
              maxLength="500"
              placeholder="เช่น ภาษาญี่ปุ่น (สื่อสารเบื้องต้นได้), ภาษาจีน (อ่าน/เขียนได้ดี)"
            ></textarea>
            {renderFieldError('foreignLanguage')}
          </div>
        </div>
      </div>
    </div>
  );
}
