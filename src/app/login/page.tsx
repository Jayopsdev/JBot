import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden flex-col justify-between bg-slate-950 px-12 py-10 text-slate-100 lg:flex">
        <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
        <div className="max-w-md">
          <p className="text-3xl font-semibold tracking-tight">
            {APP_TAGLINE} in one local workspace.
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Sign in as an agent, pick up a live conversation, and keep CRM and
            ticketing connected from a single SQLite database.
          </p>
        </div>
        <p className="text-xs text-slate-500">Interview demo · No cloud database required</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <LoginForm />
      </div>
    </div>
  );
}
