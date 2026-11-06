import React from 'react';

export default function SelectionExamsSection({
  openAccordion,
  toggleAccordion,
  exams,
  examTypeOptions,
  addExam,
  updateExam,
  removeExam,
  moveExam,
  appSteps,
  setAppSteps,
  handleListChange,
  addListItem,
  removeListItem,
  moveListItem,
  formErrors,
  setFormErrors
}) {
  return (
    <div className="accordion-item border">
      <h2 className="accordion-header">
        <button
          className={`accordion-button fw-bold ${openAccordion === 3 ? 'text-success' : 'collapsed'}`}
          type="button"
          onClick={() => toggleAccordion(3)}
        >
          <i className="bi bi-calendar-check-fill me-2" style={{ color: '#03A96B' }}></i>
          3. วัน เวลา สถานที่สอบ และวิธีการคัดเลือก
        </button>
      </h2>
      <div className={`accordion-collapse collapse ${openAccordion === 3 ? 'show' : ''}`}>
        <div className="accordion-body bg-white pb-4">

          <div className="mb-4" id="field-exams">
            <label className="form-label fw-bold text-dark mb-1">วิชา/วิธีการคัดเลือก</label>
            <div className={`p-3 bg-light rounded border ${formErrors.exams ? 'border-danger' : ''}`}>
              {exams.length === 0 && (
                <p className="text-muted small fst-italic mb-2">
                  ยังไม่มีรายการวิชา/วิธีการคัดเลือก (คลิกปุ่มด้านล่างเพื่อเพิ่มวิธีการคัดเลือก)
                </p>
              )}
              {exams.map((ex, idx) => (
                <div className="card mb-3 border shadow-sm" key={idx}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-primary">วิชา/การประเมินที่ {idx + 1}</span>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => moveExam(idx, -1)}
                          disabled={idx === 0}
                          title="เลื่อนขึ้น"
                        >
                          <i className="bi bi-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => moveExam(idx, 1)}
                          disabled={idx === exams.length - 1}
                          title="เลื่อนลง"
                        >
                          <i className="bi bi-arrow-down"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeExam(idx)}
                          title="ลบ"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-5">
                        <select
                          className="form-select"
                          value={ex.type}
                          onChange={(e) => {
                            updateExam(idx, 'type', e.target.value);
                            setFormErrors(prev => ({ ...prev, exams: '' }));
                          }}
                        >
                          <option value="">-- เลือกประเภทการสอบ --</option>
                          {examTypeOptions.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                          {ex.type && !examTypeOptions.includes(ex.type) && (
                            <option value={ex.type}>{ex.type}</option>
                          )}
                        </select>
                      </div>
                      <div className="col-md-7">
                        <textarea
                          className="form-control"
                          rows="2"
                          style={{ resize: 'vertical', minHeight: '65px' }}
                          placeholder="รายละเอียด/เกณฑ์การตัดสิน/คะแนนเต็ม (ลากขยายกรอบได้)"
                          maxLength={300}
                          value={ex.details}
                          onChange={(e) => updateExam(idx, 'details', e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-primary fw-bold" onClick={addExam}>
                <i className="bi bi-plus-circle me-1"></i>เพิ่มวิชา/วิธีการทดสอบ
              </button>
              {formErrors.exams && (
                <div className="text-danger small mt-2 d-flex align-items-center">
                  <i className="bi bi-exclamation-circle-fill me-1"></i>{formErrors.exams}
                </div>
              )}
            </div>
          </div>

          <div className="mb-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-bold text-dark mb-0">ขั้นตอนการสมัคร</label>

            </div>
            {appSteps.map((item, index) => (
              <div className="input-group input-group-textarea mb-2 shadow-sm" key={index}>
                <span className="input-group-text bg-light d-flex align-items-center justify-content-center" style={{ height: '38px', minHeight: '38px', minWidth: '42px', alignSelf: 'flex-start' }}>{index + 1}</span>
                <textarea
                  className="form-control"
                  rows="2"
                  style={{ resize: 'vertical', minHeight: '65px' }}
                  placeholder="ระบุขั้นตอนการสมัครและคำแนะนำ"
                  maxLength={500}
                  value={item}
                  onChange={(e) => handleListChange(index, e.target.value, appSteps, setAppSteps)}
                ></textarea>
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                  style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }}
                  onClick={() => moveListItem(index, -1, appSteps, setAppSteps)}
                  disabled={index === 0}
                  title="เลื่อนขึ้น"
                >
                  <i className="bi bi-arrow-up"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                  style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }}
                  onClick={() => moveListItem(index, 1, appSteps, setAppSteps)}
                  disabled={index === appSteps.length - 1}
                  title="เลื่อนลง"
                >
                  <i className="bi bi-arrow-down"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                  style={{ height: '38px', minHeight: '38px', alignSelf: 'flex-start' }}
                  onClick={() => removeListItem(index, appSteps, setAppSteps)}
                  disabled={appSteps.length === 1}
                  title="ลบ"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-primary mt-1 fw-bold" onClick={() => addListItem(appSteps, setAppSteps)}>
              <i className="bi bi-plus-circle me-1"></i>เพิ่มขั้นตอน
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
