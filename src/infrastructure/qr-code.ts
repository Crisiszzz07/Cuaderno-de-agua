import QRCode from 'qrcode';

export function createQrPath(url: string) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const margin = 4;
  const commands: string[] = [];
  for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
    if (qr.modules.data[row * size + column]) commands.push(`M${column + margin} ${row + margin}h1v1h-1z`);
  }
  return { path: commands.join(''), size: size + margin * 2 };
}
