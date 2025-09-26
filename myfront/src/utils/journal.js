// src/utils/journal.js
export const DEFAULT_CHART = {
  expense: "601",      // Achats
  vat_deductible: "44562", // Adapte si SYSCOHADA (ex: "3455" selon ton plan)
  supplier: "401",     // Fournisseurs
  bank: "512",         // Banques
  cash: "571",         // Caisse
  card: "512",         // Cartes (ou subdivise si besoin)
};

export function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function generateJournalFromPurchases(purchases = [], chart = DEFAULT_CHART) {
  const entries = [];
  purchases.forEach((p, idx) => {
    const ht = money(p.ht);
    const tva = money(p.tva);
    const ttc = money(p.ttc);

    const debitExpense = { compte: chart.expense, label: `Achat - ${p.fournisseur}`, debit: ht, credit: 0 };
    const debitVAT = tva > 0 ? { compte: chart.vat_deductible, label: "TVA déductible", debit: tva, credit: 0 } : null;

    const isPayee = p.statut === "payee";
    const isPartielle = p.statut === "partielle";

    const creditLines = [];
    if (isPayee) {
      const tresor =
        p.mode === "espece" ? chart.cash :
        p.mode === "carte" ? chart.card : chart.bank;
      creditLines.push({ compte: tresor, label: `Règlement ${p.mode}`, debit: 0, credit: ttc });
    } else if (isPartielle && p.partiel && p.partiel > 0 && p.partiel < ttc) {
      const regle = money(p.partiel);
      const solde = money(ttc - regle);
      const tresor =
        p.mode === "espece" ? chart.cash :
        p.mode === "carte" ? chart.card : chart.bank;

      creditLines.push(
        { compte: tresor, label: "Règlement partiel", debit: 0, credit: regle },
        { compte: chart.supplier, label: `Fournisseur ${p.fournisseur}`, debit: 0, credit: solde },
      );
    } else {
      creditLines.push({ compte: chart.supplier, label: `Fournisseur ${p.fournisseur}`, debit: 0, credit: ttc });
    }

    const lines = [debitExpense, ...(debitVAT ? [debitVAT] : []), ...creditLines];
    const totalDebit = lines.reduce((s, l) => s + money(l.debit), 0);
    const totalCredit = lines.reduce((s, l) => s + money(l.credit), 0);

    entries.push({
      id: p.id ?? idx + 1,
      date: p.date,
      ref: p.ref,
      libelle: `Achat ${p.ref} - ${p.fournisseur}`,
      status: p.statut,
      lines,
      totalDebit,
      totalCredit,
      equilibre: Math.abs(totalDebit - totalCredit) < 0.01,
      meta: { fournisseur: p.fournisseur, mode: p.mode, echeance: p.echeance },
    });
  });
  return entries;
}
