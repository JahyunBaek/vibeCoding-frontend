import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_PROXY_TARGET || "http://localhost:8888";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          // 백엔드 Set-Cookie를 프론트 오리진에 맞게 재작성 (개발용 프록시 전용).
          // HttpOnly는 건드리지 않음. Secure만 제거 → 로컬은 http라 Secure 쿠키가 저장되지 않기 때문.
          // 운영(HTTPS)에서는 이 프록시를 쓰지 않으므로 백엔드의 Secure+HttpOnly가 그대로 적용됨.
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes, req, res) => {
              const setCookie = proxyRes.headers["set-cookie"];
              if (!setCookie) return;
              proxyRes.headers["set-cookie"] = (Array.isArray(setCookie) ? setCookie : [setCookie]).map(
                (cookie: string) =>
                  cookie
            //        .replace(/;\s*Domain=[^;]+/gi, "") // Domain 제거 → 현재 호스트(localhost:5173)에 저장
            //        .replace(/;\s*Path=[^;]+/gi, "; Path=/") // Path를 /로 통일해 모든 /api 요청에 전송
            //        .replace(/;\s*Secure/gi, "") // 개발: http 로컬에서 쿠키 저장 가능하도록 (운영은 HTTPS라 미적용)
              );
            });
          }
        }
      }
    }
  };
});
