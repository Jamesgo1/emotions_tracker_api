const express = require('express');
const controller = require('../controllers/emotionscontroller');

const router = express.Router();

router.get("/emotions", controller.getEmotions);
router.get("/emotions/:emotion", controller.getSingleEmotion);
router.get("/emotions/sub-count/:user_id", controller.getTotalEmotionsSubmitted)
router.get("/emotions/sub-today/:user_id", controller.getCheckIfAlreadySubmitted)
router.get("/emotions/submissions/:user_id", controller.getEmotionSubmissions);
router.get("/emotions/triggers/:sub_id", controller.getCurrentSubTriggers);
router.get("/emotions/trigger-count/:user_id", controller.getTriggerCount);

router.post("/emotions/submit", controller.postNewEmotions);
router.post("/emotions/trigger-delete", controller.deleteTriggers);
router.post("/emotions/trigger-add", controller.addNewTriggers);

router.delete("/emotions/del-submission/:sub_id", controller.deleteSubmission);

// router.get('/schedules/:id', controller.selectRun);
//
// router.post('/schedules/new', controller.postNewRun);
//
// router.put('/schedules/:id', controller.updateRun);
//
// router.delete("/schedules/:id", controller.deleteRun);

module.exports = router;