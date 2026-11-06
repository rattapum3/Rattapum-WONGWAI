const express = require('express');
const router = express.Router();
const userController = require('../../controllers/hr/userController');

// GET: ดึงข้อมูลผู้ใช้งานทั้งหมด
router.get('/', userController.getAllUsers);

// POST: เพิ่มบัญชีผู้ใช้งานใหม่ (เพิ่มบรรทัดนี้)
router.post('/', userController.createUser);

// GET: ดึงข้อมูลผู้ใช้งานตาม ID
router.get('/:id', userController.getUserById);

// PUT: แก้ไขข้อมูลผู้ใช้งาน
router.put('/:id', userController.updateUser);

// PATCH / PUT: ปรับสถานะผู้ใช้งาน (ใช้งาน / พักการใช้งาน)
router.patch('/:id/status', userController.updateUserStatus);
router.put('/:id/status', userController.updateUserStatus);

// DELETE: พักการใช้งานผู้ใช้งาน (แทนการลบออกจากระบบ)
router.delete('/:id', userController.deleteUser);

module.exports = router;