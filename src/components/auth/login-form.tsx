"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Headset, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/constants";
import { APP_NAME } from "@/lib/brand";
import { getDatabase, setCurrentAgentId } from "@/lib/local-db/store";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const demo = DEMO_ACCOUNTS[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json()) as {
        error?: string;
        user?: { id: string };
      };

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to sign in");
        return;
      }

      if (payload.user?.id) {
        setCurrentAgentId(payload.user.id);
      }
      getDatabase();
      toast.success("Welcome back");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Headset className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in to {APP_NAME}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Agent workspace for live chat, tickets, and customer records.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10"
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10"
          />
        </div>
        {fieldError ? <p className="text-sm text-rose-600">{fieldError}</p> : null}
        <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      <div className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/80">Demo agent</p>
        <p className="mt-1 font-mono">{demo.email}</p>
        <p className="mt-0.5">
          Password: <span className="font-mono">{DEMO_PASSWORD}</span>
        </p>
        <button
          type="button"
          className="mt-2 text-indigo-600 hover:underline"
          onClick={() => {
            setEmail(demo.email);
            setPassword(DEMO_PASSWORD);
          }}
        >
          Fill demo credentials
        </button>
      </div>
    </div>
  );
}
