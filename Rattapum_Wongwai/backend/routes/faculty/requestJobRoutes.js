const express = require('express');
const router = express.Router();
const requestJobController = require('../../controllers/faculty/requestJobController');

router.get('/options', requestJobController.getFormOptions);
router.get('/:id', requestJobController.getRequestById);
router.post('/', requestJobController.createRequest);
router.put('/:id', requestJobController.updateRequest);

module.exports = router;
