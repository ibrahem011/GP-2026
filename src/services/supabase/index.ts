import { createAuthService } from './authService';
import { IS_MOCK_MODE, isMockModeEnabled } from './client';
import { createBookingService } from './bookingService';
import { createMessagingService } from './messagingService';
import { createNotificationService } from './notificationService';
import { createPaymentService } from './paymentService';
import { createProfileService } from './profileService';
import { createPropertyService } from './propertyService';
import { createStorageService } from './storageService';

const authService = createAuthService();
const profileService = createProfileService();
const storageService = createStorageService();
const propertyService = createPropertyService({
    uploadPropertyImages: storageService.uploadPropertyImages,
    deletePropertyImage: storageService.deletePropertyImage,
});
const paymentService = createPaymentService();
const notificationService = createNotificationService();
const messagingService = createMessagingService();
const bookingService = createBookingService({
    createConversation: messagingService.createConversation,
    sendMessage: messagingService.sendMessage,
});

export const supabaseService = {
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
    getProfile: profileService.getProfile,
    uploadPropertyImages: storageService.uploadPropertyImages,
    deletePropertyImage: storageService.deletePropertyImage,
    createFullProperty: propertyService.createFullProperty,
    getProperties: propertyService.getProperties,
    getPropertyById: propertyService.getPropertyById,
    incrementPropertyViews: propertyService.incrementPropertyViews,
    updateProperty: propertyService.updateProperty,
    deleteProperty: propertyService.deleteProperty,
    getPropertiesCount: propertyService.getPropertiesCount,
    getFavorites: propertyService.getFavorites,
    toggleFavorite: propertyService.toggleFavorite,
    getUnlockedProperties: propertyService.getUnlockedProperties,
    isPropertyUnlocked: propertyService.isPropertyUnlocked,
    getPublicBookingPeriods: bookingService.getPublicBookingPeriods,
    getTenantPropertyState: bookingService.getTenantPropertyState,
    unlockProperty: paymentService.unlockProperty,
    approvePaymentAndUnlock: paymentService.approvePaymentAndUnlock,
    createPaymentRequest: paymentService.createPaymentRequest,
    getPaymentRequests: paymentService.getPaymentRequests,
    getPaymentRequestsCount: paymentService.getPaymentRequestsCount,
    getProfilesCount: profileService.getProfilesCount,
    getNotifications: notificationService.getNotifications,
    markNotificationAsRead: notificationService.markNotificationAsRead,
    markAllNotificationsAsRead: notificationService.markAllNotificationsAsRead,
    createNotification: notificationService.createNotification,
    getReviewsForProperty: propertyService.getReviewsForProperty,
    addReview: propertyService.addReview,
    getAllProfiles: profileService.getAllProfiles,
    getProfileById: profileService.getProfileById,
    updateUserProfile: profileService.updateUserProfile,
    createConversation: messagingService.createConversation,
    getUserConversations: messagingService.getUserConversations,
    getMessages: messagingService.getMessages,
    sendMessage: messagingService.sendMessage,
    markMessagesAsRead: messagingService.markMessagesAsRead,
    uploadVoiceNote: storageService.uploadVoiceNote,
    uploadChatImage: storageService.uploadChatImage,
    requestMediaPermission: messagingService.requestMediaPermission,
    grantMediaPermission: messagingService.grantMediaPermission,
    denyMediaPermission: messagingService.denyMediaPermission,
    getConversationDetails: messagingService.getConversationDetails,
    updateOnlineStatus: messagingService.updateOnlineStatus,
    sendTypingIndicator: messagingService.sendTypingIndicator,
    subscribeToTypingIndicator: messagingService.subscribeToTypingIndicator,
    uploadMedia: storageService.uploadMedia,
    calculateTotalPrice: bookingService.calculateTotalPrice,
    checkAvailability: bookingService.checkAvailability,
    createBooking: bookingService.createBooking,
    getUserBookingsLegacy: bookingService.getUserBookingsLegacy,
    getUserBookings: bookingService.getUserBookings,
    uploadPaymentReceipt: storageService.uploadPaymentReceipt,
    getBookingById: bookingService.getBookingById,
    updateBookingStatus: bookingService.updateBookingStatus,
} as const;

export type { PropertyInsert, PropertyRow, UserProfile } from './types';
export { IS_MOCK_MODE, isMockModeEnabled };
export default supabaseService;
