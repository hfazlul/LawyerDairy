import { NextResponse } from 'next/server'

const TEMPLATES = [
  { id: 'next_hearing', titleBn: 'পরবর্তী শুনানি', credits: 0, channel: 'whatsapp' },
  { id: 'hearing_today', titleBn: 'আজ উপস্থিত থাকুন', credits: 0, channel: 'whatsapp' },
  { id: 'date_changed', titleBn: 'তারিখ পরিবর্তন', credits: 0, channel: 'whatsapp' },
  { id: 'fee_reminder', titleBn: 'বকেয়া ফি', credits: 0, channel: 'whatsapp' },
  { id: 'document_request', titleBn: 'কাগজ চাওয়া', credits: 0, channel: 'whatsapp' },
  { id: 'order_passed', titleBn: 'আজকের আদেশ', credits: 0, channel: 'whatsapp' },
  { id: 'case_disposed', titleBn: 'নিষ্পত্তি', credits: 0, channel: 'whatsapp' },
  { id: 'meeting', titleBn: 'চেম্বারে সাক্ষাৎ', credits: 0, channel: 'whatsapp' },
]

export async function GET() {
  return NextResponse.json({
    templates: TEMPLATES,
    noteBn: 'WhatsApp Mode A ক্রেডিট কাটে না। এসএমএস সেগমেন্ট কাটে (বাংলা ৭০ অক্ষর)। মাসে ২০ ক্রেডিট; প্যাক ৳৩৯৯/৫০০ ওয়েবে।',
  })
}
