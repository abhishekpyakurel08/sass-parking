import { Router } from 'express';
import { loginUser, registerTenantOwner, logoutUser, posLogin } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../utils/validation.schemas.js';

const router = Router();

// Onboard a new business + master account
router.post('/auth/onboard', validate(registerSchema), registerTenantOwner);

// Login — supports rememberMe
router.post('/auth/login', validate(loginSchema), loginUser);

// POS API Key Login
router.post('/auth/pos-login', posLogin);

// Logout — clears httpOnly cookie
router.post('/auth/logout', logoutUser);

export default router;