"use client";

import { createContext, startTransition, useActionState, useContext, type ReactNode } from "react";
import type { FormState } from "@/app/actions";
import { btn, inputCls } from "./ui";

const ErrCtx = createContext<Record<string, string>>({});
const PendingCtx = createContext(false);

export function ActionForm({
  action, children, className, successText,
}: { action: (s: FormState, fd: FormData) => Promise<FormState>; children: ReactNode; className?: string; successText?: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    // action 속성 대신 onSubmit 을 쓰는 이유: React 19 는 action 완료 후 폼을 초기화해서, 검증 오류 시 입력값이 사라지기 때문
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className={className}
      noValidate
    >
      <PendingCtx.Provider value={pending}>
        <ErrCtx.Provider value={state?.fieldErrors ?? {}}>{children}</ErrCtx.Provider>
      </PendingCtx.Provider>
      <div aria-live="polite" className="mt-3 text-sm">
        {state && !state.ok && <p role="alert" className="text-bad">{state.message}</p>}
        {state?.ok && (state.message || successText) && <p className="text-good">{state.message || successText}</p>}
      </div>
    </form>
  );
}

export function Submit({ children, variant = "primary", pending: pendingText = "처리 중…" }: { children: ReactNode; variant?: keyof typeof btn; pending?: string }) {
  const pending = useContext(PendingCtx);
  return (
    <button type="submit" disabled={pending} className={btn[variant]}>
      {pending ? pendingText : children}
    </button>
  );
}

export function Field({
  name, label, hint, children, required,
}: { name: string; label: string; hint?: string; required?: boolean; children?: (p: { id: string; "aria-invalid": boolean; "aria-describedby": string }) => ReactNode }) {
  const err = useContext(ErrCtx)[name];
  const id = `f-${name}`;
  const describedBy = `${id}-msg`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-bad" aria-hidden>*</span>}
      </label>
      {children?.({ id, "aria-invalid": !!err, "aria-describedby": describedBy })}
      <p id={describedBy} className={`text-sm ${err ? "text-bad" : "text-muted"}`}>
        {err || hint}
      </p>
    </div>
  );
}

export function TextInput({ name, label, hint, required, type = "text", defaultValue, placeholder, autoComplete }: {
  name: string; label: string; hint?: string; required?: boolean; type?: string; defaultValue?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {(p) => <input {...p} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} autoComplete={autoComplete} className={inputCls} />}
    </Field>
  );
}

export function TextArea({ name, label, hint, rows = 4, defaultValue, required }: { name: string; label: string; hint?: string; rows?: number; defaultValue?: string; required?: boolean }) {
  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {(p) => <textarea {...p} name={name} rows={rows} defaultValue={defaultValue} className={inputCls} />}
    </Field>
  );
}

export function FieldError({ name }: { name: string }) {
  const err = useContext(ErrCtx)[name];
  return err ? <p className="text-sm text-bad">{err}</p> : null;
}
