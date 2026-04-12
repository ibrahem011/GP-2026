import { vi } from 'vitest'

type PaymentRequest = {
    id: string
    user_id: string
    property_id: string
    amount: number
    status: 'pending' | 'approved' | 'rejected'
    is_consumed: boolean
    created_at: string
}

type PropertyUnlock = {
    id: string
    user_id: string
    property_id: string
    unlocked_at: string
}

const db = {
    payment_requests: [] as PaymentRequest[],
    unlocked_properties: [] as PropertyUnlock[],
}

const now = () => new Date().toISOString()
const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `test-${Math.random().toString(16).slice(2)}`)

let originalFetch: typeof fetch | null = null

export function resetSupabaseMockDb() {
    db.payment_requests.length = 0
    db.unlocked_properties.length = 0
}

function json(status: number, body: any) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    })
}

function applyEqFilters<T extends Record<string, any>>(rows: T[], url: URL) {
    // PostgREST filters look like: field=eq.value
    const filters = [...url.searchParams.entries()]
        .filter(([k, v]) => v.startsWith('eq.'))
        .map(([k, v]) => [k, v.slice(3)] as const)

    return rows.filter((r) => filters.every(([k, v]) => String(r[k]) === v))
}

export function installSupabaseFetchMock() {
    if (!originalFetch) originalFetch = globalThis.fetch

    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
        const req = new Request(input, init)
        const url = new URL(req.url)
        const path = url.pathname
        const method = (req.method || 'GET').toUpperCase()

        // ✅ only mock Supabase-like endpoints
        const isRest = path.includes('/rest/v1/')
        if (!isRest) {
            // fallback to real fetch for other calls (or block if you want)
            return originalFetch!(input as any, init)
        }

        const table = path.split('/rest/v1/')[1]?.split('/')[0] // payment_requests, unlocked_properties, rpc/...
        if (!table) return json(404, { message: 'Not found' })

        // ---------- RPC (optional) ----------
        // لو عندك RPC في الكود: /rest/v1/rpc/consume_payment_and_unlock (أو أي اسم قريب)
        if (table === 'rpc') {
            const fn = path.split('/rpc/')[1]
            const payload = req.body ? await req.json().catch(() => ({})) : {}

            // دعم عام لسيناريو "consume + unlock"
            if (
                fn === 'unlock_property_with_payment' ||
                fn === 'approve_payment_request_and_unlock' ||
                (fn?.toLowerCase().includes('consume') && fn.toLowerCase().includes('unlock'))
            ) {
                const paymentId = payload.p_payment_id || payload.payment_id || payload.paymentId
                const pr = db.payment_requests.find((x) => x.id === paymentId)
                if (!pr) return json(400, { message: 'payment not found' })
                if (pr.is_consumed) return json(400, { message: 'payment already consumed' })

                pr.status = 'approved'
                pr.is_consumed = true
                db.unlocked_properties.push({
                    id: uuid(),
                    user_id: pr.user_id,
                    property_id: pr.property_id,
                    unlocked_at: now(),
                })
                return json(200, { ok: true })
            }

            if (fn === 'transition_booking_status' || fn === 'attach_booking_payment_proof') {
                return json(200, { ok: true })
            }

            return json(404, { message: `Unknown rpc: ${fn}` })
        }

        // ---------- payment_requests ----------
        if (table === 'payment_requests') {
            if (method === 'POST') {
                const body = await req.json()
                const row: PaymentRequest = {
                    id: uuid(),
                    user_id: body.user_id,
                    property_id: body.property_id,
                    amount: Number(body.amount ?? 0),
                    status: (body.status ?? 'pending') as any,
                    is_consumed: Boolean(body.is_consumed ?? false),
                    created_at: now(),
                }
                db.payment_requests.push(row)
                // PostgREST insert often returns array
                return json(201, [row])
            }

            if (method === 'GET') {
                const filtered = applyEqFilters(db.payment_requests, url)
                const isSingle = req.headers.get('accept')?.includes('vnd.pgrst.object')

                if (isSingle) {
                    if (filtered.length > 1) return json(406, { message: 'multiple rows returned' })
                    if (filtered.length === 0) return new Response('', { status: 200, headers: { 'content-type': 'application/json' } }) // maybeSingle expects empty or null
                    return json(200, filtered[0])
                }

                return json(200, filtered)
            }

            if (method === 'PATCH') {
                const patch = await req.json()
                const filtered = applyEqFilters(db.payment_requests, url)
                filtered.forEach((r) => Object.assign(r, patch))
                return json(200, filtered)
            }

            if (method === 'DELETE') {
                const filtered = applyEqFilters(db.payment_requests, url)
                db.payment_requests = db.payment_requests.filter((row) => !filtered.includes(row))
                return json(200, filtered)
            }
        }

        // ---------- unlocked_properties ----------
        if (table === 'property_unlocks' || table === 'unlocked_properties') {
            if (method === 'POST') {
                const body = await req.json()
                const row: PropertyUnlock = {
                    id: uuid(),
                    user_id: body.user_id,
                    property_id: body.property_id,
                    unlocked_at: now(),
                }
                db.unlocked_properties.push(row)
                return json(201, [row])
            }

            if (method === 'GET') {
                const filtered = applyEqFilters(db.unlocked_properties, url)
                const isSingle = req.headers.get('accept')?.includes('vnd.pgrst.object')

                if (isSingle) {
                    if (filtered.length > 1) return json(406, { message: 'multiple rows returned' })
                    if (filtered.length === 0) return new Response('', { status: 200, headers: { 'content-type': 'application/json' } })
                    return json(200, filtered[0])
                }

                return json(200, filtered)
            }

            if (method === 'DELETE') {
                const filtered = applyEqFilters(db.unlocked_properties, url)
                db.unlocked_properties = db.unlocked_properties.filter((row) => !filtered.includes(row))
                return json(200, filtered)
            }
        }

        // لو فيه endpoint تاني الكود بيستخدمه هنطبع تحذير عشان نضيفه بسرعة
        console.warn('[supabase-mock] Unhandled:', method, url.toString())
        return json(404, { message: 'Unhandled mock route' })
    })
}

export function uninstallSupabaseFetchMock() {
    if (originalFetch) {
        vi.stubGlobal('fetch', originalFetch)
        originalFetch = null
    }
}
