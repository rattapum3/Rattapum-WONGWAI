import React from 'react';
import { academicDegrees, supportDegrees, sanitizeText } from './jobPostingUtils';

export default function QualificationsSection({
  openAccordion,
  toggleAccordion,
  isFromRequest,
  jobCategory,
  selectedDegree,
  setSelectedDegree,
  customDegree,
  setCustomDegree,
  handleDegreeChange,
  majorsList,
  setMajorsList,
  jobResponsibilities,
  setJobResponsibilities,
  generalQuals,
  setGeneralQuals,
  prohibitedTraits,
  setProhibitedTraits,
  otherAbilities,
  setOtherAbilities,
  engTests,
  setEngTests,
  engTestOptions,
  addEngTest,
  updateEngTest,
  removeEngTest,
  handleListChange,
  addListItem,
  removeListItem,
  moveListItem,
  formErrors,
  setFormErrors,
  setTouchedFields,
  getInputClass
}) {
  return (
    <div className="accordion-item border">
      <h2 className="accordion-header">
        <button
          className={`accordion-button fw-bold ${openAccordion === 2 ? 'text-success' : 'collapsed'}`}
          type="button"
          onClick={() => toggleAccordion(2)}
        >
          <i className="bi bi-mortarboard-fill me-2" style={{ color: '#03A96B' }}></i>
          2. คุณสมบัติเฉพาะตำแหน่งและภาระงาน
        </button>
      </h2>
      <div className={`accordion-collapse collapse ${openAccordion === 2 ? 'show' : ''}`}>
        <div className="accordion-body bg-white pb-4">

          {/* วุฒิการศึกษา */}
          <div className="mb-4" id="field-degrees">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-bold text-dark mb-0">
                ระดับการศึกษาที่เปิดรับ (เลือกได้ 1 วุฒิ) <span className="text-danger">*</span>
              </label>
              <span className="text-muted small">
                {isFromRequest ? 'กำหนดจากคำขอของคณะ/หน่วยงาน' : 'เลือกจากรายการ หรือ พิมพ์ระบุวุฒิเอง'}
              </span>
            </div>
            <div className={`d-flex flex-wrap gap-3 p-3 bg-light rounded border ${isFromRequest ? 'border-secondary-subtle opacity-75' : (formErrors.degrees ? 'border-danger' : '')}`}>
              {(jobCategory === "สายวิชาการ" ? academicDegrees : supportDegrees).map((deg, idx) => (
                <div className="form-check" key={idx}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="jobDegreeRadio"
                    id={`deg-${idx}`}
                    checked={selectedDegree === deg}
                    onChange={() => handleDegreeChange(deg)}
                    disabled={isFromRequest}
                  />
                  <label
                    className={`form-check-label fw-medium ${isFromRequest ? 'text-muted' : ''}`}
                    htmlFor={`deg-${idx}`}
                    style={{ cursor: isFromRequest ? 'not-allowed' : 'pointer' }}
                  >
                    {deg}
                  </label>
                </div>
              ))}
              {(!isFromRequest || selectedDegree === 'other') && (
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="jobDegreeRadio"
                    id="deg-custom-radio"
                    checked={selectedDegree === 'other'}
                    disabled={isFromRequest}
                    onChange={() => {
                      if (isFromRequest) return;
                      setSelectedDegree('other');
                      setTouchedFields(prev => ({ ...prev, degrees: true }));
                      if (customDegree.trim()) {
                        setFormErrors(prev => ({ ...prev, degrees: '' }));
                      } else {
                        setFormErrors(prev => ({ ...prev, degrees: 'กรุณาพิมพ์ระบุวุฒิการศึกษา' }));
                      }
                    }}
                  />
                  <label
                    className={`form-check-label fw-bold ${isFromRequest ? 'text-muted' : 'text-primary'}`}
                    htmlFor="deg-custom-radio"
                    style={{ cursor: isFromRequest ? 'not-allowed' : 'pointer' }}
                  >
                    + อื่นๆ (พิมพ์ระบุวุฒิเอง)
                  </label>
                </div>
              )}
            </div>

            {selectedDegree === 'other' && (
              <div className="mt-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small text-muted mb-0">พิมพ์ระบุวุฒิการศึกษา</label>
                </div>
                <input
                  type="text"
                  className={`form-control ${isFromRequest ? 'bg-light text-secondary border-secondary-subtle' : getInputClass(customDegree, formErrors.degrees && !customDegree.trim())}`}
                  placeholder="พิมพ์ระบุวุฒิการศึกษา เช่น แพทยศาสตรบัณฑิต, วิทยาศาสตรบัณฑิต หรือ ดุษฎีบัณฑิต"
                  maxLength={100}
                  value={customDegree}
                  disabled={isFromRequest}
                  onChange={e => {
                    if (isFromRequest) return;
                    const val = sanitizeText(e.target.value, 100);
                    setCustomDegree(val);
                    setTouchedFields(prev => ({ ...prev, degrees: true }));
                    if (val.trim()) {
                      setFormErrors(prev => ({ ...prev, degrees: '' }));
                    } else {
                      setFormErrors(prev => ({ ...prev, degrees: 'กรุณาพิมพ์ระบุวุฒิการศึกษา' }));
                    }
                  }}
                />
              </div>
            )}

            {formErrors.degrees && (
              <div className="text-danger small mt-1 d-flex align-items-center">
                <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.degrees}
              </div>
            )}
          </div>

          {/* สาขาวิชา */}
          <div className="mb-4" id="field-majors">
            <label className="form-label fw-bold text-dark mb-1">
              สาขาวิชาที่เปิดรับ <span className="text-danger">*</span>
            </label>
            {majorsList.map((major, index) => (
              <div className="input-group mb-2 shadow-sm" key={index}>
                <span className="input-group-text bg-light">{index + 1}</span>
                <input
                  type="text"
                  className={`form-control ${isFromRequest ? 'bg-light text-secondary border-secondary-subtle' : getInputClass(major, formErrors.majors && !major.trim())}`}
                  placeholder="เช่น วิทยาการคอมพิวเตอร์, เทคโนโลยีสารสนเทศ"
                  maxLength={100}
                  value={major}
                  disabled={isFromRequest}
                  onChange={(e) => {
                    if (isFromRequest) return;
                    handleListChange(index, e.target.value, majorsList, setMajorsList);
                    setFormErrors(prev => ({ ...prev, majors: '' }));
                  }}
                />
                {!isFromRequest && (
                  <>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => moveListItem(index, -1, majorsList, setMajorsList)} disabled={index === 0} title="เลื่อนขึ้น">
                      <i className="bi bi-arrow-up"></i>
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => moveListItem(index, 1, majorsList, setMajorsList)} disabled={index === majorsList.length - 1} title="เลื่อนลง">
                      <i className="bi bi-arrow-down"></i>
                    </button>
                    <button type="button" className="btn btn-outline-danger" onClick={() => removeListItem(index, majorsList, setMajorsList)} disabled={majorsList.length === 1} title="ลบ">
                      <i className="bi bi-trash"></i>
                    </button>
                  </>
                )}
              </div>
            ))}
            {!isFromRequest && (
              <button type="button" className="btn btn-sm btn-outline-primary mt-1 fw-bold" onClick={() => addListItem(majorsList, setMajorsList)}>
                <i className="bi bi-plus-circle me-1"></i>เพิ่มสาขาวิชา
              </button>
            )}
            {formErrors.majors && (
              <div className="text-danger small mt-1 d-flex align-items-center">
                <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.majors}
              </div>
            )}
          </div>

          {/* ภาระงานและคุณสมบัติต่างๆ */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-bold text-dark mb-0">หน้าที่และความรับผิดชอบ</label>
            </div>
            {jobResponsibilities.map((item, index) => (
              <div className="input-group input-group-textarea mb-2 shadow-sm" key={index}>
                <span className="input-group-text bg-light d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', minWidth: '42px', alignSelf: 'flex-start' }}>{index + 1}</span>
                <textarea
                  className={`form-control ${getInputClass(item, formErrors.responsibilities && !item.trim())}`}
                  placeholder="ระบุภาระงานและหน้าที่ความรับผิดชอบ"
                  rows="2"
                  style={{ resize: 'vertical', minHeight: '65px' }}
                  maxLength={500}
                  value={item}
                  onChange={(e) => handleListChange(index, e.target.value, jobResponsibilities, setJobResponsibilities)}
                ></textarea>
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, -1, jobResponsibilities, setJobResponsibilities)} disabled={index === 0} title="เลื่อนขึ้น">
                  <i className="bi bi-arrow-up"></i>
                </button>
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, 1, jobResponsibilities, setJobResponsibilities)} disabled={index === jobResponsibilities.length - 1} title="เลื่อนลง">
                  <i className="bi bi-arrow-down"></i>
                </button>
                <button type="button" className="btn btn-outline-danger d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => removeListItem(index, jobResponsibilities, setJobResponsibilities)} disabled={jobResponsibilities.length === 1} title="ลบ">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-primary mt-1 fw-bold" onClick={() => addListItem(jobResponsibilities, setJobResponsibilities)}>
              <i className="bi bi-plus-circle me-1"></i>เพิ่มหน้าที่ความรับผิดชอบ
            </button>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-bold text-dark mb-0">คุณสมบัติทั่วไป</label>
            </div>
            {generalQuals.map((item, index) => (
              <div className="input-group input-group-textarea mb-2 shadow-sm" key={index}>
                <span className="input-group-text bg-light d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', minWidth: '42px', alignSelf: 'flex-start' }}>{index + 1}</span>
                <textarea
                  className={`form-control ${getInputClass(item)}`}
                  placeholder="ระบุคุณสมบัติทั่วไป"
                  rows="2"
                  style={{ resize: 'vertical', minHeight: '65px' }}
                  maxLength={500}
                  value={item}
                  onChange={(e) => handleListChange(index, e.target.value, generalQuals, setGeneralQuals)}
                ></textarea>
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, -1, generalQuals, setGeneralQuals)} disabled={index === 0} title="เลื่อนขึ้น">
                  <i className="bi bi-arrow-up"></i>
                </button>
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, 1, generalQuals, setGeneralQuals)} disabled={index === generalQuals.length - 1} title="เลื่อนลง">
                  <i className="bi bi-arrow-down"></i>
                </button>
                <button type="button" className="btn btn-outline-danger d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => removeListItem(index, generalQuals, setGeneralQuals)} disabled={generalQuals.length === 1} title="ลบ">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-primary mt-1 fw-bold" onClick={() => addListItem(generalQuals, setGeneralQuals)}>
              <i className="bi bi-plus-circle me-1"></i>เพิ่มคุณสมบัติทั่วไป
            </button>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-bold text-dark mb-0">ลักษณะต้องห้าม</label>
            </div>
            {prohibitedTraits.map((item, index) => (
              <div className="input-group input-group-textarea mb-2 shadow-sm" key={index}>
                <span className="input-group-text bg-light d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', minWidth: '42px', alignSelf: 'flex-start' }}>{index + 1}</span>
                <textarea
                  className={`form-control ${getInputClass(item)}`}
                  placeholder="ระบุลักษณะต้องห้าม"
                  rows="2"
                  style={{ resize: 'vertical', minHeight: '65px' }}
                  maxLength={500}
                  value={item}
                  onChange={(e) => handleListChange(index, e.target.value, prohibitedTraits, setProhibitedTraits)}
                ></textarea>
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, -1, prohibitedTraits, setProhibitedTraits)} disabled={index === 0} title="เลื่อนขึ้น">
                  <i className="bi bi-arrow-up"></i>
                </button>
                <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, 1, prohibitedTraits, setProhibitedTraits)} disabled={index === prohibitedTraits.length - 1} title="เลื่อนลง">
                  <i className="bi bi-arrow-down"></i>
                </button>
                <button type="button" className="btn btn-outline-danger d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => removeListItem(index, prohibitedTraits, setProhibitedTraits)} disabled={prohibitedTraits.length === 1} title="ลบ">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-primary mt-1 fw-bold" onClick={() => addListItem(prohibitedTraits, setProhibitedTraits)}>
              <i className="bi bi-plus-circle me-1"></i>เพิ่มลักษณะต้องห้าม
            </button>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-bold text-dark mb-0">
                ความรู้ความสามารถพิเศษ หรือทักษะเฉพาะตำแหน่ง
              </label>
            </div>
            {otherAbilities.length === 0 ? (
              <p className="text-muted small fst-italic mb-2 p-2 bg-light rounded border">
                (ยังไม่มีการระบุความรู้ความสามารถพิเศษหรือทักษะเฉพาะตำแหน่ง หากต้องการเพิ่ม ให้คลิกปุ่มด้านล่าง)
              </p>
            ) : (
              otherAbilities.map((item, index) => (
                <div className="input-group input-group-textarea mb-2 shadow-sm" key={index}>
                  <span className="input-group-text bg-light d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', minWidth: '42px', alignSelf: 'flex-start' }}>{index + 1}</span>
                  <textarea
                    className={`form-control ${getInputClass(item)}`}
                    placeholder="ระบุทักษะพิเศษหรือความสามารถเฉพาะตำแหน่ง"
                    rows="2"
                    style={{ resize: 'vertical', minHeight: '65px' }}
                    maxLength={500}
                    value={item}
                    onChange={(e) => handleListChange(index, e.target.value, otherAbilities, setOtherAbilities)}
                  ></textarea>
                  <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, -1, otherAbilities, setOtherAbilities)} disabled={index === 0} title="เลื่อนขึ้น">
                    <i className="bi bi-arrow-up"></i>
                  </button>
                  <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => moveListItem(index, 1, otherAbilities, setOtherAbilities)} disabled={index === otherAbilities.length - 1} title="เลื่อนลง">
                    <i className="bi bi-arrow-down"></i>
                  </button>
                  <button type="button" className="btn btn-outline-danger d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }} onClick={() => removeListItem(index, otherAbilities, setOtherAbilities)} disabled={otherAbilities.length === 1 && (!item || !item.trim())} title="ลบ">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))
            )}
            <button type="button" className="btn btn-sm btn-outline-primary mt-1 fw-bold" onClick={() => addListItem(otherAbilities, setOtherAbilities)}>
              <i className="bi bi-plus-circle me-1"></i>เพิ่มทักษะเฉพาะ
            </button>
          </div>

          {/* เกณฑ์ภาษาอังกฤษ */}
          <div className="mb-2">
            <label className="form-label fw-bold text-dark mb-1">เกณฑ์คะแนนภาษาอังกฤษขั้นต่ำ</label>
            <div className="p-3 bg-light rounded border">
              {engTests.length === 0 && (
                <p className="text-muted small fst-italic mb-2">ยังไม่มีการกำหนดเกณฑ์คะแนนภาษาอังกฤษ (หากต้องการกำหนด ให้คลิกปุ่มด้านล่าง)</p>
              )}
              {engTests.map((t, idx) => (
                <div className="row g-2 mb-2 align-items-center bg-white p-2 rounded border shadow-sm" key={idx}>
                  <div className="col-md-5">
                    <select className="form-select" value={t.testName} onChange={(e) => updateEngTest(idx, 'testName', e.target.value)}>
                      <option value="">-- เลือกประเภทการทดสอบ --</option>
                      {engTestOptions.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>{opt}</option>
                      ))}
                      {t.testName && !engTestOptions.includes(t.testName) && (
                        <option value={t.testName}>{t.testName}</option>
                      )}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <input type="text" className="form-control" placeholder="คะแนนขั้นต่ำ (เช่น 500)" value={t.minScore} onChange={(e) => updateEngTest(idx, 'minScore', e.target.value)} />
                  </div>
                  <div className="col-md-3 text-end d-flex gap-1 justify-content-end">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => moveListItem(idx, -1, engTests, setEngTests)} disabled={idx === 0} title="เลื่อนขึ้น">
                      <i className="bi bi-arrow-up"></i>
                    </button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => moveListItem(idx, 1, engTests, setEngTests)} disabled={idx === engTests.length - 1} title="เลื่อนลง">
                      <i className="bi bi-arrow-down"></i>
                    </button>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeEngTest(idx)} title="ลบ">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-primary mt-1 fw-bold" onClick={addEngTest}>
                <i className="bi bi-plus-circle me-1"></i>เพิ่มเกณฑ์ภาษาอังกฤษ
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
