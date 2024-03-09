const express = require('express');
const controller = require('../controllers/emotionscontroller');

const router = express.Router();

router.get("/emotions", controller.getEmotions);
router.get("/emotions/:emotion", controller.getSingleEmotion);
router.post("/emotions/submit", controller.postNewEmotions);
// router.get('/schedules/:id', controller.selectRun);
//
// router.post('/schedules/new', controller.postNewRun);
//
// router.put('/schedules/:id', controller.updateRun);
//
// router.delete("/schedules/:id", controller.deleteRun);

module.exports = router;