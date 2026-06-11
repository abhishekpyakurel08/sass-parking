import { Router } from 'express';
import { loginUser, registerTenantOwner, logoutUser, posLogin, getMe, resendEmailVerification, verifyEmail, forgotPassword, resetPassword } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../utils/validation.schemas.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Public route - no rate limiter to prevent 401 errors
router.post('/auth/onboard', validate(registerSchema), registerTenantOwner);
router.post('/auth/login', validate(loginSchema), loginUser);
router.post('/auth/pos-login', posLogin);
router.post('/auth/logout', logoutUser);
router.get('/me', authenticate, getMe);
router.post('/auth/resend-verification', resendEmailVerification);
router.post('/auth/verify-email', verifyEmail);
router.get('/auth/verify-email', verifyEmail);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

export default router;