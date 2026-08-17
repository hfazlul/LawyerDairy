import type { CampaignTemplate } from './types'

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://lawyerdiarybd.com'

export type TemplateVars = {
  name?: string
  phone?: string
  couponCode?: string
  dealTitle?: string
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function wrap(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:1.25rem;margin:0 0 12px">${escapeHtml(title)}</h1>
  ${inner}
  <p style="margin-top:28px;font-size:0.85rem;color:#666">Lawyer Diary BD · <a href="${APP_URL()}">${APP_URL()}</a></p>
</body></html>`
}

/** Built-in campaign HTML for subscription / coupons / deals. */
export function renderCampaignTemplate(
  template: CampaignTemplate,
  vars: TemplateVars,
  customHtml?: string,
): { subject: string; html: string } {
  const name = vars.name?.trim() || 'সদস্য'
  const phone = vars.phone?.trim() || ''

  if (template === 'custom') {
    const html = (customHtml || '')
      .replaceAll('{{name}}', escapeHtml(name))
      .replaceAll('{{phone}}', escapeHtml(phone))
      .replaceAll('{{coupon}}', escapeHtml(vars.couponCode || ''))
      .replaceAll('{{deal}}', escapeHtml(vars.dealTitle || ''))
    return { subject: '', html }
  }

  if (template === 'subscription') {
    return {
      subject: 'Lawyer Diary BD — সাবস্ক্রিপশন রিমাইন্ডার',
      html: wrap(
        'সাবস্ক্রিপশন আপডেট',
        `<p>প্রিয় ${escapeHtml(name)},</p>
         <p>আপনার Lawyer Diary BD সাবস্ক্রিপশন পরীক্ষা করুন। প্ল্যান নবায়ন বা আপগ্রেড করতে ড্যাশবোর্ডে লগইন করুন।</p>
         <p><a href="${APP_URL()}/dashboard" style="display:inline-block;padding:10px 16px;background:#0b3d2e;color:#fff;text-decoration:none;border-radius:6px">ড্যাশবোর্ড খুলুন</a></p>`,
      ),
    }
  }

  if (template === 'coupons') {
    const code = vars.couponCode?.trim() || 'WELCOME'
    return {
      subject: 'Lawyer Diary BD — কুপন অফার',
      html: wrap(
        'আপনার কুপন',
        `<p>প্রিয় ${escapeHtml(name)},</p>
         <p>বিশেষ কুপন কোড: <strong style="letter-spacing:0.05em">${escapeHtml(code)}</strong></p>
         <p>চেকআউটে ব্যবহার করে সাবস্ক্রিপশনে ছাড় পান।</p>
         <p><a href="${APP_URL()}/pricing" style="display:inline-block;padding:10px 16px;background:#0b3d2e;color:#fff;text-decoration:none;border-radius:6px">অফার দেখুন</a></p>`,
      ),
    }
  }

  // deals
  const deal = vars.dealTitle?.trim() || 'বিশেষ অফার'
  return {
    subject: `Lawyer Diary BD — ${deal}`,
    html: wrap(
      deal,
      `<p>প্রিয় ${escapeHtml(name)},</p>
       <p>${escapeHtml(deal)} এখন উপলব্ধ। বিস্তারিত জানতে সাইটে দেখুন।</p>
       <p><a href="${APP_URL()}" style="display:inline-block;padding:10px 16px;background:#0b3d2e;color:#fff;text-decoration:none;border-radius:6px">বিস্তারিত</a></p>`,
    ),
  }
}

/** Apply {{name}} / {{phone}} placeholders on arbitrary HTML. */
export function personalizeHtml(html: string, vars: TemplateVars): string {
  return html
    .replaceAll('{{name}}', vars.name?.trim() || 'সদস্য')
    .replaceAll('{{phone}}', vars.phone?.trim() || '')
    .replaceAll('{{coupon}}', vars.couponCode || '')
    .replaceAll('{{deal}}', vars.dealTitle || '')
}
