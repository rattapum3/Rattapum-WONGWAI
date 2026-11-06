import React from 'react';

export default function DocumentUploadSection({
  currentStep,
  requiredDocs = [],
  files = {},
  handleFileUpload,
  removeMainFile,
  extraDocFiles = {},
  addExtraDocFile,
  removeExtraDocFile,
  handleExtraDocFileChange,
  additionalDocs = [],
  addAdditionalDoc,
  removeAdditionalDoc,
  handleAdditionalDocChange,
  handleAdditionalDocFile
}) {
  const totalUploadedFilesCount =
    Object.keys(files).length +
    Object.values(extraDocFiles).flat().filter(f => f.file).length +
    additionalDocs.filter(d => d.file).length;

  return (
    <div className={`card shadow-sm border-0 mb-4 ${currentStep === 6 ? 'd-block' : 'd-none'}`} style={{ borderTop: '4px solid #03A96B' }}>
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-file-earmark-arrow-up-fill me-2 text-success"></i>6. แนบสำเนาเอกสารประกอบการสมัคร</h5>
        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
          แนบแล้ว {totalUploadedFilesCount} ไฟล์
        </span>
      </div>

      <div className="card-body p-4 animate__animated animate__fadeIn d-block">
        <div className="alert alert-info border-0 shadow-sm mb-4" style={{ backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>คำแนะนำ:</strong> กรุณาอัปโหลดไฟล์ในรูปแบบ PDF หรือ JPG/PNG ขนาดไฟล์ละไม่เกิน 10MB พร้อมลงนามรับรองสำเนาถูกต้องทุกฉบับ (ท่านสามารถแนบไฟล์เพิ่มในแต่ละเอกสาร หรือเพิ่มเอกสารอื่นๆ ได้ตามต้องการ)
        </div>

        {/* ส่วนที่ 1: เอกสารหลักฐานบังคับตามประกาศ */}
        <h6 className="fw-bold text-secondary mb-3">
          <i className="bi bi-check2-circle me-1 text-primary"></i> 1. เอกสารหลักฐานบังคับตามประกาศรับสมัคร
        </h6>

        <div className="row g-4 mb-4">
          {requiredDocs.map((doc, index) => {
            const mainFile = files['doc_' + doc.id];
            const extras = extraDocFiles[doc.id] || [];

            return (
              <div className="col-12 col-lg-6" key={doc.id}>
                <div className="p-3 border rounded h-100 bg-white shadow-sm position-relative">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <label className="form-label fw-bold mb-0">
                      {index + 1}. {doc.name} <span className="text-danger">*</span>
                    </label>
                    {mainFile && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        <i className="bi bi-check-lg me-1"></i>เลือกแล้ว
                      </span>
                    )}
                  </div>
                  {doc.detail && <div className="small text-muted mb-2">{doc.detail}</div>}

                  {/* ช่องแนบไฟล์หลัก */}
                  <div className="mb-2">
                    <input
                      type="file"
                      className={`form-control ${mainFile ? 'border-ku-filled' : 'border-ku-required'}`}
                      onChange={(e) => handleFileUpload(e, `doc_${doc.id}`)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>

                  {mainFile && (
                    <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2 border">
                      <span className="small text-truncate me-2" style={{ maxWidth: '75%' }}>
                        <i className="bi bi-file-earmark-check-fill text-success me-1"></i>
                        {mainFile.name} ({(mainFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2"
                        title="ลบไฟล์"
                        onClick={() => removeMainFile(`doc_${doc.id}`)}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  )}

                  {/* ไฟล์ย่อยเพิ่มเติมสำหรับเอกสารข้อนี้ */}
                  {extras.map((extraItem, extraIdx) => (
                    <div key={extraItem.id} className="p-2 border rounded bg-light mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-bold text-secondary">
                          <i className="bi bi-paperclip me-1"></i>ไฟล์เพิ่มเติม #{extraIdx + 1}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-0 px-2"
                          onClick={() => removeExtraDocFile(doc.id, extraItem.id)}
                        >
                          <i className="bi bi-trash me-1"></i>ลบไฟล์นี้
                        </button>
                      </div>
                      <input
                        type="file"
                        className="form-control form-control-sm mb-1"
                        onChange={(e) => handleExtraDocFileChange(doc.id, extraItem.id, e)}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {extraItem.name && (
                        <div className="small text-success">
                          <i className="bi bi-check-circle me-1"></i>{extraItem.name} ({extraItem.size})
                        </div>
                      )}
                    </div>
                  ))}

                  {/* ปุ่มเพิ่มไฟล์เพิ่มเติมในหัวข้อนี้ */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary w-100 mt-1"
                    style={{ borderStyle: 'dashed' }}
                    onClick={() => addExtraDocFile(doc.id)}
                  >
                    <i className="bi bi-plus-circle me-1"></i>แนบไฟล์เพิ่มสำหรับเอกสารนี้ (เช่น ใบที่ 2 หรือหน้าต่อไป)
                  </button>
                </div>
              </div>
            );
          })}

          {requiredDocs.length === 0 && (
            <div className="col-12 text-center text-muted py-4">
              ไม่พบรายการเอกสารบังคับพิเศษ
            </div>
          )}
        </div>

        <hr className="text-muted opacity-25 my-4" />

        {/* ส่วนที่ 2: เอกสารเพิ่มเติมอื่นๆ (สามารถเพิ่มได้มากกว่า 1 รายการ) */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
          <div>
            <h6 className="fw-bold text-secondary mb-1">
              <i className="bi bi-folder-plus me-2 text-success"></i>2. เอกสารแนบเพิ่มเติมอื่นๆ (ถ้ามี)
            </h6>
            <div className="text-muted small">
              ผู้สมัครสามารถเพิ่มเอกสารแนบอื่นๆ ประกอบการพิจารณา เช่น ใบประกอบวิชาชีพ, เกียรติบัตร/วุฒิบัตร, ผลงานทางวิชาการ (Portfolio), เอกสารรับรองการทำงาน ฯลฯ
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm text-white px-3 py-2 rounded shadow-sm flex-shrink-0"
            style={{ backgroundColor: '#03A96B' }}
            onClick={addAdditionalDoc}
          >
            <i className="bi bi-plus-circle-fill me-1"></i>+ เพิ่มเอกสารเพิ่มเติม
          </button>
        </div>

        {/* รายการเอกสารเพิ่มเติมที่เพิ่มเข้ามา */}
        {additionalDocs.length > 0 ? (
          <div className="row g-3 mb-3">
            {additionalDocs.map((item, idx) => (
              <div className="col-12 col-lg-6" key={item.id}>
                <div className="p-3 border rounded bg-white shadow-sm h-100 position-relative">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-success">
                      <i className="bi bi-file-earmark-plus-fill me-1"></i>เอกสารเพิ่มเติม #{idx + 1}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      onClick={() => removeAdditionalDoc(item.id)}
                      title="ลบเอกสารนี้"
                    >
                      <i className="bi bi-trash me-1"></i>ลบ
                    </button>
                  </div>

                  {/* ชื่อเอกสาร */}
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">ชื่อหรือประเภทเอกสาร <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="เช่น ใบประกอบวิชาชีพ, แฟ้มผลงาน Portfolio, เกียรติบัตร"
                      value={item.title}
                      onChange={(e) => handleAdditionalDocChange(item.id, 'title', e.target.value)}
                    />
                    {/* Quick suggestions */}
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {["ใบประกอบวิชาชีพ", "Portfolio / แฟ้มผลงาน", "เกียรติบัตร / วุฒิบัตร", "ใบผ่านงาน", "หนังสือรับรอง"].map(tag => (
                        <button
                          type="button"
                          key={tag}
                          className="btn btn-xs btn-light border py-0 px-2 rounded-pill small text-secondary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleAdditionalDocChange(item.id, 'title', tag)}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ช่องเลือกไฟล์ */}
                  <div className="mb-1">
                    <label className="form-label small fw-bold text-secondary mb-1">เลือกไฟล์เอกสาร <span className="text-danger">*</span></label>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      onChange={(e) => handleAdditionalDocFile(item.id, e)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>

                  {item.name && (
                    <div className="small text-success mt-1">
                      <i className="bi bi-check-circle-fill me-1"></i>{item.name} ({item.size})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-light rounded border border-dashed text-muted mb-3" style={{ borderStyle: 'dashed' }}>
            <i className="bi bi-folder2-open fs-2 d-block text-secondary opacity-50 mb-1"></i>
            <div className="small">ยังไม่มีเอกสารเพิ่มเติม หากท่านมีเอกสารอื่นๆ ที่ต้องการแนบ สามารถกดปุ่ม <strong>"+ เพิ่มเอกสารเพิ่มเติม"</strong> ด้านบนได้</div>
          </div>
        )}

      </div>
    </div>
  );
}
