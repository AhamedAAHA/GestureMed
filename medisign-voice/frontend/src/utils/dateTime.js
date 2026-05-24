const sriLankaFormatter = new Intl.DateTimeFormat('en-LK', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Colombo',
});

export function formatSriLankaDateTime(value) {
  if (!value) return '';
  return `${sriLankaFormatter.format(new Date(value))} SLST`;
}
