% QUICK REFERENCE CARD
% Professional UI Notification System

# 🎯 TOAST NOTIFICATIONS - Quick Copy & Paste

## Import
```javascript
import { toastSuccess, toastError, toastWarning, toastInfo } from '../lib/toast';
```

## Usage

| Purpose | Code | Color | Duration |
|---------|------|-------|----------|
| ✅ Success | `toastSuccess('Done!')` | Green | 3s |
| ❌ Error | `toastError('Failed')` | Red | 4s |
| ⚠️ Warning | `toastWarning('Careful')` | Yellow | 4s |
| ℹ️ Info | `toastInfo('Note')` | Blue | 3s |

## Copy-Paste Examples

### Success Message
```javascript
const handleSave = async () => {
  try {
    await api.save(data);
    toastSuccess('Changes saved successfully!');
  } catch (error) {
    toastError('Failed to save');
  }
};
```

### Error with Specific Message
```javascript
try {
  await api.call();
} catch (error) {
  toastError(error.message || 'Something went wrong');
}
```

### Validation Error
```javascript
if (!formData.title) {
  toastError('Title is required');
  return;
}
```

### Warning
```javascript
if (duplicateFound) {
  toastWarning('Similar item already exists');
}
```

### Info Message
```javascript
toastInfo('This feature requires a mobile device');
```

---

# 🎯 CONFIRMATION MODAL - Quick Copy & Paste

## Import
```javascript
import ConfirmModal from './ConfirmModal';
```

## Step 1: Add State
```javascript
const [deleteModal, setDeleteModal] = useState({ 
  isOpen: false, 
  itemId: null 
});
const [isDeleting, setIsDeleting] = useState(false);
```

## Step 2: Add Handlers
```javascript
// Open modal
const handleDeleteClick = (id) => {
  setDeleteModal({ isOpen: true, itemId: id });
};

// Confirm action
const handleConfirm = async () => {
  setIsDeleting(true);
  try {
    await api.delete(deleteModal.itemId);
    toastSuccess('Deleted');
    setDeleteModal({ isOpen: false, itemId: null });
  } catch (e) {
    toastError(e.message);
  } finally {
    setIsDeleting(false);
  }
};
```

## Step 3: Add Button
```javascript
<button onClick={() => handleDeleteClick(item.id)}>
  Delete
</button>
```

## Step 4: Add Modal Component
```javascript
<ConfirmModal
  isOpen={deleteModal.isOpen}
  onClose={() => setDeleteModal({ isOpen: false, itemId: null })}
  onConfirm={handleConfirm}
  title="Delete?"
  message="Cannot be undone"
  confirmText="Delete"
  confirmColor="red"
  isLoading={isDeleting}
/>
```

---

# 🎨 BUTTON COLORS

```
confirmColor="red"      → ❌ Delete, remove, destructive
confirmColor="blue"     → ℹ️ General confirm
confirmColor="green"    → ✅ Save, approve, submit
confirmColor="amber"    → ⚠️ Logout, warning actions
```

---

# 🚫 DON'T USE

```javascript
❌ window.alert('message')
❌ window.confirm('message') 
❌ window.prompt('message')

✅ toastSuccess()
✅ <ConfirmModal />
✅ toastWarning()
```

---

# 📋 MODAL PROPS REFERENCE

```javascript
<ConfirmModal
  isOpen={boolean}              // Required: show/hide
  onClose={function}            // Required: on cancel/close
  onConfirm={function}          // Required: on confirm
  title="string"                // Required: modal title
  message="string"              // Required: detailed message
  confirmText="Delete"          // Optional: button text (default: "Confirm")
  cancelText="Cancel"           // Optional: button text (default: "Cancel")
  confirmColor="red"            // Optional: button color (default: "red")
  isLoading={false}             // Optional: show loading (default: false)
/>
```

---

# ⌨️ KEYBOARD SHORTCUTS

```
ESC  → Close modal
Click backdrop → Close modal
```

---

# 🔧 CUSTOM DURATION

```javascript
toastSuccess('Message', 5000)    // 5 seconds
toastError('Message', 2000)      // 2 seconds
```

---

# 📝 COMMON PATTERNS

## Pattern: Delete with Modal
```javascript
// State
const [modal, setModal] = useState({ isOpen: false, id: null });

// Open
const open = (id) => setModal({ isOpen: true, id });

// Close  
const close = () => setModal({ isOpen: false, id: null });

// Confirm
const confirm = async () => {
  await api.delete(modal.id);
  toastSuccess('Deleted');
  close();
};

// JSX
<ConfirmModal
  isOpen={modal.isOpen}
  onClose={close}
  onConfirm={confirm}
  title="Delete?"
  message="Sure?"
/>
```

## Pattern: Form with Validation
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate
  if (!form.title) {
    toastError('Title required');
    return;
  }
  
  // Submit
  try {
    await api.submit(form);
    toastSuccess('Submitted!');
  } catch (e) {
    toastError(e.message);
  }
};
```

---

# 🎯 DECISION TREE

```
User Action
    ↓
Is it DESTRUCTIVE? (delete, logout, reject)
    ├─ YES → Use ConfirmModal
    └─ NO → Continue
    
Does user need TO CONFIRM?
    ├─ YES → Use ConfirmModal
    └─ NO → Continue
    
Does action need IMMEDIATE FEEDBACK?
    ├─ YES → Use Toast
    └─ NO → Maybe no feedback needed
```

---

# 📂 FILES

| File | Purpose |
|------|---------|
| `src/lib/toast.js` | Import toast functions from here |
| `src/components/ConfirmModal.jsx` | Import modal component from here |
| `src/components/EXAMPLE_PATTERNS.jsx` | Copy patterns from example code |
| `PROFESSIONAL_UI_GUIDE.md` | Read full documentation |
| `ALERT_REMOVAL_SUMMARY.md` | See complete migration details |

---

# 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Toast not showing | Check imports, verify Toaster in App.jsx |
| Modal not closing | Call setModal({ isOpen: false }) in onClose |
| Buttons disabled during loading | Use isLoading prop correctly |
| Multiple toasts stacking | Limit toast frequency |
| Modal blocking interaction | Click backdrop to close |

---

**Print this card and keep it handy! 📌**

*For more details, see PROFESSIONAL_UI_GUIDE.md*
