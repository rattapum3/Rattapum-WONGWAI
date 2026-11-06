import React from 'react';

export default function WorkHistorySection({
  currentStep,
  expanded,
  toggleSection,
  formValues,
  handleFieldChange,
  getInputClass,
  renderFieldError,
  obligation,
  setObligation,
  fieldErrors,
  setFieldErrors
}) {
  return (
    <div className={`card shadow-sm border-0 mb-4 ${currentStep === 5 ? 'd-block' : 'd-none'}`} style={{ borderTop: '4px solid #03A96B' }}>
      <div
        className="card-header bg-white py-3 d-flex justify-content-between align-items-center"
        onClick={() => toggleSection('s5')}
        style={{ cursor: 'pointer' }}
      >
        <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-briefcase-fill me-2 text-success"></i>5. ข้อมูลการทำงานและภาระผูกพัน</h5>
        <i className={`bi fs-5 ${expanded.s5 ? 'bi-chevron-up text-secondary' : 'bi-chevron-down text-primary'}`}></i>
      </div>

      <div className="card-body p-4 animate__animated animate__fadeIn d-block">
        <h6 className="fw-bold text-secondary mb-3">สถานะการทำงานปัจจุบัน</h6>
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label">ขณะนี้มีอาชีพอะไร</label>
            <input
              type="text"
              id="currentJob"
              className={`form-control ${getInputClass('currentJob', false)}`}
              value={formValues.currentJob || ''}
              onChange={e => handleFieldChange('currentJob', e.target.value)}
              maxLength="100"
              placeholder="เช่น พนักงานบริษัท, รับราชการ"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">ทำงาน ณ ที่ใด</label>
            <input
              type="text"
              id="workplace"
              className={`form-control ${getInputClass('workplace', false)}`}
              value={formValues.workplace || ''}
              onChange={e => handleFieldChange('workplace', e.target.value)}
              maxLength="150"
              placeholder="ระบุชื่อบริษัทหรือหน่วยงาน"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">กรณีเป็นบุคลากร มก. เป็นบุคลากรประเภทใด</label>
            <select
              id="staffType"
              className="form-select"
              value={formValues.staffType || ''}
              onChange={e => handleFieldChange('staffType', e.target.value)}
            >
              <option value="">ไม่ได้เป็น (หรือเลือกประเภทบุคลากร)</option>
              <option value="ไม่ได้เป็น">ไม่ได้เป็น</option>
              <option value="พนักงานมหาวิทยาลัย">พนักงานมหาวิทยาลัย</option>
              <option value="พนักงานมหาวิทยาลัยเงินรายได้">พนักงานมหาวิทยาลัยเงินรายได้</option>
              <option value="ข้าราชการ">ข้าราชการ</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">เคยทำงานอะไรมาบ้าง</label>
            <input
              type="text"
              id="workExperience"
              className={`form-control ${getInputClass('workExperience', false)}`}
              value={formValues.workExperience || ''}
              onChange={e => handleFieldChange('workExperience', e.target.value)}
              maxLength="255"
              placeholder="ระบุประวัติหรือประสบการณ์การทำงานที่ผ่านมา (ถ้ามี)"
            />
          </div>
        </div>

        <hr className="text-muted opacity-25" />
        <h6 className="fw-bold text-secondary mb-3 mt-4">ภาระผูกพันการชดใช้ทุน / ลาศึกษาต่อ</h6>

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label className="form-label">มีภาระผูกพันตามสัญญารับทุน <span className="text-danger">*</span></label>
            <select
              id="obligation"
              className={`form-select ${fieldErrors.obligation ? 'border-ku-invalid is-invalid' : (obligation ? 'border-ku-filled' : 'border-ku-required')}`}
              value={obligation}
              onChange={(e) => {
                const val = e.target.value;
                setObligation(val);
                setFieldErrors(prev => ({
                  ...prev,
                  obligation: val ? '' : 'กรุณาเลือกเงื่อนไขภาระผูกพัน',
                  contractAgency: '',
                  contractName: ''
                }));
              }}
              required
            >
              <option value="">เลือก</option>
              <option value="ไม่มี">ไม่มี</option>
              <option value="มี">มีภาระผูกพัน</option>
            </select>
            {renderFieldError('obligation')}
          </div>
          <div className="col-md-4">
            <label className="form-label">หน่วยงานที่ชดใช้ทุน {obligation === 'มี' && <span className="text-danger">*</span>}</label>
            <input
              type="text"
              id="contractAgency"
              className={`form-control ${getInputClass('contractAgency', obligation === 'มี')}`}
              placeholder="เช่น มหาวิทยาลัย..."
              value={formValues.contractAgency || ''}
              onChange={e => handleFieldChange('contractAgency', e.target.value)}
              maxLength="150"
              disabled={obligation === 'ไม่มี' || obligation === ''}
            />
            {renderFieldError('contractAgency')}
          </div>
          <div className="col-md-4">
            <label className="form-label">ชื่อสัญญารับทุน {obligation === 'มี' && <span className="text-danger">*</span>}</label>
            <input
              type="text"
              id="contractName"
              className={`form-control ${getInputClass('contractName', obligation === 'มี')}`}
              placeholder="ระบุชื่อสัญญา"
              value={formValues.contractName || ''}
              onChange={e => handleFieldChange('contractName', e.target.value)}
              maxLength="150"
              disabled={obligation === 'ไม่มี' || obligation === ''}
            />
            {renderFieldError('contractName')}
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-12">
            <label className="form-label">มีภาระผูกพันปฏิบัติงานชดใช้ตามสัญญาขณะเป็นบุคลากร มก. (ระบุสังกัด)</label>
          </div>
          <div className="col-md-6">
            <input
              type="text"
              id="staffAffiliation"
              className="form-control"
              placeholder="ระบุสังกัดพนักงานมหาวิทยาลัย"
              value={formValues.staffAffiliation || ''}
              onChange={e => handleFieldChange('staffAffiliation', e.target.value)}
              maxLength="150"
              disabled={obligation === 'ไม่มี' || obligation === ''}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              id="staffAffiliationIncome"
              className="form-control"
              placeholder="ระบุสังกัดพนักงานมหาวิทยาลัยเงินรายได้"
              value={formValues.staffAffiliationIncome || ''}
              onChange={e => handleFieldChange('staffAffiliationIncome', e.target.value)}
              maxLength="150"
              disabled={obligation === 'ไม่มี' || obligation === ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
