# Drugs Dashboard

This page provides a comprehensive view of all drugs in the system with full CRUD functionality.

## Features

### Data Display

- **Table View**: Shows all drugs with key information including:
  - Drug ID
  - Name
  - Generic Name
  - Brand Name
  - Drug Class
  - Status
  - Indication
  - Manufacturer
  - Creation Date

### Search & Filtering

- **Search Bar**: Search drugs by name, generic name, brand name, drug class, or indication
- **Real-time Filtering**: Results update as you type

### Actions

- **Create Drug**: Click the "New Drug" button to add a new drug via modal
- **View Details**: Click the eye icon to see comprehensive drug information in a modal
- **Edit Drug**: Click the edit icon to modify drug details in an editable modal
- **Delete Drug**: Click the trash icon to remove a drug (with confirmation)

### Data Management

- **API Integration**: Fetches data from `/api/v1/drugs/all-drugs-with-data`
- **Real-time Updates**: Automatically refreshes data after operations
- **Error Handling**: Toast notifications for success/error states

## API Endpoints Used

- `GET /api/v1/drugs/all-drugs-with-data` - Fetch all drugs with complete data
- `POST /api/v1/drugs/create-drug` - Create a new drug
- `PUT /api/v1/drugs/update/{id}` - Update drug information
- `DELETE /api/v1/drugs/delete/{id}` - Delete a drug

## Data Structure

The dashboard displays comprehensive drug information including:

### Basic Information

- Name, Generic Name, Brand Name
- Drug Class, Status, Manufacturer
- Dosage Form, Strength, Route of Administration

### Clinical Information

- Indication, Mechanism of Action
- Approval Dates, Patent Information
- Special Designations (Orphan Drug, Fast Track, etc.)

### Clinical Trials

- Phase, Status, Dates
- Participants, Endpoints, Results

### Safety Information

- Adverse Events
- Drug Interactions
- Contraindications, Warnings, Precautions

### Pharmacokinetics

- Absorption, Distribution, Metabolism, Excretion
- Half-life, Bioavailability

## Usage

1. **Navigate** to `/admin/drugs`
2. **Search** for specific drugs using the search bar
3. **View** detailed information by clicking the eye icon
4. **Edit** drug details by clicking the edit icon
5. **Delete** drugs by clicking the trash icon (with confirmation)

## Technical Details

- Built with React and TypeScript
- Uses shadcn/ui components for consistent styling
- Responsive design with mobile-friendly layout
- State management with React hooks
- Error handling with toast notifications
- Loading states for better UX
