/* Receipt abbreviations and lines to skip. */
/* ---------- receipts ---------- */
const RECEIPT_ABBR = {
  MLK: "milk", WHL: "whole", CHKN: "chicken", CHK: "chicken", CKN: "chicken", CHIX: "chicken", BRST: "breast", BRSTS: "breast", BNLS: "", SKNLS: "", BL: "", SL: "",
  THGH: "thighs", THGHS: "thighs", GRD: "ground", GRND: "ground", BF: "beef", TRKY: "turkey", PRK: "pork", BCN: "bacon", SAUS: "sausage", SSG: "sausage",
  SLMN: "salmon", SHRMP: "shrimp", SHRIMP: "shrimp", EGG: "eggs", EGGS: "eggs", LG: "", XL: "", DZ: "", BUTR: "butter", BTR: "butter", CHS: "cheese",
  CHSE: "cheese", CHED: "cheddar", CHEDR: "cheddar", SHRD: "shredded", MOZZ: "mozzarella", MOZ: "mozzarella", PARM: "parmesan", YOG: "yogurt", YGRT: "yogurt",
  GRK: "greek", SRCRM: "sour cream", SR: "sour", CRM: "cream", HVY: "heavy", WHP: "whipping", BRD: "bread", WHT: "white", TORT: "tortillas", TRTLA: "tortillas",
  PSTA: "pasta", SPAG: "spaghetti", BNS: "beans", BN: "beans", BLK: "black", KDNY: "kidney", TOM: "tomatoes", TOMS: "tomatoes", TMT: "tomatoes", TOMATO: "tomatoes",
  ONN: "onion", ONIONS: "onion", YEL: "", YLW: "", POT: "potatoes", POTS: "potatoes", POTATO: "potatoes", SWT: "sweet", PEPR: "pepper", PPR: "pepper", PEPPER: "pepper",
  GRN: "green", BELL: "bell", CARR: "carrots", CRRT: "carrots", CARROT: "carrots", CELRY: "celery", CEL: "celery", BROC: "broccoli", BRCLI: "broccoli",
  CAUL: "cauliflower", CAULI: "cauliflower", SPNCH: "spinach", SPIN: "spinach", LETT: "lettuce", LTTC: "lettuce", ROM: "romaine", ROMAINE: "romaine",
  MUSH: "mushrooms", MSHRM: "mushrooms", MUSHRM: "mushrooms", ZUCC: "zucchini", ZUCH: "zucchini", CUC: "cucumber", CUKE: "cucumber", AVO: "avocado", AVOC: "avocado",
  AVOCADO: "avocado", BAN: "bananas", BNNA: "bananas", BANANA: "bananas", BANANAS: "bananas", APPL: "apples", APL: "apples", STRWB: "strawberries", STRAWB: "strawberries",
  STRBRY: "strawberries", BLUEB: "blueberries", BLBRY: "blueberries", BLUBRY: "blueberries", LMN: "lemon", LIM: "lime", LIMES: "lime", GRLC: "garlic", CILNTR: "cilantro",
  CIL: "cilantro", SCALL: "scallions", GRNONION: "scallions", JAL: "jalapeno", FRZ: "frozen", FRZN: "frozen", FZ: "frozen", PB: "peanut butter", MAYO: "mayonnaise",
  BRTH: "broth", BROTH: "broth", STK: "stock", OAT: "oats", OATS: "oats", RCE: "rice", PNT: "peanut", SLSA: "salsa", TOFU: "tofu", HAM: "ham", CORN: "corn",
  PEAS: "peas", GRBNZ: "chickpeas", CHKPEA: "chickpeas", LNTL: "lentils", COCO: "coconut", GV: "", KS: "", HT: "", MM: "", SIG: "", ORG: "", ORGANIC: "",
  NAT: "", CLSC: "", FAM: "", PK: "", PKG: "", CT: "", EA: "", OZ: "", LB: "", LBS: "", GAL: "", HLF: "", ITM: "", TX: "", RTL: "", REG: ""
};
const RECEIPT_SKIP = /\b(SUB\s*TOTAL|SUBTOTAL|TOTAL|TAX|CHANGE|CASH|VISA|MASTERCARD|AMEX|DEBIT|CREDIT|BALANCE|SAVINGS|SAVED|COUPON|DISCOUNT|THANK|STORE|TEL|PHONE|MEMBER|ITEMS?\s+SOLD|AUTH|APPROVED|CARD|REWARDS|POINTS|RECEIPT|CASHIER|REGISTER|TRANS|TERMINAL|REFUND|BOTTLE DEP|BAG FEE|WWW|HTTP|SURVEY|ACCOUNT|CHIP|PIN)\b/i;
