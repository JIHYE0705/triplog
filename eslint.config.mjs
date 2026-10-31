import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// shortcut: 플러그인의 ESLint 10 peer 지원 전까지 9 사용, 지원 시 유지보수 버전으로 갱신.
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "out/**", "output/**", "next-env.d.ts"]),
]);
