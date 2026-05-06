import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7] p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 border border-[#E5E7EB] text-center">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">Sign-up disabled</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          New accounts are created by an administrator. Contact your admin to request access.
        </p>
        <Link
          href="/sign-in"
          className="inline-block bg-[#E8611A] hover:bg-[#D4561A] text-white py-2.5 px-6 rounded-md font-medium transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
