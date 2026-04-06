export const Colors = {
  bg: "#0a0e17",
  surface: "#111827",
  surface2: "#1a2235",
  surface3: "#222d42",
  border: "#2a3550",
  text: "#e8edf5",
  text2: "#8896b0",
  text3: "#5a6a85",
  green: "#34d399",
  greenBg: "rgba(52,211,153,0.1)",
  red: "#f87171",
  redBg: "rgba(248,113,113,0.1)",
  blue: "#60a5fa",
  blueBg: "rgba(96,165,250,0.1)",
  amber: "#fbbf24",
  amberBg: "rgba(251,191,36,0.1)",
  purple: "#a78bfa",
  purpleBg: "rgba(167,139,250,0.1)",
};

export const Fonts = {
  regular: { fontSize: 14, color: Colors.text },
  small: { fontSize: 12, color: Colors.text2 },
  tiny: { fontSize: 11, color: Colors.text3 },
  heading: { fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  mono: { fontVariant: ["tabular-nums" as const] },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
};
