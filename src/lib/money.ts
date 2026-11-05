const formatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const money = (value: number) => formatter.format(value) + ' с.';
