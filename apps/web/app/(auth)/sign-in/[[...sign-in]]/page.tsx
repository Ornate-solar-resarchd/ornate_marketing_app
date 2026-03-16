import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7]">
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  );
}
