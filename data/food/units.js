/* Unit words and their sizes. */
/* unit word -> [kind, size]: mass in grams, volume in ml */
const UNITS = {
  g: ["mass", 1], gram: ["mass", 1], kg: ["mass", 1000], kilo: ["mass", 1000], oz: ["mass", 28.35], ounce: ["mass", 28.35], onza: ["mass", 28.35],
  lb: ["mass", 453.6], pound: ["mass", 453.6], libra: ["mass", 453.6],
  ml: ["vol", 1], l: ["vol", 1000], liter: ["vol", 1000], litro: ["vol", 1000], tsp: ["vol", 4.93], teaspoon: ["vol", 4.93], cdta: ["vol", 4.93],
  tbsp: ["vol", 14.79], tablespoon: ["vol", 14.79], cda: ["vol", 14.79], cup: ["vol", 236.6], taza: ["vol", 236.6], pint: ["vol", 473],
  quart: ["vol", 946], gallon: ["vol", 3785], gal: ["vol", 3785], galon: ["vol", 3785],
  clove: ["count", "clove"], diente: ["count", "clove"], slice: ["count", "slice"], rebanada: ["count", "slice"], can: ["count", "can"], lata: ["count", "can"],
  head: ["count", "head"], cabeza: ["count", "head"], bunch: ["count", "bunch"], manojo: ["count", "bunch"], handful: ["count", "handful"], punado: ["count", "handful"],
  fillet: ["count", "fillet"], filete: ["count", "fillet"], stalk: ["count", "stalk"], tallo: ["count", "stalk"], leaf: ["count", "leaf"], leave: ["count", "leaf"], hoja: ["count", "leaf"],
  piece: ["each", 1], pieza: ["each", 1], each: ["each", 1], dozen: ["each", 12], docena: ["each", 12], small: ["each", 0.7], medium: ["each", 1], large: ["each", 1.3],
  bag: ["pkg", "bag"], bolsa: ["pkg", "bag"], box: ["pkg", "box"], caja: ["pkg", "box"], bottle: ["pkg", "bottle"], botella: ["pkg", "bottle"],
  pack: ["pkg", "pack"], package: ["pkg", "pack"], paquete: ["pkg", "pack"], carton: ["pkg", "carton"], jar: ["pkg", "jar"], frasco: ["pkg", "jar"],
  loaf: ["pkg", "loaf"], loave: ["pkg", "loaf"], tub: ["pkg", "tub"], container: ["pkg", "tub"], serving: ["pkg", "serving"], porcion: ["pkg", "serving"]
};
