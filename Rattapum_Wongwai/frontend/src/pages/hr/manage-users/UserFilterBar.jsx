import React from 'react';

export default function UserFilterBar({
  searchQuery,
  setSearchQuery,
  filterDepartment,
  setFilterDepartment,
  filterStatus,
  setFilterStatus,
  faculties = []
}) {
  return (
    <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: '12px' }}>
      <div className="card-body p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-0 text-muted ps-3">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-0 py-2"
                placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn bg-light border-0 text-muted"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <select
              className="form-select bg-light border-0 py-2 text-dark"
              value={filterDepartment}
              onChange={e => setFilterDepartment(e.target.value)}
            >
              <option value="all">-- ทุกสังกัด / หน่วยงาน --</option>
              {faculties.map(f => (
                <option key={f.Faculty_id} value={f.Faculty_name}>
                  {f.Faculty_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <select
              className="form-select bg-light border-0 py-2 text-dark"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">-- ทุกสถานะบัญชี --</option>
              <option value="ใช้งาน">เฉพาะ "ใช้งาน"</option>
              <option value="พักการใช้งาน">เฉพาะ "พักการใช้งาน"</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
