const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);
router.post('/updatePassword/:id', authController.protect, authController.updatePassword);

router
  .route('/')
  .get(authController.protect, userController.getAllUsers);

module.exports = router;