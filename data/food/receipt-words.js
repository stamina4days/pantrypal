/* Receipt shorthand and the lines to skip. Stores squeeze names to fit, so "CHKN BRST BNLS" needs
   RECEIPT_ABBR to become "chicken breast". An empty string drops the word. */
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
  NAT: "", CLSC: "", FAM: "", PK: "", PKG: "", CT: "", EA: "", OZ: "", LB: "", LBS: "", GAL: "", HLF: "", ITM: "", TX: "", RTL: "", REG: "",
  // More store codes: fruit, dairy, bakery, meat, pantry, and store brand tags to drop
  STRWBRY: "strawberries", STRWBRRY: "strawberries", RASPB: "raspberries", RSPBRY: "raspberries", BLKBRY: "blackberries", GRP: "grapes", GRPS: "grapes",
  ORNG: "oranges", ORNGS: "oranges", PCH: "peaches", PEACH: "peaches", PNAPL: "pineapple", PINEAPL: "pineapple", WTRMLN: "watermelon", MNGO: "mango", PEAR: "pears",
  CLMNTN: "clementines", CUTIES: "clementines", KIWI: "kiwi", CANT: "cantaloupe", CNTLP: "cantaloupe",
  HRTS: "hearts", HRT: "hearts", ASPRG: "asparagus", ASPAR: "asparagus", GRNBN: "green beans", CABB: "cabbage", CBG: "cabbage", KALE: "kale", SQSH: "squash", BTRNT: "butternut", EGGPLNT: "eggplant",
  RADSH: "radishes", BEETS: "beets", GNGR: "ginger", PRSLY: "parsley", BASL: "basil", SHALLT: "shallot", SLD: "salad", SPRNG: "spring", MIX: "mix",
  SKM: "skim", FF: "", CHOC: "chocolate", HNH: "half and half", CREAMR: "creamer", CRMR: "creamer", COTT: "cottage", CTG: "cottage", RICOT: "ricotta",
  CRMCHS: "cream cheese", SWS: "swiss", PROV: "provolone", AMER: "american", STRNG: "string", ICECRM: "ice cream", ICE: "ice",
  BGL: "bagels", BGLS: "bagels", ENG: "english", MUFF: "muffins", MFN: "muffins", BUNS: "buns", HMBRGR: "hamburger", HMBG: "hamburger", HTDG: "hot dog",
  CRSNT: "croissants", ROLLS: "rolls", WHEAT: "wheat", WW: "whole wheat", SRDGH: "sourdough", PITA: "pita",
  STEAK: "steak", RIBEYE: "steak", SRLN: "sirloin", ROAST: "roast", LMB: "lamb", TLPIA: "tilapia", COD: "cod", TUNA: "tuna",
  DELI: "", LNCH: "lunch", TRKYBRST: "turkey breast", PEPP: "pepperoni", PPRNI: "pepperoni", SALAMI: "salami", NUGG: "nuggets", NUG: "nuggets", WNGS: "wings",
  CRL: "cereal", CEREAL: "cereal", CRKR: "crackers", CRKRS: "crackers", GRNLA: "granola", PNKC: "pancake", SYRP: "syrup", HNY: "honey", JLLY: "jelly",
  JAM: "jam", SPGTI: "spaghetti", MAC: "macaroni", MACN: "macaroni", NDL: "noodles", NDLS: "noodles", RAMN: "ramen", MARIN: "marinara", SCE: "sauce", SAUCE: "sauce",
  KETCH: "ketchup", KTCHP: "ketchup", MUST: "mustard", MSTRD: "mustard", RNCH: "ranch", DRSG: "dressing", DRSNG: "dressing", VEG: "vegetable", OLV: "olive", OIL: "oil",
  SUGR: "sugar", SGR: "sugar", FLR: "flour", BKG: "baking", PWDR: "powder", VAN: "vanilla", CNMN: "cinnamon", SALT: "salt",
  CND: "canned", CN: "", CNS: "", CHKPEAS: "chickpeas", PNTO: "pinto", REFR: "refried", TOMPST: "tomato paste", DICED: "diced", CRSHD: "crushed",
  OJ: "orange juice", JCE: "juice", JUICE: "juice", APLJ: "apple juice", COFF: "coffee", COFFEE: "coffee", TEA: "tea", WTR: "water", SPRKL: "sparkling",
  PZZ: "pizza", PZA: "pizza", PIZZA: "pizza", FRIES: "fries", WFFL: "waffles", WAFFLE: "waffles", MXD: "mixed", MXDVEG: "mixed vegetables", BRCFLR: "broccoli florets",
  KRO: "", KROGER: "", PL: "", PLS: "", SMRT: "", SMART: "", MKR: "", SB: "", TRADER: "", JOES: "", GG: "", MKT: "", SEL: "", SELECT: "", PRIV: "", BRAND: "",
  EACH: "", BAG: "", BAGGED: "", BNCH: "", BUNCH: "", HD: "", HEAD: "", CRT: "", CARTON: "", JAR: "", BTL: "", BOTTLE: "", CAN: "", BOX: "", PCK: "", VAL: "", VALUE: ""
};
/* Things stores sell that aren't food. A line with one of these is never guessed into a food name, and starts unchecked. */
const RECEIPT_NONFOOD = /\b(SOAP|DISH|PAPER|TOWELS?|TISSUE|TOILET|NAPKINS?|DETERG\w*|BLEACH|CLEANER|WIPES|SHAMPOO|CONDITNR|CONDITIONER|LOTION|DEODOR\w*|TOOTH\w*|RAZOR|DIAPERS?|BATTER(Y|IES)|BULBS?|FOIL|WRAP|ZIPLOC|TRASH|GARBAGE|BAGS|PLATES|CUPS|FORKS|SPOONS|CANDLE|CHARCOAL|LIGHTER|PET|DOG\s*FOOD|CAT\s*FOOD|LITTER|VITAMIN\w*|MEDICINE|TYLENOL|ADVIL|BANDAGE\w*|CARD|GIFT|MAGAZINE|SPONGE|LAUNDRY|FABRIC|SOFTENER|AIR\s*FRESH\w*)\b/i;
const RECEIPT_SKIP = /\b(SUB\s*TOTAL|SUBTOTAL|TOTAL|TAX|CHANGE|CASH|VISA|MASTERCARD|AMEX|DEBIT|CREDIT|BALANCE|SAVINGS|SAVED|COUPON|DISCOUNT|THANK|STORE|TEL|PHONE|MEMBER|ITEMS?\s+SOLD|AUTH|APPROVED|CARD|REWARDS|POINTS|RECEIPT|CASHIER|REGISTER|TRANS|TERMINAL|REFUND|BOTTLE DEP|BAG FEE|WWW|HTTP|SURVEY|ACCOUNT|CHIP|PIN)\b/i;
