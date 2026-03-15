"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { IS_MOCK_MODE, supabaseService } from "@/services/supabaseService";

export type BookingStatusUI =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "unknown";

interface BookingListItem {
  id: string;
  propertyId: string;
  buyerId?: string;
  ownerId?: string;
  propertyTitle: string;
  propertyImage: string;
  location: string;
  price: number;
  startDate: string;
  endDate: string;
  status: BookingStatusUI;
  guestName?: string;
  guestAvatar?: string;
  ownerName?: string;
}

const calculateNights = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
};

const normalizeBookingStatus = (
  dbStatus: string | null | undefined,
): BookingStatusUI => {
  if (!dbStatus) return "unknown";
  const s = dbStatus.toLowerCase();

  if (s === "pending") return "pending";
  if (s === "confirmed") return "confirmed";
  if (s === "completed") return "completed";
  if (s === "cancelled") return "cancelled";

  if (s === "requested" || s === "payment_pending" || s === "payment_uploaded") {
    return "pending";
  }

  if (s === "approved" || s === "active") return "confirmed";

  if (
    s === "rejected" ||
    s === "expired" ||
    s === "cancelled_by_tenant" ||
    s === "cancelled_by_landlord" ||
    s === "disputed"
  ) {
    return "cancelled";
  }

  return "unknown";
};

const getStatusBadge = (status: BookingStatusUI) => {
  switch (status) {
    case "pending":
      return (
        <span className="rounded-md bg-amber-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
          قيد الانتظار
        </span>
      );
    case "confirmed":
      return (
        <span className="rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
          مؤكد
        </span>
      );
    case "completed":
      return (
        <span className="rounded-md bg-gray-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
          مكتمل
        </span>
      );
    case "cancelled":
      return (
        <span className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
          ملغي
        </span>
      );
    default:
      return (
        <span className="rounded-md bg-gray-400 px-2 py-1 text-xs font-bold text-white shadow-sm">
          غير معروف
        </span>
      );
  }
};

const INITIAL_MY_BOOKINGS: BookingListItem[] = [
  {
    id: "b1",
    propertyId: "1",
    buyerId: "mock-user-123",
    ownerId: "owner-1",
    propertyTitle: "شقة فاخرة تطل على البحر",
    propertyImage:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80",
    location: "منطقة الفيلات",
    price: 4500,
    startDate: "2024-06-15",
    endDate: "2024-06-18",
    status: "pending",
    ownerName: "الحاج محمد",
  },
  {
    id: "b2",
    propertyId: "2",
    buyerId: "mock-user-123",
    ownerId: "owner-2",
    propertyTitle: "شاليه أرضي بحديقة",
    propertyImage:
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=400&q=80",
    location: "15 مايو",
    price: 1600,
    startDate: "2024-05-01",
    endDate: "2024-05-03",
    status: "confirmed",
    ownerName: "أم كريم",
  },
];

const INITIAL_INCOMING_REQUESTS: BookingListItem[] = [
  {
    id: "r1",
    propertyId: "3",
    buyerId: "tenant-1",
    ownerId: "mock-user-123",
    propertyTitle: "ستوديو اقتصادي للطلاب",
    propertyImage:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=400&q=80",
    location: "حي الشباب",
    price: 3000,
    startDate: "2024-09-01",
    endDate: "2024-09-30",
    status: "pending",
    guestName: "أحمد علي",
    guestAvatar: "",
  },
];

export default function BookingsPage() {
  const { user, loading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"my-bookings" | "incoming">(
    "my-bookings",
  );
  const [myBookings, setMyBookings] = useState<BookingListItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user && !IS_MOCK_MODE) return;

    setError(null);
    setLoading(true);

    try {
      if (IS_MOCK_MODE) {
        setMyBookings(INITIAL_MY_BOOKINGS);
        setIncomingRequests(INITIAL_INCOMING_REQUESTS);
      } else if (user) {
        const { bookings, error: fetchError } = await supabaseService.getUserBookings(
          user.id,
        );

        if (fetchError) throw fetchError;

        const tenantBookings = bookings.filter(
          (booking: any) => booking.bookingType === "tenant",
        );
        const ownerBookings = bookings.filter(
          (booking: any) => booking.bookingType === "owner",
        );

        setMyBookings(
          tenantBookings.map((booking: any) => ({
            id: booking.id,
            propertyId: booking.propertyId,
            buyerId: booking.userId,
            ownerId: booking.property?.ownerId,
            propertyTitle: booking.property?.title || "عقار غير معروف",
            propertyImage: booking.property?.images?.[0] || "",
            location: booking.property?.area || "غير محدد",
            price: booking.totalAmount,
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: normalizeBookingStatus(booking.status),
            ownerName: booking.property?.ownerName || "المالك",
          })),
        );

        setIncomingRequests(
          ownerBookings.map((booking: any) => ({
            id: booking.id,
            propertyId: booking.propertyId,
            buyerId: booking.userId,
            ownerId: booking.property?.ownerId,
            propertyTitle: booking.property?.title || "عقار غير معروف",
            propertyImage: booking.property?.images?.[0] || "",
            location: booking.property?.area || "غير محدد",
            price: booking.totalAmount,
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: normalizeBookingStatus(booking.status),
            guestName: booking.tenantName || booking.user?.fullName || "ضيف",
            guestAvatar: booking.user?.avatarUrl || "",
          })),
        );
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user && !IS_MOCK_MODE) {
      setLoading(false);
      return;
    }

    void fetchData();
  }, [isAuthLoading, user]);

  const handleOpenConversation = async (booking: BookingListItem) => {
    const buyerId = booking.buyerId || user?.id;
    const ownerId = booking.ownerId;

    if (!buyerId || !ownerId) {
      alert("تعذر تحديد أطراف المحادثة لهذا الحجز.");
      return;
    }

    try {
      const conversationId = await supabaseService.createConversation({
        propertyId: booking.propertyId,
        buyerId,
        ownerId,
      });

      router.push(`/messages/${conversationId}`);
    } catch (conversationError) {
      console.error(conversationError);
      alert("تعذر فتح المحادثة الآن. حاول مرة أخرى.");
    }
  };

  const handleCancelBooking = async (id: string, currentStatus: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;

    setMyBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status: "cancelled" } : booking,
      ),
    );

    const { error: updateError } = await supabaseService.updateBookingStatus(
      id,
      "cancelled",
    );

    if (updateError) {
      alert("فشل في عملية الإلغاء. سيتم التراجع.");
      setMyBookings((prev) =>
        prev.map((booking) =>
          booking.id === id
            ? { ...booking, status: normalizeBookingStatus(currentStatus) }
            : booking,
        ),
      );
    }
  };

  const handleAcceptRequest = async (id: string, currentStatus: string) => {
    setIncomingRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "confirmed" } : request,
      ),
    );

    const { error: updateError } = await supabaseService.updateBookingStatus(
      id,
      "confirmed",
    );

    if (updateError) {
      alert("فشل في عملية القبول. سيتم التراجع.");
      setIncomingRequests((prev) =>
        prev.map((request) =>
          request.id === id
            ? { ...request, status: normalizeBookingStatus(currentStatus) }
            : request,
        ),
      );
    }
  };

  const handleRejectRequest = async (id: string, currentStatus: string) => {
    if (!confirm("هل تريد رفض هذا الطلب؟")) return;

    setIncomingRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "cancelled" } : request,
      ),
    );

    const { error: updateError } = await supabaseService.updateBookingStatus(
      id,
      "cancelled",
    );

    if (updateError) {
      alert("فشل في عملية الرفض. سيتم التراجع.");
      setIncomingRequests((prev) =>
        prev.map((request) =>
          request.id === id
            ? { ...request, status: normalizeBookingStatus(currentStatus) }
            : request,
        ),
      );
    }
  };

  if (isAuthLoading || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 pb-28 dark:bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-gray-500">جاري تحميل الحجوزات...</p>
      </main>
    );
  }

  if (!user && !IS_MOCK_MODE) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 pb-28 dark:bg-black">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-zinc-900">
          <span className="material-symbols-outlined mb-4 text-6xl text-gray-400">
            lock
          </span>
          <h2 className="mb-2 text-xl font-bold">يرجى تسجيل الدخول</h2>
          <p className="mb-6 text-sm text-gray-500">
            يجب عليك تسجيل الدخول لعرض الحجوزات الخاصة بك
          </p>
          <button
            onClick={() => router.push("/auth?mode=login&redirect=/bookings")}
            className="w-full rounded-xl bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90"
          >
            تسجيل الدخول
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28 dark:bg-black">
      <div className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 pb-4 backdrop-blur-xl dark:border-white/5 dark:bg-black/80">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="mb-6 mt-2 flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:text-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900"
              aria-label="الرجوع للرئيسية"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
            <nav className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Link className="transition-colors hover:text-primary" href="/">
                الرئيسية
              </Link>
              <span className="material-symbols-outlined text-[14px]">
                chevron_left
              </span>
              <span className="text-gray-600 dark:text-gray-300">الحجوزات</span>
            </nav>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            الحجوزات
          </h1>

          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-zinc-900">
            <button
              onClick={() => setActiveTab("my-bookings")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                activeTab === "my-bookings"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-black dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              حجوزاتي
            </button>
            <button
              onClick={() => setActiveTab("incoming")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                activeTab === "incoming"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-black dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              طلبات واردة
              {incomingRequests.filter((request) => request.status === "pending")
                .length > 0 ? (
                <span className="mb-0.5 mr-2 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" />
              ) : null}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {error ? (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <span className="material-symbols-outlined shrink-0">error</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={() => void fetchData()}
                className="mt-2 text-xs font-bold hover:underline"
              >
                المحاولة مرة أخرى
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "my-bookings" ? (
          <div className="animate-fadeIn space-y-4">
            {myBookings.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined mb-4 text-6xl text-gray-300 dark:text-gray-600">
                  calendar_month
                </span>
                <p className="text-gray-500">ليس لديك حجوزات حالية</p>
              </div>
            ) : (
              myBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900"
                >
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={booking.propertyImage}
                        className="h-full w-full object-cover"
                        alt={`صورة ${booking.propertyTitle}`}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">
                            {booking.propertyTitle}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="material-symbols-outlined text-[14px]">
                            calendar_today
                          </span>
                          {calculateNights(booking.startDate, booking.endDate)} ليالي
                          <span className="mx-1">•</span>
                          {booking.location}
                        </p>
                      </div>

                      <div className="mt-2 flex items-end justify-between">
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase text-gray-400">
                            التاريخ
                          </div>
                          <div className="dir-ltr text-xs font-medium text-gray-700 dark:text-gray-300">
                            {new Date(booking.startDate).toLocaleDateString("ar-EG", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -
                            {new Date(booking.endDate).toLocaleDateString("ar-EG", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>

                        <Link
                          href={`/property/${booking.propertyId}`}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-900 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-gray-300"
                        >
                          تفاصيل العقار
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => void handleOpenConversation(booking)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        chat
                      </span>
                      مراسلة المالك
                    </button>
                    {booking.status === "pending" ? (
                      <button
                        onClick={() => handleCancelBooking(booking.id, booking.status)}
                        className="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-gray-500 transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                        title="إلغاء الحجز"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          close
                        </span>
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="animate-fadeIn space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined mb-4 text-6xl text-gray-300 dark:text-gray-600">
                  notifications_off
                </span>
                <p className="text-gray-500">لا توجد طلبات واردة</p>
              </div>
            ) : (
              incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900"
                >
                  <div className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={request.propertyImage}
                        className="h-full w-full object-cover"
                        alt={`صورة ${request.propertyTitle}`}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">
                            {request.propertyTitle}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
                            {request.guestAvatar ? (
                              <img
                                src={request.guestAvatar}
                                className="h-full w-full object-cover"
                                alt="Avatar"
                              />
                            ) : (
                              <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-sm text-gray-400">
                                person
                              </span>
                            )}
                          </div>
                          <span className="truncate text-sm font-medium text-gray-600 dark:text-gray-300">
                            {request.guestName}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-end justify-between">
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase text-gray-400">
                            التاريخ
                          </div>
                          <div className="dir-ltr text-xs font-medium text-gray-700 dark:text-gray-300">
                            {new Date(request.startDate).toLocaleDateString("ar-EG", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -
                            {new Date(request.endDate).toLocaleDateString("ar-EG", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>

                        <Link
                          href={`/property/${request.propertyId}`}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-900 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-gray-300"
                        >
                          تفاصيل العقار
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => void handleOpenConversation(request)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        chat
                      </span>
                      مراسلة الضيف
                    </button>

                    {request.status === "pending" ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAcceptRequest(request.id, request.status)}
                          className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600"
                        >
                          قبول الطلب
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id, request.status)}
                          className="flex-1 rounded-xl bg-rose-50 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                        >
                          رفض
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
