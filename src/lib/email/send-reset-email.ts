/**
 * Email sending module for password reset via N8N webhook.
 *
 * In development (no N8N_WEBHOOK_URL), logs the reset link to console.
 * In production, sends to N8N which handles Gmail integration.
 *
 * N8N integration will be configured in Phase 5.
 */

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('N8N_WEBHOOK_URL not configured');
    // In development, just log the reset link
    if (process.env.NODE_ENV === 'development') {
      console.log('========================================');
      console.log('PASSWORD RESET LINK (dev mode):');
      console.log(`User: ${userName} <${email}>`);
      console.log(resetUrl);
      console.log('========================================');
      return { success: true };
    }
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'password_reset',
        to: email,
        userName,
        resetUrl,
        subject: 'Aterstall ditt losenord - Kalkyla.se',
      }),
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: 'Kunde inte skicka e-post' };
  }
}
