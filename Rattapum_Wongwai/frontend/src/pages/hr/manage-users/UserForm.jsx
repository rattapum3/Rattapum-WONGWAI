import React from 'react';
import { sanitizeFieldValue } from './manageUserValidation';

export default function UserForm({
  formData,
  setFormData,
  formErrors,
  phoneErrors,
  touchedFields,
  loadingFaculties,
  faculties = [],
  editId,
  handleInputChange,
  handlePhoneChange,
  addPhoneField,
  removePhoneField,
  handleSave,
  setView
}) {
  return (
    <div className="card border-0 shadow-sm" style={{ borderTop: '4px solid #006664', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="card-body p-4 p-md-5 bg-white">
        <form onSubmit={handleSave} noValidate>

          {/* ==========================================
              ส่วนที่ 1: ข้อมูลส่วนบุคคล
              ========================================== */}
          <h5 className="fw-bold mb-4 border-bottom pb-2 d-flex align-items-center" style={{ color: '#006664' }}>
            <i className="bi bi-person-lines-fill me-2" style={{ color: '#03A96B' }}></i>
            1. ข้อมูลส่วนบุคคล
          </h5>

          <div className="px-md-3">

            {/* 1.1 คำนำหน้าชื่อ */}
            <div className="row mb-4 align-items-start">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4 pt-2">
                คำนำหน้าชื่อ <span className="text-danger">*</span>
              </label>
              <div className="col-md-9 mt-1 mt-md-0">
                <div className="d-flex flex-wrap align-items-center gap-3">
                  {/* ปุ่มตัวเลือกมาตรฐาน */}
                  <div className="btn-group shadow-sm">
                    {["นาย", "นาง", "นางสาว"].map(prefix => (
                      <React.Fragment key={prefix}>
                        <input
                          type="radio"
                          className="btn-check"
                          name="prefix"
                          id={`prefix-${prefix}`}
                          value={prefix}
                          checked={formData.prefix === prefix}
                          onChange={() => handleInputChange('prefix', prefix)}
                        />
                        <label
                          className={`btn px-3 px-sm-4 ${formData.prefix === prefix ? 'btn-success text-white fw-bold' : 'btn-outline-secondary bg-light text-dark'}`}
                          htmlFor={`prefix-${prefix}`}
                        >
                          {prefix}
                        </label>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* ช่องกรอกคำนำหน้าแบบระบุเอง */}
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">หรือระบุเอง :</span>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        id="field-prefix"
                        className={`form-control form-control-sm shadow-sm ${formErrors.prefix && !["นาย", "นาง", "นางสาว"].includes(formData.prefix) ? 'is-invalid border-danger' : ''}`}
                        style={{ width: '130px' }}
                        placeholder="เช่น ดร., ผศ."
                        maxLength={20}
                        value={!["นาย", "นาง", "นางสาว"].includes(formData.prefix) ? formData.prefix : ""}
                        onChange={e => handleInputChange('prefix', sanitizeFieldValue('prefixCustom', e.target.value))}
                        onFocus={() => {
                          if (["นาย", "นาง", "นางสาว"].includes(formData.prefix)) {
                            handleInputChange('prefix', '');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                {formErrors.prefix && touchedFields.prefix && (
                  <div className="text-danger small mt-2 d-flex align-items-center">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {formErrors.prefix}
                  </div>
                )}
              </div>
            </div>

            {/* 1.2 ชื่อจริง และ นามสกุล */}
            <div className="row mb-4 align-items-start">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4 pt-2">
                ชื่อ - นามสกุล <span className="text-danger">*</span>
              </label>
              <div className="col-md-9 mt-1 mt-md-0">
                <div className="row g-3">
                  {/* ชื่อจริง */}
                  <div className="col-12 col-sm-6">
                    <div className="mb-1">
                      <span className="text-muted small">ชื่อจริง (ตัวอักษรเท่านั้น)</span>
                    </div>
                    <input
                      type="text"
                      id="field-firstName"
                      className={`form-control form-control-lg bg-light ${formErrors.firstName && touchedFields.firstName ? 'is-invalid border-danger' : formData.firstName && !formErrors.firstName ? 'is-valid border-success' : 'border-0'} shadow-none`}
                      placeholder="เช่น สมชาย (ห้ามมีตัวเลข)"
                      maxLength={50}
                      value={formData.firstName}
                      onChange={e => handleInputChange('firstName', e.target.value)}
                    />
                    {formErrors.firstName && touchedFields.firstName && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                        {formErrors.firstName}
                      </div>
                    )}
                  </div>

                  {/* นามสกุล */}
                  <div className="col-12 col-sm-6">
                    <div className="mb-1">
                      <span className="text-muted small">นามสกุล (ตัวอักษรเท่านั้น)</span>
                    </div>
                    <input
                      type="text"
                      id="field-lastName"
                      className={`form-control form-control-lg bg-light ${formErrors.lastName && touchedFields.lastName ? 'is-invalid border-danger' : formData.lastName && !formErrors.lastName ? 'is-valid border-success' : 'border-0'} shadow-none`}
                      placeholder="เช่น ใจดี (ห้ามมีตัวเลข)"
                      maxLength={50}
                      value={formData.lastName}
                      onChange={e => handleInputChange('lastName', e.target.value)}
                    />
                    {formErrors.lastName && touchedFields.lastName && (
                      <div className="text-danger small mt-1 d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                        {formErrors.lastName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 1.3 เบอร์โทรศัพท์ (มีปุ่มเพิ่ม/ลบหลายเบอร์) */}
            <div className="row mb-4 align-items-start">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4 pt-2">
                เบอร์โทรศัพท์
              </label>
              <div className="col-md-9 mt-1 mt-md-0">
                <p className="text-muted small mb-2">ตัวเลข 9-10 หลักขึ้นต้นด้วย 0 เช่น 0812345678 (กรอกได้หลายเบอร์ และไม่สามารถซ้ำกันได้)</p>
                {formData.phones.map((phone, idx) => {
                  const hasPhoneErr = !!phoneErrors[idx] && touchedFields[`phone_${idx}`];
                  return (
                    <div className="mb-2" key={idx}>
                      <div className="d-flex gap-2">
                        <div className="flex-grow-1 position-relative">
                          <input
                            type="text"
                            id={`field-phone-${idx}`}
                            className={`form-control form-control-lg bg-light ${hasPhoneErr ? 'is-invalid border-danger' : phone && !phoneErrors[idx] ? 'is-valid border-success' : 'border-0'} shadow-none`}
                            placeholder="เช่น 0812345678"
                            maxLength={10}
                            value={phone}
                            onChange={e => handlePhoneChange(idx, e.target.value)}
                          />
                        </div>
                        <span className="align-self-center text-muted small text-nowrap px-1">
                          {phone.length}/10
                        </span>
                        {idx === 0 ? (
                          <button
                            type="button"
                            className="btn btn-outline-primary px-3 shadow-sm d-flex align-items-center"
                            style={{ minWidth: '95px', borderRadius: '8px' }}
                            onClick={addPhoneField}
                          >
                            <i className="bi bi-plus-lg me-1"></i>เพิ่มเบอร์
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline-danger px-3 shadow-sm d-flex align-items-center"
                            style={{ minWidth: '95px', borderRadius: '8px' }}
                            onClick={() => removePhoneField(idx)}
                          >
                            <i className="bi bi-trash3-fill me-1"></i>ลบ
                          </button>
                        )}
                      </div>
                      {hasPhoneErr && (
                        <div className="text-danger small mt-1 d-flex align-items-center">
                          <i className="bi bi-exclamation-circle-fill me-1"></i>
                          {phoneErrors[idx]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1.4 คณะ / หน่วยงาน */}
            <div className="row mb-4 align-items-start">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4 pt-2">
                คณะ/หน่วยงาน <span className="text-danger">*</span>
              </label>
              <div className="col-md-9 mt-1 mt-md-0">
                <select
                  id="field-department"
                  className={`form-select form-select-lg bg-light ${formErrors.department && touchedFields.department ? 'is-invalid border-danger' : formData.department ? 'is-valid border-success' : 'border-0'} text-dark shadow-none`}
                  value={formData.department}
                  onChange={e => handleInputChange('department', e.target.value)}
                  disabled={loadingFaculties}
                >
                  <option value="" disabled>
                    {loadingFaculties ? 'กำลังโหลดข้อมูลหน่วยงาน...' : '-- เลือกสังกัดหน่วยงาน --'}
                  </option>
                  {faculties.map((faculty) => (
                    <option key={faculty.Faculty_id} value={faculty.Faculty_name}>
                      {faculty.Faculty_name}
                    </option>
                  ))}
                </select>
                {formErrors.department && touchedFields.department && (
                  <div className="text-danger small mt-1 d-flex align-items-center">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {formErrors.department}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==========================================
              ส่วนที่ 2: ข้อมูลบัญชีผู้ใช้งาน
              ========================================== */}
          <h5 className="fw-bold mb-4 mt-5 border-bottom pb-2 d-flex align-items-center" style={{ color: '#006664' }}>
            <i className="bi bi-shield-lock-fill me-2" style={{ color: '#03A96B' }}></i>
            2. ข้อมูลบัญชีผู้ใช้งาน
          </h5>

          <div className="px-md-3">

            {/* 2.1 ชื่อผู้ใช้ (อีเมล) */}
            <div className="row mb-4 align-items-start">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4 pt-2">
                ชื่อผู้ใช้ (อีเมล) <span className="text-danger">*</span>
              </label>
              <div className="col-md-9 mt-1 mt-md-0">
                <div className="mb-1">
                  <span className="text-muted small">ใช้อีเมลเป็นชื่อเข้าสู่ระบบ (ห้ามมีภาษาไทยหรือช่องว่าง)</span>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 text-muted">
                    <i className="bi bi-envelope-at"></i>
                  </span>
                  <input
                    type="email"
                    id="field-username"
                    className={`form-control form-control-lg bg-light ${formErrors.username && touchedFields.username ? 'is-invalid border-danger' : formData.username && !formErrors.username ? 'is-valid border-success' : 'border-0'} shadow-none`}
                    placeholder="เช่น somchai@ku.th"
                    maxLength={50}
                    value={formData.username}
                    onChange={e => handleInputChange('username', e.target.value)}
                  />
                </div>
                {formErrors.username && touchedFields.username && (
                  <div className="text-danger small mt-1 d-flex align-items-center">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {formErrors.username}
                  </div>
                )}
              </div>
            </div>

            {/* 2.2 รหัสผ่าน */}
            <div className="row mb-4 align-items-start">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4 pt-2">
                รหัสผ่าน {!editId && <span className="text-danger">*</span>}
              </label>
              <div className="col-md-9 mt-1 mt-md-0">
                <div className="mb-1">
                  <span className="text-muted small">
                    {editId ? 'เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน' : 'ความยาวอย่างน้อย 8 ตัวอักษร'}
                  </span>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    id="field-password"
                    className={`form-control form-control-lg bg-light ${formErrors.password && touchedFields.password ? 'is-invalid border-danger' : formData.password && !formErrors.password ? 'is-valid border-success' : 'border-0'} shadow-none`}
                    placeholder={editId ? "เว้นว่างไว้หากไม่เปลี่ยน (หากเปลี่ยนขั้นต่ำ 8 ตัวอักษร)" : "ตั้งรหัสผ่าน (ขั้นต่ำ 8 ตัวอักษร)"}
                    maxLength={32}
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                  />
                </div>
                {formErrors.password && touchedFields.password ? (
                  <div className="text-danger small mt-1 d-flex align-items-center">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {formErrors.password}
                  </div>
                ) : (
                  <div className="form-text text-muted small mt-1">
                    <i className="bi bi-shield-check me-1 text-success"></i>
                    รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร และไม่เกิน 32 ตัวอักษร
                  </div>
                )}
              </div>
            </div>

            {/* 2.3 ยืนยันรหัสผ่าน */}
            <div className="row mb-4 align-items-start">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4 pt-2">
                ยืนยันรหัสผ่าน {!editId && <span className="text-danger">*</span>}
              </label>
              <div className="col-md-9 mt-1 mt-md-0">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0 text-muted">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    id="field-confirmPassword"
                    className={`form-control form-control-lg bg-light ${formErrors.confirmPassword && touchedFields.confirmPassword ? 'is-invalid border-danger' : formData.confirmPassword && !formErrors.confirmPassword ? 'is-valid border-success' : 'border-0'} shadow-none`}
                    placeholder={editId ? "กรอกรหัสผ่านอีกครั้ง (ถ้ามีการเปลี่ยน)" : "กรอกรหัสผ่านอีกครั้ง"}
                    maxLength={32}
                    value={formData.confirmPassword}
                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                  />
                </div>
                {formErrors.confirmPassword && touchedFields.confirmPassword ? (
                  <div className="text-danger small mt-1 d-flex align-items-center">
                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                    {formErrors.confirmPassword}
                  </div>
                ) : formData.confirmPassword && formData.confirmPassword === formData.password ? (
                  <div className="text-success small mt-1 d-flex align-items-center">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    รหัสผ่านตรงกันเรียบร้อย
                  </div>
                ) : null}
              </div>
            </div>

            {/* 2.4 สถานะบัญชี */}
            <div className="row mb-5 align-items-center">
              <label className="col-md-3 text-md-end fw-medium text-dark pe-4">
                สถานะบัญชี
              </label>
              <div className="col-md-9 mt-2 mt-md-0">
                <div className="btn-group shadow-sm">
                  <input
                    type="radio"
                    className="btn-check"
                    name="account_status"
                    id="status-active"
                    value="ใช้งาน"
                    checked={formData.status === 'ใช้งาน'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  />
                  <label
                    className={`btn px-4 py-2 ${formData.status === 'ใช้งาน' ? 'btn-success text-white fw-bold' : 'btn-outline-secondary bg-light text-dark'}`}
                    htmlFor="status-active"
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>ใช้งาน
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="account_status"
                    id="status-suspended"
                    value="พักการใช้งาน"
                    checked={formData.status === 'พักการใช้งาน'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  />
                  <label
                    className={`btn px-4 py-2 ${formData.status === 'พักการใช้งาน' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary bg-light text-dark'}`}
                    htmlFor="status-suspended"
                  >
                    <i className="bi bi-pause-circle-fill me-1"></i>พักการใช้งาน
                  </label>
                </div>
                <span className="text-muted small ms-3">
                  {formData.status === 'พักการใช้งาน' ? '(ผู้ใช้จะถูกระงับไม่สามารถล็อกอินเข้าสู่ระบบได้)' : '(ผู้ใช้สามารถเข้าสู่ระบบและทำงานได้ตามปกติ)'}
                </span>
              </div>
            </div>

          </div>

          {/* ปุ่มบันทึกและยกเลิก */}
          <div className="d-flex justify-content-end gap-3 pt-4 border-top">
            <button
              type="button"
              className="btn btn-light border px-4 py-2 fw-medium shadow-sm"
              onClick={() => setView('list')}
              style={{ borderRadius: '10px' }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn px-5 py-2 text-white fw-bold shadow-sm d-flex align-items-center"
              style={{ backgroundColor: '#006664', borderRadius: '10px' }}
            >
              <i className="bi bi-save-fill me-2 fs-5"></i>
              {editId ? 'บันทึกการแก้ไข' : 'บันทึกบัญชีผู้ใช้งาน'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
