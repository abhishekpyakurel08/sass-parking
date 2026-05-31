import { Router } from 'express';
import { loginUser, registerTenantOwner, logoutUser, posLogin } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../utils/validation.schemas.js';

const router: Router = Router();

router.post('/auth/onboard', validate(registerSchema), registerTenantOwner);
router.post('/auth/login', validate(loginSchema), loginUser);
router.post('/auth/pos-login', posLogin);
router.post('/auth/logout', logoutUser);

export default router;