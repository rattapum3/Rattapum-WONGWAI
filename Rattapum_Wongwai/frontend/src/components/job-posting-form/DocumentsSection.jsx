import React from 'react';
import { sanitizeText } from './jobPostingUtils';

export default function DocumentsSection({
  openAccordion,
  toggleAccordion,
  selectedDocs,
  setSelectedDocs,
  docMasterList,
  updateDocId,
  updateDocDetail,
  removeDocItem,
  addDocItem,
  moveListItem,
  feeDetails,
  setFeeDetails,
  appConditions,
  setAppConditions
}) {
  return (
    <div className="accordion-item border">
      <h2 className="accordion-header">
        <button
          className={`accordion-button fw-bold ${openAccordion === 4 ? 'text-success' : 'collapsed'}`}
          type="button"
          onClick={() => toggleAccordion(4)}
        >
          <i className="bi bi-file-earmark-check-fill me-2" style={{ color: '#03A96B' }}></i>
          4. เอกสารและหลักฐานที่ต้องยื่น
        </button>
      </h2>
      <div className={`accordion-collapse collapse ${openAccordion === 4 ? 'show' : ''}`}>
        <div className="accordion-body bg-white pb-4">

          <div className="mb-4">
            <label className="form-label fw-bold text-dark mb-1">รายการเอกสารประกอบการสมัคร</label>
            <div className="p-3 bg-light rounded border">
              {selectedDocs.map((doc, idx) => (
                <div className="row g-2 mb-2 align-items-center bg-white p-2 rounded border shadow-sm" key={idx}>
                  <div className="col-md-5">
                    <select
                      className="form-select form-select-sm"
                      value={doc.docId}
                      onChange={(e) => updateDocId(idx, e.target.value)}
                    >
                      {docMasterList.map((m, mIdx) => (
                        <option key={mIdx} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="รายละเอียด เช่น จำนวน 1 ชุด"
                      maxLength={200}
                      value={doc.docDetail}
                      onChange={(e) => updateDocDetail(idx, e.target.value)}
                    />
                  </div>
                  <div className="col-md-3 text-end d-flex gap-1 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveListItem(idx, -1, selectedDocs, setSelectedDocs)}
                      disabled={idx === 0}
                      title="เลื่อนขึ้น"
                    >
                      <i className="bi bi-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => moveListItem(idx, 1, selectedDocs, setSelectedDocs)}
                      disabled={idx === selectedDocs.length - 1}
                      title="เลื่อนลง"
                    >
                      <i className="bi bi-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeDocItem(idx)}
                      title="ลบ"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary mt-2 fw-bold"
                onClick={addDocItem}
              >
                <i className="bi bi-plus-circle me-1"></i>เพิ่มเอกสารประกอบ
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold text-dark mb-1">ค่าธรรมเนียมการสมัครสอบ</label>
            <input
              type="text"
              className="form-control"
              maxLength={100}
              value={feeDetails}
              onChange={e => setFeeDetails(sanitizeText(e.target.value, 100))}
            />
          </div>

          <div className="mb-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-bold text-dark mb-0">เงื่อนไขและข้อกำหนดในการสมัคร</label>

            </div>
            <textarea
              className="form-control text-muted"
              rows="5"
              style={{ resize: 'vertical', minHeight: '130px' }}
              value={appConditions}
              onChange={e => setAppConditions(e.target.value)}
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
