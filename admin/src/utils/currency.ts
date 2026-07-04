export const formatCurrency = (value: number | null | undefined): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    currencyDisplay: 'symbol',
  });

  return formatter.format(value ?? 0).replace(/\.00$/, '');
};
