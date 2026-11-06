import React from 'react';

export default function AddressContactSection({
  currentStep,
  expanded,
  toggleSection,
  selectedProvince,
  handleProvinceChange,
  provinces = [],
  selectedAmphoe,
  handleAmphoeChange,
  setSelectedAmphoe,
  selectedTambon,
  handleTambonChange,
  setSelectedTambon,
  addressDataMap = {},
  zipcode,
  setZipcode,
  formValues,
  handleFieldChange,
  getInputClass,
  renderFieldError,
  fieldErrors,
  setFieldErrors,
  mobilePhones = [""],
  phoneErrors = {},
  handleMobilePhoneChange,
  addMobilePhone,
  removeMobilePhone
}) {
  return (
    <div className={`card shadow-sm border-0 mb-4 ${currentStep === 2 ? 'd-block' : 'd-none'}`} style={{ borderTop: '4px solid #03A96B' }}>
      <div
        className="card-header bg-white py-3 d-flex justify-content-between align-items-center"
        onClick={() => toggleSection('s2')}
        style={{ cursor: 'pointer' }}
      >
        <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-house-door-fill me-2 text-success"></i>2. ข้อมูลที่อยู่ปัจจุบันและการติดต่อ</h5>
        <i className={`bi fs-5 ${expanded.s2 ? 'bi-chevron-up text-secondary' : 'bi-chevron-down text-primary'}`}></i>
      </div>

      <div className="card-body p-4 animate__animated animate__fadeIn d-block">
        <h6 className="fw-bold text-secondary mb-3">ที่อยู่ตามปัจจุบัน</h6>
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label">จังหวัด <span className="text-danger">*</span></label>
            <select
              id="selectedProvince"
              className={`form-select ${selectedProvince ? 'border-ku-filled' : (fieldErrors.selectedProvince ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
              value={selectedProvince}
              onChange={handleProvinceChange}
              required
            >
              <option value="">เลือกจังหวัด</option>
              {provinces.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
              {selectedProvince && !provinces.includes(selectedProvince) && (
                <option key={selectedProvince} value={selectedProvince}>{selectedProvince}</option>
              )}
            </select>
            {renderFieldError('selectedProvince')}
          </div>
          <div className="col-md-3">
            <label className="form-label">อำเภอ / เขต <span className="text-danger">*</span></label>
            {addressDataMap[selectedProvince] ? (
              <select
                id="selectedAmphoe"
                className={`form-select ${selectedAmphoe ? 'border-ku-filled' : (fieldErrors.selectedAmphoe ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                value={selectedAmphoe}
                onChange={handleAmphoeChange}
                disabled={!selectedProvince}
                required
              >
                <option value="">เลือกอำเภอ/เขต</option>
                {Object.keys(addressDataMap[selectedProvince]).map(amp => (
                  <option key={amp} value={amp}>{amp}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="selectedAmphoe"
                className={`form-control ${selectedAmphoe ? 'border-ku-filled' : (fieldErrors.selectedAmphoe ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                placeholder="กรอกอำเภอ/เขต"
                value={selectedAmphoe}
                onChange={e => {
                  setSelectedAmphoe(e.target.value);
                  setFieldErrors(prev => ({ ...prev, selectedAmphoe: e.target.value ? '' : 'กรุณาเลือกหรือระบุอำเภอ/เขต' }));
                }}
                disabled={!selectedProvince}
                required
              />
            )}
            {renderFieldError('selectedAmphoe')}
          </div>
          <div className="col-md-3">
            <label className="form-label">ตำบล / แขวง <span className="text-danger">*</span></label>
            {addressDataMap[selectedProvince] && addressDataMap[selectedProvince][selectedAmphoe] ? (
              <select
                id="selectedTambon"
                className={`form-select ${selectedTambon ? 'border-ku-filled' : (fieldErrors.selectedTambon ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                value={selectedTambon}
                onChange={handleTambonChange}
                disabled={!selectedAmphoe}
                required
              >
                <option value="">เลือกตำบล/แขวง</option>
                {addressDataMap[selectedProvince][selectedAmphoe].map(tam => (
                  <option key={tam.name} value={tam.name}>{tam.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="selectedTambon"
                className={`form-control ${selectedTambon ? 'border-ku-filled' : (fieldErrors.selectedTambon ? 'border-ku-invalid is-invalid' : 'border-ku-required')}`}
                placeholder="กรอกตำบล/แขวง"
                value={selectedTambon}
                onChange={e => {
                  setSelectedTambon(e.target.value);
                  setFieldErrors(prev => ({ ...prev, selectedTambon: e.target.value ? '' : 'กรุณาเลือกหรือระบุตำบล/แขวง' }));
                }}
                disabled={!selectedAmphoe}
                required
              />
            )}
            {renderFieldError('selectedTambon')}
          </div>
          <div className="col-md-3">
            <label className="form-label">รหัสไปรษณีย์</label>
            <input
              type="text"
              id="zipcode"
              className="form-control bg-light"
              value={zipcode}
              maxLength="5"
              onChange={e => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              readOnly={Boolean(addressDataMap[selectedProvince] && addressDataMap[selectedProvince][selectedAmphoe])}
              placeholder={addressDataMap[selectedProvince] && addressDataMap[selectedProvince][selectedAmphoe] ? "อัตโนมัติ" : "กรอกรหัสไปรษณีย์ (5 หลัก)"}
            />
            {renderFieldError('zipcode')}
          </div>

          <div className="col-md-3">
            <label className="form-label">ที่อยู่ปัจจุบันเลขที่ <span className="text-danger">*</span></label>
            <input
              type="text"
              id="houseNo"
              className={`form-control ${getInputClass('houseNo', true)}`}
              value={formValues.houseNo || ''}
              onChange={e => handleFieldChange('houseNo', e.target.value)}
              maxLength="30"
              placeholder="เช่น 123/45"
              required
            />
            {renderFieldError('houseNo')}
          </div>
          <div className="col-md-2">
            <label className="form-label">หมู่ที่</label>
            <input
              type="text"
              id="villageNo"
              className={`form-control ${getInputClass('villageNo', false)}`}
              value={formValues.villageNo || ''}
              onChange={e => handleFieldChange('villageNo', e.target.value)}
              maxLength="10"
              placeholder="เช่น 5"
            />
            {renderFieldError('villageNo')}
          </div>
          <div className="col-md-3">
            <label className="form-label">ตรอก/ซอย</label>
            <input
              type="text"
              id="alley"
              className={`form-control ${getInputClass('alley', false)}`}
              value={formValues.alley || ''}
              onChange={e => handleFieldChange('alley', e.target.value)}
              maxLength="80"
              placeholder="เช่น ซอยมิตรภาพ"
            />
            {renderFieldError('alley')}
          </div>
          <div className="col-md-4">
            <label className="form-label">ถนน</label>
            <input
              type="text"
              id="street"
              className={`form-control ${getInputClass('street', false)}`}
              value={formValues.street || ''}
              onChange={e => handleFieldChange('street', e.target.value)}
              maxLength="80"
              placeholder="เช่น ถนนแจ้งวัฒนะ"
            />
            {renderFieldError('street')}
          </div>
        </div>

        <hr className="text-muted opacity-25 my-4" />

        <h6 className="fw-bold text-secondary mb-3">ช่องทางการติดต่อ (โทรศัพท์มือถือ)</h6>
        <div className="row g-4">
          {/* โทรศัพท์มือถือ */}
          <div className="col-md-8 col-lg-6">
            <label className="form-label d-flex justify-content-between">
              <span>โทรศัพท์มือถือ <span className="text-danger">*</span></span>
              <button type="button" className="btn btn-sm btn-outline-success py-0" onClick={addMobilePhone}>+ เพิ่มเบอร์</button>
            </label>
            {mobilePhones.map((phone, index) => (
              <div key={`mobile-${index}`} className="mb-2">
                <div className="input-group">
                  <input
                    type="text"
                    id={`mobilePhone_${index}`}
                    className={`form-control ${phoneErrors[index] ? 'border-ku-invalid is-invalid' : ((phone || '').trim() ? 'border-ku-filled' : (index === 0 ? 'border-ku-required' : ''))}`}
                    placeholder="ระบุเบอร์มือถือ (เช่น 0812345678)"
                    value={phone}
                    maxLength="10"
                    onChange={(e) => handleMobilePhoneChange(index, e.target.value)}
                    required={index === 0}
                  />
                  <span className="input-group-text bg-white text-muted small" style={{ fontSize: '11px', minWidth: '65px', justifyContent: 'center' }}>
                    {(phone || '').length}/10
                  </span>
                  {mobilePhones.length > 1 && (
                    <button type="button" className="btn btn-outline-danger" onClick={() => removeMobilePhone(index)}><i className="bi bi-trash"></i></button>
                  )}
                </div>
                {phoneErrors[index] && (
                  <div className="text-danger small mt-1 animate__animated animate__fadeIn" style={{ fontSize: '13px' }}>
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {phoneErrors[index]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
