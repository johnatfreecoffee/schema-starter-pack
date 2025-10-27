# Page Builder Prompt Template

Use this template when building pages one at a time.

---

## PROMPT FORMAT

```
BUILD PAGE: [Page Name]
PAGE TYPE: [Static or Service]

Reference Files:
- Instructions: src/templates/AI_INSTRUCTIONS.md
- System Spec: src/templates/HTML_TEMPLATE_SPECIFICATION.md
- Page Spec: [see file path below based on page type]

Build the page following all specifications.
```

---

## FILE PATH REFERENCE

### Static Pages
**Location:** `src/templates/page-instructions/static-pages/[page-name].md`

**Available Static Pages:**
- `home.md` - Homepage
- `about.md` - About/Company page
- `contact.md` - Contact page
- `services.md` - Services overview page

**Example Prompt:**
```
BUILD PAGE: Home
PAGE TYPE: Static

Reference Files:
- Instructions: src/templates/AI_INSTRUCTIONS.md
- System Spec: src/templates/HTML_TEMPLATE_SPECIFICATION.md
- Page Spec: src/templates/page-instructions/static-pages/home.md

Build the page following all specifications.
```

---

### Service Template Pages

#### Granule Service Templates
**Location:** `src/templates/page-instructions/service-templates/granule-service/[service-name].md`

**Example Prompt:**
```
BUILD PAGE: [Service Name]
PAGE TYPE: Service

Reference Files:
- Instructions: src/templates/AI_INSTRUCTIONS.md
- System Spec: src/templates/HTML_TEMPLATE_SPECIFICATION.md
- Page Spec: src/templates/page-instructions/service-templates/granule-service/[service-name].md

Build the page following all specifications.
```

---

#### Emergency Service Templates
**Location:** `src/templates/page-instructions/service-templates/emergency-service/[service-name].md`

**Example Prompt:**
```
BUILD PAGE: [Service Name]
PAGE TYPE: Service

Reference Files:
- Instructions: src/templates/AI_INSTRUCTIONS.md
- System Spec: src/templates/HTML_TEMPLATE_SPECIFICATION.md
- Page Spec: src/templates/page-instructions/service-templates/emergency-service/[service-name].md

Build the page following all specifications.
```

---

#### Authority Hub Templates
**Location:** `src/templates/page-instructions/service-templates/authority-hub/[hub-name].md`

**Example Prompt:**
```
BUILD PAGE: [Hub Name]
PAGE TYPE: Service

Reference Files:
- Instructions: src/templates/AI_INSTRUCTIONS.md
- System Spec: src/templates/HTML_TEMPLATE_SPECIFICATION.md
- Page Spec: src/templates/page-instructions/service-templates/authority-hub/[hub-name].md

Build the page following all specifications.
```

---

## QUICK REFERENCE

**Folder Structure:**
```
src/templates/
├── AI_INSTRUCTIONS.md                    (Core instructions)
├── HTML_TEMPLATE_SPECIFICATION.md        (Technical specs)
├── PROMPT_TEMPLATE.md                    (This file)
└── page-instructions/
    ├── static-pages/                     (Home, About, Contact, Services)
    │   ├── home.md
    │   ├── about.md
    │   ├── contact.md
    │   └── services.md
    └── service-templates/
        ├── granule-service/              (Individual services)
        ├── emergency-service/            (Emergency-focused)
        └── authority-hub/                (Authority content)
```
