export type KhmerFontId =
  | "kantumruy"
  | "battambang"
  | "siemreap"
  | "moul"
  | "hanuman"
  | "notoserif"
  | "suwannaphum"
  | "kdamthmor"
  | "bayon"
  | "notosans";

export interface KhmerFontPreset {
  id: KhmerFontId;
  nameKhmer: string;
  nameEn: string;
  categoryKhmer: string;
  categoryEn: string;
  description: string;
  cssFamily: string;
  sampleKhmer: string;
  sampleTitle: string;
  bestFor: string;
}

export const KHMER_FONT_PRESETS: KhmerFontPreset[] = [
  {
    id: "kantumruy",
    nameKhmer: "កន្ទុំរុយ ប្រូ (Kantumruy Pro)",
    nameEn: "Kantumruy Pro",
    categoryKhmer: "ទំនើប & បច្ចេកវិទ្យា",
    categoryEn: "Modern Tech UI",
    description: "ពុម្ពអក្សរទំនើបកម្រិតខ្ពស់ ស្រាល ស្រួលអាន ពេញនិយមបំផុតសម្រាប់កម្មវិធីឌីជីថលជំនាន់ថ្មី។",
    cssFamily: "\"Kantumruy Pro\", \"Noto Sans Khmer\", \"Inter\", sans-serif",
    sampleKhmer: "ភាសាខ្មែរជាព្រលឹងជាតិ និងជាស្ពានតភ្ជាប់បច្ចេកវិទ្យា AI ជំនាន់ថ្មី",
    sampleTitle: "សាស្ត្រា AI បញ្ញាសិប្បនិម្មិត",
    bestFor: "ការសន្ទនាទូទៅ & ការអានលឿន (Chat & UI)",
  },
  {
    id: "battambang",
    nameKhmer: "បាត់ដំបង (Battambang)",
    nameEn: "Battambang",
    categoryKhmer: "តុល្យភាព & អានស្រួលភ្នែក",
    categoryEn: "Balanced Editorial",
    description: "ពុម្ពអក្សរស្តង់ដារខ្មែរ ច្បាស់ ទំហំសមាមាត្រល្អឥតខ្ចោះ មិនចាំងភ្នែកពេលអានយូរ។",
    cssFamily: "\"Battambang\", \"Noto Sans Khmer\", \"Inter\", sans-serif",
    sampleKhmer: "ចំណេះដឹងវិទ្យាសាស្ត្រ និងទស្សនវិជ្ជាខ្មែរបុរាណផ្សារភ្ជាប់គ្នាយ៉ាងសុខដុម",
    sampleTitle: "គតិបណ្ឌិតសាស្ត្រាចារ្យ",
    bestFor: "ការអានអត្ថបទវែងៗ (Long Form Reading)",
  },
  {
    id: "siemreap",
    nameKhmer: "សៀមរាប (Siemreap)",
    nameEn: "Siemreap",
    categoryKhmer: "ប្រពៃណី & សៀវភៅ",
    categoryEn: "Traditional Literary",
    description: "រចនាប័ទ្មបែបសៀវភៅអក្សរសិល្ប៍ខ្មែរ ស្រទន់ រលូន និងមានលក្ខណៈជាតិនិយមខ្ពស់។",
    cssFamily: "\"Siemreap\", \"Noto Sans Khmer\", \"Inter\", sans-serif",
    sampleKhmer: "ប្រាសាទអង្គរវត្តជាបេះដូងនៃអារ្យធម៌ខ្មែរដ៏រុងរឿងលើទឹកដីសុវណ្ណភូមិ",
    sampleTitle: "កេរដំណែលប្រវត្តិសាស្ត្រ",
    bestFor: "អក្សរសិល្ប៍ និងកំណាព្យខ្មែរ (Literature & Arts)",
  },
  {
    id: "moul",
    nameKhmer: "អក្សរមូល (Moul Royal)",
    nameEn: "Moul Royal",
    categoryKhmer: "រាជវាំង & សក្ការៈ",
    categoryEn: "Royal Monumental",
    description: "អក្សរមូលរាជវាំងដ៏ឧត្តុង្គឧត្តម ប្រើសម្រាប់ព្រះរាជក្រឹត្យ ចំណងជើងធំៗ និងព្រះធម៌។",
    cssFamily: "\"Moul\", \"Kantumruy Pro\", \"Noto Sans Khmer\", sans-serif",
    sampleKhmer: "ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ",
    sampleTitle: "ព្រះរាជកិច្ច AI",
    bestFor: "ចំណងជើង និងអត្ថបទសក្ការៈ (Royal Titles & Badges)",
  },
  {
    id: "hanuman",
    nameKhmer: "ហនុមាន (Hanuman Serif)",
    nameEn: "Hanuman Serif",
    categoryKhmer: "សេរីហ្វ & ប្រវត្តិសាស្ត្រ",
    categoryEn: "Historical Serif",
    description: "ពុម្ពអក្សរមានជើង (Serif) បែបបុរាណវិទ្យា ផ្តល់នូវអារម្មណ៍ថ្លៃថ្នូរ និងគួរឱ្យគោរព។",
    cssFamily: "\"Hanuman\", \"Noto Serif Khmer\", serif",
    sampleKhmer: "រឿងរ៉ាវប្រវត្តិសាស្ត្រ និងសិលាចារឹកខ្មែរបុរាណឆ្លុះបញ្ចាំងពីភាពរឹងមាំ",
    sampleTitle: "សិលាចារឹកខ្មែរ",
    bestFor: "ប្រវត្តិសាស្ត្រ និងឯកសារផ្លូវការ (History & Archives)",
  },
  {
    id: "notoserif",
    nameKhmer: "ណូតូ សេរីហ្វ (Noto Serif Khmer)",
    nameEn: "Noto Serif Khmer",
    categoryKhmer: "សិក្សាស្រាវជ្រាវ & ស្តង់ដារ",
    categoryEn: "Academic Serif",
    description: "ពុម្ពអក្សរសេរីហ្វលំដាប់អន្តរជាតិ មានកម្រិតច្បាស់ខ្ពស់ ស័ក្តិសមសម្រាប់ការស្រាវជ្រាវសិក្សា។",
    cssFamily: "\"Noto Serif Khmer\", \"Hanuman\", serif",
    sampleKhmer: "ការស្រាវជ្រាវវិទ្យាសាស្ត្រ និងទិន្នន័យភាសាវិទ្យាក្នុងយុគសម័យឌីជីថល",
    sampleTitle: "ការស្រាវជ្រាវអប់រំ",
    bestFor: "ការស្រាវជ្រាវ និងទិនានុប្បវត្តិ (Academic Papers)",
  },
  {
    id: "suwannaphum",
    nameKhmer: "សុវណ្ណភូមិ (Suwannaphum)",
    nameEn: "Suwannaphum",
    categoryKhmer: "ទន់ភ្លន់ & សុខដុម",
    categoryEn: "Gentle Harmony",
    description: "រាងអក្សរមូលទន់ភ្លន់ ផ្តល់អារម្មណ៍ស្ងប់ និងងាយស្រួលយល់សម្រាប់អ្នកអានគ្រប់វ័យ។",
    cssFamily: "\"Suwannaphum\", \"Noto Sans Khmer\", sans-serif",
    sampleKhmer: "សុខសន្តិភាព និងសុភមង្គលកើតចេញពីការចេះអត់ឱន និងការចែករំលែកចំណេះដឹង",
    sampleTitle: "សុខដុមរមនាជីវិត",
    bestFor: "ការសន្ទនាស្រាលៗ និងទស្សនវិជ្ជាជីវិត (Lifestyle & Mindfulness)",
  },
  {
    id: "kdamthmor",
    nameKhmer: "ក្តាមថ្ម ប្រូ (Kdam Thmor Pro)",
    nameEn: "Kdam Thmor Pro",
    categoryKhmer: "ធរណីមាត្រ & អនាគត",
    categoryEn: "Geometric Modern",
    description: "រាងអក្សរធរណីមាត្ររឹងមាំ មើលទៅដូចបច្ចេកវិទ្យា Coding និងរ៉ូបូតទំនើប។",
    cssFamily: "\"Kdam Thmor Pro\", \"Kantumruy Pro\", sans-serif",
    sampleKhmer: "ប្រព័ន្ធកូដ Programming និងស្ថាបត្យកម្មប្រព័ន្ធកុំព្យូទ័រឆ្លាតវៃ",
    sampleTitle: "បច្ចេកវិទ្យាកូដ",
    bestFor: "ការសរសេរកូដ និងបច្ចេកទេស (Code & Engineering)",
  },
  {
    id: "bayon",
    nameKhmer: "បាយ័ន (Bayon Stone)",
    nameEn: "Bayon Stone",
    categoryKhmer: "ចម្លាក់ថ្ម & អង្គរ",
    categoryEn: "Angkor Stone Inscription",
    description: "រចនាឡើងតាមគំរូចម្លាក់លើប្រាសាទបាយ័ន រឹងមាំ និងមានអំណាចបែបប្រវត្តិសាស្ត្រ។",
    cssFamily: "\"Bayon\", \"Moul\", sans-serif",
    sampleKhmer: "ស្នាមញញឹមព្រហ្មមុខបួននៃប្រាសាទបាយ័នឆ្លុះបញ្ចាំងពីមេត្តាធម៌",
    sampleTitle: "ចម្លាក់ថ្មបាយ័ន",
    bestFor: "ចំណងជើងសិល្បៈ និងរូបចម្លាក់ (Art & Sculptures)",
  },
  {
    id: "notosans",
    nameKhmer: "ណូតូ សាន (Noto Sans Khmer)",
    nameEn: "Noto Sans Khmer",
    categoryKhmer: "អព្យាក្រឹត្យ & ស្តង់ដារ",
    categoryEn: "Neutral Standard",
    description: "ពុម្ពអក្សរមូលដ្ឋានស្តង់ដារសកល មានភាពច្បាស់លាស់ និងភាពឆបគ្នាខ្ពស់គ្រប់ឧបករណ៍។",
    cssFamily: "\"Noto Sans Khmer\", \"Inter\", sans-serif",
    sampleKhmer: "ការអភិវឌ្ឍប្រព័ន្ធព័ត៌មានវិទ្យាប្រកបដោយស្តង់ដារខ្ពស់",
    sampleTitle: "ស្តង់ដារអន្តរជាតិ",
    bestFor: "ភាពឆបគ្នាជាសកល (Cross-Platform Default)",
  },
];

export const DEFAULT_FONT_ID: KhmerFontId = "kantumruy";

export function getFontById(id: string): KhmerFontPreset {
  return KHMER_FONT_PRESETS.find((f) => f.id === id) || KHMER_FONT_PRESETS[0];
}
