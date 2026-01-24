# MR Confirmation Dialog - Troubleshooting Guide

## 🐛 **Problem: Dialog Tidak Muncul**

### **Root Cause:**
QRScannerDialog memanggil `handleClose()` setelah `onScanSuccess()`, menyebabkan dialog tertutup sebelum confirmation dialog bisa muncul.

---

## 🔧 **Solution**

### **1. Fix QRScannerDialog.tsx**

**Problem Code:**
```tsx
cleanupTimeoutRef.current = setTimeout(() => {
    onScanSuccess(data)
    handleClose()  // ❌ Auto-closes dialog
}, 1500)
```

**Fixed Code:**
```tsx
cleanupTimeoutRef.current = setTimeout(() => {
    onScanSuccess(data)
    // Don't auto-close - let parent component handle it
    // handleClose()  // ✅ Commented out
}, 1500)
```

**Location:** `frontend/components/inventoryMr/QRScannerDialog.tsx` (Line 128-131, 142-145)

---

### **2. Parent Component Controls Dialog State**

**TableMr.tsx:**
```tsx
onScanSuccess={async (scannedToken) => {
    console.log("🔍 QR Scanned successfully:", scannedToken)
    
    // Close QR scanner
    setShowQRScanner(false)  // ✅ Parent closes QR scanner
    
    if (selectedMR) {
        // Set pending data
        setPendingIssueData({
            scannedToken,
            mr: selectedMR
        })
        
        // Show confirmation dialog
        setShowConfirmDialog(true)  // ✅ Parent shows confirmation
    }
}}
```

---

## 📊 **Flow Diagram**

### **Before Fix (❌ Broken):**
```
User Scan QR
    ↓
QRScannerDialog.handleScanResult()
    ↓
setTimeout(1500ms)
    ↓
onScanSuccess(data)  ← Parent tries to show confirmation
    ↓
handleClose()  ← ❌ QR dialog closes immediately!
    ↓
❌ Confirmation dialog never visible
```

### **After Fix (✅ Working):**
```
User Scan QR
    ↓
QRScannerDialog.handleScanResult()
    ↓
setTimeout(1500ms)
    ↓
onScanSuccess(data)
    ↓
Parent: setShowQRScanner(false)  ← Close QR scanner
    ↓
Parent: setPendingIssueData(...)  ← Set data
    ↓
Parent: setShowConfirmDialog(true)  ← ✅ Show confirmation
    ↓
✅ Confirmation dialog visible!
```

---

## 🧪 **Testing Steps**

### **1. Check Console Logs**

After QR scan, you should see:
```
🔍 QR Scanned successfully: [token]
🔍 Selected MR: [id]
🔍 Selected MR Warehouse: { name: "...", isWip: true/false }
🔍 Closing QR Scanner...
🔍 Setting pending issue data...
🔍 Opening confirmation dialog...
✅ Confirmation dialog should now be visible
```

### **2. Visual Check**

**Expected Behavior:**
1. Click "Approve" button
2. QR Scanner dialog opens
3. Scan QR code (or manual input)
4. QR Scanner shows success animation (1.5s)
5. QR Scanner closes
6. **Confirmation dialog appears** ✅
7. User can see warnings and confirm

**If Not Working:**
- Check browser console for errors
- Check if `showConfirmDialog` state is true
- Check if `pendingIssueData` is set
- Check React DevTools for component state

---

## 🔍 **Debug Checklist**

### **Frontend State:**
```tsx
// Check these states in React DevTools
showQRScanner: false  // Should be false after scan
showConfirmDialog: true  // Should be true after scan
pendingIssueData: {
  scannedToken: "...",
  mr: { ... }
}  // Should have data
```

### **Console Logs:**
- [ ] "🔍 QR Scanned successfully" appears
- [ ] "🔍 Selected MR" shows correct ID
- [ ] "🔍 Selected MR Warehouse" shows warehouse data
- [ ] "🔍 Closing QR Scanner..." appears
- [ ] "🔍 Setting pending issue data..." appears
- [ ] "🔍 Opening confirmation dialog..." appears
- [ ] "✅ Confirmation dialog should now be visible" appears

### **Component Rendering:**
```tsx
// MRIssueConfirmDialog should render with:
open={showConfirmDialog}  // Should be true
mrNumber={pendingIssueData?.mr.mrNumber}  // Should have value
isWipWarehouse={pendingIssueData?.mr.Warehouse?.isWip}  // Should be true/false
```

---

## 🚨 **Common Issues**

### **Issue 1: Dialog Still Not Showing**

**Check:**
```tsx
// Is MRIssueConfirmDialog component imported?
import { MRIssueConfirmDialog } from "./MRIssueConfirmDialog"

// Is it rendered in JSX?
<MRIssueConfirmDialog
  open={showConfirmDialog}
  onOpenChange={setShowConfirmDialog}
  ...
/>
```

**Solution:** Ensure component is imported and rendered

---

### **Issue 2: Dialog Shows But No Content**

**Check:**
```tsx
// Is pendingIssueData set correctly?
console.log("Pending data:", pendingIssueData)

// Should output:
{
  scannedToken: "abc123",
  mr: {
    mrNumber: "MR-202601-0001",
    Warehouse: {
      name: "GUDANG WIP",
      isWip: true
    },
    items: [...]
  }
}
```

**Solution:** Ensure `selectedMR` has all required data

---

### **Issue 3: QR Scanner Doesn't Close**

**Check:**
```tsx
// Is setShowQRScanner(false) being called?
console.log("🔍 Closing QR Scanner...")  // Should appear in console
```

**Solution:** Ensure `setShowQRScanner(false)` is called in `onScanSuccess`

---

### **Issue 4: Multiple Dialogs Open**

**Symptom:** Both QR Scanner and Confirmation dialog visible

**Check:**
```tsx
showQRScanner: true  // Should be false
showConfirmDialog: true  // Should be true
```

**Solution:** Ensure QR Scanner closes before Confirmation opens

---

## 📝 **Files Modified**

1. **QRScannerDialog.tsx**
   - Removed `handleClose()` after `onScanSuccess()`
   - Let parent component control dialog state

2. **TableMr.tsx**
   - Added debug console logs
   - Properly manages dialog states
   - Shows confirmation dialog after QR scan

---

## ✅ **Verification**

### **Manual Test:**
1. Open MR list page
2. Click "Approve" on a PENDING MR
3. QR Scanner dialog opens
4. Input token manually or scan QR
5. Wait 1.5 seconds
6. **Confirmation dialog should appear** ✅
7. Check if warning shows for WIP warehouse
8. Click "Ya, Keluarkan Barang"
9. Check backend creates journal

### **Automated Check:**
```javascript
// In browser console after scan:
console.log("QR Scanner visible:", document.querySelector('[role="dialog"]')?.textContent?.includes("Scan QR Code"))
console.log("Confirmation visible:", document.querySelector('[role="dialog"]')?.textContent?.includes("Konfirmasi Pengeluaran"))
```

---

## 🎯 **Expected Result**

After implementing the fix:
- ✅ QR Scanner closes after successful scan
- ✅ Confirmation dialog appears
- ✅ Warning shows for WIP warehouse
- ✅ User can confirm or cancel
- ✅ Journal created on confirm

---

**Created:** 2026-01-23  
**Version:** 1.0.0  
**Status:** ✅ Fixed
