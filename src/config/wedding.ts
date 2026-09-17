import type { WeddingConfig } from './types'

/**
 * ✏️  Edit this file to personalise the whole site.
 * Text fields have an English (en) and Bengali (bn) version.
 * Still sample content: Aashirbaad / Gaye Holud / Bou Bhaat venues. Gallery uses stock photos.
 */
export const wedding: WeddingConfig = {
  defaultLang: 'en',

  // Groom
  groom: {
    firstName: { en: 'Ujjal', bn: 'উজ্জ্বল' },
    fullName: { en: 'Ujjal Dey Sarkar', bn: 'উজ্জ্বল দে সরকার' },
    parents: {
      relation: 'son',
      father: 'Mr. Uttam Dey Sarkar',
      mother: 'Mrs. Shyaama Dey Sarkar',
      bn: 'শ্রী উত্তম দে সরকার ও শ্রীমতী শ্যামা দে সরকারের পুত্র',
    },
    photo: '/images/couple/ujjal.jpg',
  },
  // Bride
  bride: {
    firstName: { en: 'Rupsha', bn: 'রূপসা' },
    fullName: { en: 'Rupsha Roy', bn: 'রূপসা রায়' },
    parents: {
      relation: 'daughter',
      father: 'Mr. Prantik Roy',
      mother: 'Mrs. Chhabita Roy',
      bn: 'শ্রী প্রান্তিক রায় ও শ্রীমতী ছবিতা রায়ের কন্যা',
    },
    photo: '/images/couple/rupsha.jpg',
  },
  hashtag: '#UjjalWedsRupsha', // English version only
  hosts: {
    // Groom's family first
    names: [
      { en: 'Uttam & Shyaama Dey Sarkar', bn: 'শ্রী উত্তম ও শ্রীমতী শ্যামা দে সরকার' },
      { en: 'Prantik & Chhabita Roy', bn: 'শ্রী প্রান্তিক ও শ্রীমতী ছবিতা রায়' },
    ],
    message: {
      en: 'invite you to the wedding of their children',
      bn: 'সাদর আমন্ত্রণ জানাচ্ছেন তাঁদের সন্তানদের শুভ বিবাহে',
    },
  },

  date: '2027-01-29T18:00:00+05:30',
  timeZone: 'Asia/Kolkata',
  city: { en: 'Siliguri, India', bn: 'শিলিগুড়ি, ভারত' },
  // heroImage: '/images/hero.jpg',

  // Shown only in the Bengali version
  bengali: {
    invocation: 'শ্রী শ্রী প্রজাপতয়ে নমঃ',
    greeting: 'শুভ বিবাহ',
    invitation: 'সপরিবারে আপনার উপস্থিতি একান্ত কাম্য',
    // banglaDate: '১৫ মাঘ ১৪৩৩', // format example — confirm the actual date with your purohit / panjika
  },

  intro: {
    en: 'Together with our families, we joyfully invite you to celebrate the beginning of our forever. Your presence would make our day complete.',
    bn: 'পরিবারের সকলের সঙ্গে, আমাদের নতুন জীবনের শুভ সূচনায় আপনাকে সানন্দে আমন্ত্রণ জানাই। আপনার উপস্থিতিই আমাদের দিনটিকে পূর্ণ করবে।',
  },

  story: [
    {
      year: '2023',
      motif: 'birds',
      title: { en: 'Where it all began', bn: 'প্রথম দেখা' },
      text: {
        en: 'Two strangers at the same event, one easy conversation, and a feeling neither of us could quite explain.',
        bn: 'একই অনুষ্ঠানে দুই অচেনা মানুষ, এক সহজ আলাপ, আর এমন এক অনুভূতি যা কেউই ঠিক বোঝাতে পারিনি।',
      },
    },
    {
      year: '2024',
      motif: 'ring',
      title: { en: 'The proposal', bn: 'প্রস্তাব' },
      text: {
        en: 'A year of long calls and little moments led to one nervous question and a very happy “yes”.',
        bn: 'এক বছরের লম্বা ফোনালাপ আর ছোট ছোট মুহূর্তের পর — কাঁপা গলায় একটি প্রশ্ন, আর এক খুশির “হ্যাঁ”।',
      },
    },
    {
      year: '2025',
      motif: 'boat',
      title: { en: 'First trip together', bn: 'প্রথম একসঙ্গে বেড়ানো' },
      text: {
        en: 'New places, unplanned detours and countless photos, and the discovery that home is wherever we are together.',
        bn: 'নতুন জায়গা, অপরিকল্পিত পথচলা আর অগুনতি ছবি — আর বুঝে নেওয়া, দুজনে একসঙ্গে থাকলেই সেটা ঘর।',
      },
    },
    {
      year: '2026',
      motif: 'homes',
      title: { en: 'When our families met', bn: 'দুই পরিবারের মিলন' },
      text: {
        en: 'Our parents finally met, and over stories and laughter two families began to feel like one.',
        bn: 'অবশেষে দুই বাড়ির বাবা-মায়ের দেখা — গল্পে আর হাসিতে দুটি পরিবার হয়ে উঠল এক।',
      },
    },
    {
      year: '2026',
      motif: 'rings',
      title: { en: 'The engagement', bn: 'বাগদান' },
      text: {
        en: 'With both families beside us and their blessings over us, we exchanged rings and made it official.',
        bn: 'দুই পরিবারের উপস্থিতি আর আশীর্বাদে আংটি বদল — এবার সবকিছু পাকাপাকি।',
      },
    },
    {
      year: '2027',
      motif: 'crowns',
      title: { en: 'Forever begins', bn: 'চিরকালের শুরু' },
      text: {
        en: 'With saat paak and sindoor daan we begin our forever, and we can’t wait to celebrate it with the people we love most.',
        bn: 'সাত পাক আর সিঁদুরদানে শুরু হবে আমাদের চিরকালের পথচলা — প্রিয় মানুষদের সঙ্গে সেই উদযাপনের অপেক্ষায়।',
      },
    },
  ],

  events: [
    {
      id: 'aashirbaad',
      name: { en: 'Aashirbaad', bn: 'আশীর্বাদ' },
      icon: 'blessing',
      theme: 'dhaan',
      start: '2027-01-27T11:00:00+05:30',
      end: '2027-01-27T14:00:00+05:30',
      venue: { en: 'Dey Sarkar Residence', bn: 'দে সরকার বাসভবন' },
      address: { en: '12 Lake Road, Kolkata', bn: '১২ লেক রোড, কলকাতা' },
      dressCode: { en: 'Traditional', bn: 'ঐতিহ্যবাহী পোশাক' },
      description: {
        en: 'Elders of both families bless the groom and bride with dhaan and durba.',
        bn: 'দুই পরিবারের গুরুজনেরা ধান-দূর্বা দিয়ে বর ও কনেকে আশীর্বাদ করবেন।',
      },
    },
    {
      id: 'gaye-holud',
      name: { en: 'Gaye Holud', bn: 'গায়ে হলুদ' },
      icon: 'turmeric',
      theme: 'haldi',
      start: '2027-01-29T08:00:00+05:30',
      end: '2027-01-29T11:00:00+05:30',
      venue: { en: 'Dey Sarkar Residence', bn: 'দে সরকার বাসভবন' },
      address: { en: '12 Lake Road, Kolkata', bn: '১২ লেক রোড, কলকাতা' },
      dressCode: { en: 'Yellow & white', bn: 'হলুদ ও সাদা' },
      description: {
        en: 'A morning of turmeric, conch shells and ululu as the tattva is sent to the bride.',
        bn: 'শাঁখ, উলুধ্বনি আর হলুদের সকাল — কনের বাড়িতে যাবে তত্ত্ব।',
      },
    },
    {
      id: 'biye',
      name: { en: 'Biye', bn: 'বিবাহ' },
      icon: 'heart',
      theme: 'sindoor',
      start: '2027-01-29T18:00:00+05:30',
      end: '2027-01-29T23:30:00+05:30',
      venue: { en: 'Siliguri Baghajatin Sporting Club', bn: 'শিলিগুড়ি বাঘাযতীন স্পোর্টিং ক্লাব' },
      address: { en: 'Pradhan Nagar, Siliguri', bn: 'প্রধাননগর, শিলিগুড়ি' },
      atVenue: true,
      dressCode: { en: 'Saree & dhoti-panjabi', bn: 'শাড়ি ও ধুতি-পাঞ্জাবি' },
      description: {
        en: 'Shubho Drishti, Mala Badal, Saat Paak and Sindoor Daan — the sacred union.',
        bn: 'শুভদৃষ্টি, মালাবদল, সাত পাক আর সিঁদুরদান — পবিত্র বন্ধনের শুভক্ষণ।',
      },
    },
    {
      id: 'bou-bhaat',
      name: { en: 'Bou Bhaat & Reception', bn: 'বৌভাত ও প্রীতিভোজ' },
      icon: 'feast',
      theme: 'kolapata',
      start: '2027-01-31T19:30:00+05:30',
      end: '2027-01-31T23:30:00+05:30',
      venue: { en: 'The Grand Ballroom', bn: 'দ্য গ্র্যান্ড বলরুম' },
      address: { en: 'Park Street, Kolkata', bn: 'পার্ক স্ট্রিট, কলকাতা' },
      dressCode: { en: 'Festive traditional', bn: 'উৎসবের সাজ' },
      description: {
        en: 'The new bride serves bhaat to the family, followed by dinner and celebration.',
        bn: 'নববধূ পরিবারের সবাইকে ভাত পরিবেশন করবেন, তারপর প্রীতিভোজ ও আনন্দ-উৎসব।',
      },
    },
  ],

  venue: {
    name: { en: 'Siliguri Baghajatin Sporting Club', bn: 'শিলিগুড়ি বাঘাযতীন স্পোর্টিং ক্লাব' },
    shortName: { en: 'Baghajatin Sporting Club', bn: 'বাঘাযতীন স্পোর্টিং ক্লাব' },
    address: {
      en: '45/1, Baghajotin Colony, Pradhan Nagar, Siliguri, West Bengal 734003',
      bn: '৪৫/১, বাঘাযতীন কলোনি, প্রধাননগর, শিলিগুড়ি, পশ্চিমবঙ্গ ৭৩৪০০৩',
    },
    // From Mappls (place UR35CD). Run `npm run routes` after changing any coordinates.
    coordinates: { lat: 26.733682, lng: 88.420173 },
    parking: true,
    journeys: [
      {
        id: 'airport',
        icon: 'plane',
        name: { en: 'Bagdogra Airport', bn: 'বাগডোগরা বিমানবন্দর' },
        short: { en: 'Bagdogra Airport', bn: 'বাগডোগরা বিমানবন্দর' },
        coordinates: { lat: 26.681774, lng: 88.330065 },
        labelSide: 'right',
      },
      {
        id: 'njp',
        icon: 'train',
        name: { en: 'New Jalpaiguri Junction (NJP)', bn: 'নিউ জলপাইগুড়ি জংশন' },
        short: { en: 'NJP Station', bn: 'এনজেপি স্টেশন' },
        coordinates: { lat: 26.682855, lng: 88.44248 },
        labelSide: 'bottom',
      },
      {
        id: 'bus',
        icon: 'bus',
        name: { en: 'Tenzing Norgay Bus Terminus', bn: 'তেনজিং নোরগে বাস টার্মিনাস' },
        short: { en: 'Bus Terminus', bn: 'বাস টার্মিনাস' },
        coordinates: { lat: 26.724968, lng: 88.414882 },
        labelSide: 'right',
      },
    ],
  },

  // Freely licensed photos from Wikimedia Commons (credited on the page, resized for the web).
  // To use your own: drop files in public/images/gallery and add { src, alt: { en, bn } } — no credit needed.
  gallery: [
    {
      src: '/images/gallery/shola-topor.jpg',
      alt: { en: 'Shola topor, the groom’s crown', bn: 'শোলার টোপর — বরের মুকুট' },
      credit: {
        author: 'Sumit Paul-Choudhury',
        license: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Topor.jpg',
      },
    },
    {
      src: '/images/gallery/shankha-pola.jpg',
      alt: { en: 'Shankha, pola & mehendi', bn: 'শাঁখা, পলা ও মেহেন্দি' },
      credit: {
        author: 'AnkitaaDeb',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Bride_wearing_Shankha_Pola_at_a_Bengali_Wedding.jpg',
      },
    },
    {
      src: '/images/gallery/alta.jpg',
      alt: { en: 'Alta for the bride', bn: 'কনের পায়ে আলতা' },
      credit: {
        author: 'Shounak Ray',
        license: 'CC BY-SA 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Feet-in-alta.jpg',
      },
    },
    {
      src: '/images/gallery/biye-bari-feast.jpg',
      alt: { en: 'The biye-bari feast', bn: 'বিয়েবাড়ির ভোজ' },
      credit: {
        author: 'Pulak Pattanayak',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Bengal_Wedding_Delight.JPG',
      },
    },
    {
      src: '/images/gallery/kanchenjunga.jpg',
      alt: { en: 'Kanchenjunga at sunrise', bn: 'সূর্যোদয়ে কাঞ্চনজঙ্ঘা' },
      credit: {
        author: 'Yuvraj Anand',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source:
          'https://commons.wikimedia.org/wiki/File:Morning_sunlight_on_Kangchenjunga_summit_view_from_Darjeeling,_West_Bengal.jpg',
      },
    },
    {
      src: '/images/gallery/siliguri-tea-garden.jpg',
      alt: { en: 'Tea gardens of Siliguri', bn: 'শিলিগুড়ির চা বাগান' },
      credit: {
        author: 'Chayandas0308',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:TEA_GARDEN,SILIGURI,INDIA.jpg',
      },
    },
  ],

  // Background music is off for now. Uncomment to play the original synthesised shehnai (Raag Yaman)
  // rendered by scripts/make-shehnai.py, or point it at your own mp3.
  // music: '/audio/shehnai.mp3',
}
