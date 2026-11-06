const express = require('express');
const router = express.Router();
const provinceController = require('../../controllers/common/provinceController');

router.get('/', provinceController.getProvinces);
router.get('/hierarchy/:provinceName', provinceController.getProvinceHierarchy);
router.get('/:provinceName/districts', provinceController.getDistrictsByProvince);
router.get('/districts/:districtName/subdistricts', provinceController.getSubdistrictsByDistrict);

module.exports = router;
