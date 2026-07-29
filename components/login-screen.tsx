"use client"

import { useState, type FormEvent } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Database, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { siteConfig } from "@/lib/site-config"

type LoginScreenProps = {
  client: SupabaseClient | null
  configured: boolean
}

export function LoginScreen({ client, configured }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!client) return
    setSubmitting(true)
    setErrorMessage("")
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMessage("メールアドレスまたはパスワードを確認してください。")
    }
    setSubmitting(false)
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/35 p-4">
      <section className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Database className="size-5" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.16em] text-muted-foreground">
              {siteConfig.universityName}
            </div>
            <h1 className="text-xl font-semibold">{siteConfig.appName}</h1>
          </div>
        </div>

        {configured ? (
          <form className="mt-7 grid gap-4" onSubmit={login}>
            <div>
              <h2 className="text-lg font-semibold">運営メンバーとしてログイン</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                ログインしたメンバーは、同じ運営データを編集できます。
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-email">メールアドレス</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-password">パスワード</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {errorMessage ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              <LogIn className="size-4" />
              {submitting ? "ログイン中…" : "ログイン"}
            </Button>
          </form>
        ) : (
          <div className="mt-7 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <h2 className="font-semibold">Supabaseの接続設定が必要です</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              無料枠のSupabaseプロジェクトでSQLマイグレーションを実行し、次の環境変数を設定してください。
            </p>
            <code className="mt-3 block overflow-x-auto rounded-lg bg-background p-3 text-xs leading-6">
              NEXT_PUBLIC_SUPABASE_URL
              <br />
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>
          </div>
        )}
      </section>
    </main>
  )
}
