import { Router, type RequestHandler } from 'express';
import { authenticateAny, authenticate } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import {
  getTenantBranding,
  updateTenantBranding,
  updateEmailTemplate,
  previewEmailTemplate,
  resetEmailTemplate,
} from '../controllers/branding.controller.js';

const router: Router = Router();

/**
 * @route   GET /api/v1/branding
 * @desc    Get tenant branding settings
 * @access  Private (supports both JWT and API key for mobile app)
 */
router.get('/', authenticateAny, tenantMiddleware, getTenantBranding);

// All other branding routes require JWT authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * @route   PUT /api/v1/branding
 * @desc    Update tenant branding settings
 * @access  Private (SUPER_ADMIN)
 */
router.put('/', updateTenantBranding);

/**
 * @route   PUT /api/v1/branding/templates/:templateType
 * @desc    Update email template for a specific type
 * @access  Private (SUPER_ADMIN)
 */
router.put('/templates/:templateType', updateEmailTemplate);

/**
 * @route   POST /api/v1/branding/templates/:templateType/preview
 * @desc    Preview email template with tenant branding
 * @access  Private (SUPER_ADMIN)
 */
router.post('/templates/:templateType/preview', previewEmailTemplate);

/**
 * @route   DELETE /api/v1/branding/templates/:templateType
 * @desc    Reset email template to default
 * @access  Private (SUPER_ADMIN)
 */
router.delete('/templates/:templateType', resetEmailTemplate);

export default router;
