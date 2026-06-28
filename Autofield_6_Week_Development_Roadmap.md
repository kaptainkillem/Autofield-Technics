# Autofield Technics -- 6 Week Development Roadmap

# Overview

This roadmap splits responsibilities between **Developer A (Vic)** and
**Developer B (Jey)** to minimize merge conflicts and ensure the launch
focuses on the core business workflow.

## Core Launch Workflow

``` text
Lead
↓
Quote
↓
Accepted
↓
Job(s)
↓
Invoice
↓
Payment Tracking
↓
Receipt
↓
Completed
```

------------------------------------------------------------------------

# Week 1 -- Foundation

## Developer A (Vic)

### Quote Generator

-   Finish quote generator
-   Quote templates
-   Line items
-   Quantity
-   Unit price
-   Tax
-   Discount
-   Total
-   Draft saving
-   Edit drafts
-   Quote statuses
-   PDF generation
-   Send quote

**Database** - quotes - quote_items

### Invoice Generator

-   Generate invoice from accepted quote
-   Manual invoice creation
-   Walk-in invoice creation
-   Partial payment support
-   Cash/Card payment tracking
-   Outstanding balance
-   Invoice PDF
-   Receipt numbers

**Database** - invoices - invoice_items - payments

### Business Settings

Create one central place to store: - Business logo - Company name -
Phone - Email - VAT number - Registration number - Banking details -
Quote footer - Invoice footer

Everything should read from here.

### Quote → Invoice Pipeline

``` text
Lead
↓
Quote
↓
Accepted
↓
Invoice
↓
Paid
↓
Completed
```

## Developer B (Jey)

### Leads Page

-   Receive quote requests
-   Receive walk-in requests
-   Accept
-   Decline
-   Create Quote

### Quote Inbox

Statuses: - Draft - Sent - Viewed - Accepted - Declined - Expired

### Customer Dashboard

Display: - Quotes - Vehicles - Appointments - Reviews

### Security

-   Middleware
-   Role protection
-   API protection

------------------------------------------------------------------------

# Week 2

## Developer A

### PDF Engine

Reusable PDFs for: - Quotes - Invoices - Receipts

### Email Templates

-   Quote Ready
-   Invoice Ready
-   Receipt
-   Appointment
-   Reminder

### WhatsApp Templates

Pre-written messages so the admin only presses **Send**.

------------------------------------------------------------------------

## Developer B

### Booking System

Workflow:

``` text
Customer requests date
↓
Mechanic approves
↓
Booking confirmed
```

Rules: - One booking per slot

### Calendar

-   Month view
-   Week view
-   Day view
-   Block dates
-   Working hours
-   Upcoming jobs

### Appointment Cancellation

Customer can cancel. Admin sees changes instantly.

------------------------------------------------------------------------

# Week 3

## Developer A

### Jobs System

Accepted quote becomes one or more jobs.

Statuses: - Pending - In Progress - Completed - Cancelled

### Invoice Completion

Job ↓ Invoice ↓ Receipt

### Payment Tracking

Track only: - Cash - Card - Paid - Partial - Outstanding

(No payment processing.)

------------------------------------------------------------------------

## Developer B

### Customer Management

-   Create customer
-   Walk-in customer
-   Edit customer
-   Customer vehicles
-   Customer history

### Walk-in Workflow

``` text
Walk In
↓
Create Customer
↓
Create Quote
↓
Invoice
↓
Done
```

### Customer Profile

One page containing everything about the customer.

------------------------------------------------------------------------

# Week 4

## Developer A

### Reviews Logic

Rules: - Only customers with invoices can review. - One invoice = one
review. - Rating 4--5 stars = auto approve. - Rating 1--3 stars = admin
approval.

### Rate Limits

-   Max 3 quote requests/hour/IP
-   Signup limits
-   Review spam prevention

### API Validation

-   Zod validation
-   Security improvements

------------------------------------------------------------------------

## Developer B

### Admin Dashboard

Display: - Today's jobs - Revenue - Pending quotes - Accepted quotes -
Appointments - Outstanding payments - Reviews

### Real-Time Notifications

-   New quote
-   New booking
-   Cancelled booking
-   New review

### Dashboard Polish

-   Loading states
-   Empty states
-   Charts

------------------------------------------------------------------------

# Week 5

## Developer A

### Finance Module

-   Revenue
-   Outstanding payments
-   Paid invoices
-   Monthly reports
-   Yearly reports
-   Profit
-   Expenses
-   Manual expenses
-   Manual income
-   Download CSV/PDF

### Business Analytics

-   Revenue
-   Jobs
-   Quotes
-   Conversion rate
-   Repeat customers

------------------------------------------------------------------------

## Developer B

### Settings

-   Business
-   Financial
-   Quote
-   Working hours
-   Notifications
-   WhatsApp
-   Email
-   Branding

### Homepage Improvements

-   Animations
-   SEO
-   Performance
-   Accessibility

------------------------------------------------------------------------

# Week 6

## Developer A

### Final Testing

-   Quotes
-   Invoices
-   Jobs
-   Bookings
-   PDFs
-   Business Settings
-   Edge cases
-   Bug fixes

### Database Cleanup

-   Indexes
-   RLS
-   Types
-   Performance

------------------------------------------------------------------------

## Developer B

### Launch Polish

-   Responsive testing
-   Phone
-   Tablet
-   Desktop
-   Bug fixes
-   Error pages
-   Forms
-   Accessibility

------------------------------------------------------------------------

# Post Launch

## Developer A

-   Inventory
-   VIN Decoder
-   Expense Tracking
-   Finance Reports
-   Multi-mechanic Support
-   Public API

## Developer B

-   PWA
-   Push Notifications
-   Dark Mode
-   Analytics
-   Charts
-   Customer Portal Improvements

------------------------------------------------------------------------

# Ownership

## Developer A (Vic)

-   Quote Engine
-   Invoice Engine
-   Receipt Engine
-   Business Settings
-   PDF Engine
-   Jobs Logic
-   Payment Tracking
-   Finance Logic
-   Reviews Logic
-   Database Architecture
-   API Validation
-   Core Business Rules

## Developer B (Jey)

-   Leads
-   Quote Inbox
-   Booking System
-   Calendar
-   Customer Dashboard
-   Admin Dashboard
-   Notifications
-   Customer Management
-   Walk-in Customers
-   Homepage Polish
-   Settings UI
-   Responsive Design
-   Accessibility
-   Charts
-   Testing

------------------------------------------------------------------------

# Recommendation

The team should build features in this order:

1.  Quote System
2.  Invoice System
3.  Jobs System
4.  Booking & Calendar
5.  Customer Dashboard
6.  Admin Dashboard
7.  Notifications
8.  Finance
9.  Polish & Launch
