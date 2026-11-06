const express = require('express');
const router = express.Router();

// ดึง controller ที่เราเพิ่งเขียนมา
const facultyController = require('../../controllers/common/facultyController');

// กำหนด Route: เมื่อมี GET Request มาที่ '/' ให้เรียกฟังก์ชัน getAllFaculties
router.get('/', facultyController.getAllFaculties);

module.exports = router;