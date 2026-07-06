import { SignIn } from '@clerk/nextjs';
import { PRODUCT } from '@/lib/product-copy';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{PRODUCT.name}</h1>
        <p className="text-sm text-slate-600 mt-1">{PRODUCT.edition}</p>
        <p className="text-xs text-slate-500 mt-1">{PRODUCT.tagline}</p>
      </div>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/ops" />
    </div>
  );
}
