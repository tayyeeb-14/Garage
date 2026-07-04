export const formatCurrency = (value: number | null | undefined): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    currencyDisplay: 'symbol',
  }).format(value ?? 0).replace(/\.00$/, '');
};
