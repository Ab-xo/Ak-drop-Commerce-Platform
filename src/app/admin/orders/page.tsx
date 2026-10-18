import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

const pageSize = 20;
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toLocaleString('en-US')}`;
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ status: requestedStatus, q: requestedQuery, page: requestedPage }, adminUser] = await Promise.all([
    searchParams,
    getServerVerifiedAdmin(),
  ]);
  if (!adminUser) notFound();

  const status = typeof requestedStatus === 'string' && orderStatuses.includes(requestedStatus as typeof orderStatuses[number])
    ? requestedStatus
    : '';
  const query = (typeof requestedQuery === 'string' ? requestedQuery : '').trim().slice(0, 80);
  const requestedPageNumber = pageNumber(requestedPage);
  const admin = createAdminClient();
  let ordersQuery = admin
    .from('orders')
    .select('id, order_number, user_id, status, payment_status, total_amount, currency, created_at, shipping_address', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) ordersQuery = ordersQuery.eq('status', status);
  if (query) ordersQuery = ordersQuery.ilike('order_number', `%${query.replace(/[\\%_]/g, '\\$&')}%`);

  const { data: orders, count, error } = await ordersQuery
    .range((requestedPageNumber - 1) * pageSize, requestedPageNumber * pageSize - 1);
  if (error) {
    console.error('Admin order queue load failed:', error.message);
    throw new Error('Unable to load the order queue.');
  }

  const orderRows = orders ?? [];
  const customerIds = [...new Set(orderRows.flatMap((order) => order.user_id ? [order.user_id] : []))];
  const { data: profiles, error: profilesError } = customerIds.length
    ? await admin.from('user_profiles').select('id, full_name, email').in('id', customerIds)
    : { data: [], error: null };
  if (profilesError) {
    console.error('Admin order customer lookup failed:', profilesError.message);
    throw new Error('Unable to load customer names for the order queue.');
  }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const currentPage = Math.min(requestedPageNumber, totalPages);
  const pageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (query) params.set('q', query);
    params.set('page', String(page));
    return `/admin/orders?${params.toString()}`;
  };
  if (count && currentPage !== requestedPageNumber) redirect(pageUrl(currentPage));

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="orders">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Store operations</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review payment state and move paid orders through fulfillment.</p>
      </div>

      <form method="get" className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <label className="relative block">
          <span className="sr-only">Search order number</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={query} maxLength={80} placeholder="Search order number"
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select name="status" defaultValue={status} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm capitalize outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
            <option value="">All statuses</option>
            {orderStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90">Apply filters</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-bold">{(count ?? 0).toLocaleString()} orders</p>
          <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
        </div>
        {orderRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-secondary/35 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Payment</th>
                  <th className="px-4 py-3 font-bold">Fulfillment</th>
                  <th className="px-5 py-3 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orderRows.map((order) => {
                  const profile = order.user_id ? profileById.get(order.user_id) : null;
                  const address = order.shipping_address && typeof order.shipping_address === 'object'
                    ? order.shipping_address as Record<string, unknown>
                    : {};
                  const addressEmail = typeof address.email === 'string' ? address.email : '';
                  return (
                    <tr key={order.id} className="hover:bg-secondary/25">
                      <td className="px-5 py-4">
                        <Link href={`/admin/orders/${order.id}`} className="font-bold hover:text-primary">#{order.order_number}</Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className="block font-medium">{profile?.full_name || 'Customer'}</span>
                        <span className="text-xs text-muted-foreground">{profile?.email || addressEmail || 'Email unavailable'}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4 text-xs capitalize">{order.payment_status}</td>
                      <td className="px-4 py-4 text-xs capitalize">{order.status}</td>
                      <td className="px-5 py-4 text-right text-xs font-bold tabular-nums">{formatAmount(Number(order.total_amount), order.currency || 'ETB')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-bold">No matching orders</p>
            <p className="mt-1 text-xs text-muted-foreground">Try another order number or status.</p>
          </div>
        )}
        <nav aria-label="Order pages" className="flex items-center justify-between border-t border-border px-5 py-4">
          <Link aria-disabled={currentPage <= 1} href={pageUrl(Math.max(1, currentPage - 1))}
            className={`inline-flex items-center gap-2 text-xs font-bold ${currentPage <= 1 ? 'pointer-events-none text-muted-foreground/50' : 'hover:text-primary'}`}>
            <ArrowLeft size={14} /> Previous
          </Link>
          <span className="text-xs text-muted-foreground">{pageSize} per page</span>
          <Link aria-disabled={currentPage >= totalPages} href={pageUrl(Math.min(totalPages, currentPage + 1))}
            className={`inline-flex items-center gap-2 text-xs font-bold ${currentPage >= totalPages ? 'pointer-events-none text-muted-foreground/50' : 'hover:text-primary'}`}>
            Next <ArrowRight size={14} />
          </Link>
        </nav>
      </section>
    </AdminWorkspace>
  );
}
