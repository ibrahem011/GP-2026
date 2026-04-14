import { supabase } from './supabase';
import { getIsMockMode } from '@/config/constants';
import { supabaseService } from '@/services/supabaseService';
import type { Property, Notification, User, Booking, Review, PaymentRequest } from '@/types';
import type { Property as PropertyRow } from '@/types/database.types';
import type { Message } from '@/types/messaging';
import { fromPropertyRow, toPropertyInsert } from './propertyMapper';
import { STORAGE_BUCKET } from './storageBucket';
import { buildStorageObjectPath, extractStoragePath } from './storagePaths';

// مفاتيح التخزين
const STORAGE_KEYS = {
    PROPERTIES: 'gamasa_properties',
    USERS: 'gamasa_users',
    CURRENT_USER: 'gamasa_current_user',
    PAYMENTS: 'gamasa_payments',
    REVIEWS: 'gamasa_reviews',
    NOTIFICATIONS: 'gamasa_notifications',
};

// التحقق من وجود localStorage (للـ SSR)
const isClient = typeof window !== 'undefined';

// دوال مساعدة للتخزين
function getItem<T>(key: string, defaultValue: T): T {
    if (!isClient) return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function setItem<T>(key: string, value: T): void {
    if (!isClient) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
        // إطلاق حدث للتحديث الفوري
        window.dispatchEvent(new Event('storage'));
        if (key === STORAGE_KEYS.CURRENT_USER) {
            window.dispatchEvent(new Event('userUpdated'));
        }
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// ====== رفع الصور (Supabase) ======

export async function uploadImage(file: File): Promise<string> {
    try {
        const fileExt = file.name.split('.').pop();
        const filePath = buildStorageObjectPath(
            `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`,
        );

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        return filePath;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

export async function uploadPropertyImages(files: File[]): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
        throw new Error('يجب تسجيل الدخول لرفع الصور');
    }

    const uploadedPaths: string[] = [];

    for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = buildStorageObjectPath(
            user.id,
            `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`,
        );

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file);

        if (uploadError) {
            throw new Error(`فشل رفع الصورة: ${uploadError.message}`);
        }

        uploadedPaths.push(fileName);
    }

    return uploadedPaths;
}

export async function deletePropertyImages(urls: string[]): Promise<void> {
    const pathsToDelete = urls
        .map((url) => extractStoragePath(url, STORAGE_BUCKET) || url)
        .filter(Boolean) as string[];

    if (pathsToDelete.length === 0) {
        return;
    }

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(pathsToDelete);

    if (error) {
        console.error('Error deleting images:', error);
    }
}

// ====== العقارات ======

export function getProperties(): Property[] {
    return getItem<Property[]>(STORAGE_KEYS.PROPERTIES, mockProperties);
}

export function getPropertyById(id: string): Property | undefined {
    const properties = getProperties();
    return properties.find(p => p.id === id);
}

// This function is kept for mock mode support specifically in components that use it
export async function addProperty(
    property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount'>
): Promise<Property> {
    if (getIsMockMode()) {
        const properties = getProperties();
        const newProperty: Property = {
            ...property,
            id: generateId(),
            viewsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        properties.unshift(newProperty);
        setItem(STORAGE_KEYS.PROPERTIES, properties);
        return newProperty;
    }

    const dbProperty = toPropertyInsert(property);
    const { data, error } = await supabase
        .from('properties')
        .insert(dbProperty)
        .select()
        .single();

    if (error) throw error;
    return fromPropertyRow(data);
}

export function updateProperty(id: string, updates: Partial<Property>): Property | null {
    const properties = getProperties();
    const index = properties.findIndex(p => p.id === id);
    if (index === -1) return null;

    properties[index] = {
        ...properties[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.PROPERTIES, properties);
    return properties[index];
}

export function incrementViews(id: string): void {
    const properties = getProperties();
    const property = properties.find(p => p.id === id);
    if (property) {
        property.viewsCount++;
        setItem(STORAGE_KEYS.PROPERTIES, properties);
    }
}

// ====== المستخدمين ======

export function getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
}

export async function toggleFavorite(propertyId: string): Promise<boolean> {
    const user = getCurrentUser();
    if (!user) return false;

    if (!getIsMockMode()) {
        return supabaseService.toggleFavorite(user.id, propertyId);
    }

    const index = user.favorites.indexOf(propertyId);
    if (index === -1) {
        user.favorites.push(propertyId);
    } else {
        user.favorites.splice(index, 1);
    }
    setCurrentUser(user);
    return index === -1;
}

export async function unlockProperty(propertyId: string, paymentId?: string): Promise<boolean> {
    const user = getCurrentUser();
    if (!user) return false;

    if (!getIsMockMode()) {
        await supabaseService.unlockProperty(user.id, propertyId, paymentId);
        return true;
    }

    if (!user.unlockedProperties.includes(propertyId)) {
        user.unlockedProperties.push(propertyId);
        setCurrentUser(user);

        await addNotification({
            userId: user.id,
            title: 'تم فك القفل بنجاح',
            message: 'يمكنك الآن التواصل مع المالك مباشرة.',
            type: 'success',
            link: `/property/${propertyId}`,
        });
        return true;
    }
    return true;
}

// ====== الإشعارات ======

export function getNotifications(userId?: string): Notification[] {
    const allNotifications = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (userId) {
        return allNotifications.filter(n => n.userId === userId);
    }
    return allNotifications;
}

export async function addNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
): Promise<Notification> {
    if (!getIsMockMode() && notification.userId) {
        try {
            await supabaseService.createNotification({
                userId: notification.userId,
                title: notification.title,
                message: notification.message,
                type: notification.type as 'success' | 'info' | 'warning' | 'error',
                link: notification.link,
            });
        } catch (err) {
            console.error('Failed to create Supabase notification:', err);
        }
    }

    const notifications = getNotifications();
    const newNotification: Notification = {
        ...notification,
        id: generateId(),
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotification);
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
}

export function markNotificationAsRead(notificationId: string): void {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = true;
        setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
}

export function markAllNotificationsAsRead(userId: string): void {
    const notifications = getNotifications();
    notifications.forEach(n => {
        if (n.userId === userId) {
            n.isRead = true;
        }
    });
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

export function getUnreadNotificationCount(userId: string): number {
    return getNotifications(userId).filter(n => !n.isRead).length;
}

// ====== دوال مساعدة ======

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ====== بيانات وهمية للعرض ======

const mockProperties: Property[] = [
    {
        id: '1',
        title: 'شقة فاخرة بإطلالة بحرية',
        description: 'شقة مفروشة بالكامل مع إطلالة مباشرة على البحر. تتميز بتصميم عصري وموقع مميز قريب من جميع الخدمات.',
        price: 500,
        priceUnit: 'day',
        category: 'apartment',
        status: 'available',
        images: ['/images/property1.png'],
        location: {
            lat: 31.4431,
            lng: 31.5344,
            address: 'شارع البحر الرئيسي',
            area: 'منطقة البحر',
        },
        ownerPhone: '01012345678',
        ownerId: 'owner1',
        ownerName: 'محمد أحمد',
        features: ['تكييف', 'واي فاي', 'إطلالة بحرية', 'مطبخ مجهز'],
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        floor: 3,
        isVerified: true,
        viewsCount: 156,
        createdAt: '2024-12-01T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
    },
    {
        id: '2',
        title: 'غرفة مفروشة للإيجار اليومي',
        description: 'غرفة نظيفة ومريحة في موقع مميز بالقرب من الشاطئ. مناسبة للأفراد أو الأزواج.',
        price: 150,
        priceUnit: 'day',
        category: 'room',
        status: 'available',
        images: ['/images/property2.png'],
        location: {
            lat: 31.4450,
            lng: 31.5360,
            address: 'شارع الكرنك',
            area: 'منطقة الكرنك',
        },
        ownerPhone: '01098765432',
        ownerId: 'owner2',
        ownerName: 'أحمد محمود',
        features: ['تكييف', 'واي فاي'],
        bedrooms: 1,
        bathrooms: 1,
        area: 30,
        floor: 2,
        isVerified: false,
        viewsCount: 89,
        createdAt: '2024-12-10T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
    },
    {
        id: '3',
        title: 'استوديو مودرن قريب من البحر',
        description: 'استوديو حديث التشطيب مع كل المرافق. يبعد دقائق قليلة عن الشاطئ.',
        price: 250,
        priceUnit: 'day',
        category: 'studio',
        status: 'available',
        images: ['/images/property3.png'],
        location: {
            lat: 31.4420,
            lng: 31.5380,
            address: 'الشاطئ الجديد',
            area: 'الشاطئ الجديد',
        },
        ownerPhone: '01111222333',
        ownerId: 'owner3',
        ownerName: 'كريم حسن',
        features: ['تكييف', 'واي فاي', 'قريب من البحر', 'أثاث كامل'],
        bedrooms: 1,
        bathrooms: 1,
        area: 45,
        floor: 1,
        isVerified: true,
        viewsCount: 234,
        createdAt: '2024-12-15T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
    },
    {
        id: '4',
        title: 'فيلا فاخرة مع حديقة',
        description: 'فيلا واسعة مع حديقة خاصة وموقف سيارات. مثالية للعائلات الكبيرة.',
        price: 2000,
        priceUnit: 'day',
        category: 'villa',
        status: 'available',
        images: ['/images/property4.png'],
        location: {
            lat: 31.4400,
            lng: 31.5320,
            address: 'الحي الغربي',
            area: 'الحي الغربي',
        },
        ownerPhone: '01234567890',
        ownerId: 'owner4',
        ownerName: 'سمير علي',
        features: ['تكييف', 'واي فاي', 'موقف سيارة', 'حديقة', 'مطبخ مجهز', 'غسالة'],
        bedrooms: 5,
        bathrooms: 3,
        area: 300,
        floor: 0,
        isVerified: true,
        viewsCount: 67,
        createdAt: '2024-12-18T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
    },
    {
        id: '5',
        title: 'شاليه على البحر مباشرة',
        description: 'شاليه ممتاز على شاطئ البحر مباشرة. يتسع لـ 6 أشخاص.',
        price: 800,
        priceUnit: 'day',
        category: 'chalet',
        status: 'rented',
        images: ['/images/property-placeholder.svg'],
        location: {
            lat: 31.4460,
            lng: 31.5300,
            address: 'شاطئ المنتزه',
            area: 'منطقة البحر',
        },
        ownerPhone: '01555666777',
        ownerId: 'owner5',
        ownerName: 'ياسر محمد',
        features: ['تكييف', 'واي فاي', 'إطلالة بحرية', 'شاطئ خاص'],
        bedrooms: 2,
        bathrooms: 2,
        area: 80,
        floor: 0,
        isVerified: true,
        viewsCount: 445,
        createdAt: '2024-12-05T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
    },
];

// تهيئة البيانات عند أول تحميل
if (isClient && !localStorage.getItem(STORAGE_KEYS.PROPERTIES)) {
    setItem(STORAGE_KEYS.PROPERTIES, mockProperties);
}
