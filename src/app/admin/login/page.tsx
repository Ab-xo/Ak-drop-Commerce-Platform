import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { getServerVerifiedAdmin } from '@/lib/admin-auth';

export default async function AdminLoginPage() {
  const adminUser = await getServerVerifiedAdmin();
  if (adminUser) redirect('/admin');

  return <AdminLoginForm />;
}
