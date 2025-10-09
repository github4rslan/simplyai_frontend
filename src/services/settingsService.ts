/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from "@/config/api";

export const fetchAppSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`);

    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    const result = await response.json();
    console.log("Fetched app settings:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return null;
  }
};

export const fetchColorProfiles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/colorProfiles`);
    if (!response.ok) {
      throw new Error("Failed to fetch color profiles");
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching color profiles:", error);
    return null;
  }
};

export const saveAppSettings = async (settings: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_name: settings.siteName,
        site_description: settings.siteDescription,
        contact_email: settings.contactEmail,
        site_url: settings.siteUrl,
        logo: settings.logo,
        favicon: settings.favicon,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        accent_color: settings.accentColor,
        font_family: settings.fontFamily,
        font_size: settings.fontSize,
        button_style: settings.buttonStyle,
        enable_registration: settings.enableRegistration,
        require_email_verification: settings.requireEmailVerification,
        max_storage_per_user: settings.maxStoragePerUser,
        // Notification settings
        send_welcome_email: settings.sendWelcomeEmail,
        send_completion_email: settings.sendCompletionEmail,
        send_email_in_report: settings.sendReportEmail,
        send_admin_notification: settings.adminNotifyNewUser,
        // Payment settings
        enable_payments: settings.enablePayments,
        currency: settings.currency,
        vat_percentage: settings.vatPercentage,
        stripe_public_key: settings.stripePublicKey,
        stripe_secret_key: settings.stripeSecretKey,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save settings");
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Error saving app settings:", error);
    return { success: false, error };
  }
};
