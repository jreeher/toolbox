"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Signing up..." : "Sign Up"}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signUpAction, initialState);

  if (state.checkEmail) {
    return (
      <div className="max-w-sm mx-auto p-8">
        <h1 className="font-heading text-4xl text-toolbox-red mb-4">Check Your Email</h1>
        <p className="text-off-white text-sm">
          We sent a confirmation link to your email. Click it to activate your account,
          then come back and sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="font-heading text-4xl text-toolbox-red mb-6">Sign Up</h1>
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
          minLength={6}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          minLength={6}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="text-off-white text-sm mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-toolbox-red underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
