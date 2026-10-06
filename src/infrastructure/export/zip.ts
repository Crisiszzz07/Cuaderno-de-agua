/** Minimal ZIP STORE writer: local static exports, UTF-8 names, no compression. */
const encoder = new TextEncoder();
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
export function createZip(files: readonly { name: string; text: string }[]): Uint8Array {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const body = encoder.encode(file.text);
    const checksum = crc32(body);
    const entry = new Uint8Array(30 + name.length);
    const view = new DataView(entry.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(12, 0x0021, true); // Fixed valid DOS date: 1980-01-01.
    view.setUint32(14, checksum, true);
    view.setUint32(18, body.length, true);
    view.setUint32(22, body.length, true);
    view.setUint16(26, name.length, true);
    entry.set(name, 30);
    local.push(entry, body);
    const record = new Uint8Array(46 + name.length);
    const directory = new DataView(record.buffer);
    directory.setUint32(0, 0x02014b50, true);
    directory.setUint16(4, 20, true);
    directory.setUint16(6, 20, true);
    directory.setUint16(8, 0x0800, true);
    directory.setUint16(14, 0x0021, true);
    directory.setUint32(16, checksum, true);
    directory.setUint32(20, body.length, true);
    directory.setUint32(24, body.length, true);
    directory.setUint16(28, name.length, true);
    directory.setUint32(42, offset, true);
    record.set(name, 46);
    central.push(record);
    offset += entry.length + body.length;
  }
  const directory = concatenate(central);
  const end = new Uint8Array(22);
  const footer = new DataView(end.buffer);
  footer.setUint32(0, 0x06054b50, true);
  footer.setUint16(8, files.length, true);
  footer.setUint16(10, files.length, true);
  footer.setUint32(12, directory.length, true);
  footer.setUint32(16, offset, true);
  return concatenate([...local, directory, end]);
}
