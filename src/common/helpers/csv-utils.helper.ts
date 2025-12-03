export class CsvUtils {
  /**
   * Format a value for CSV output with proper escaping
   * @param value Any value to convert to CSV cell
   * @param sanitizeLeading Whether to sanitize leading characters that could be interpreted as formulas
   * @returns Properly formatted and escaped CSV cell value
   */
  static csvCell(value: any, sanitizeLeading = false): string {
    if (value === null || value === undefined) return '""';
    let s = String(value);

    // Neutralize CSV injection for Excel (leading = + - @)
    if (sanitizeLeading && /^[=+\-@]/.test(s)) s = "'" + s;

    // Escape double quotes by doubling them; quote all fields consistently
    if (s.includes('"')) s = s.replace(/"/g, '""');
    return `"${s}"`;
  }

  /**
   * Format date as ISO string
   * @param val Date value (Date object or date string)
   * @returns ISO formatted date string or empty string
   */
  static formatIso(val: any): string {
    if (!val) return '';
    const d = typeof val === 'string' ? new Date(val) : val;
    return d.toISOString();
  }
}
