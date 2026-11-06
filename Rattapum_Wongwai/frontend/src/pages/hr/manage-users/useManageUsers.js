import { useState, useEffect } from 'react';
import {
  sanitizeFieldValue,
  validateField,
  validatePhonesList,
  scrollToFirstError
} from './manageUserValidation';

export const initialFormData = {
  prefix: "นาย",
  firstName: "",
  lastName: "",
  phones: [""],
  department: "",
  username: "", // อีเมล (Email_user)
  password: "",
  confirmPassword: "",
  status: "ใช้งาน"
};

export function useManageUsers() {
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);

  // 1. State สำหรับคณะ และ ผู้ใช้งาน
  const [faculties, setFaculties] = useState([]);
  const [loadingFaculties, setLoadingFaculties] = useState(true);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // การค้นหาและกรองในตารางรายชื่อ
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // ข้อความแจ้งเตือน (Banner Notification)
  const [notification, setNotification] = useState(null);

  // Modal ยืนยันการกระทำ (Confirm Modal)
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'ยืนยัน',
    confirmVariant: 'primary',
    onConfirm: null
  });

  // State สำหรับ Form
  const [formData, setFormData] = useState(initialFormData);

  const [formErrors, setFormErrors] = useState({
    prefix: '',
    firstName: '',
    lastName: '',
    department: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [phoneErrors, setPhoneErrors] = useState(['']);
  const [touchedFields, setTouchedFields] = useState({});

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/faculties');
      if (response.ok) {
        const result = await response.json();
        if (result.success) setFaculties(result.data);
      }
    } catch (error) {
      console.error('❌ ไม่สามารถดึงข้อมูลคณะได้:', error);
    } finally {
      setLoadingFaculties(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('http://localhost:3000/api/users');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const sortedUsers = [...result.data].sort((a, b) => Number(a.id) - Number(b.id));
          setUsers(sortedUsers);
        }
      }
    } catch (error) {
      console.error('❌ ไม่สามารถดึงข้อมูลผู้ใช้งานได้:', error);
      showNotification('ไม่สามารถดึงข้อมูลผู้ใช้งานจากเซิร์ฟเวอร์ได้', 'danger');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchUsers();
  }, []);

  const handleInputChange = (name, rawValue) => {
    const sanitized = sanitizeFieldValue(name, rawValue);
    const updatedForm = { ...formData, [name]: sanitized };
    setFormData(updatedForm);

    setTouchedFields(prev => ({ ...prev, [name]: true }));

    const err = validateField(name, sanitized, updatedForm, editId);
    setFormErrors(prev => {
      const nextErrors = { ...prev, [name]: err };
      if (name === 'password' && (formData.confirmPassword || !editId)) {
        nextErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword, updatedForm, editId);
      }
      return nextErrors;
    });
  };

  const handlePhoneChange = (index, rawValue) => {
    const clean = rawValue.replace(/\D/g, '').slice(0, 10);
    const newPhones = [...formData.phones];
    newPhones[index] = clean;
    setFormData(prev => ({ ...prev, phones: newPhones }));

    setTouchedFields(prev => ({ ...prev, [`phone_${index}`]: true }));

    const updatedPhoneErrors = validatePhonesList(newPhones);
    setPhoneErrors(updatedPhoneErrors);
  };

  const addPhoneField = () => {
    const newPhones = [...formData.phones, ""];
    setFormData(prev => ({ ...prev, phones: newPhones }));
    setPhoneErrors(validatePhonesList(newPhones));
  };

  const removePhoneField = (index) => {
    const newPhones = formData.phones.filter((_, i) => i !== index);
    const finalPhones = newPhones.length > 0 ? newPhones : [""];
    setFormData(prev => ({ ...prev, phones: finalPhones }));
    setPhoneErrors(validatePhonesList(finalPhones));
  };

  const validateAllFields = () => {
    const newErrors = {};
    const touchedAll = {};

    ['prefix', 'firstName', 'lastName', 'department', 'username', 'password', 'confirmPassword'].forEach(field => {
      newErrors[field] = validateField(field, formData[field], formData, editId);
      touchedAll[field] = true;
    });

    const newPhoneErrors = validatePhonesList(formData.phones);
    formData.phones.forEach((_, idx) => {
      touchedAll[`phone_${idx}`] = true;
    });

    setTouchedFields(touchedAll);
    setFormErrors(newErrors);
    setPhoneErrors(newPhoneErrors);

    const hasFormError = Object.values(newErrors).some(err => !!err);
    const hasPhoneError = newPhoneErrors.some(err => !!err);

    return {
      isValid: !hasFormError && !hasPhoneError,
      errors: newErrors,
      phoneErrors: newPhoneErrors
    };
  };

  const handleAddNew = () => {
    setEditId(null);
    setFormData(initialFormData);
    setFormErrors({
      prefix: '', firstName: '', lastName: '', department: '', username: '', password: '', confirmPassword: ''
    });
    setPhoneErrors(['']);
    setTouchedFields({});
    setView('create');
  };

  const handleEdit = async (user) => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${user.id}`);
      const result = await response.json();
      if (result.success) {
        setEditId(user.id);
        const u = result.data;

        let loadedPhones = [''];
        if (u.phones && Array.isArray(u.phones) && u.phones.length > 0) {
          const filtered = u.phones.filter(p => p && String(p).trim() !== '');
          loadedPhones = filtered.length > 0 ? filtered : [''];
        } else if (user.phone) {
          loadedPhones = user.phone.split(',').map(p => p.trim()).filter(Boolean);
          if (loadedPhones.length === 0) loadedPhones = [''];
        }

        setFormData({
          prefix: u.Prefix || "นาย",
          firstName: u.First_name || "",
          lastName: u.Last_name || "",
          phones: loadedPhones,
          department: u.department || "",
          username: u.username || "",
          password: "",
          confirmPassword: "",
          status: u.status || user.status || "ใช้งาน"
        });

        setFormErrors({
          prefix: '', firstName: '', lastName: '', department: '', username: '', password: '', confirmPassword: ''
        });
        setPhoneErrors(loadedPhones.map(() => ''));
        setTouchedFields({});
        setView('create');
      } else {
        showNotification(result.message || "ไม่สามารถดึงข้อมูลผู้ใช้งานได้", "danger");
      }
    } catch (error) {
      console.error("Edit Error:", error);
      showNotification("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "danger");
    }
  };

  const executeSave = async () => {
    try {
      const url = editId ? `http://localhost:3000/api/users/${editId}` : 'http://localhost:3000/api/users';
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        showNotification(editId ? "แก้ไขข้อมูลบัญชีผู้ใช้งานสำเร็จเรียบร้อยแล้ว!" : "เพิ่มบัญชีผู้ใช้งานใหม่สำเร็จเรียบร้อยแล้ว!", "success");
        await fetchUsers();
        setView('list');
      } else {
        showNotification(result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", "danger");
      }
    } catch (error) {
      console.error("Save Error:", error);
      showNotification("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ", "danger");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const validation = validateAllFields();
    if (!validation.isValid) {
      showNotification("กรุณาตรวจสอบและแก้ไขข้อมูลในช่องที่มีข้อความแจ้งเตือนสีแดงให้ถูกต้องครบถ้วน", "danger");
      scrollToFirstError(validation.errors, validation.phoneErrors);
      return;
    }

    setConfirmModal({
      show: true,
      title: editId ? "ยืนยันการแก้ไขข้อมูลบัญชีผู้ใช้งาน" : "ยืนยันการเพิ่มบัญชีผู้ใช้งานใหม่",
      message: editId
        ? `คุณต้องการบันทึกการแก้ไขข้อมูลของ "${formData.prefix}${formData.firstName} ${formData.lastName}" (${formData.username}) ใช่หรือไม่?`
        : `คุณต้องการเพิ่มบัญชีผู้ใช้งาน "${formData.prefix}${formData.firstName} ${formData.lastName}" (${formData.username}) เข้าสู่ระบบใช่หรือไม่?`,
      confirmText: editId ? "บันทึกการแก้ไข" : "เพิ่มบัญชีผู้ใช้",
      confirmVariant: "success",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        await executeSave();
      }
    });
  };

  const handleToggleStatus = (user) => {
    const currentStatus = user.status || 'ใช้งาน';
    const nextStatus = currentStatus === 'ใช้งาน' ? 'พักการใช้งาน' : 'ใช้งาน';
    const isSuspending = currentStatus === 'ใช้งาน';

    setConfirmModal({
      show: true,
      title: isSuspending ? "ยืนยันการพักการใช้งานบัญชี" : "ยืนยันการเปิดใช้งานบัญชี",
      message: isSuspending
        ? `คุณต้องการพักการใช้งานบัญชี "${user.name}" (${user.email}) ใช่หรือไม่?\n(เมื่อพักการใช้งาน ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้)`
        : `คุณต้องการเปิดใช้งานบัญชี "${user.name}" (${user.email}) เพื่อให้สามารถเข้าสู่ระบบได้ตามปกติใช่หรือไม่?`,
      confirmText: isSuspending ? "พักการใช้งาน" : "เปิดใช้งาน",
      confirmVariant: isSuspending ? "warning" : "success",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
          const response = await fetch(`http://localhost:3000/api/users/${user.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
          });
          const result = await response.json();
          if (result.success) {
            showNotification(result.message || `เปลี่ยนสถานะเป็น "${nextStatus}" สำเร็จ`, "success");
            fetchUsers();
          } else {
            showNotification(result.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ", "danger");
          }
        } catch (error) {
          console.error("Toggle Status Error:", error);
          showNotification("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "danger");
        }
      }
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, show: false }));
  };

  // กรองข้อมูลผู้ใช้งานสำหรับแสดงผลตาราง
  const filteredUsers = users.filter(user => {
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query ||
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.department && user.department.toLowerCase().includes(query)) ||
      (user.phone && user.phone.toLowerCase().includes(query));

    const matchDept = filterDepartment === 'all' || user.department === filterDepartment;
    const matchStatus = filterStatus === 'all' || (user.status || 'ใช้งาน') === filterStatus;

    return matchQuery && matchDept && matchStatus;
  });

  const totalCount = users.length;
  const activeCount = users.filter(u => (u.status || 'ใช้งาน') === 'ใช้งาน').length;
  const suspendedCount = users.filter(u => u.status === 'พักการใช้งาน').length;

  return {
    view,
    setView,
    editId,
    faculties,
    loadingFaculties,
    users,
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
  };
}
