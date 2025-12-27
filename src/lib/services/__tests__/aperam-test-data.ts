/**
 * APERAM B155908 Test Data
 *
 * This simulates the extracted text from the APERAM B155908 annual accounts
 * based on the values mentioned in .claude-rules:
 *
 * Expected Values:
 * - EUR 517.4M IC loan provided
 * - EUR 310.9M IC loan received
 * - EUR 36.6M IC interest income (Item 10a)
 * - EUR 31.3M IC interest income (Item 11a)
 * - EUR 378.7M IC interest expense (Item 14a)
 * - EUR 91.3M Other operating income (Item 4) - should be flagged as unverified
 */

export const APERAM_B155908_SAMPLE_TEXT = `
APERAM Treasury S.C.A.
Société en Commandite par Actions

Siège social: 12C, rue Guillaume J. Kroll, L-1882 Luxembourg
R.C.S. Luxembourg B 155908

COMPTES ANNUELS AU 31 DECEMBRE 2022
ANNUAL ACCOUNTS AS AT 31 DECEMBER 2022

==========================================================
BILAN - BALANCE SHEET
==========================================================

ACTIF - ASSETS
                                                    EUR
C. ACTIF IMMOBILISE - FIXED ASSETS

   III. Immobilisations financières - Financial assets

       1. Parts dans entreprises liées
          Shares in affiliated undertakings
          (Note 4)                                  1.500.000

       2. Créances sur des entreprises liées
          Amounts owed by affiliated undertakings
          (Note 5)                                517.400.000

D. ACTIF CIRCULANT - CURRENT ASSETS

   II. Créances - Debtors
       (becoming due and payable within one year)

       1. Créances commerciales
          Trade debtors                             5.200.000

       2. Créances sur entreprises liées
          Amounts owed by affiliated undertakings
          (Note 6)                                 45.600.000

       4. Autres créances
          Other debtors                             2.100.000

   IV. Avoirs en banques
       Cash at bank and in hand                    12.300.000

TOTAL DE L'ACTIF - TOTAL ASSETS                   583.100.000

==========================================================
PASSIF - LIABILITIES
==========================================================

A. CAPITAUX PROPRES - CAPITAL AND RESERVES

   I.   Capital souscrit - Subscribed capital      50.000.000
   II.  Prime d'émission - Share premium           25.000.000
   IV.  Réserves - Reserves                        15.000.000
   V.   Résultats reportés - Retained earnings     35.200.000
   VI.  Résultat de l'exercice - Profit for year   12.500.000

   TOTAL EQUITY                                   137.700.000

C. DETTES - CREDITORS

   Becoming due and payable within one year:

   5. Dettes envers des entreprises liées
      Amounts owed to affiliated undertakings
      (Note 8)                                    310.900.000

   7. Dettes fiscales et sociales
      Tax and social security                       8.500.000

   Becoming due and payable after more than one year:

   5. Dettes envers des entreprises liées
      Amounts owed to affiliated undertakings
      (Note 9)                                    126.000.000

TOTAL DU PASSIF - TOTAL LIABILITIES               583.100.000

==========================================================
COMPTE DE PROFITS ET PERTES - PROFIT AND LOSS ACCOUNT
==========================================================

                                                    EUR

1. Montant net du chiffre d'affaires
   Net turnover                                             0

4. Autres produits d'exploitation
   Other operating income (Note 15)                91.300.000

5. Matières premières et consommables
   Raw materials and consumables                   (1.200.000)

6. Frais de personnel - Staff costs                (2.500.000)

7. Corrections de valeur - Depreciation              (150.000)

8. Autres charges d'exploitation
   Other operating expenses                        (3.800.000)

   RESULTAT D'EXPLOITATION
   OPERATING RESULT                                83.650.000

9. Produits provenant de participations
   Income from participating interests
   (Note 10)                                       15.000.000
   a) provenant d'entreprises liées
      derived from affiliated undertakings         15.000.000

10. Produits provenant d'autres placements et créances
    de l'actif immobilisé
    Income from other investments and loans
    forming part of the fixed assets               40.200.000
    a) provenant d'entreprises liées
       derived from affiliated undertakings        36.600.000

11. Autres intérêts et autres produits assimilés
    Other interest receivable and similar income   35.800.000
    a) provenant d'entreprises liées
       derived from affiliated undertakings        31.300.000

13. Corrections de valeur sur immobilisations
    financières
    Value adjustments on financial assets          (2.500.000)

14. Intérêts et charges assimilées
    Interest payable and similar expenses        (400.000.000)
    a) concernant des entreprises liées
       concerning affiliated undertakings        (378.700.000)

15. Impôts sur le résultat
    Tax on profit                                  (8.350.000)

18. Résultat de l'exercice
    Profit for the financial year                  12.500.000

==========================================================
ANNEXE AUX COMPTES ANNUELS - NOTES TO ANNUAL ACCOUNTS
==========================================================

Note 4 - Shares in affiliated undertakings
------------------------------------------
The Company holds shares in the following affiliated undertaking:
- APERAM Holdings S.à r.l. - 100% ownership - EUR 1.500.000

Note 5 - Amounts owed by affiliated undertakings (Fixed assets)
---------------------------------------------------------------
The Company has granted the following loans to affiliated undertakings:

Borrower                          Amount EUR    Interest Rate    Maturity
APERAM Stainless Services BV     250.000.000      6.50%         2027-12-31
APERAM Stainless France SAS      167.400.000      7.10%         2026-06-30
APERAM Genk NV                   100.000.000      6.25%         2028-03-31

Total                            517.400.000

The loans are subordinated to the senior debt of the respective borrowers.
All loans are unsecured.

Note 6 - Amounts owed by affiliated undertakings (Current assets)
-----------------------------------------------------------------
Short-term receivables from affiliated undertakings:
- Cash pooling receivables: EUR 35.600.000
- Trade receivables: EUR 10.000.000
Total: EUR 45.600.000

Note 8 - Amounts owed to affiliated undertakings (Current)
----------------------------------------------------------
The Company has received the following loans from affiliated undertakings:

Lender                           Amount EUR    Interest Rate    Maturity
APERAM S.A.                     310.900.000     varies*        2023-12-31

*Interest is charged at EURIBOR + margin, reviewed quarterly.
Average rate for 2022: 4.25%

Note 9 - Amounts owed to affiliated undertakings (Long-term)
------------------------------------------------------------
Long-term financing from affiliated undertakings:
- Subordinated loan from APERAM S.A.: EUR 126.000.000 at 5.5% p.a.
  Maturity: 2028-12-31

Note 10 - Income from participating interests
---------------------------------------------
Dividends received from APERAM Holdings S.à r.l.: EUR 15.000.000

The dividend was approved by shareholder resolution dated 15 March 2022.

Note 15 - Other operating income
--------------------------------
Other operating income comprises:

                                              EUR
Rental income from group properties        5.200.000
Foreign exchange gains                    12.500.000
Reversal of provisions                     8.600.000
Administrative services recharge          48.000.000
Other income                              17.000.000
                                         -----------
Total                                     91.300.000

The administrative services recharge relates to management oversight
and compliance services provided to various APERAM entities.

Note 20 - Related party transactions
------------------------------------
The Company is a wholly-owned subsidiary of APERAM S.A., a company
incorporated in Luxembourg and listed on the Euronext Amsterdam,
Paris and Brussels stock exchanges.

All transactions with related parties are conducted at arm's length
based on the Group's transfer pricing policy.

Key related party transactions during the year:
- Interest income from IC loans: EUR 67.900.000
- Interest expense on IC borrowings: EUR 378.700.000
- Dividend income: EUR 15.000.000
- Administrative services charged: EUR 48.000.000

==========================================================
AUDITOR'S REPORT
==========================================================

To the Shareholders of APERAM Treasury S.C.A.

We have audited the annual accounts of APERAM Treasury S.C.A.
for the year ended 31 December 2022.

In our opinion, the annual accounts give a true and fair view
of the financial position of the Company as at 31 December 2022,
and of the results of its operations for the year then ended
in accordance with Luxembourg legal and regulatory requirements
relating to the preparation of annual accounts.

Deloitte Audit S.à r.l.
Luxembourg, 15 April 2023

`;

export default APERAM_B155908_SAMPLE_TEXT;
