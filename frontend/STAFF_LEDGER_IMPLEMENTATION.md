# Staff Balance Ledger - Implementation Guide

## Overview
Halaman detail ledger untuk menampilkan riwayat transaksi staff balance per karyawan dengan fitur filter dan pagination.

## File Structure

```
frontend/
├── app/admin-area/finance/staff-balance/
│   ├── page.tsx                                    # Main staff balance list
│   ├── StaffBalanceContent.tsx                     # Staff balance content component
│   └── ledger/[karyawanId]/
│       └── page.tsx                                # Staff ledger detail page (NEW)
├── components/staffBalance/
│   ├── TabelStaffBalance.tsx                       # Staff balance table
│   └── StaffLedgerContent.tsx                      # Staff ledger content (NEW)
├── actions/
│   └── staffBalanceAction.ts                       # Server actions for staff balance
└── types/
    └── staffBalance.ts                             # TypeScript types
```

## Features

### 1. Staff Ledger Detail Page
**File:** `app/admin-area/finance/staff-balance/ledger/[karyawanId]/page.tsx`

**Features:**
- Server-side data fetching
- Employee information display
- Balance summary cards (Operasional & Pinjaman)
- Integration with ledger content component
- Error handling
- Loading states

**Key Components:**
```tsx
// Employee Info Section
- Name, email, department, position
- Visual user icon

// Balance Summary
- Operasional Proyek balance
- Pinjaman Pribadi balance
- Currency formatting

// Navigation
- Back button to staff balance list
```

### 2. Staff Ledger Content Component
**File:** `components/staffBalance/StaffLedgerContent.tsx`

**Features:**
- Transaction filtering:
  - By category (Operasional/Pinjaman)
  - By transaction type (5 types)
  - By date range
- Transaction table with columns:
  - Tanggal (Date & Time)
  - Keterangan (Description)
  - Kategori (Category badge)
  - Tipe (Transaction type badge)
  - Debit (with green indicator)
  - Kredit (with red indicator)
  - Saldo (Running balance)
- Pagination controls
- Empty state handling
- Responsive design

## Data Flow

### 1. Server-Side Data Fetching
```typescript
// In page.tsx
const [ledgerResponse, balanceResponse] = await Promise.all([
    getStaffLedgerByKaryawan(karyawanId, {
        page,
        limit,
        category,
        type,
        startDate,
        endDate,
    }),
    getStaffBalanceByKaryawan(karyawanId),
]);
```

### 2. Client-Side Filtering
```typescript
// In StaffLedgerContent.tsx
const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedType) params.set("type", selectedType);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", "1");
    
    router.push(`/admin-area/finance/staff-balance/ledger/${karyawanId}?${params.toString()}`);
};
```

## Transaction Types

### Ledger Categories
1. **OPERASIONAL_PROYEK** - Project operational expenses
2. **PINJAMAN_PRIBADI** - Personal loans

### Transaction Types
1. **CASH_ADVANCE** - Kasbon / Uang Muka
2. **EXPENSE_REPORT** - Laporan Pengeluaran
3. **LOAN_DISBURSEMENT** - Pencairan Pinjaman
4. **LOAN_REPAYMENT** - Pembayaran Pinjaman
5. **REIMBURSEMENT** - Reimbursement

## UI/UX Features

### Color Coding
- **Debit (Income)**: Green with TrendingUp icon
- **Kredit (Expense)**: Red with TrendingDown icon
- **Positive Balance**: Green text
- **Negative Balance**: Red text
- **Zero Balance**: Gray text

### Badges
- Category badges with custom colors
- Transaction type badges with semantic colors
- Outlined variant for better visibility

### Responsive Design
- Mobile-friendly filter layout (grid responsive)
- Horizontal scroll for table on small screens
- Adaptive spacing and typography

## Navigation Flow

```
Staff Balance List
    ↓ (Click "Detail Ledger" button)
Staff Ledger Detail
    ├── View employee info
    ├── View balance summary
    ├── Filter transactions
    ├── View transaction history
    └── Navigate pages
    ↓ (Click "Kembali" button)
Back to Staff Balance List
```

## API Integration

### Endpoints Used
1. **GET** `/api/staff-balance/ledger/:karyawanId`
   - Query params: page, limit, category, type, startDate, endDate
   - Returns: Paginated ledger entries

2. **GET** `/api/staff-balance/karyawan/:karyawanId`
   - Returns: Staff balance summary by category

## Error Handling

### Page Level
```tsx
try {
    // Fetch data
} catch (error) {
    // Show error UI with back button
    return <ErrorState />;
}
```

### Empty States
- No transactions found
- No filters applied
- Filtered results empty

## Performance Optimizations

1. **Server-Side Rendering**: Initial data fetched on server
2. **Parallel Fetching**: Balance and ledger data fetched simultaneously
3. **Pagination**: Limit data per page (default 20)
4. **Suspense Boundaries**: Loading states for better UX

## Future Enhancements

### Potential Features
1. Export to Excel/PDF
2. Transaction detail modal
3. Search by description
4. Sort by columns
5. Bulk actions
6. Transaction analytics/charts
7. Print view
8. Email reports

### Performance
1. Virtual scrolling for large datasets
2. Infinite scroll option
3. Client-side caching
4. Optimistic updates

## Testing Checklist

- [ ] Page loads with correct employee info
- [ ] Balance summary displays correctly
- [ ] Filters work independently
- [ ] Filters work in combination
- [ ] Date range filter validates correctly
- [ ] Pagination works correctly
- [ ] Empty state shows when no data
- [ ] Error state shows on API failure
- [ ] Back button navigates correctly
- [ ] Mobile responsive layout works
- [ ] Dark mode styling correct
- [ ] Currency formatting correct
- [ ] Date/time formatting correct

## Dependencies

```json
{
  "required": [
    "@/components/ui/table",
    "@/components/ui/badge",
    "@/components/ui/button",
    "@/components/ui/select",
    "@/components/ui/input",
    "@/components/ui/skeleton",
    "lucide-react",
    "next/navigation"
  ]
}
```

## Styling

### Tailwind Classes Used
- Gradient backgrounds
- Dark mode support
- Responsive grid layouts
- Hover effects
- Border styling
- Shadow effects
- Color utilities

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- ARIA labels where needed
- Keyboard navigation support
- Focus states
- Color contrast compliance

---

**Created:** 2026-01-01
**Last Updated:** 2026-01-01
**Status:** ✅ Implemented
