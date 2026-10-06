declare module 'qrcode' {
  interface QrSymbol { modules: { size: number; data: Uint8Array } }
  const QRCode: { create(text: string, options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }): QrSymbol };
  export default QRCode;
}
