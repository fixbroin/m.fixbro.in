


import type { AppSettings, ThemeColors } from '@/types/firestore';
import { DEFAULT_LIGHT_THEME_COLORS_HSL, DEFAULT_DARK_THEME_COLORS_HSL } from '@/lib/colorUtils';

export const defaultAppSettings: AppSettings = {
  // General
  enableMinimumBookingPolicy: false,
  minimumBookingAmount: 500,
  visitingChargeAmount: 100, // This is the DISPLAYED visiting charge
  isVisitingChargeTaxInclusive: false, // Default to exclusive
  minimumBookingPolicyDescription: "A visiting charge of ₹{VISITING_CHARGE} will be applied if your booking total is below ₹{MINIMUM_BOOKING_AMOUNT}.",
  googleMapsApiKey: "",
  smtpHost: "",
  smtpPort: "587", // Default to common non-SSL/TLS port
  smtpUser: "",
  smtpPass: "",
  senderEmail: "",
  enableHeroCarousel: true,
  enableCarouselAutoplay: true, 
  carouselAutoplayDelay: 5000, 
  enableTaxOnVisitingCharge: true, 
  visitingChargeTaxPercent: 5,     
  // Payment
  enableOnlinePayment: true,
  razorpayKeyId: "",
  razorpayKeySecret: "",
  enableCOD: true, // Represents "Pay After Service"
  // Time Slots
  timeSlotSettings: {
    slotIntervalMinutes: 60,
    breakTimeMinutes: 15, // Added break time
    weeklyAvailability: {
      monday: { isEnabled: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { isEnabled: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { isEnabled: true, startTime: "09:00", endTime: "17:00" },
      thursday: { isEnabled: true, startTime: "09:00", endTime: "17:00" },
      friday: { isEnabled: true, startTime: "09:00", endTime: "17:00" },
      saturday: { isEnabled: true, startTime: "10:00", endTime: "14:00" },
      sunday: { isEnabled: true, startTime: "10:00", endTime: "14:00" },
    }
  },
  enableLimitLateBookings: false,
  limitLateBookingHours: 4,
  // Platform Fees
  platformFees: [], // Default to an empty array
  // Cancellation Policy
  enableCancellationPolicy: false,
  freeCancellationDays: 1, // e.g., 1 day before
  freeCancellationHours: 0,
  freeCancellationMinutes: 0,
  cancellationFeeType: 'fixed', // 'fixed' or 'percentage'
  cancellationFeeValue: 100, // e.g., 100 (for fixed) or 10 (for 10%)

  // Chat setting - default sound URL
  // User needs to place default-notification.mp3 in public/sounds/
  chatNotificationSoundUrl: "/sounds/default-notification.mp3", 
  isChatEnabled: false, // Default chat to false. Will be managed in GlobalWebSettings now.
  
  isProviderRegistrationEnabled: true, // Added default
  maxProviderRadiusKm: 50, // Added default max provider radius
  
  // Login Settings
  enableEmailPasswordLogin: true,
  enableOtpLogin: true,
  enableGoogleLogin: true,
  defaultLoginMethod: 'email',
  defaultOtpCountryCode: '+91',

  isReferralSystemEnabled: false, // Added default
  isComplaintSystemEnabled: true, // New: Enable complaint system by default

  // Provider Fee Settings
  providerFeeType: 'fixed', // 'fixed' or 'percentage'
  providerFeeValue: 0, // Default to 0, meaning no fee
  
  providerTermsAndConditions: "<h3>Provider Terms and Conditions</h3><p>Please add your terms and conditions for providers here. This content will be displayed during the final step of their registration, and they must agree to it to complete the process.</p><ul><li>Outline service quality standards.</li><li>Describe payment terms and commission rates.</li><li>Explain grounds for partnership termination.</li></ul><p>Ensure this content is comprehensive and legally sound.</p>",

  // Connection Access Settings
  connectionAccessOptions: [
    { id: 'oneTime', label: 'One-time Access', price: 50, durationDays: 1, enabled: true },
    { id: 'sevenDays', label: '7 Days Access', price: 250, durationDays: 7, enabled: true },
    { id: 'thirtyDays', label: '30 Days Access', price: 800, durationDays: 30, enabled: false },
    { id: 'lifetime', label: 'Lifetime Access', price: 2000, durationDays: undefined, enabled: false },
  ],
  isFreeAccessFallbackEnabled: true,
  freeAccessDurationMinutes: 30,
  disclaimerEmailContent: "The platform only facilitates connection between users and providers. Any agreement or service is strictly between both parties. The platform is not responsible for pricing, quality, safety, or outcomes.",

  updatedAt: undefined, // No default for updatedAt
};

// Default theme colors are now primarily managed in useGlobalSettings and colorUtils
// This is because themeColors is part of GlobalWebSettings, not AppSettings.

    
