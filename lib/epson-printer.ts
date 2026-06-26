// lib/epson-printer.ts
// Epson PLQ-35 (ESC/P2) WebUSB printer driver
// Direct USB printing from browser — no server needed

/* eslint-disable @typescript-eslint/no-explicit-any */
// WebUSB API types — not in default TS lib, declared inline
interface USBDevice {
  vendorId: number; productId: number;
  productName: string | null; serialNumber: string | null;
  configuration: any; configurations: any[];
  opened: boolean;
  open(): Promise<void>; close(): Promise<void>;
  selectConfiguration(v: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  releaseInterface(n: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<any>;
  transferIn(endpointNumber: number, length: number): Promise<any>;
}
declare const navigator: Navigator & { usb?: { getDevices(): Promise<USBDevice[]>; requestDevice(o?: any): Promise<USBDevice> } };

// Epson ESC/P2 commands
const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  INIT: [ESC, 0x40],                    // @ — Initialize printer
  LF: [0x0a],                           // Line feed
  CUT: [GS, 0x56, 0x00],              // Full cut
  PARTIAL_CUT: [GS, 0x56, 0x01],      // Partial cut
  BOLD_ON: [ESC, 0x45, 0x01],         // Bold on
  BOLD_OFF: [ESC, 0x45, 0x00],        // Bold off
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],// Double height
  DOUBLE_HEIGHT_OFF: [ESC, 0x21, 0x00],// Normal height
  CENTER: [ESC, 0x61, 0x01],          // Center alignment
  LEFT: [ESC, 0x61, 0x00],            // Left alignment
  RIGHT: [ESC, 0x61, 0x02],           // Right alignment
  FEED_LINES: (n: number) => [ESC, 0x64, n],  // Feed n lines
  SET_FONT_A: [ESC, 0x4d, 0x00],      // Font A (12x24)
  SET_FONT_B: [ESC, 0x4d, 0x01],      // Font B (9x17)
  SET_FONT_C: [ESC, 0x4d, 0x02],      // Font C (9x17)
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
};

// Epson Vendor ID
const EPSON_VENDOR_ID = 0x04b8; // Seiko Epson

// PLQ-35 Product IDs (multiple variants)
const PLQ35_PRODUCT_IDS = [
  0x0202, // PLQ-35
  0x0203, // PLQ-35 SC
  0x0204, // PLQ-35S
  0x0205, // PLQ-35M
];

export interface PrinterStatus {
  connected: boolean;
  deviceName: string;
  printWidth: number;
}

class EpsonPrinter {
  private device: USBDevice | null = null;
  private endpointOut: number | null = null;
  private endpointIn: number | null = null;

  /** Check if WebUSB is available */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.usb;
  }

  /** Connect to Epson PLQ-35 */
  async connect(): Promise<PrinterStatus> {
    if (!navigator.usb) {
      throw new Error('WebUSB tidak didukung di browser ini. Gunakan Chrome/Edge.');
    }

    // Try to get previously authorized device first
    const devices = await navigator.usb.getDevices();
    let device = devices.find(d =>
      d.vendorId === EPSON_VENDOR_ID &&
      PLQ35_PRODUCT_IDS.includes(d.productId)
    );

    // If not found, request user to select
    if (!device) {
      try {
        device = await navigator.usb.requestDevice({
          filters: [
            { vendorId: EPSON_VENDOR_ID },
          ],
        });
      } catch {
        throw new Error('Tidak ada printer yang dipilih. Pastikan printer terhubung via USB.');
      }
    }

    if (!device) {
      throw new Error('Printer tidak ditemukan.');
    }

    await device.open();

    // Select configuration
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Find endpoints
    const iface = device.configuration.interfaces[0];
    if (!iface) {
      throw new Error('Interface printer tidak ditemukan.');
    }

    for (const ep of iface.alternate.endpoints) {
      if (ep.direction === 'out') {
        this.endpointOut = ep.endpointNumber;
      } else if (ep.direction === 'in') {
        this.endpointIn = ep.endpointNumber;
      }
    }

    if (this.endpointOut === null) {
      throw new Error('Endpoint output tidak ditemukan.');
    }

    // Claim interface
    await device.claimInterface(0);

    this.device = device;

    // Save device info for reconnect
    try {
      localStorage.setItem('zgold_printer_id', device.serialNumber || device.productName);
    } catch {}

    return {
      connected: true,
      deviceName: device.productName || 'Epson PLQ-35',
      printWidth: 80, // 80 columns
    };
  }

  /** Auto-reconnect from saved device */
  async autoConnect(): Promise<PrinterStatus | null> {
    if (!navigator.usb) return null;
    try {
      return await this.connect();
    } catch {
      return null;
    }
  }

  /** Disconnect */
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.releaseInterface(0);
        await this.device.close();
      } catch {}
      this.device = null;
      this.endpointOut = null;
      this.endpointIn = null;
    }
  }

  /** Check if connected */
  isConnected(): boolean {
    return this.device !== null && this.device.opened;
  }

  /** Get status */
  getStatus(): PrinterStatus {
    return {
      connected: this.isConnected(),
      deviceName: this.device?.productName || 'Epson PLQ-35',
      printWidth: 80,
    };
  }

  /** Send raw bytes to printer */
  private async send(data: Uint8Array): Promise<void> {
    if (!this.device || !this.endpointOut) {
      throw new Error('Printer tidak terhubung.');
    }
    await this.device.transferOut(this.endpointOut, data);
  }

  /** Send text line */
  private async sendLine(text: string, align?: 'left' | 'center' | 'right'): Promise<void> {
    if (align) {
      const alignCmd = align === 'center' ? CMD.CENTER : align === 'right' ? CMD.RIGHT : CMD.LEFT;
      await this.send(new Uint8Array(alignCmd));
    }
    // Encode text as bytes (Latin-1 compatible for Indonesian)
    const bytes = new TextEncoder().encode(text + '\n');
    await this.send(bytes);
  }

  /** Print receipt — main method */
  async printReceipt(opts: {
    namaToko: string;
    alamat?: string;
    telepon?: string;
    noTransaksi: string;
    tanggal: string;
    namaKasir: string;
    items: { nama: string; jumlah: number; harga: number }[];
    subtotal: number;
    diskon: number;
    total: number;
    bayar: number;
    kembalian: number;
   _footer?: string[];
  }): Promise<void> {
    const p = this;

    // Initialize
    await p.send(new Uint8Array(CMD.INIT));
    await p.send(new Uint8Array(CMD.SET_FONT_A));

    // --- Header ---
    await p.send(new Uint8Array(CMD.BOLD_ON));
    await p.send(new Uint8Array(CMD.DOUBLE_HEIGHT_ON));
    await p.sendLine(opts.namaToko, 'center');
    await p.send(new Uint8Array(CMD.DOUBLE_HEIGHT_OFF));
    await p.send(new Uint8Array(CMD.BOLD_OFF));

    if (opts.alamat) await p.sendLine(opts.alamat, 'center');
    if (opts.telepon) await p.sendLine(`Telp: ${opts.telepon}`, 'center');
    await p.sendLine('══════════════════════════', 'center');
    await p.send(new Uint8Array(CMD.LF));

    // --- Info Transaksi ---
    await p.sendLine(`No: ${opts.noTransaksi}`);
    await p.sendLine(`Tanggal: ${opts.tanggal}`);
    await p.sendLine(`Kasir: ${opts.namaKasir}`);
    await p.send(new Uint8Array(CMD.LF));
    await p.sendLine('──────────────────────────');
    await p.send(new Uint8Array(CMD.LF));

    // --- Items ---
    for (const item of opts.items) {
      await p.sendLine(`${item.nama} x${item.jumlah}`);
      await p.sendLine(`  ${formatIDR(item.harga)}`, 'right');
    }
    await p.send(new Uint8Array(CMD.LF));
    await p.sendLine('──────────────────────────');
    await p.send(new Uint8Array(CMD.LF));

    // --- Totals ---
    await p.sendLine(`Subtotal:  ${formatIDR(opts.subtotal)}`);
    if (opts.diskon > 0) {
      await p.sendLine(`Diskon:    -${formatIDR(opts.diskon)}`);
    }

    await p.send(new Uint8Array(CMD.BOLD_ON));
    await p.sendLine(`TOTAL:     ${formatIDR(opts.total)}`);
    await p.send(new Uint8Array(CMD.BOLD_OFF));
    await p.send(new Uint8Array(CMD.LF));

    await p.sendLine(`Bayar:     ${formatIDR(opts.bayar)}`);
    await p.sendLine(`Kembalian: ${formatIDR(opts.kembalian)}`);
    await p.send(new Uint8Array(CMD.LF));

    // --- Footer ---
    await p.sendLine('──────────────────────────');
    await p.send(new Uint8Array(CMD.LF));

    if (opts._footer) {
      for (const line of opts._footer) {
        await p.sendLine(line, 'center');
      }
    } else {
      await p.sendLine('Terima kasih atas kunjungan', 'center');
      await p.sendLine('Barang yang sudah dibeli', 'center');
      await p.sendLine('tidak dapat dikembalikan', 'center');
    }

    await p.sendLine('══════════════════════════', 'center');
    await p.send(new Uint8Array(CMD.LF));
    await p.send(new Uint8Array(CMD.LF));
    await p.send(new Uint8Array(CMD.LF));

    // --- Cut paper ---
    await p.send(new Uint8Array(CMD.CUT));
  }

  /** Print raw text (simple mode) */
  async printText(text: string): Promise<void> {
    await this.send(new Uint8Array(CMD.INIT));
    const bytes = new TextEncoder().encode(text);
    await this.send(bytes);
    await this.send(new Uint8Array(CMD.LF));
    await this.send(new Uint8Array(CMD.LF));
    await this.send(new Uint8Array(CMD.CUT));
  }
}

function formatIDR(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

// Singleton
export const epsonPrinter = new EpsonPrinter();
