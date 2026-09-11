import bg1 from "../assets/background/image.png";
import bg2 from "../assets/background/image copy.png";
import bg3 from "../assets/background/image copy 2.png";
import bg4 from "../assets/background/image copy 3.png";
import bg5 from "../assets/background/image copy 4.png";
import bg6 from "../assets/background/image copy 5.png";
import bg7 from "../assets/background/image copy 6.png";
import bg8 from "../assets/background/image copy 7.png";
import bg9 from "../assets/background/image copy 8.png";
import bg10 from "../assets/background/image copy 9.png";

export interface BackgroundItem {
  id: string;
  nameEn: string;
  nameKm: string;
  description: string;
  src: string;
}

export const BACKGROUND_PRESETS: BackgroundItem[] = [
  {
    id: "bg-1",
    nameEn: "Angkor Wat Sanctuary",
    nameKm: "រមណីយដ្ឋានអង្គរវត្ត",
    description: "Iconic Angkor spires with morning mist",
    src: bg1,
  },
  {
    id: "bg-2",
    nameEn: "Sacred Golden Dawn",
    nameKm: "រស្មីពណ៌មាសពិសិដ្ឋ",
    description: "Radiant golden glow across ancient temples",
    src: bg2,
  },
  {
    id: "bg-3",
    nameEn: "Bayon Royal Faces",
    nameKm: "ប្រាសាទបាយ័នសម័យអង្គរ",
    description: "Serene four-faced stone Bodhisattvas",
    src: bg3,
  },
  {
    id: "bg-4",
    nameEn: "Banteay Srei Rose Stone",
    nameKm: "បន្ទាយស្រីក្បាច់ផ្កាឈូក",
    description: "Exquisite high-relief rose sandstone filigree",
    src: bg4,
  },
  {
    id: "bg-5",
    nameEn: "Ta Prohm Ancient Jungle",
    nameKm: "ព្រៃបុរាណប្រាសាទតាព្រហ្ម",
    description: "Ancient stone towers embraced by sacred roots",
    src: bg5,
  },
  {
    id: "bg-6",
    nameEn: "Preah Vihear Mountain Cliff",
    nameKm: "ប្រាសាទព្រះវិហារលើកំពូលភ្នំ",
    description: "Cliffside sanctuary touching the clouds",
    src: bg6,
  },
  {
    id: "bg-7",
    nameEn: "Tonle Sap Twilight",
    nameKm: "ទិដ្ឋភាពទន្លេសាបពេលអស្តង្គត",
    description: "Peaceful waters reflecting the setting sun",
    src: bg7,
  },
  {
    id: "bg-8",
    nameEn: "Phnom Bakheng Sunset",
    nameKm: "ភ្នំបាខែងពេលសូរិយាអស្តង្គត",
    description: "Panoramic vistas bathed in amber dusk",
    src: bg8,
  },
  {
    id: "bg-9",
    nameEn: "Angkor Thom Victory Gate",
    nameKm: "ក្លោងទ្វារជ័យជំនះអង្គរធំ",
    description: "Majestic Causeway of Gods and Demons",
    src: bg9,
  },
  {
    id: "bg-10",
    nameEn: "Celestial Lotus Pavilion",
    nameKm: "វិមានផ្កាឈូកសួគ៌ា",
    description: "Spiritual Khmer sanctuary in divine serenity",
    src: bg10,
  },
];

export const DEFAULT_BACKGROUND_ID = "bg-1";

export function getBackgroundById(id?: string): BackgroundItem {
  if (!id) return BACKGROUND_PRESETS[0];
  const found = BACKGROUND_PRESETS.find((b) => b.id === id);
  return found || BACKGROUND_PRESETS[0];
}
