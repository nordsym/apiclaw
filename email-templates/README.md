# APIClaw Email Templates

Official HTML email templates for APIClaw communications.

## Design System

**Brand Colors:**
- Primary Red: `#ef4444`
- Background: `#fafafa`
- Card Background: `#ffffff`
- Text Primary: `#1a1a1a`
- Text Secondary: `#4b5563`
- Text Muted: `#6b7280`
- Border: `#e5e7eb`
- Highlight Background: `#fef2f2`

**Typography:**
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- Headers: Bold, red (`#ef4444`)
- Body: Regular, dark gray (`#4b5563`)
- Code blocks: Monospace, gray background (`#f9fafb`)

**Layout:**
- Max width: 600px
- Card style with rounded corners (16px)
- Subtle shadow and border
- Responsive padding
- Center-aligned container

## Templates

### `partnership-template.html`
**Use for:** Partnership outreach, integration proposals, technical follow-ups

**Variables to replace:**
- `{{EMAIL_TITLE}}` - Main heading (e.g., "APIClaw × Apideck")
- `{{EMAIL_SUBTITLE}}` - Subtitle (e.g., "Partnership Follow-up")
- `{{GREETING}}` - Opening (e.g., "Hi Pratham,")
- `{{INTRO_TEXT}}` - First paragraph
- `{{SECTION_X_TITLE}}` - Section headings
- `{{SECTION_X_CONTENT}}` - Section content (can include HTML lists, paragraphs)
- `{{HIGHLIGHT_TITLE}}` - Callout box title
- `{{HIGHLIGHT_TEXT}}` - Callout box content
- `{{CODE_BLOCK}}` - Technical/code content (optional)
- `{{CTA_LINK}}` - Button URL
- `{{CTA_TEXT}}` - Button text
- `{{CLOSING_TEXT}}` - Closing paragraph
- `{{FOOTER_TEXT}}` - Footer context (e.g., "APIClaw × Apideck • March 2026")

**Structure:**
1. Header with logo + title
2. Greeting + intro
3. Multiple sections with red headings
4. Optional highlight box
5. Optional code block
6. CTA button
7. Closing + signature
8. Footer

## Usage

Send via n8n workflow:

```bash
curl -s -X POST "https://nordsym.app.n8n.cloud/webhook/symbot-gmail" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "to": "recipient@example.com",
    "subject": "Subject line",
    "message": "'"$(cat partnership-template.html | sed 's/{{VAR}}/value/g')"'"
  }'
```

Or use `action: "smtp"` for sending from `Symbot@nordsym.com`.

## Design Principles

✅ **DO:**
- Use light mode (professional, readable)
- Keep sections scannable
- Use red for emphasis sparingly
- Include clear CTA
- Test in both light and dark mode (email clients auto-convert)
- Maintain 600px max width for readability

❌ **DON'T:**
- Use dark mode as default
- Overuse red color
- Create walls of text
- Skip the highlight box for key points
- Forget mobile responsiveness

## Created

**Date:** 2026-03-24  
**Design:** Light APIClaw theme matching MoU pages  
**First use:** Pratham/Apideck partnership follow-up (draft)

## Notes

Design is production-ready. Copy/content templates can be improved iteratively.

Each email should feel like it came from the same visual system as apiclaw.nordsym.com.
