export type MouzaDistrict = {
  slug: string
  nameBn: string
  nameEn: string
  divisionId: string
  divisionBn: string
  divisionEn: string
}

export const MOUZA_DIVISIONS: { id: string; bn: string; en: string }[] = [
  { id: 'dhaka', bn: 'ঢাকা', en: 'Dhaka' },
  { id: 'chattogram', bn: 'চট্টগ্রাম', en: 'Chattogram' },
  { id: 'rajshahi', bn: 'রাজশাহী', en: 'Rajshahi' },
  { id: 'khulna', bn: 'খুলনা', en: 'Khulna' },
  { id: 'barishal', bn: 'বরিশাল', en: 'Barishal' },
  { id: 'sylhet', bn: 'সিলেট', en: 'Sylhet' },
  { id: 'rangpur', bn: 'রংপুর', en: 'Rangpur' },
  { id: 'mymensingh', bn: 'ময়মনসিংহ', en: 'Mymensingh' },
]

function d(
  slug: string, nameBn: string, nameEn: string, divisionId: string, divisionBn: string, divisionEn: string,
): MouzaDistrict {
  return { slug, nameBn, nameEn, divisionId, divisionBn, divisionEn }
}

export const MOUZA_DISTRICTS: MouzaDistrict[] = [
  d('metrodhaka', 'ঢাকা (মেট্রো)', 'Dhaka (metro)', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('gazipur', 'গাজীপুর', 'Gazipur', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('narayanganj', 'নারায়ণগঞ্জ', 'Narayanganj', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('narsingdi', 'নরসিংদী', 'Narsingdi', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('manikganj', 'মানিকগঞ্জ', 'Manikganj', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('munshiganj', 'মুন্সিগঞ্জ', 'Munshiganj', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('tangail', 'টাঙ্গাইল', 'Tangail', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('kishoreganj', 'কিশোরগঞ্জ', 'Kishoreganj', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('faridpur', 'ফরিদপুর', 'Faridpur', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('rajbari', 'রাজবাড়ী', 'Rajbari', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('gopalganj', 'গোপালগঞ্জ', 'Gopalganj', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('madaripur', 'মাদারীপুর', 'Madaripur', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('shariatpur', 'শরীয়তপুর', 'Shariatpur', 'dhaka', 'ঢাকা', 'Dhaka'),
  d('chattogram', 'চট্টগ্রাম', 'Chattogram', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('coxs-bazar', 'কক্সবাজার', "Cox's Bazar", 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('cumilla', 'কুমিল্লা', 'Cumilla', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('feni', 'ফেনী', 'Feni', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('noakhali', 'নোয়াখালী', 'Noakhali', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('lakshmipur', 'লক্ষ্মীপুর', 'Lakshmipur', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('chandpur', 'চাঁদপুর', 'Chandpur', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'Brahmanbaria', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('khagrachhari', 'খাগড়াছড়ি', 'Khagrachhari', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('rangamati', 'রাঙ্গামাটি', 'Rangamati', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('bandarban', 'বান্দরবান', 'Bandarban', 'chattogram', 'চট্টগ্রাম', 'Chattogram'),
  d('rajshahi', 'রাজশাহী', 'Rajshahi', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('bogura', 'বগুড়া', 'Bogura', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('pabna', 'পাবনা', 'Pabna', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('sirajganj', 'সিরাজগঞ্জ', 'Sirajganj', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('natore', 'নাটোর', 'Natore', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('naogaon', 'নওগাঁ', 'Naogaon', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('joypurhat', 'জয়পুরহাট', 'Joypurhat', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('chapainawabganj', 'চাঁপাইনবাবগঞ্জ', 'Chapainawabganj', 'rajshahi', 'রাজশাহী', 'Rajshahi'),
  d('khulna', 'খুলনা', 'Khulna', 'khulna', 'খুলনা', 'Khulna'),
  d('bagerhat', 'বাগেরহাট', 'Bagerhat', 'khulna', 'খুলনা', 'Khulna'),
  d('satkhira', 'সাতক্ষীরা', 'Satkhira', 'khulna', 'খুলনা', 'Khulna'),
  d('jashore', 'যশোর', 'Jashore', 'khulna', 'খুলনা', 'Khulna'),
  d('jhenaidah', 'ঝিনাইদহ', 'Jhenaidah', 'khulna', 'খুলনা', 'Khulna'),
  d('magura', 'মাগুরা', 'Magura', 'khulna', 'খুলনা', 'Khulna'),
  d('narail', 'নড়াইল', 'Narail', 'khulna', 'খুলনা', 'Khulna'),
  d('kushtia', 'কুষ্টিয়া', 'Kushtia', 'khulna', 'খুলনা', 'Khulna'),
  d('chuadanga', 'চুয়াডাঙ্গা', 'Chuadanga', 'khulna', 'খুলনা', 'Khulna'),
  d('meherpur', 'মেহেরপুর', 'Meherpur', 'khulna', 'খুলনা', 'Khulna'),
  d('barishal', 'বরিশাল', 'Barishal', 'barishal', 'বরিশাল', 'Barishal'),
  d('bhola', 'ভোলা', 'Bhola', 'barishal', 'বরিশাল', 'Barishal'),
  d('patuakhali', 'পটুয়াখালী', 'Patuakhali', 'barishal', 'বরিশাল', 'Barishal'),
  d('pirojpur', 'পিরোজপুর', 'Pirojpur', 'barishal', 'বরিশাল', 'Barishal'),
  d('jhalokathi', 'ঝালকাঠি', 'Jhalokathi', 'barishal', 'বরিশাল', 'Barishal'),
  d('barguna', 'বরগুনা', 'Barguna', 'barishal', 'বরিশাল', 'Barishal'),
  d('sylhet', 'সিলেট', 'Sylhet', 'sylhet', 'সিলেট', 'Sylhet'),
  d('moulvibazar', 'মৌলভীবাজার', 'Moulvibazar', 'sylhet', 'সিলেট', 'Sylhet'),
  d('habiganj', 'হবিগঞ্জ', 'Habiganj', 'sylhet', 'সিলেট', 'Sylhet'),
  d('sunamganj', 'সুনামগঞ্জ', 'Sunamganj', 'sylhet', 'সিলেট', 'Sylhet'),
  d('rangpur', 'রংপুর', 'Rangpur', 'rangpur', 'রংপুর', 'Rangpur'),
  d('dinajpur', 'দিনাজপুর', 'Dinajpur', 'rangpur', 'রংপুর', 'Rangpur'),
  d('kurigram', 'কুড়িগ্রাম', 'Kurigram', 'rangpur', 'রংপুর', 'Rangpur'),
  d('lalmonirhat', 'লালমনিরহাট', 'Lalmonirhat', 'rangpur', 'রংপুর', 'Rangpur'),
  d('nilphamari', 'নীলফামারী', 'Nilphamari', 'rangpur', 'রংপুর', 'Rangpur'),
  d('panchagarh', 'পঞ্চগড়', 'Panchagarh', 'rangpur', 'রংপুর', 'Rangpur'),
  d('thakurgaon', 'ঠাকুরগাঁও', 'Thakurgaon', 'rangpur', 'রংপুর', 'Rangpur'),
  d('gaibandha', 'গাইবান্ধা', 'Gaibandha', 'rangpur', 'রংপুর', 'Rangpur'),
  d('mymensingh', 'ময়মনসিংহ', 'Mymensingh', 'mymensingh', 'ময়মনসিংহ', 'Mymensingh'),
  d('jamalpur', 'জামালপুর', 'Jamalpur', 'mymensingh', 'ময়মনসিংহ', 'Mymensingh'),
  d('sherpur', 'শেরপুর', 'Sherpur', 'mymensingh', 'ময়মনসিংহ', 'Mymensingh'),
  d('netrokona', 'নেত্রকোণা', 'Netrokona', 'mymensingh', 'ময়মনসিংহ', 'Mymensingh'),
]

export function mouzaRateJudiciaryUrl(slug: string) {
  return `https://${slug}.judiciary.gov.bd/en/servicve-box-detail/mouza-rate`
}

export function mouzaDistrictsFor(divisionId?: string | null) {
  if (!divisionId) return MOUZA_DISTRICTS
  return MOUZA_DISTRICTS.filter((x) => x.divisionId === divisionId)
}

export const MOUZA_PORTAL_LINKS = [
  { href: 'https://www.land.gov.bd/', bn: 'ভূমি মন্ত্রণালয়', en: 'Ministry of Land' },
  { href: 'https://www.land.gov.bd/mouja-info?lang=bn', bn: 'মৌজা তথ্য (ভূমি বাতায়ন)', en: 'Mouza info (Land portal)' },
  { href: 'https://land.gov.bd/vumisheba-fee', bn: 'ভূমিসেবার নির্ধারিত ফি', en: 'Land service fees' },
  { href: 'https://www.judiciary.gov.bd/', bn: 'বাংলাদেশ জুডিশিয়ারি', en: 'Bangladesh Judiciary' },
  { href: 'https://eporcha.gov.bd/', bn: 'ই-পর্চা', en: 'e-Porcha' },
  { href: 'https://mutation.land.gov.bd/', bn: 'ই-মিউটেশন', en: 'e-Mutation' },
]
