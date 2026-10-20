import { NextResponse } from 'next/server'

/** Verified government / judiciary deep links (doc 41). No embedding, no fake APIs. */
const SERVICES = [
  {
    id: 'bdlaws',
    nameBn: 'বাংলাদেশ আইন (bdlaws)',
    url: 'https://bdlaws.minlaw.gov.bd/',
    note: 'সংশোধিত আইন পাঠ — উৎস: আইন মন্ত্রণালয়',
  },
  {
    id: 'judiciary',
    nameBn: 'সুপ্রিম কোর্ট / জুডিশিয়ারি',
    url: 'https://www.judiciary.org.bd/',
    note: 'কজলিস্ট ও আদালত তথ্য — পাবলিক API নেই',
  },
  {
    id: 'barcouncil',
    nameBn: 'বাংলাদেশ বার কাউন্সিল',
    url: 'https://www.barcouncil.gov.bd/',
    note: 'এনরোলমেন্ট ও নোটিশ',
  },
  {
    id: 'mygov',
    nameBn: 'myGov বাংলাদেশ',
    url: 'https://www.mygov.bd/',
    note: 'সরকারি সেবা পোর্টাল — অ্যাপে এমবেড নয়',
  },
  {
    id: 'land',
    nameBn: 'ভূমি সেবা',
    url: 'https://land.gov.bd/',
    note: 'খতিয়ান / ভূমি সংক্রান্ত সেবা',
  },
  {
    id: 'ecourt',
    nameBn: 'ই-কোর্ট তথ্য',
    url: 'https://www.supremecourt.gov.bd/',
    note: 'সুপ্রিম কোর্ট অফিসিয়াল সাইট',
  },
]

export async function GET() {
  return NextResponse.json({ services: SERVICES })
}
