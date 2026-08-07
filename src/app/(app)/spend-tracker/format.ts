const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatGBP(amount: number) {
  return formatter.format(amount);
}
