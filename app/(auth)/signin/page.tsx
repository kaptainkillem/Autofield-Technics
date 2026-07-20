import { Suspense } from 'react';
import { SignInForm } from './signinform';

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
