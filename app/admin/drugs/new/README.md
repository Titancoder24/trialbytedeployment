# Drug Form Context System

This directory contains a multi-step drug creation form that uses React Context API for centralized state management, similar to the therapeutic form system.

## Architecture

### Context Provider

- **File**: `context/drug-form-context.tsx`
- **Purpose**: Centralized state management for all drug form steps
- **Features**:
  - Type-safe form data structure
  - Reducer-based state updates
  - Array field management (add/remove/update)
  - Form reset and load functionality

### Form Steps

1. **Overview** (`overview/page.tsx`) - Basic drug information and development status
2. **Development Status** (`dev-status/page.tsx`) - Disease type, therapeutic class, company details
3. **Drug Activity** (`drug-activity/page.tsx`) - Mechanism of action, biological targets, delivery
4. **Development** (`development/page.tsx`) - Preclinical status, development phase, sponsor
5. **Other Sources** (`other-sources/page.tsx`) - Additional information from external sources
6. **Licensing** (`licensing/page.tsx`) - Agreement types and marketing approvals
7. **Logs** (`logs/page.tsx`) - Documentation and final submission

### Progress Indicator

- **File**: `components/drug-form-progress.tsx`
- **Purpose**: Visual progress tracking across all form steps
- **Features**:
  - Step completion detection
  - Current step highlighting
  - Visual progress indicators

## State Management

### Form Data Structure

```typescript
interface DrugFormData {
  overview: {
    drug_name: string;
    generic_name: string;
    // ... other overview fields
  };
  devStatus: {
    disease_type: string;
    therapeutic_class: string;
    // ... other development status fields
  };
  activity: {
    mechanism_of_action: string;
    biological_target: string;
    // ... other activity fields
  };
  development: {
    preclinical: string;
    status: string;
    sponsor: string;
  };
  otherSources: {
    data: string;
  };
  licencesMarketing: {
    agreement: string;
    marketing_approvals: string;
  };
  logs: {
    drug_changes_log: string;
    notes: string;
  };
}
```

### Context Functions

- `updateField(step, field, value)` - Update a single field
- `updateStep(step, data)` - Update multiple fields in a step
- `addArrayItem(step, field)` - Add item to array field
- `removeArrayItem(step, field, index)` - Remove item from array field
- `updateArrayItem(step, field, index, value)` - Update specific array item
- `resetForm()` - Clear all form data
- `loadForm(data)` - Load existing form data

## API Integration

### Submission Endpoint

- **URL**: `POST {{URL}}/api/v1/drugs/create-drug`
- **Payload Format**: Matches the exact structure specified in requirements

### Data Flow

1. User fills out form steps
2. Data is stored in context state
3. On "Finish" click, all data is collected from context
4. Single API call with consolidated payload
5. Form reset and redirect on success

## Usage

### Basic Form Field

```typescript
const { formData, updateField } = useDrugForm();
const form = formData.overview;

<Input
  value={form.drug_name}
  onChange={(e) => updateField("overview", "drug_name", e.target.value)}
/>;
```

### Array Field Management

```typescript
const { addArrayItem, removeArrayItem, updateArrayItem } = useDrugForm();

// Add new item
<Button onClick={() => addArrayItem("overview", "attachments")}>
  Add Attachment
</Button>

// Remove item
<Button onClick={() => removeArrayItem("overview", "attachments", index)}>
  Remove
</Button>

// Update item
<Input
  value={form.attachments[index]}
  onChange={(e) => updateArrayItem("overview", "attachments", index, e.target.value)}
/>
```

## Benefits Over Previous Approach

1. **Centralized State**: Single source of truth for all form data
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Efficient Updates**: Minimal re-renders with reducer pattern
4. **Data Persistence**: Form data maintained across navigation
5. **Simplified Submission**: Single API call with all collected data
6. **Progress Tracking**: Visual indication of form completion
7. **Error Handling**: Centralized error management and user feedback

## Migration Notes

- Replaces individual `useState` hooks in each step
- Removes `localStorage` dependency for form data
- Consolidates form submission logic
- Adds progress indicator component
- Maintains existing UI components and styling

## File Structure

```
app/admin/drugs/new/
├── context/
│   └── drug-form-context.tsx
├── components/
│   └── drug-form-progress.tsx
├── overview/
│   └── page.tsx
├── dev-status/
│   └── page.tsx
├── drug-activity/
│   └── page.tsx
├── development/
│   └── page.tsx
├── other-sources/
│   └── page.tsx
├── licensing/
│   └── page.tsx
├── logs/
│   └── page.tsx
├── layout.tsx
└── README.md
```

