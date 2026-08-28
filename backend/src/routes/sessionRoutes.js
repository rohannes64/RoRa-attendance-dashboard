const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/', sessionController.getSessions);
router.post('/', sessionController.createSession);
router.put('/:id', sessionController.updateSession);
router.put('/:id/start', sessionController.startSession);
router.put('/:id/end', sessionController.endSession);
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
