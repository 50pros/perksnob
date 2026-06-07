import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SignInForm from "@/components/auth/SignInForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/";
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-md px-6 py-20">
        <SignInForm next={safeNext} />
      </div>
      <Footer />
    </main>
  );
}
