// Regenerates public/join-qr.svg, the QR code on the "Join the class" slide and the poll badge.
// The address never changes, so this only needs running if the domain does.
import { writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

const svg = await QRCode.toString('https://clearviewsunday.school', {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#000000', light: '#FFFFFF' },
});
writeFileSync(new URL('../public/join-qr.svg', import.meta.url), svg);
console.log('Wrote public/join-qr.svg');
