import re

with open('src/app/bookings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update BookingCard props and definition to remove action handlers
content = re.sub(r'function BookingCard\(\{.*?\}: \{.*?\}\) \{', '''function BookingCard({
    booking,
    audience,
    isSelected,
    onClick,
}: {
    booking: BookingListItem;
    audience: 'tenant' | 'landlord';
    isSelected?: boolean;
    onClick?: () => void;
}) {''', content, flags=re.DOTALL)

# Remove canCancel and canRespond from BookingCard
content = re.sub(r'    const canCancel = audience === \'tenant\' && canTenantCancelBooking\(booking\.status\);\s*const canRespond = audience === \'landlord\' && canLandlordRespondToBooking\(booking\.status\);', '', content)

# Update BookingCard actions container to ONLY have the Details link
new_card_actions = '''<div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center dark:border-[#2a3142] lg:hidden">
                <Link
                    href={`/bookings/${booking.id}`}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    تفاصيل الحجز
                </Link>
            </div>'''
content = re.sub(r'<div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center dark:border\[#2a3142\] lg:hidden">.*?</div>\s*</article>', new_card_actions + '\n        </article>', content, flags=re.DOTALL)

# 2. Update BookingDetailsPanel
content = re.sub(r'function BookingDetailsPanel\(\{.*?\}: \{.*?\}\) \{', '''function BookingDetailsPanel({
    booking,
    audience,
}: {
    booking: BookingListItem;
    audience: 'tenant' | 'landlord';
}) {''', content, flags=re.DOTALL)

# Remove canCancel and canRespond from BookingDetailsPanel
content = re.sub(r'    const canCancel = audience === \'tenant\' && canTenantCancelBooking\(booking\.status\);\s*const canRespond = audience === \'landlord\' && canLandlordRespondToBooking\(booking\.status\);', '', content)

# Update BookingDetailsPanel actions to ONLY have the Details link
new_panel_actions = '''{/* Actions Footer */}
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 shrink-0 dark:border-[#2a3142] dark:bg-[#121520]">
                <Link
                    href={`/bookings/${booking.id}`}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                >
                    <span className="material-symbols-outlined text-[18px]">article</span>
                    تفاصيل الحجز
                </Link>
            </div>
        </div>'''
content = re.sub(r'\{\/\* Actions Footer \*\/\}\s*<div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 shrink-0 dark:border\[#2a3142\] dark:bg\[#121520\]">.*?</div>\s*</div>', new_panel_actions, content, flags=re.DOTALL)

# 3. Clean up BookingsPage component
# Remove decision and action states
content = re.sub(r'\s*const \[decisionTarget, setDecisionTarget\] = useState.*?;\s*const \[decisionLoading, setDecisionLoading\] = useState.*?;\s*', '\n', content)

# Remove action functions (openConversation, cancelBooking, submitDecision)
content = re.sub(r'\s*const openConversation = async \(booking: BookingListItem\) => \{.*?\};\s*', '\n', content, flags=re.DOTALL)
content = re.sub(r'\s*const cancelBooking = async \(booking: BookingListItem\) => \{.*?\};\s*', '\n', content, flags=re.DOTALL)
content = re.sub(r'\s*const submitDecision = async \(note: string\) => \{.*?\};\s*', '\n', content, flags=re.DOTALL)

# Remove <BookingDecisionDialog />
content = re.sub(r'\s*<BookingDecisionDialog.*?/>\s*</main>', '\n        </main>', content, flags=re.DOTALL)

# 4. Revert Stats Cards & Hide on Mobile
content = content.replace('<div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">', '<div className="mt-6 hidden sm:grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">')

content = re.sub(r'<div \s*onClick=\{.*?\}\s*className={`rounded-\[20px\] border px-5 py-4 shadow-sm transition-all lg:cursor-pointer \$\{activeTab === \'trips\' \?.*?`}\s*>', '<div className="rounded-[20px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm dark:border-[#2a3142] dark:bg-[#1e2130]">', content, flags=re.DOTALL)
content = re.sub(r'<div \s*onClick=\{.*?\}\s*className={`rounded-\[20px\] border px-5 py-4 shadow-sm transition-all lg:cursor-pointer \$\{activeTab === \'incoming\' \?.*?`}\s*>', '<div className="rounded-[20px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm dark:border-[#2a3142] dark:bg-[#1e2130]">', content, flags=re.DOTALL)

# 5. Restore the Pill Toggle on Desktop
content = content.replace('<div className="mt-6 flex lg:hidden rounded-xl bg-slate-200/50 p-1 dark:bg-[#1e2130]">', '<div className="mt-6 flex rounded-xl bg-slate-200/50 p-1 dark:bg-[#1e2130]">')

# 6. Remove handlers passed to BookingCard
content = re.sub(r'\s*onOpenConversation=\{openConversation\}\s*onCancel=\{cancelBooking\}\s*onDecision=\{\(target, action\) => setDecisionTarget\(\{ booking: target, action \}\)\}', '', content)

# 7. Remove handlers passed to BookingDetailsPanel
content = re.sub(r'\s*onOpenConversation=\{openConversation\}\s*onCancel=\{cancelBooking\}\s*onDecision=\{\(target, action\) => setDecisionTarget\(\{ booking: target, action \}\)\}', '', content)

# 8. Remove BookingDecisionDialog import
content = re.sub(r'import BookingDecisionDialog from \'@/components/bookings/BookingDecisionDialog\';\n', '', content)

# Remove unused imports and types if they cause lint errors
content = content.replace('type DecisionAction = \'landlord_confirm\' | \'landlord_reject\';', '')

with open('src/app/bookings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
