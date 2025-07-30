import { Suspense } from 'react';
import AdminLoginForm from './login-form';

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
