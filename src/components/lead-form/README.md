# Universal Lead Form System

This system provides a single, centralized lead capture form that can be used across your entire site in two ways:

## 1. Modal Popup (Triggered by CTA Buttons)

Use the `useLeadFormModal` hook to open the form as a modal from any button:

```tsx
import { useLeadFormModal } from '@/hooks/useLeadFormModal';
import { Button } from '@/components/ui/button';

function MyComponent() {
  const { openModal } = useLeadFormModal();

  return (
    <Button onClick={() => openModal("24/7 Emergency Service Available")}>
      24/7 Emergency Service
    </Button>
  );
}
```

The header text you pass will be displayed at the top of the modal.

## 2. Embedded on Pages

Import and use the `LeadFormEmbed` component to display the form inline:

```tsx
import { LeadFormEmbed } from '@/components/lead-form/LeadFormEmbed';

function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      <LeadFormEmbed 
        headerText="Send Us a Message"
        showHeader={true}
      />
    </div>
  );
}
```

## Admin Configuration

Admins can customize the form at:
`/dashboard/settings/form-fields`

This includes:
- Service dropdown options
- Form heading and subheading
- Submit button text
- Success message
- Live preview of changes

## Features

- ✅ Auto-formats phone numbers as (XXX) XXX-XXXX
- ✅ Full validation on all required fields
- ✅ Creates lead record in database
- ✅ Creates customer user account automatically
- ✅ Sends welcome email with login credentials
- ✅ Logs activity for tracking
- ✅ Emergency checkbox with special styling
- ✅ Mobile responsive
- ✅ Single source of truth - edit once, updates everywhere
