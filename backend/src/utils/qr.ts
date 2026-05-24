import QRCode from 'qrcode';

/**
 * Generates a base64 encoded data URI of a QR Code representing the given text.
 * @param text The input string to encode in the QR Code.
 */
export const generateQrCodeDataUri = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 250,
  });
};
