import { Property, User, PaymentRequest, Review, Notification } from '@/types';
import { fromPropertyRow, toPropertyInsert } from './propertyMapper';
import type { PropertyRowCompat } from './propertyMapper';
import { supabase } from './supabase';
import { STORAGE_BUCKET } from './storageBucket';

type PropertyRowWithLegacyLocation = PropertyRowCompat;
type PropertyInsertPayload = ReturnType<typeof toPropertyInsert>;

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
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        return data.publicUrl;
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

    const uploadedUrls: string[] = [];

    for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file);

        if (uploadError) {
            throw new Error(`فشل رفع الصورة: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
}

export async function deletePropertyImages(urls: string[]): Promise<void> {
    const pathsToDelete = urls
        .filter(url => url.includes('supabase'))
        .map(url => {
            const bucketIndex = url.indexOf('properties-images/');
            if (bucketIndex === -1) return null;
            return url.substring(bucketIndex + 'properties-images/'.length);
        })
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

// ====== دوال Mapping بين DB و App ======

// تحويل Property من DB format إلى App format
function convertPropertyFromDB(dbProperty: PropertyRowWithLegacyLocation): Property {
    return fromPropertyRow(dbProperty);
}

// تحويل Property من App format إلى DB format
function convertPropertyToDB(appProperty: Partial<Property>): PropertyInsertPayload {
    return toPropertyInsert(appProperty);
}

// دالة للحصول على العقارات من Supabase
export async function getPropertiesFromSupabase(): Promise<Property[]> {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data ? data.map(convertPropertyFromDB) : [];
    } catch (error) {
        console.error('Error fetching properties from Supabase:', error);
        throw error;
    }
}

// دالة للحصول على عقارات المستخدم الحالي من Supabase
export async function getUserPropertiesFromSupabase(userId: string): Promise<Property[]> {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select(`
                id,
                owner_id,
                title,
                description,
                price,
                price_unit,
                category,
                status,
                images,
                address,
                area,
                bedrooms,
                bathrooms,
                floor_area,
                floor_number,
                features,
                owner_phone,
                owner_name,
                is_verified,
                views_count,
                created_at,
                updated_at,
                location_lat,
                location_lng
            `)
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getUserPropertiesFromSupabase Error]', error);
            throw new Error(`فشل جلب عقارات المستخدم: ${error.message}`);
        }

        return data ? data.map(convertPropertyFromDB) : [];
    } catch (error) {
        console.error('[getUserPropertiesFromSupabase Unexpected]', error);
        throw error;
    }
}

// دالة للحصول على عقار واحد من Supabase
export async function getPropertyByIdFromSupabase(id: string): Promise<Property | null> {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return data ? convertPropertyFromDB(data) : null;
    } catch (error) {
        console.error('Error fetching property from Supabase:', error);
        return null;
    }
}

export async function deletePropertyFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const property = await getPropertyByIdFromSupabase(id);
        if (!property) {
            return { success: false, error: 'العقار غير موجود' };
        }

        if (property.images.length > 0) {
            await deletePropertyImages(property.images);
        }

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting property from Supabase:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in deletePropertyFromSupabase:', error);
        return { success: false, error: error instanceof Error ? error.message : 'فشل حذف العقار' };
    }
}

export async function updatePropertyInSupabase(
    id: string,
    updates: Partial<Property>
): Promise<Property | null> {
    try {
        const dbUpdates = convertPropertyToDB(updates);
        const updatesWithTimestamp = {
            ...dbUpdates,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('properties')
            .update(updatesWithTimestamp)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return data ? convertPropertyFromDB(data) : null;
    } catch (error) {
        console.error('Error updating property in Supabase:', error);
        throw error;
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

export async function addProperty(
    property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount'>
): Promise<Property> {
    const isMockMode = process.env.NEXT_PUBLIC_IS_MOCK_MODE === 'true';

    if (isMockMode) {
        // Mock Mode - localStorage
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

    // Supabase Mode
    try {
        const dbProperty = convertPropertyToDB(property);

        const { data, error } = await supabase
            .from('properties')
            .insert(dbProperty)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }

        return convertPropertyFromDB(data);
    } catch (error) {
        console.error('Error adding property to Supabase:', error);
        throw error;
    }
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

export function searchProperties(filters: {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    area?: string;
}): Property[] {
    let properties = getProperties();

    if (filters.query) {
        const q = filters.query.toLowerCase();
        properties = properties.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.location.address.toLowerCase().includes(q)
        );
    }

    if (filters.category) {
        properties = properties.filter(p => p.category === filters.category);
    }

    if (filters.minPrice) {
        properties = properties.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice) {
        properties = properties.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.area) {
        properties = properties.filter(p => p.location.area === filters.area);
    }

    return properties;
}

// ====== المستخدمين ======

export function getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user: User | null): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
}

export function createUser(userData: Omit<User, 'id' | 'createdAt' | 'favorites' | 'unlockedProperties' | 'isVerified' | 'memberSince'>): User {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
    const now = new Date().toISOString();
    const newUser: User = {
        ...userData,
        id: generateId(),
        favorites: [],
        unlockedProperties: [],
        isVerified: false,
        createdAt: now,
        memberSince: now,
        lastLogin: now,
    };
    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);
    setCurrentUser(newUser);

    // إضافة إشعار ترحيبي
    addNotification({
        userId: newUser.id,
        title: 'مرحباً بك في عقارات جمصة!',
        message: 'نتمنى لك تجربة مميزة في البحث عن عقارك المثالي.',
        type: 'success',
    });

    return newUser;
}

export function toggleFavorite(propertyId: string): boolean {
    const user = getCurrentUser();
    if (!user) return false;

    const index = user.favorites.indexOf(propertyId);
    if (index === -1) {
        user.favorites.push(propertyId);
    } else {
        user.favorites.splice(index, 1);
    }
    setCurrentUser(user);
    return index === -1; // true إذا تمت الإضافة، false إذا تمت الإزالة
}

export function isPropertyUnlocked(userId: string, propertyId: string): boolean {
    const user = getUserById(userId);
    return user ? user.unlockedProperties.includes(propertyId) : false;
}

export function unlockProperty(propertyId: string): boolean {
    const user = getCurrentUser();
    if (!user) return false;

    if (!user.unlockedProperties.includes(propertyId)) {
        user.unlockedProperties.push(propertyId);
        setCurrentUser(user);

        // إرسال إشعار
        addNotification({
            userId: user.id,
            title: 'تم فك القفل بنجاح',
            message: 'يمكنك الآن التواصل مع المالك مباشرة.',
            type: 'success',
            link: `/property/${propertyId}`
        });
        return true;
    }
    return true; // Already unlocked
}

export function getUserById(id: string): User | null {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
    return users.find(u => u.id === id) || null;
}

export function updateUserLastLogin(userId: string): void {
    const user = getCurrentUser();
    if (user && user.id === userId) {
        user.lastLogin = new Date().toISOString();
        setCurrentUser(user);
    }
}

// ====== طلبات الدفع ======

export function getPaymentRequests(): PaymentRequest[] {
    return getItem<PaymentRequest[]>(STORAGE_KEYS.PAYMENTS, []);
}

export function createPaymentRequest(request: Omit<PaymentRequest, 'id' | 'createdAt' | 'status'>): PaymentRequest {
    const payments = getPaymentRequests();
    const newRequest: PaymentRequest = {
        ...request,
        id: generateId(),
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    payments.unshift(newRequest);
    setItem(STORAGE_KEYS.PAYMENTS, payments);
    return newRequest;
}

export function approvePayment(paymentId: string): void {
    const payments = getPaymentRequests();
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'approved';
        payment.processedAt = new Date().toISOString();
        setItem(STORAGE_KEYS.PAYMENTS, payments);
        unlockProperty(payment.propertyId);
    }
}

// ====== التقييمات ======

export function getReviewsForProperty(propertyId: string): Review[] {
    const reviews = getItem<Review[]>(STORAGE_KEYS.REVIEWS, []);
    return reviews.filter(r => r.propertyId === propertyId);
}

export function addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const reviews = getItem<Review[]>(STORAGE_KEYS.REVIEWS, []);
    const newReview: Review = {
        ...review,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };
    reviews.unshift(newReview);
    setItem(STORAGE_KEYS.REVIEWS, reviews);
    return newReview;
}

// ====== الإشعارات ======

export function getNotifications(userId?: string): Notification[] {
    const allNotifications = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (userId) {
        return allNotifications.filter(n => n.userId === userId);
    }
    return allNotifications;
}

export function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
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
        images: ['/images/property2.jpg'],
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
        images: ['/images/property3.jpg'],
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
        images: ['/images/property4.jpg'],
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
        images: ['/images/property5.jpg'],
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
