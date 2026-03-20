/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem"
      },
      /**
       * 시멘틱 컬러 토큰 — CSS 변수와 연결됩니다.
       * 하드코딩(bg-white, text-slate-900 등) 대신 아래 클래스를 사용하세요.
       *
       *  배경    bg-background  /  bg-surface  /  bg-muted  /  bg-accent
       *  텍스트  text-foreground  /  text-muted-fg
       *  테두리  border-base
       */
      colors: {
        background:  "rgb(var(--background) / <alpha-value>)",
        surface:     "rgb(var(--surface)    / <alpha-value>)",
        muted:       "rgb(var(--muted)      / <alpha-value>)",
        accent:      "rgb(var(--accent)     / <alpha-value>)",
        foreground:  "rgb(var(--foreground) / <alpha-value>)",
        "muted-fg":  "rgb(var(--muted-foreground) / <alpha-value>)",
        base:        "rgb(var(--border)     / <alpha-value>)",
      },
    }
  },
  plugins: []
};
