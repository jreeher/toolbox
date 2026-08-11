"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

function LoginForm() {
  const [state, formAction] = useFormState(signInAction, initialState);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reason") === "auth") {
      toast("Sign in to continue");
    }
  }, [searchParams]);

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="font-heading text-4xl text-toolbox-red mb-6">Sign In</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="text-off-white text-sm mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-toolbox-red underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
