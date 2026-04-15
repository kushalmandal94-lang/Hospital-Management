const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
	'/register',
	[
		body('email').isEmail().withMessage('Valid email is required'),
		body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
	],
	register
);
router.post(
	'/login',
	[
		body('identifier').optional().isString().withMessage('Identifier must be text'),
		body('email').optional().isEmail().withMessage('Valid email is required'),
		body('phone').optional().isString().withMessage('Phone must be text'),
		body().custom((_, { req }) => {
			if (!req.body.identifier && !req.body.email && !req.body.phone) {
				throw new Error('Email or phone is required');
			}
			return true;
		}),
		body('password').notEmpty().withMessage('Password is required'),
	],
	login
);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
