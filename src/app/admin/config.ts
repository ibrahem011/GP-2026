export type AdminRouteConfig = {
    title: string;
    subtitle: string;
    fabIcon: string;
    fabAction: string; // The URL to navigate to, or 'search' to focus the search bar
};

export const ADMIN_ROUTES: Record<string, AdminRouteConfig> = {
    '/admin': {
        title: 'نظرة عامة',
        subtitle: 'مرحباً بك مجدداً في لوحة التحكم، إليك ملخص اليوم.',
        fabIcon: 'add',
        fabAction: '/admin/properties', // From specs: /admin -> /admin/properties
    },
    '/admin/properties': {
        title: 'إدارة العقارات',
        subtitle: 'إدارة ومتابعة جميع العقارات المدرجة في النظام.',
        fabIcon: 'add_home',
        fabAction: '/add-property', // From specs: /admin/properties -> /add-property
    },
    '/admin/bookings': {
        title: 'الحجوزات',
        subtitle: 'مراجعة وتأكيد طلبات الحجز.',
        fabIcon: 'book_online',
        fabAction: 'search', // From specs: /admin/bookings -> focus page search
    },
    '/admin/payments': {
        title: 'طلبات الدفع',
        subtitle: 'مراجعة إيصالات جدية الحجز وفتح العقارات.',
        fabIcon: 'receipt_long',
        fabAction: 'filter_pending', // From specs: /admin/payments -> switch to pending filter
    },
    '/admin/users': {
        title: 'إدارة المستخدمين',
        subtitle: 'إدارة الأدوار والتوثيق بالهوية الوطنية.',
        fabIcon: 'person_add',
        fabAction: 'search', // From specs: /admin/users -> focus page search
    },
    '/admin/settings': {
        title: 'إعدادات النظام',
        subtitle: 'واجهة مخصصة للتطوير المستقبلي.',
        fabIcon: 'home',
        fabAction: '/admin', // From specs: /admin/settings -> /admin
    },
};

export const getAdminRouteConfig = (pathname: string): AdminRouteConfig => {
    // Exact match
    if (ADMIN_ROUTES[pathname]) {
        return ADMIN_ROUTES[pathname];
    }
    
    // Partial Match (for nested edit pages etc.)
    const matches = Object.keys(ADMIN_ROUTES).filter(k => k !== '/admin' && pathname.startsWith(k));
    if (matches.length > 0) {
        // Sort by length to get most specific
        matches.sort((a, b) => b.length - a.length);
        return ADMIN_ROUTES[matches[0]];
    }

    // Default
    return ADMIN_ROUTES['/admin'];
};
