const rialFormatter = new Intl.NumberFormat("fa-IR");
const numberFormatter = new Intl.NumberFormat("fa-IR");

export const formatRial = (value: number) => `${rialFormatter.format(value)} ریال`;

export const formatNumber = (value: number) => numberFormatter.format(value);

export const todayFa = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());
