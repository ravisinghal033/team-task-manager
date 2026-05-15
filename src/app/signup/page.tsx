"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardDescription, CardTitle } from "@/components/Card";
import { Button, Input, SelectField } from "@/components/FormControls";
import { apiFetch } from "@/lib/client-fetch";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceIntent, setWorkspaceIntent] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (!cancelled && res.ok) router.replace("/dashboard");
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        details?: Record<string, string[]>;
      };
      if (!res.ok) {
        setError(data.error || "Signup failed");
        setFieldErrors(data.details ?? null);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <AuthLayout>
        <Card>
          <CardTitle>Checking session…</CardTitle>
          <CardDescription>Please wait.</CardDescription>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Use a unique email and a password of at least 8 characters. You are signed in
          automatically after signup.
        </CardDescription>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <Input
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors?.name?.[0]}
            required
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors?.email?.[0]}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors?.password?.[0]}
            required
          />
          <SelectField
            label="How will you use this workspace?"
            value={workspaceIntent}
            onChange={(e) => setWorkspaceIntent(e.target.value)}
          >
            <option value="admin">Project Admin</option>
            <option value="member">Team Member</option>
          </SelectField>
          <p className="text-xs leading-relaxed text-slate-500">
            You become a project admin when you create a project. Team roles are managed per
            project.
          </p>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
