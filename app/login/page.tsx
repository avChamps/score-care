import type { Metadata } from "next";
import { AuthLaunchMotion } from "@/components/auth/auth-launch-motion";
import { LoginFlow } from "@/components/auth/login-flow";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your SCORECARE dashboard with mobile and PAN verification.",
};

export default function LoginPage() {
  return (
    <section className="auth-page min-h-dvh bg-white px-6 py-5 text-[#172033] sm:px-8">
      <AuthLaunchMotion>
        <div className="mx-auto max-w-md">
          <LoginFlow />
        </div>
      </AuthLaunchMotion>
    </section>
  );
}
