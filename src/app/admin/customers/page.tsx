import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

const pageSize = 20;

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ q: requestedQuery, page: requestedPage }, adminUser] = await Promise.all([
    searchParams,
    getServerVerifiedAdmin(),
  ]);
  if (!adminUser) notFound();

  const query = (typeof requestedQuery === 'string' ? requestedQuery : '').trim().slice(0, 120);
  const requestedPageNumber = pageNumber(requestedPage);
  const admin = createAdminClient();
  let customersQuery = admin
    .from('user_profiles')
    .select('id, full_name, email, phone, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (query) customersQuery = customersQuery.ilike('email', `%${query.replace(/[\\%_]/g, '\\$&')}%`);
  const { data: customers, count, error } = await customersQuery
    .range((requestedPageNumber - 1) * pageSize, requestedPageNumber * pageSize - 1);
  if (error) {
    console.error('Admin customer directory load failed:', error.message);
    throw new Error('Unable to load the customer directory.');
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const currentPage = Math.min(requestedPageNumber, totalPages);
  const pageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', String(page));
    return `/admin/customers?${params.toString()}`;
  };
  if (count && currentPage !== requestedPageNumber) redirect(pageUrl(currentPage));

  return (
    <AdminWorkspace email={adminUser.email ?? 'Authorized staff'} activePage="customers">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Store operations</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Customers</h1>
        <p className="mt-2 text-sm text-muted-foreground">Look up registered customer contact details for support. Only essential fields are shown.</p>
      </div>
      <form method="get" className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Search customer email</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input name="q" type="search" defaultValue={query} maxLength={120} placeholder="Search customer email"
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </label>
        <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90">Search</button>
      </form>
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-bold">{(count ?? 0).toLocaleString()} customers</p>
          <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
        </div>
        {customers?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-secondary/35 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Phone</th>
                  <th className="px-5 py-3 text-right font-bold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary/25">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{customer.full_name || 'Name not provided'}</p>
                      {customer.email && <a href={`mailto:${customer.email}`} className="mt-1 block text-xs text-primary hover:underline">{customer.email}</a>}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {customer.phone ? <a href={`tel:${customer.phone}`} className="hover:text-foreground">{customer.phone}</a> : 'Not provided'}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-bold">No matching customers</p>
            <p className="mt-1 text-xs text-muted-foreground">Search by email address or clear the search to browse the directory.</p>
          </div>
        )}
        <nav aria-label="Customer pages" className="flex items-center justify-between border-t border-border px-5 py-4">
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
