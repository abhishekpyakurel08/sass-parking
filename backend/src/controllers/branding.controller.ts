import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/tenant.model.js';
import { NotFoundError, ForbiddenError } from '../errors/ApiError.js';
import { UserRole } from '../types/enums.js';

/**
 * Get tenant branding settings
 */
export const getTenantBranding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      return next(new NotFoundError('Tenant not found'));
    }

    const tenant = await Tenant.findById(tenantId).select('branding emailTemplates');
    if (!tenant) {
      return next(new NotFoundError('Tenant not found'));
    }

    res.json({
      success: true,
      data: {
        branding: tenant.branding || {},
        emailTemplates: tenant.emailTemplates || {},
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tenant branding settings
 */
export const updateTenantBranding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      return next(new NotFoundError('Tenant not found'));
    }

    const user = req.user;
    if (user?.role !== UserRole.SUPER_ADMIN) {
      return next(new ForbiddenError('Only super admins can update branding'));
    }

    const { logoUrl, primaryColor, secondaryColor, accentColor, customDomain, senderEmail, senderName, tagline, description, contactPhone, contactAddress } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: {
          'branding.logoUrl': logoUrl,
          'branding.primaryColor': primaryColor,
          'branding.secondaryColor': secondaryColor,
          'branding.accentColor': accentColor,
          'branding.customDomain': customDomain,
          'branding.senderEmail': senderEmail,
          'branding.senderName': senderName,
          'branding.tagline': tagline,
          'branding.description': description,
          'branding.contactPhone': contactPhone,
          'branding.contactAddress': contactAddress,
        },
      },
      { new: true }
    ).select('branding');

    if (!tenant) {
      return next(new NotFoundError('Tenant not found'));
    }

    res.json({
      success: true,
      message: 'Branding updated successfully',
      data: tenant.branding,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update email template for a specific type
 */
export const updateEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      return next(new NotFoundError('Tenant not found'));
    }

    const user = req.user;
    if (user?.role !== UserRole.SUPER_ADMIN) {
      return next(new ForbiddenError('Only super admins can update email templates'));
    }

    const { templateType } = req.params;
    const { subject, title, message, buttonText } = req.body;

    const validTemplateTypes = ['welcome', 'verification', 'passwordReset'];
    if (!validTemplateTypes.includes(templateType as string)) {
      return next(new NotFoundError('Invalid template type'));
    }

    const updatePath = `emailTemplates.${templateType}`;
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: {
          [`${updatePath}.subject`]: subject,
          [`${updatePath}.title`]: title,
          [`${updatePath}.message`]: message,
          [`${updatePath}.buttonText`]: buttonText,
        },
      },
      { new: true }
    ).select('emailTemplates');

    if (!tenant) {
      return next(new NotFoundError('Tenant not found'));
    }

    res.json({
      success: true,
      message: `${templateType} email template updated successfully`,
      data: tenant.emailTemplates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview email template with tenant branding
 */
export const previewEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      return next(new NotFoundError('Tenant not found'));
    }

    const user = req.user;
    if (user?.role !== UserRole.SUPER_ADMIN) {
      return next(new ForbiddenError('Only super admins can preview email templates'));
    }

    const { templateType } = req.params;
    const { userName, url } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return next(new NotFoundError('Tenant not found'));
    }

    const branding = {
      logoUrl: tenant.branding?.logoUrl,
      primaryColor: tenant.branding?.primaryColor,
      secondaryColor: tenant.branding?.secondaryColor,
      accentColor: tenant.branding?.accentColor,
      companyName: tenant.name,
      senderName: tenant.branding?.senderName || `${tenant.name} Team`,
    };

    let html = '';
    let subject = '';

    // Import template functions dynamically
    const {
      getWelcomeEmailTemplate,
      getVerificationEmailTemplate,
      getPasswordResetEmailTemplate,
      getOnboardingEmailTemplate,
    } = await import('../utils/emailTemplates.js');

    switch (templateType) {
      case 'welcome':
        const welcomeTemplate = getWelcomeEmailTemplate(
          userName || 'User',
          branding.companyName,
          url || 'https://example.com',
          branding
        );
        html = welcomeTemplate.html;
        subject = welcomeTemplate.subject;
        break;
      case 'verification':
        const verifyTemplate = getVerificationEmailTemplate(
          userName || 'User',
          branding.companyName,
          url || 'https://example.com',
          branding
        );
        html = verifyTemplate.html;
        subject = verifyTemplate.subject;
        break;
      case 'passwordReset':
        const resetTemplate = getPasswordResetEmailTemplate(
          userName || 'User',
          branding.companyName,
          url || 'https://example.com',
          branding
        );
        html = resetTemplate.html;
        subject = resetTemplate.subject;
        break;
      case 'onboarding':
        const onboardTemplate = getOnboardingEmailTemplate(
          userName || 'User',
          branding.companyName,
          url || 'https://example.com',
          branding
        );
        html = onboardTemplate.html;
        subject = onboardTemplate.subject;
        break;
      default:
        return next(new NotFoundError('Invalid template type'));
    }

    res.json({
      success: true,
      data: {
        subject,
        html,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset email template to default
 */
export const resetEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      return next(new NotFoundError('Tenant not found'));
    }

    const user = req.user;
    if (user?.role !== UserRole.SUPER_ADMIN) {
      return next(new ForbiddenError('Only super admins can reset email templates'));
    }

    const { templateType } = req.params;

    const validTemplateTypes = ['welcome', 'verification', 'passwordReset'];
    if (!validTemplateTypes.includes(templateType as string)) {
      return next(new NotFoundError('Invalid template type'));
    }

    const updatePath = `emailTemplates.${templateType}`;
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $unset: { [updatePath]: 1 },
      },
      { new: true }
    ).select('emailTemplates');

    if (!tenant) {
      return next(new NotFoundError('Tenant not found'));
    }

    res.json({
      success: true,
      message: `${templateType} email template reset to default`,
      data: tenant.emailTemplates,
    });
  } catch (error) {
    next(error);
  }
};
