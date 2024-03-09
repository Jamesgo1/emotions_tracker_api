const express = require('express');
const controller = require('../controllers/usercontroller');
const {postRegister, postLoginHist, getLoginAttempts} = require("../controllers/usercontroller");

const router = express.Router();


router.post('/users/', controller.postLogin); //redundant
router.post("/users/add-login-hist", postLoginHist);
router.post("/users/login-check", controller.postGetUserDetails);

router.post("/users/reg-check", controller.postCheckUniqueRegField);

router.post("/users/add-user-details", postRegister);

router.get("/users/login-attempts/:user_id", getLoginAttempts);

module.exports = router;