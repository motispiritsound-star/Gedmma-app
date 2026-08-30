/**
 * Fouten uit de rekenkern. Elke fout heeft een stabiele code die de API
 * doorgeeft, en een Nederlandse uitleg die een gebruiker kan begrijpen.
 */
export type BoekhoudFoutCode =
  | 'entry_not_balanced'
  | 'entry_too_few_lines'
  | 'line_debit_and_credit'
  | 'line_no_amount'
  | 'line_negative_amount'
  | 'mixed_currencies'
  | 'invalid_exchange_rate'
  | 'tax_code_not_valid_on_date'
  | 'tax_base_missing'
  | 'unknown_account'
  | 'account_blocked'
  | 'period_closed'
  | 'date_outside_period'
  | 'invoice_requirements_missing';

export class BoekhoudFout extends Error {
  readonly code: BoekhoudFoutCode;
  readonly hint: string;
  readonly details: Record<string, unknown>;

  constructor(code: BoekhoudFoutCode, message: string, hint = '', details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'BoekhoudFout';
    this.code = code;
    this.hint = hint;
    this.details = details;
  }
}
