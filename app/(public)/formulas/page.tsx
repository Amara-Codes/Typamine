import { getAllFormulas } from "@/lib/services/formula";
import { getVirtualFormulas } from "@/lib/services/virtualFormula";
import FormulasClient from "./FormulasClient";

export const dynamic = "force-dynamic";

export default async function FormulasPage() {
  const [realFormulas, virtualFormulas] = await Promise.all([
    getAllFormulas(),
    getVirtualFormulas(),
  ]);

  // Le collezioni curate a mano in admin vengono prima, e ricevono il badge
  // "Typamine Selection" in FormulaCard — quelle generate dalle regole
  // programmatiche (lib/services/virtualFormula.ts) seguono subito dopo.
  const items = [
    ...realFormulas.map((formula) => ({ formula, isCurated: true })),
    ...virtualFormulas.map((formula) => ({ formula, isCurated: false })),
  ];

  return <FormulasClient items={items} />;
}
