/** Invoervalidatie met zod. Onbekende velden worden geweigerd. */
import { z, type ZodTypeAny, type infer as ZodInfer } from 'zod';
import { fout } from './fout.ts';

export { z };

/** Valideert en geeft het getypeerde resultaat, of gooit een leesbare fout. */
export function valideer<S extends ZodTypeAny>(schema: S, waarde: unknown): ZodInfer<S> {
  const uitkomst = schema.safeParse(waarde);
  if (!uitkomst.success) {
    throw fout.validatie(
      uitkomst.error.issues.map((issue) => ({
        veld: issue.path.join('.') || '(hoofdniveau)',
        probleem: issue.message,
      })),
    );
  }
  return uitkomst.data;
}

/** Een bedrag als decimale tekst: "1210.00". Nooit een getal, zie ADR-006. */
export const bedragSchema = z
  .string()
  .regex(/^-?\d{1,15}([.,]\d{1,2})?$/, 'Vul een bedrag in, bijvoorbeeld 1210,00')
  .transform((waarde) => waarde.replace(',', '.'));

/** Een aantal met maximaal zes decimalen. */
export const aantalSchema = z
  .string()
  .regex(/^-?\d{1,12}([.,]\d{1,6})?$/, 'Vul een aantal in, bijvoorbeeld 2,5')
  .transform((waarde) => waarde.replace(',', '.'));

export const datumSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik het formaat jjjj-mm-dd')
  .refine((waarde) => !Number.isNaN(Date.parse(waarde)), 'Dit is geen bestaande datum');

export const uuidSchema = z.string().uuid('Dit is geen geldige verwijzing');

export const valutaSchema = z
  .string()
  .length(3)
  .transform((waarde) => waarde.toUpperCase());

export const paginatieSchema = z.object({
  limiet: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});
