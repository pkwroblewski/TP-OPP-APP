# Update Frontend to Display Validation Results and Warnings

## Context
The backend now returns:
- Validation warnings (e.g., Item 4 flagged as unverified)
- TP opportunity flags (e.g., high implied rates, zero-spread)
- Extraction quality metrics

## Task
Update the frontend UI to display these validation results prominently.

## Implementation Requirements

### 1. Add Verification Status Column to Results Table

In the IC transactions table, add a "Status" column showing:

```typescript
// Status badge logic
function getVerificationStatus(transaction, validation) {
  const hasWarning = validation.warnings.some(w => 
    w.field === transaction.fieldName
  );
  const hasSource = transaction.source !== null;
  const isTPFlag = validation.flags.some(f => 
    f.reference === transaction.fieldName
  );
  
  if (isTPFlag) return { icon: '🚩', label: 'TP Opportunity', color: 'red' };
  if (hasWarning) return { icon: '⚠️', label: 'Unverified', color: 'yellow' };
  if (hasSource) return { icon: '✓', label: 'Verified', color: 'green' };
  return { icon: '?', label: 'Unknown', color: 'gray' };
}
```

### 2. Add Warnings Section

Above the results table, add a warnings section:

```tsx
{validation.warnings.length > 0 && (
  <div className="warnings-section bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
      ⚠️ Validation Warnings ({validation.warnings.length})
    </h3>
    <ul className="space-y-2">
      {validation.warnings.map((warning, i) => (
        <li key={i} className="text-sm">
          <span className="font-medium">{warning.field}:</span>{' '}
          <span className="text-yellow-700">{warning.issue}</span>
          <p className="text-yellow-600 text-xs mt-1">{warning.details}</p>
        </li>
      ))}
    </ul>
  </div>
)}
```

### 3. Add TP Opportunities Section

Add a prominent TP opportunities section:

```tsx
{validation.flags.length > 0 && (
  <div className="tp-opportunities bg-red-50 border-l-4 border-red-500 p-4 mb-6">
    <h3 className="text-lg font-semibold text-red-800 mb-2">
      🚩 Transfer Pricing Opportunities ({validation.flags.length})
    </h3>
    <div className="space-y-3">
      {validation.flags.map((flag, i) => (
        <div key={i} className="bg-white p-3 rounded border border-red-200">
          <div className="flex justify-between items-start mb-1">
            <span className="font-medium text-red-700">{flag.type}</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              flag.priority === 'HIGH' ? 'bg-red-600 text-white' :
              flag.priority === 'MEDIUM' ? 'bg-orange-500 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              {flag.priority} PRIORITY
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-1">{flag.description}</p>
          <p className="text-xs text-gray-600">
            <strong>Estimated Value:</strong> {flag.estimatedValue}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

### 4. Add Extraction Quality Badge

At the top of results, show quality metrics:

```tsx
<div className="extraction-quality flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">Extraction Quality:</span>
    <span className={`px-3 py-1 rounded font-semibold ${
      extractionQuality.confidence === 'HIGH' ? 'bg-green-500 text-white' :
      extractionQuality.confidence === 'MEDIUM' ? 'bg-yellow-500 text-white' :
      'bg-red-500 text-white'
    }`}>
      {extractionQuality.confidence}
    </span>
  </div>
  
  <div className="flex items-center gap-2">
    {extractionQuality.allSourced ? (
      <span className="text-green-600 text-sm">✓ All values sourced</span>
    ) : (
      <span className="text-red-600 text-sm">⚠️ Some values missing sources</span>
    )}
  </div>
  
  <div className="flex items-center gap-2">
    {extractionQuality.crossValidated ? (
      <span className="text-green-600 text-sm">✓ Cross-validated</span>
    ) : (
      <span className="text-gray-600 text-sm">○ Not cross-validated</span>
    )}
  </div>
</div>
```

### 5. Update Results Table to Show Sources

Add a "Source" column to the results table:

```tsx
<td className="text-xs text-gray-500">
  {transaction.source || 'No source'}
</td>
```

## Files to Update

1. Main results component (likely `app/results/page.tsx` or similar)
2. Results table component
3. Add new components if needed: `WarningsSection.tsx`, `TPOpportunitiesSection.tsx`

## Verification

After implementation, show me:
1. Screenshot or description of the warnings section
2. Screenshot or description of TP opportunities section
3. Screenshot of the updated results table with status badges
4. Confirmation that Item 4 shows "⚠️ Unverified" badge

Implement these UI updates now.
