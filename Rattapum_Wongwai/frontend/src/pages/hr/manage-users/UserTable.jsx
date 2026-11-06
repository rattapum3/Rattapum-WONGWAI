import React from 'react';

export default function UserTable({
  filteredUsers = [],
  loadingUsers = false,
  totalCount = 0,
  searchQuery = '',
  filterDepartment = 'all',
  filterStatus = 'all',
  handleToggleStatus,
  handleEdit
}) {
  return (
    <div className="card border-0 shadow-sm" style={{ borderTop: '4px solid #006664', borderRadius: '14px', overflow: 'hidden' }}>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="py-3 px-3 text-center border-0 text-secondary" style={{ width: '60px' }}>ลำดับ</th>
              <th className="py-3 px-3 border-0 text-secondary">ชื่อ - นามสกุล</th>
              <th className="py-3 px-3 border-0 text-secondary">เบอร์โทรศัพท์</th>
              <th className="py-3 px-3 border-0 text-secondary">ชื่อผู้ใช้งาน (อีเมล)</th>
              <th className="py-3 px-3 border-0 text-secondary">สังกัด / หน่วยงาน</th>
              <th className="py-3 px-3 border-0 text-center text-secondary">สถานะ</th>
              <th className="py-3 px-4 border-0 text-center text-secondary" style={{ minWidth: '180px' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loadingUsers ? (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  <div className="spinner-border text-success spinner-border-sm me-2" role="status"></div>
                  กำลังโหลดข้อมูลผู้ใช้งานระบบ...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  {searchQuery || filterDepartment !== 'all' || filterStatus !== 'all'
                    ? 'ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา'
                    : 'ยังไม่มีข้อมูลผู้ใช้งานในระบบ'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user.id || index} className={user.status === 'พักการใช้งาน' ? 'table-light text-muted' : ''}>
                  <td className="py-3 px-3 text-center text-muted fw-bold">{index + 1}</td>
                  <td className="py-3 px-3 fw-bold text-dark">
                    {user.name}
                    {user.status === 'พักการใช้งาน' && (
                      <span className="ms-2 badge bg-secondary text-white small" style={{ fontSize: '0.7rem' }}>ระงับชั่วคราว</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-secondary">
                    {user.phone ? (
                      <div className="d-flex flex-column gap-1">
                        {user.phone.split(',').map((p, pIdx) => (
                          <span key={pIdx} className="text-nowrap small">
                            <i className="bi bi-telephone me-1 text-muted"></i>
                            {p.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-secondary small">
                    <i className="bi bi-envelope me-1 text-muted"></i>
                    {user.email}
                  </td>
                  <td className="py-3 px-3 text-muted">
                    <span className="badge bg-light text-dark border px-2 py-1 fw-normal">{user.department}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {user.status === 'พักการใช้งาน' ? (
                      <span className="badge bg-warning-subtle text-dark border border-warning px-2 py-1 fw-semibold">
                        <i className="bi bi-pause-circle-fill me-1 text-warning"></i>พักการใช้งาน
                      </span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success px-2 py-1 fw-semibold">
                        <i className="bi bi-check-circle-fill me-1"></i>ใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-nowrap">
                    {/* ปุ่มจัดการสถานะ: เปิดใช้งาน หรือ พักการใช้งาน */}
                    {user.status === 'พักการใช้งาน' ? (
                      <button
                        className="btn btn-sm btn-outline-success me-1 shadow-sm px-2"
                        style={{ borderRadius: '6px' }}
                        onClick={() => handleToggleStatus(user)}
                        title="เปิดใช้งานบัญชีนี้"
                      >
                        <i className="bi bi-play-circle-fill me-1"></i>เปิดใช้งาน
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-secondary me-1 shadow-sm px-2"
                        style={{ borderRadius: '6px' }}
                        onClick={() => handleToggleStatus(user)}
                        title="พักการใช้งานบัญชีนี้"
                      >
                        <i className="bi bi-pause-circle me-1"></i>พักใช้งาน
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-warning me-1 shadow-sm px-2"
                      style={{ borderRadius: '6px' }}
                      onClick={() => handleEdit(user)}
                      title="แก้ไขข้อมูลบัญชี"
                    >
                      <i className="bi bi-pencil-square me-1"></i>แก้ไข
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredUsers.length > 0 && (
        <div className="p-3 bg-light border-top text-muted small d-flex justify-content-between align-items-center">
          <span>แสดงข้อมูลทั้งหมด <strong>{filteredUsers.length}</strong> จาก <strong>{totalCount}</strong> บัญชี</span>
          <span>ระบบบริหารจัดการผู้ใช้งาน KU CSC</span>
        </div>
      )}
    </div>
  );
}
