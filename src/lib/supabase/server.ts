import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** 사용자 JWT 를 쿠키에서 읽는 서버 클라이언트. anon key 만 사용하므로 RLS 가 항상 적용됩니다. */
export async function createSupabaseServerClient() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Server Component 에서 호출된 경우 무시 (쿠키 갱신은 Server Action/Route Handler 에서 수행)
        }
      },
    },
  });
}
