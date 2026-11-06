export type PrinterPort = {
  open(options: {baudRate: number}): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array> | null;
};

export function rememberedPrinter<T>(ports: T[], enabled: boolean): T | undefined {
  return enabled && ports.length === 1 ? ports[0] : undefined;
}

export async function sendPrinterData(
  port: PrinterPort, packets: Iterable<Uint8Array>,
  onWrite: () => void,
  pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
) {
  let opened = false;
  let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
  try {
    await port.open({baudRate: 9600});
    opened = true;
    if (!port.writable) throw new Error('Принтер недоступен');
    writer = port.writable.getWriter();
    for (const packet of packets) {
      for (let offset = 0; offset < packet.length; offset += 256) {
        // Small paced writes avoid overflowing portable printer receive buffers.
        onWrite();
        await writer.write(packet.slice(offset, offset + 256));
        await pause(40);
      }
    }
    await writer.close();
    await pause(300);
  } finally {
    writer?.releaseLock();
    if (opened) await port.close().catch(() => {});
  }
}
