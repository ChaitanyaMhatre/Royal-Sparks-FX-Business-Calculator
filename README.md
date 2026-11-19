# ROYAL SPARKS FX – BUSINESS MANAGER
### Celebrating Your Special Moments
#### Streamlined 3-Page Financial & Event Production Platform

---

## 1. Overview

The **Royal Sparks FX Business Manager** has been streamlined into an intuitive, mobile-first **3-page platform** designed specifically for the three partners of Royal Sparks FX. All unnecessary navigation items, fragmented modules, and excessive steps have been eliminated while preserving the full Supabase PostgreSQL database, real-time synchronization, and official black-and-gold branding.

---

## 2. The Three Primary Pages

### 1. Dashboard (`/`)
A single, focused financial overview displaying:
- **7 Summary Cards**:
  1. Total Events
  2. Total Client Charges (Revenue)
  3. Total Expenses
  4. Overall Profit
  5. Total Amount Received
  6. Pending Client Payments
  7. Actual Available Cash
- **Visual Trends**:
  - Monthly Revenue vs Expenses (Bar Chart)
  - Overall Profit Trend (Line Chart)
- **Recent Events List**:
  - Cards showing Event Name, Event Date, Client Charge, Total Expenses, and Event Profit.
  - Direct 1-click access to load any event into the Calculation page.

### 2. Calculation (`/calculation`)
The dedicated finance and operational calculation workspace:
- **Event Selector**: Dropdown to select and edit any previously saved event, or click `+ New Event` to start fresh.
- **Event Details**: Event Date, Event Name, Client Name (optional).
- **Material Expenses**: Dynamically add multiple rows:
  $$\text{Total Amount} = \text{Quantity} \times \text{Price Per Unit}$$
  With `Add Material` and `Remove` buttons.
- **Additional Expenses**: Description, Category (Transportation, Labour, Rentals, Food, etc.), Amount, and Paid / Unpaid toggle.
- **Client Payment**: Total Amount Charged to Client, Amount Received, Payment Date, Payment Method.
- **Automatic Financial Summary**:
  - Total Material Expenses
  - Total Additional Expenses
  - Total Expenses
  - Total Client Charge
  - Amount Received
  - Pending Client Payment
  - Expected Event Profit: $\text{Total Client Charge} - \text{Total Expenses}$
  - Actual Cash Impact: $\text{Amount Received} - \text{Paid Expenses}$
- **Action Buttons**:
  - `Save Calculation (New)`
  - `Update Calculation`

### 3. Calendar (`/calendar`)
Simple, interactive event calendar:
- **Navigation**: Previous month, next month, current date highlighting.
- **Views**: Month View & Agenda View.
- **Interactivity**:
  - Click any date to view events or click `+ Add Event on This Date` to open the Calculation page with the date prefilled.
  - Click any existing event card to view details or click `Edit in Calculation` to load it directly into the Calculation page.

---

## 3. Navigation

- **Mobile**: Fixed bottom navigation bar containing exactly:
  $$\text{Dashboard} \quad|\quad \text{Calculation} \quad|\quad \text{Calendar}$$
- **Desktop**: Clean collapsible sidebar containing the same three items.
- **Header**: Preserves the official Royal Sparks FX golden crown logo, business title, real-time sync status indicator, and quick partner switcher.

---

## 4. Multi-Partner Real-Time Sync & Database

- **Shared Database**: All 3 members access the same Supabase PostgreSQL database.
- **Live Sync**: Changes made by one partner automatically broadcast to the other two partners without requiring manual page refresh.
- **Optimistic Concurrency**: Prevents silent overwriting when multiple partners update simultaneously.
- **Official Brand**: Uploaded Royal Sparks FX logo preserved at `public/assets/royal-sparks-fx-logo.jpeg`.

---

## 5. Running the Application

```bash
# Development mode
npm run dev

# Production build and run
npm run build
npm start
```

Accessible on your phone or computer at **`http://localhost:3000`**.
