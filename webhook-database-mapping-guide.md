# Webhook Database Mapping Guide

## Overview
This webhook allows you to update database records from Make.com (or any HTTP client) by sending POST requests with table name, row ID(s), and column-value mappings.

---

## 🔗 Webhook URL

```
https://tkrcdxkdfjeupbdlbcfz.supabase.co/functions/v1/database-webhook
```

---

## 🔐 Authentication

### Headers Required

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer YOUR_API_KEY` |
| `Content-Type` | `application/json` |

**Example Headers in Make.com:**
```
Authorization: Bearer [paste your LOCAL_DATABASE_KEY_API secret value here]
Content-Type: application/json
```

---

## ⚠️ CRITICAL: Handling HTML Content

When sending HTML content (especially AI-generated pages), you **MUST** ensure proper JSON encoding:

### Common Issue: Bad Control Characters
**Error**: `Bad control character in string literal in JSON at position 152`

**Cause**: HTML contains unescaped newlines, quotes, or special characters that break JSON parsing.

### ✅ Solution in Make.com:

**Option 1: Use Make.com's JSON Builder (Recommended)**
- Use the "Create JSON" module before your HTTP request
- Map your fields in the JSON module - Make.com will auto-escape everything
- Pass the output to the HTTP module's body

**Option 2: Ensure toString() is Used**
- Make sure AI-generated HTML is wrapped in `toString()` function
- Example: `{{toString(ai.output)}}`

**Option 3: Manual Text Functions**
- Use Make.com's `replace()` function to escape critical characters:
  - Replace `"` with `\"`
  - Replace newlines with `\n`

### ❌ DO NOT Include Markdown Code Fences
The AI should output raw HTML without:
- ` ```html ` at the beginning
- ` ``` ` at the end
- Any backticks wrapping the HTML

**The HTML should start directly with `<!DOCTYPE html>` and end with `</html>`**

---

## 📤 Request Format

### Method
```
POST
```

### Content Type
```
application/json (raw JSON)
```

---

## 📝 Single Row Update

### Example: Update Contact Us Page (DRAFT)

**Request Body:**
```json
{
  "table": "static_pages",
  "data": {
    "id": "518097ac-6e0d-4d8a-a5cf-cd20e0b64325",
    "updates": {
      "content_html_draft": "<h1>New Contact Page</h1><p>Updated content</p>",
      "meta_title": "Contact Us - Updated",
      "meta_description": "Get in touch with us today"
    }
  }
}
```

**Important:** Use `content_html_draft` for AI-generated drafts. When you click "Publish" in your app's AI editor, it will automatically move the draft content to `content_html` (the live version).

**Response (Success):**
```json
{
  "success": true,
  "updated": 1,
  "failed": 0,
  "results": [
    {
      "id": "518097ac-6e0d-4d8a-a5cf-cd20e0b64325",
      "success": true,
      "data": [
        {
          "id": "518097ac-6e0d-4d8a-a5cf-cd20e0b64325",
          "slug": "contact-us",
          "title": "Contact Us",
          "content_html": "<h1>New Contact Page</h1><p>Updated content</p>",
          "meta_title": "Contact Us - Updated",
          "meta_description": "Get in touch with us today"
        }
      ]
    }
  ]
}
```

---

## 📝 Multiple Rows Update

### Example: Update Multiple Service Pages

**Request Body:**
```json
{
  "table": "static_pages",
  "data": [
    {
      "id": "518097ac-6e0d-4d8a-a5cf-cd20e0b64325",
      "updates": {
        "content_html": "<h1>Contact Page</h1>",
        "meta_title": "Contact Us"
      }
    },
    {
      "id": "abc123def-4567-8901-2345-6789abcdef01",
      "updates": {
        "content_html": "<h1>About Page</h1>",
        "meta_title": "About Us"
      }
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "updated": 2,
  "failed": 0,
  "results": [
    {
      "id": "518097ac-6e0d-4d8a-a5cf-cd20e0b64325",
      "success": true,
      "data": [...]
    },
    {
      "id": "abc123def-4567-8901-2345-6789abcdef01",
      "success": true,
      "data": [...]
    }
  ]
}
```

---

## 🎯 Make.com Setup Guide

### Step 1: Add HTTP Module
1. Add "HTTP" → "Make a Request" module
2. Set **Method**: `POST`
3. Set **URL**: `https://tkrcdxkdfjeupbdlbcfz.supabase.co/functions/v1/database-webhook`

### Step 2: Configure Headers
Add these headers:

| Name | Value |
|------|-------|
| `Authorization` | `Bearer [YOUR_LOCAL_DATABASE_KEY_API]` |
| `Content-Type` | `application/json` |

### Step 3: Build Request Body

**For Single Row:**
```json
{
  "table": "{{1.tableName}}",
  "data": {
    "id": "{{1.rowId}}",
    "updates": {
      "{{1.column1}}": "{{1.value1}}",
      "{{1.column2}}": "{{1.value2}}"
    }
  }
}
```

**For Multiple Rows:**
```json
{
  "table": "{{1.tableName}}",
  "data": [
    {
      "id": "{{1.rowId1}}",
      "updates": {
        "{{1.column1}}": "{{1.value1}}"
      }
    },
    {
      "id": "{{1.rowId2}}",
      "updates": {
        "{{1.column1}}": "{{1.value1}}"
      }
    }
  ]
}
```

### Step 4: Map Your Values
- **table**: The database table name (e.g., `static_pages`, `services`, `accounts`)
- **id**: The UUID of the row you want to update
- **updates**: Object containing column names and their new values

---

## 🗂️ Common Tables

| Table Name | Description | Common Columns to Update |
|------------|-------------|--------------------------|
| `static_pages` | Static website pages | `content_html_draft` (for drafts), `content_html` (for published), `meta_title`, `meta_description` |
| `services` | Services offered | `name`, `full_description`, `starting_price` |
| `accounts` | Customer accounts | `account_name`, `notes`, `status` |
| `contacts` | Contact records | `first_name`, `last_name`, `email`, `phone` |
| `test_table` | Test data | `test_one`, `test_two`, `test_three` |

---

## 📋 Draft vs Published Content

### For `static_pages` table:

- **`content_html_draft`**: Use this column when sending AI-generated drafts from Make.com
- **`content_html`**: This is the live/published content shown on your website

### Workflow:
1. Make.com sends AI-edited content → Updates `content_html_draft`
2. You review the draft in your app's AI editor
3. Click "Publish" in the app → Automatically copies `content_html_draft` to `content_html`

**Always use `content_html_draft` for your Make.com automations!**

---

## ❌ Error Responses

### Missing Authorization
```json
{
  "error": "Missing or invalid Authorization header"
}
```
**Fix**: Add `Authorization: Bearer YOUR_API_KEY` header

### Invalid API Key
```json
{
  "error": "Invalid API key"
}
```
**Fix**: Verify your LOCAL_DATABASE_KEY_API secret value

### Missing Required Fields
```json
{
  "error": "Missing required fields: table and data"
}
```
**Fix**: Ensure your JSON includes both `table` and `data` fields

### Partial Success (Some Failed)
```json
{
  "success": false,
  "updated": 1,
  "failed": 1,
  "results": [...],
  "errors": [
    {
      "id": "abc123",
      "error": "Row not found or insufficient permissions"
    }
  ]
}
```

---

## 🧪 Testing Examples

### cURL Test (Single Row)
```bash
curl -X POST https://tkrcdxkdfjeupbdlbcfz.supabase.co/functions/v1/database-webhook \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "table": "test_table",
    "data": {
      "id": "PASTE_A_VALID_ID_HERE",
      "updates": {
        "test_one": "Updated A",
        "test_two": "Updated B"
      }
    }
  }'
```

### cURL Test (Multiple Rows)
```bash
curl -X POST https://tkrcdxkdfjeupbdlbcfz.supabase.co/functions/v1/database-webhook \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "table": "test_table",
    "data": [
      {
        "id": "ID_1",
        "updates": {"test_one": "Batch A"}
      },
      {
        "id": "ID_2",
        "updates": {"test_one": "Batch B"}
      }
    ]
  }'
```

---

## 💡 Pro Tips

1. **Always use valid UUIDs** for the `id` field
2. **Column names must match exactly** (case-sensitive)
3. **Test with a single row first** before bulk updates
4. **Check the response** for any errors in the `errors` array
5. **Use `test_table`** for initial testing before updating real data
6. **Keep your API key secret** - never commit it to code or share publicly

---

## 📊 Response Status Codes

| Code | Meaning |
|------|---------|
| `200` | All updates successful |
| `207` | Partial success (some failed) |
| `400` | Bad request (missing fields) |
| `401` | Unauthorized (missing auth header) |
| `403` | Forbidden (invalid API key) |
| `500` | Server error |

---

## 🔄 Real-World Make.com Scenario

**Scenario**: Update Contact Us page content from Make.com when a form is submitted

### Make.com Module Setup:
1. **Trigger**: Webhook or Form Submit
2. **HTTP Request Module**:
   - **URL**: `https://tkrcdxkdfjeupbdlbcfz.supabase.co/functions/v1/database-webhook`
   - **Method**: POST
   - **Headers**:
     ```
     Authorization: Bearer [YOUR_KEY]
     Content-Type: application/json
     ```
   - **Body**:
     ```json
     {
       "table": "static_pages",
       "data": {
         "id": "518097ac-6e0d-4d8a-a5cf-cd20e0b64325",
         "updates": {
           "content_html": "{{trigger.newContent}}",
           "updated_at": "{{now}}"
         }
       }
     }
     ```

---

## 🆘 Need Help?

Check the webhook logs in your backend for detailed error messages and debugging information.
