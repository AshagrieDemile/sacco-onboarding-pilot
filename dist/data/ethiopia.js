export const itemName = (item, locale) => locale === "am" && item.nameAm !== undefined ? item.nameAm : item.name;
export const childrenOf = (list, parent) => parent === undefined ? [] : list.filter((i) => i.parent === parent);
export const REGIONS = [
    { code: "addis-ababa", name: "Addis Ababa", nameAm: "አዲስ አበባ" },
    { code: "afar", name: "Afar", nameAm: "አፋር" },
    { code: "amhara", name: "Amhara", nameAm: "አማራ" },
    { code: "benishangul-gumuz", name: "Benishangul-Gumuz", nameAm: "ቤንሻንጉል ጉሙዝ" },
    { code: "central-ethiopia", name: "Central Ethiopia", nameAm: "ማዕከላዊ ኢትዮጵያ" },
    { code: "dire-dawa", name: "Dire Dawa", nameAm: "ድሬዳዋ" },
    { code: "gambela", name: "Gambela", nameAm: "ጋምቤላ" },
    { code: "harari", name: "Harari", nameAm: "ሐረሪ" },
    { code: "oromia", name: "Oromia", nameAm: "ኦሮሚያ" },
    { code: "sidama", name: "Sidama", nameAm: "ሲዳማ" },
    { code: "somali", name: "Somali", nameAm: "ሶማሌ" },
    { code: "south-ethiopia", name: "South Ethiopia", nameAm: "ደቡብ ኢትዮጵያ" },
    { code: "south-west-ethiopia", name: "South West Ethiopia", nameAm: "ደቡብ ምዕራብ ኢትዮጵያ" },
    { code: "tigray", name: "Tigray", nameAm: "ትግራይ" },
];
export const ZONES = [
    { code: "aa-addis-ketema", parent: "addis-ababa", name: "Addis Ketema", nameAm: "አዲስ ከተማ" },
    { code: "aa-akaki-kality", parent: "addis-ababa", name: "Akaki Kality", nameAm: "አቃቂ ቃሊቲ" },
    { code: "aa-arada", parent: "addis-ababa", name: "Arada", nameAm: "አራዳ" },
    { code: "aa-bole", parent: "addis-ababa", name: "Bole", nameAm: "ቦሌ" },
    { code: "aa-gullele", parent: "addis-ababa", name: "Gullele", nameAm: "ጉለሌ" },
    { code: "aa-kirkos", parent: "addis-ababa", name: "Kirkos", nameAm: "ቂርቆስ" },
    { code: "aa-kolfe-keranio", parent: "addis-ababa", name: "Kolfe Keranio", nameAm: "ኮልፌ ቀራኒዮ" },
    { code: "aa-lideta", parent: "addis-ababa", name: "Lideta", nameAm: "ልደታ" },
    { code: "aa-nifas-silk-lafto", parent: "addis-ababa", name: "Nifas Silk-Lafto", nameAm: "ንፋስ ስልክ ላፍቶ" },
    { code: "aa-yeka", parent: "addis-ababa", name: "Yeka", nameAm: "የካ" },
    { code: "aa-lemi-kura", parent: "addis-ababa", name: "Lemi Kura", nameAm: "ለሚ ኩራ" },
    { code: "am-north-gondar", parent: "amhara", name: "North Gondar", nameAm: "ሰሜን ጎንደር" },
    { code: "am-south-gondar", parent: "amhara", name: "South Gondar", nameAm: "ደቡብ ጎንደር" },
    { code: "am-west-gojjam", parent: "amhara", name: "West Gojjam", nameAm: "ምዕራብ ጎጃም" },
    { code: "or-east-shewa", parent: "oromia", name: "East Shewa", nameAm: "ምሥራቅ ሸዋ" },
    { code: "or-west-shewa", parent: "oromia", name: "West Shewa", nameAm: "ምዕራብ ሸዋ" },
];
export const WOREDAS = [
    { code: "aa-bole-w03", parent: "aa-bole", name: "Woreda 03", nameAm: "ወረዳ 03" },
    { code: "aa-bole-w05", parent: "aa-bole", name: "Woreda 05", nameAm: "ወረዳ 05" },
    { code: "aa-kirkos-w01", parent: "aa-kirkos", name: "Woreda 01", nameAm: "ወረዳ 01" },
    { code: "aa-yeka-w06", parent: "aa-yeka", name: "Woreda 06", nameAm: "ወረዳ 06" },
    { code: "aa-addis-ketema-w02", parent: "aa-addis-ketema", name: "Woreda 02", nameAm: "ወረዳ 02" },
    { code: "aa-lemi-kura-w04", parent: "aa-lemi-kura", name: "Woreda 04", nameAm: "ወረዳ 04" },
    { code: "am-ng-dabat", parent: "am-north-gondar", name: "Dabat" },
    { code: "or-es-adama", parent: "or-east-shewa", name: "Adama" },
];
export const ADDIS_SUBCITY_WOREDA_COUNTS = {
    "aa-addis-ketema": 14,
    "aa-akaki-kality": 13,
    "aa-arada": 10,
    "aa-bole": 14,
    "aa-gullele": 10,
    "aa-kirkos": 11,
    "aa-kolfe-keranio": 15,
    "aa-lideta": 10,
    "aa-nifas-silk-lafto": 15,
    "aa-yeka": 13,
    "aa-lemi-kura": 14,
};
export const isAddisSubCity = (zoneCode) => zoneCode !== undefined && zoneCode in ADDIS_SUBCITY_WOREDA_COUNTS;
export const addisWoredaCount = (zoneCode) => zoneCode !== undefined ? (ADDIS_SUBCITY_WOREDA_COUNTS[zoneCode] ?? 0) : 0;
export const normaliseWoredaInput = (raw) => raw.replace(/\D+/g, "").slice(0, 2);
export const canonicalWoreda = (raw) => {
    const digits = raw.replace(/\D+/g, "");
    if (digits === "")
        return "";
    return String(Number(digits)).padStart(2, "0");
};
export const isValidAddisWoreda = (zoneCode, raw) => {
    const digits = raw.replace(/\D+/g, "");
    if (digits === "" || digits.length > 2 || !/^\d+$/.test(digits))
        return false;
    const n = Number(digits);
    const count = addisWoredaCount(zoneCode);
    return n >= 1 && count > 0 && n <= count;
};
export const formatWoreda = (raw, locale) => {
    const digits = raw.replace(/\D+/g, "");
    if (digits !== "" && digits.length <= 2 && /^\d+$/.test(raw.trim())) {
        const nn = canonicalWoreda(digits);
        return locale === "am" ? `ወረዳ ${nn}` : `Woreda ${nn}`;
    }
    return lookupAdminName(raw, locale);
};
export const CITIES = [
    { code: "aa-bole-city", parent: "aa-bole-w03", name: "Addis Ababa", nameAm: "አዲስ አበባ" },
    { code: "or-es-adama-city", parent: "or-es-adama", name: "Adama", nameAm: "አዳማ" },
];
export const BANKS = [
    { code: "cbe", name: "Commercial Bank of Ethiopia", nameAm: "የኢትዮጵያ ንግድ ባንክ" },
    { code: "awash", name: "Awash Bank", nameAm: "አዋሽ ባንክ" },
    { code: "dashen", name: "Dashen Bank", nameAm: "ዳሽን ባንክ" },
    { code: "abyssinia", name: "Bank of Abyssinia", nameAm: "አቢሲኒያ ባንክ" },
    { code: "coop", name: "Cooperative Bank of Oromia", nameAm: "የኦሮሚያ ኅብረት ሥራ ባንክ" },
];
export const MOBILE_OPERATORS = [
    { code: "ethiotelecom", name: "Ethio Telecom", nameAm: "ኢትዮ ቴሌኮም" },
    { code: "safaricom", name: "Safaricom Ethiopia", nameAm: "ሳፋሪኮም ኢትዮጵያ" },
];
export const ID_DOCUMENT_TYPES = [
    { code: "fayda", name: "Fayda National ID", nameAm: "ፋይዳ መታወቂያ" },
    { code: "passport", name: "Passport", nameAm: "ፓስፖርት" },
    { code: "driving-licence", name: "Driving Licence", nameAm: "የመንጃ ፈቃድ" },
    { code: "kebele-id", name: "Kebele ID", nameAm: "የቀበሌ መታወቂያ" },
];
export const LANGUAGES = [
    { code: "am", name: "Amharic", nameAm: "አማርኛ" },
    { code: "en", name: "English", nameAm: "እንግሊዝኛ" },
    { code: "om", name: "Afaan Oromo", nameAm: "ኦሮምኛ" },
    { code: "ti", name: "Tigrinya", nameAm: "ትግርኛ" },
    { code: "so", name: "Somali", nameAm: "ሶማልኛ" },
];
export const NATIONALITIES = [
    { code: "et", name: "Ethiopian", nameAm: "ኢትዮጵያዊ" },
    { code: "other", name: "Other", nameAm: "ሌላ" },
];
export const OCCUPATIONS = [
    { code: "employed", name: "Employed", nameAm: "ተቀጣሪ" },
    { code: "self-employed", name: "Self-employed", nameAm: "የግል ሥራ" },
    { code: "farmer", name: "Farmer", nameAm: "ገበሬ" },
    { code: "trader", name: "Trader", nameAm: "ነጋዴ" },
    { code: "student", name: "Student", nameAm: "ተማሪ" },
    { code: "retired", name: "Retired", nameAm: "ጡረተኛ" },
    { code: "other", name: "Other", nameAm: "ሌላ" },
];
export const EDUCATIONAL_LEVELS = [
    { code: "none", name: "No formal education", nameAm: "መደበኛ ትምህርት የለም" },
    { code: "primary", name: "Primary", nameAm: "የመጀመሪያ ደረጃ" },
    { code: "secondary", name: "Secondary", nameAm: "ሁለተኛ ደረጃ" },
    { code: "tvet", name: "TVET / Diploma", nameAm: "ቴክኒክና ሙያ / ዲፕሎማ" },
    { code: "degree", name: "Bachelor's degree", nameAm: "የመጀመሪያ ዲግሪ" },
    { code: "postgraduate", name: "Postgraduate", nameAm: "ድህረ ምረቃ" },
];
export const MARITAL_STATUS = [
    { code: "single", name: "Single", nameAm: "ያላገባ" },
    { code: "married", name: "Married", nameAm: "ያገባ" },
    { code: "divorced", name: "Divorced", nameAm: "የተፋታ" },
    { code: "widowed", name: "Widowed", nameAm: "የሞተበት/ባት" },
];
export const VEHICLE_CATEGORIES = [
    { code: "motorcycle", name: "Motorcycle", nameAm: "ሞተር ሳይክል" },
    { code: "automobile", name: "Automobile", nameAm: "አውቶሞቢል" },
    { code: "minibus", name: "Minibus", nameAm: "ሚኒባስ" },
    { code: "bus", name: "Bus", nameAm: "አውቶቡስ" },
    { code: "truck", name: "Truck", nameAm: "የጭነት መኪና" },
    { code: "three-wheeler", name: "Three-wheeler (Bajaj)", nameAm: "ባጃጅ" },
];
export const SACCO_CLASSIFICATIONS = [
    { code: "saving-credit", name: "Saving & Credit", nameAm: "ቁጠባና ብድር" },
    { code: "agricultural", name: "Agricultural", nameAm: "ግብርና" },
    { code: "housing", name: "Housing", nameAm: "የቤቶች" },
    { code: "multipurpose", name: "Multipurpose", nameAm: "ብዙ ዓላማ" },
    { code: "transport", name: "Transport", nameAm: "ትራንስፖርት" },
    { code: "consumer", name: "Consumer", nameAm: "የሸማቾች" },
];
export const addressData = {
    regions: () => REGIONS,
    zones: (region) => childrenOf(ZONES, region),
    woredas: (zone) => childrenOf(WOREDAS, zone),
    cities: (woreda) => childrenOf(CITIES, woreda),
};
export const dataLibrary = {
    address: addressData,
    banks: () => BANKS,
    mobileOperators: () => MOBILE_OPERATORS,
    idDocumentTypes: () => ID_DOCUMENT_TYPES,
    languages: () => LANGUAGES,
    nationalities: () => NATIONALITIES,
    occupations: () => OCCUPATIONS,
    educationalLevels: () => EDUCATIONAL_LEVELS,
    maritalStatus: () => MARITAL_STATUS,
    vehicleCategories: () => VEHICLE_CATEGORIES,
    saccoClassifications: () => SACCO_CLASSIFICATIONS,
};
export const lookupAdminName = (code, locale) => {
    for (const list of [REGIONS, ZONES, WOREDAS, CITIES]) {
        const hit = list.find((i) => i.code === code);
        if (hit)
            return locale === "am" && hit.nameAm !== undefined ? hit.nameAm : hit.name;
    }
    return code;
};
export const DATASET_CATEGORIES = [
    "administrative-divisions", "banks", "mobile-operators", "identity-document-types",
    "languages", "nationalities", "occupations", "educational-levels", "marital-status",
    "vehicle-categories", "sacco-classifications",
];
