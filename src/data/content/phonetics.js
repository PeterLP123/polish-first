const TOKENS = {
  softDz: "\uE000",
  hardDz: "\uE001",
  cz: "\uE002",
  sz: "\uE003",
  rz: "\uE004",
  ch: "\uE005",
  barredL: "\uE006",
  softC: "\uE007",
  softS: "\uE008",
  softN: "\uE009",
  softZ: "\uE00A",
};

// A compact English-friendly reading aid, not an IPA transcription. Ordered
// placeholders keep digraphs intact while the single-letter rules are applied.
export function toEnglishPhonetic(value) {
  return value
    .toLocaleLowerCase("pl")
    .replace(/dź|dzi/g, TOKENS.softDz)
    .replace(/dż/g, TOKENS.hardDz)
    .replace(/cz/g, TOKENS.cz)
    .replace(/sz/g, TOKENS.sz)
    .replace(/rz/g, TOKENS.rz)
    .replace(/ch/g, TOKENS.ch)
    .replace(/si(?=[aąeęioóuy])/g, TOKENS.softS)
    .replace(/ci(?=[aąeęioóuy])/g, TOKENS.softC)
    .replace(/ni(?=[aąeęioóuy])/g, TOKENS.softN)
    .replace(/zi(?=[aąeęioóuy])/g, TOKENS.softZ)
    .replace(/ż|ź/g, TOKENS.rz)
    .replace(/ś/g, TOKENS.softS)
    .replace(/ć/g, TOKENS.softC)
    .replace(/ń/g, TOKENS.softN)
    .replace(/ł/g, TOKENS.barredL)
    .replace(/w/g, "v")
    .replace(/c/g, "ts")
    .replace(/ó/g, "oo")
    .replace(/u/g, "oo")
    .replace(/ą/g, "on")
    .replace(/ę/g, "en")
    .replace(/y/g, "ih")
    .replace(/j/g, "y")
    .replaceAll(TOKENS.softDz, "j")
    .replaceAll(TOKENS.hardDz, "j")
    .replaceAll(TOKENS.cz, "ch")
    .replaceAll(TOKENS.sz, "sh")
    .replaceAll(TOKENS.rz, "zh")
    .replaceAll(TOKENS.ch, "h")
    .replaceAll(TOKENS.barredL, "w")
    .replaceAll(TOKENS.softC, "ch")
    .replaceAll(TOKENS.softS, "sh")
    .replaceAll(TOKENS.softN, "ny")
    .replaceAll(TOKENS.softZ, "zh");
}
