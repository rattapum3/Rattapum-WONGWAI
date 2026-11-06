import React from 'react';
import { useManageUsers } from './manage-users/useManageUsers';
import UserStatsCards from './manage-users/UserStatsCards';
import UserFilterBar from './manage-users/UserFilterBar';
import UserTable from './manage-users/UserTable';
import UserForm from './manage-users/UserForm';
import ConfirmModal from './manage-users/ConfirmModal';

export default function ManageUsers() {
  const {
    view,
    setView,
    editId,
    faculties,
    loadingFaculties,
    loadingUsers,
    searchQuery,
    setSearchQuery,
    filterDepartment,
    setFilterDepartment,
    filterStatus,
    setFilterStatus,
    notification,
    setNotification,
    confirmModal,
    closeConfirmModal,
    formData,
    setFormData,
    formErrors,
    phoneErrors,
    touchedFields,
    handleInputChange,
    handlePhoneChange,
    addPhoneField,
    removePhoneField,
    handleAddNew,
    handleEdit,
    handleSave,
    handleToggleStatus,
    filteredUsers,
    totalCount,
    activeCount,
    suspendedCount
  } = useManageUsers();

  // ==========================================
  // 📍 1. UI - หน้าตารางรายชื่อ (List View)
  // ==========================================
  if (view === 'list') {
    return (
      <div className="container-fluid py-4 bg-light" style={{ minHeight: '100vh' }}>
        <div className="mx-auto" style={{ maxWidth: '1150px' }}>

          {/* Banner ข้อความแจ้งเตือน */}
          {notification && (
            <div className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm d-flex align-items-center mb-4`} role="alert" style={{ borderRadius: '12px' }}>
              <i className={`bi ${notification.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5 me-2`}></i>
              <div className="flex-grow-1 fw-medium">{notification.message}</div>
              <button type="button" className="btn-close" onClick={() => setNotification(null)} aria-label="Close"></button>
            </div>
          )}

          {/* หัวข้อและปุ่มเพิ่ม */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-1" style={{ color: '#006664' }}>
                <i className="bi bi-people-fill me-2" style={{ color: '#03A96B' }}></i>รายชื่อผู้ใช้งานระบบ
              </h2>
              <p className="text-muted mb-0">จัดการบัญชีบุคลากร สิทธิ์การใช้งาน และสถานะการเข้าใช้งานระบบ</p>
            </div>
            <button
              className="btn px-4 py-2 shadow-sm text-white fw-bold d-inline-flex align-items-center align-self-start align-self-sm-auto"
              style={{ backgroundColor: '#03A96B', borderRadius: '10px' }}
              onClick={handleAddNew}
            >
              <i className="bi bi-person-plus-fill me-2 fs-5"></i>เพิ่มบัญชีผู้ใช้ใหม่
            </button>
          </div>

          {/* บัตรสรุปสถานะผู้ใช้งาน */}
          <UserStatsCards
            totalCount={totalCount}
            activeCount={activeCount}
            suspendedCount={suspendedCount}
          />

          {/* แถบค้นหาและตัวกรอง */}
          <UserFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterDepartment={filterDepartment}
            setFilterDepartment={setFilterDepartment}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            faculties={faculties}
          />

          {/* ตารางแสดงรายชื่อผู้ใช้งาน */}
          <UserTable
            filteredUsers={filteredUsers}
            loadingUsers={loadingUsers}
            totalCount={totalCount}
            searchQuery={searchQuery}
            filterDepartment={filterDepartment}
            filterStatus={filterStatus}
            handleToggleStatus={handleToggleStatus}
            handleEdit={handleEdit}
          />
        </div>

        {/* Modal ยืนยันการกระทำ */}
        <ConfirmModal modalState={confirmModal} onClose={closeConfirmModal} />
      </div>
    );
  }

  // ==========================================
  // 📍 2. UI - หน้าฟอร์มสร้าง/แก้ไข (Create / Edit View)
  // ==========================================
  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: '880px' }}>

        {/* ปุ่มย้อนกลับและหัวข้อ */}
        <div className="mb-4 d-flex align-items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="btn btn-white btn-sm rounded-circle px-2 shadow-sm border"
            style={{ width: '40px', height: '40px' }}
            title="กลับหน้ารายชื่อ"
          >
            <i className="bi bi-arrow-left fs-5 text-dark"></i>
          </button>
          <div>
            <h2 className="fw-bold mb-1" style={{ color: '#006664' }}>
              {editId ? 'แก้ไขข้อมูลบัญชีผู้ใช้งาน' : 'เพิ่มบัญชีผู้ใช้งานใหม่'}
            </h2>
            <p className="text-muted mb-0">กรอกข้อมูลรายละเอียดบัญชีเพื่อใช้งานระบบ (ระบบตรวจสอบความถูกต้องขณะพิมพ์ทันที)</p>
          </div>
        </div>

        {/* Banner ข้อความแจ้งเตือน */}
        {notification && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm d-flex align-items-center mb-4`} role="alert" style={{ borderRadius: '12px' }}>
            <i className={`bi ${notification.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5 me-2`}></i>
            <div className="flex-grow-1 fw-medium">{notification.message}</div>
            <button type="button" className="btn-close" onClick={() => setNotification(null)} aria-label="Close"></button>
          </div>
        )}

        {/* ฟอร์มข้อมูลผู้ใช้งาน */}
        <UserForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          phoneErrors={phoneErrors}
          touchedFields={touchedFields}
          loadingFaculties={loadingFaculties}
          faculties={faculties}
          editId={editId}
          handleInputChange={handleInputChange}
          handlePhoneChange={handlePhoneChange}
          addPhoneField={addPhoneField}
          removePhoneField={removePhoneField}
          handleSave={handleSave}
          setView={setView}
        />
      </div>

      {/* Modal ยืนยันการกระทำ */}
      <ConfirmModal modalState={confirmModal} onClose={closeConfirmModal} />
    </div>
  );
}