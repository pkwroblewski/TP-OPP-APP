# Luxembourg GAAP Balance Sheet (Bilan) - Line Item Reference

## Structure Overview
Luxembourg balance sheets follow standardized formats per the Company Law. Assets and liabilities must be presented in specific categories.

## ASSETS (ACTIF)

### A. SUBSCRIBED CAPITAL UNPAID (CAPITAL SOUSCRIT NON VERSÉ)
- French: "Capital souscrit non versé"
- Shows capital called but not yet paid by shareholders
- Rare in practice

### B. FORMATION EXPENSES (FRAIS D'ÉTABLISSEMENT)
- French: "Frais d'établissement"
- Start-up and organization costs
- Amortized over max 5 years

### C. FIXED ASSETS (ACTIF IMMOBILISÉ)

#### I. Intangible Assets (Immobilisations incorporelles)
1. Development costs - "Frais de développement"
2. Concessions, patents, licenses, trademarks - "Concessions, brevets, licences, marques"
3. Goodwill - "Fonds de commerce"
4. Payments on account and intangible assets in course - "Acomptes versés et immobilisations incorporelles en cours"

#### II. Tangible Assets (Immobilisations corporelles)
1. Land and buildings - "Terrains et constructions"
2. Plant and machinery - "Installations techniques et machines"
3. Other fixtures, tools and equipment - "Autres installations, outillage et mobilier"
4. Payments on account and tangible assets in course - "Acomptes versés et immobilisations corporelles en cours"

#### III. Financial Assets (Immobilisations financières)
1. **Shares in affiliated undertakings** - "Parts dans des entreprises liées"
2. **Amounts owed by affiliated undertakings** - "Créances sur des entreprises liées"
   - Often IC loans/financing
   - May have subordination mentioned in notes
3. Participating interests - "Participations"
4. Amounts owed by undertakings with participating interest - "Créances sur des entreprises avec lesquelles il existe un lien de participation"
5. Securities held as fixed assets - "Titres ayant le caractère d'immobilisations"
6. Other loans - "Autres prêts"

### D. CURRENT ASSETS (ACTIF CIRCULANT)

#### I. Stocks (Stocks)
1. Raw materials and consumables - "Matières premières et consommables"
2. Work in progress - "En-cours de production"
3. Finished goods and goods for resale - "Produits finis et marchandises"
4. Payments on account - "Acomptes versés"

#### II. Debtors (Créances)
**Becoming due and payable within one year:**
1. Trade debtors - "Créances commerciales"
2. **Amounts owed by affiliated undertakings** - "Créances sur entreprises liées"
3. Amounts owed by undertakings with participating interest - "Créances sur des entreprises avec lesquelles il existe un lien de participation"
4. Other debtors - "Autres créances"

**Becoming due and payable after more than one year:**
(Same categories as above, split by maturity)

#### III. Investments (Valeurs mobilières)
1. Shares in affiliated undertakings - "Parts dans des entreprises liées"
2. Own shares - "Parts propres"
3. Other investments - "Autres valeurs mobilières"

#### IV. Cash at bank and in hand (Avoirs en banques, avoirs en CCP, chèques et en caisse)

### E. PREPAYMENTS (COMPTES DE RÉGULARISATION)
- French: "Comptes de régularisation"
- Prepaid expenses, deferred charges

### F. LOSS FOR THE FINANCIAL YEAR (PERTE DE L'EXERCICE)
- Only if net loss position

---

## LIABILITIES (PASSIF)

### A. CAPITAL AND RESERVES (CAPITAUX PROPRES)

#### I. Subscribed Capital (Capital souscrit)
- French: "Capital souscrit"

#### II. Share Premium (Prime d'émission)
- French: "Prime d'émission"

#### III. Revaluation Reserve (Réserve de réévaluation)
- French: "Réserve de réévaluation"

#### IV. Reserves (Réserves)
1. Legal reserve - "Réserve légale" (min 10% of capital)
2. Reserve for own shares - "Réserve pour parts propres"
3. Reserves provided for by articles of association - "Réserves statutaires"
4. Other reserves - "Autres réserves"

#### V. Profit or Loss Brought Forward (Résultats reportés)
- French: "Résultats reportés"
- Can be positive or negative

#### VI. Profit or Loss for the Financial Year (Résultat de l'exercice)
- French: "Résultat de l'exercice"

### B. PROVISIONS (PROVISIONS)
1. Provisions for pensions - "Provisions pour pensions"
2. Provisions for taxation - "Provisions pour impôts"
3. Other provisions - "Autres provisions"

### C. CREDITORS (DETTES)

**Becoming due and payable within one year:**
1. Debenture loans - "Emprunts obligataires"
2. Amounts owed to credit institutions - "Dettes envers des établissements de crédit"
3. Payments received on account of orders - "Acomptes reçus sur commandes"
4. Trade creditors - "Dettes commerciales"
5. **Amounts owed to affiliated undertakings** - "Dettes envers des entreprises liées"
   - **KEY IC ITEM**: Often IC loans received
6. Amounts owed to undertakings with participating interest - "Dettes envers des entreprises avec lesquelles il existe un lien de participation"
7. Tax authorities - "Dettes fiscales"
8. Social security authorities - "Dettes au titre de la sécurité sociale"
9. Other creditors - "Autres dettes"

**Becoming due and payable after more than one year:**
(Same categories as above, split by maturity)

### D. DEFERRED INCOME (COMPTES DE RÉGULARISATION)
- French: "Comptes de régularisation"
- Deferred income, accrued charges

---

## KEY INTER-COMPANY INDICATORS

### Balance Sheet IC Items:
1. **Assets - Fixed Assets - Financial Assets:**
   - "Créances sur des entreprises liées" = Amounts owed by affiliated undertakings (often IC loans given)

2. **Assets - Current Assets - Debtors:**
   - "Créances sur entreprises liées" = Trade or other amounts owed by group companies

3. **Liabilities - Creditors:**
   - "Dettes envers des entreprises liées" = Amounts owed to affiliated undertakings (often IC loans received)

### Important Notes:
- **Subordination**: IC loans may have subordination clauses mentioned in notes
- **Maturity split**: Always check <1 year vs >1 year classification
- **Notes reference**: Note numbers typically appear next to line items (e.g., "Note 8")

---

## PRACTICAL EXTRACTION GUIDANCE

### What to Extract:
1. **IC Loans Provided** (Assets):
   - Look for: "Créances sur des entreprises liées"
   - Location: Fixed Assets → Financial Assets OR Current Assets → Debtors
   - Record: Amount + maturity + note reference + page number

2. **IC Loans Received** (Liabilities):
   - Look for: "Dettes envers des entreprises liées"
   - Location: Creditors section
   - Record: Amount + maturity + note reference + page number

3. **Participating Interests**:
   - Look for: "Parts dans des entreprises liées" or "Participations"
   - Location: Fixed Assets → Financial Assets
   - Record: Amount + note reference

### What NOT to Extract:
- Trade receivables/payables (unless specifically labeled as IC)
- Bank loans (unless from group company)
- Any amount without explicit IC reference

### Source Documentation Format:
```
"Balance Sheet - Fixed Assets - Créances sur entreprises liées, Note 6, page 8"
"Balance Sheet - Current Liabilities - Dettes envers entreprises liées (<1 yr), page 9"
```
