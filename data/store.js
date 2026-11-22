/* Benji's shop. Each item is paid for with a Square checkout link, then unlocked with the code the buyer gets.
   buyUrl: paste the item's Square payment link here. While it's empty, the shop shows "Coming soon".
   kind decides the preview in the shop. The tip jar has one Square link per amount (tiers). */
const STORE_ITEMS = [
  { id: "bundle", kind: "bundle", name: "Everything bundle", price: "$9.99", was: "$14.93",
    desc: "Every item in the shop at once: all four kitchen themes, all four hat packs, the outfit pack, and the radio pack.",
    buyUrl: "" },
  { id: "themes", kind: "themes", name: "Kitchen theme pack", price: "$2.99",
    desc: "Four new looks for every room in the app: a diner, a log cabin, a beach shack, and a space station. Switch anytime in Settings.",
    buyUrl: "" },
  { id: "hats-fun", kind: "hats", name: "Fun hat pack", price: "$1.99",
    desc: "Four silly hats for Benji to wear: a cowboy hat, a pirate hat, a viking helmet, and a frog hat.",
    hats: ["cowboy", "pirate", "viking", "frog"], buyUrl: "https://square.link/u/nvIdItlL" },
  { id: "hats-holiday", kind: "hats", name: "Holiday hat pack", price: "$1.99",
    desc: "Dress Benji up for the holidays: an elf hat, reindeer antlers, a witch hat, and bunny ears.",
    hats: ["elf", "antlers", "witch", "bunny"], buyUrl: "" },
  { id: "hats-food", kind: "hats", name: "Food hat pack", price: "$1.99",
    desc: "Snack-sized hats: a taco, sushi, a pizza slice, and a cupcake.",
    hats: ["taco", "sushi", "pizza", "cupcake"], buyUrl: "" },
  { id: "hats-jobs", kind: "hats", name: "Job hat pack", price: "$1.99",
    desc: "Benji clocks in: a firefighter helmet, a hard hat, a space helmet, and a pilot cap.",
    hats: ["firefighter", "hardhat", "astronaut", "pilot"], buyUrl: "" },
  { id: "outfits", kind: "outfits", name: "Benji's outfit pack", price: "$1.99",
    desc: "Round glasses, a bow tie, a cozy scarf, and a kitchen apron. Wear them with any hat.",
    buyUrl: "" },
  { id: "radio", kind: "radio", name: "Kitchen radio pack", price: "$1.99",
    desc: "Four new stations for the kitchen radio, made right on your phone: Coffee shop, Campfire, Ocean waves, and Holiday tunes.",
    buyUrl: "" },
  { id: "tip", kind: "tip", name: "Tip jar", price: "You pick",
    desc: "Just want to say thanks? Any tip helps keep Pantry Pal free. Every tipper gets a golden sprout for Benji and the Supporter badge.",
    tiers: [{ id: "tip-1", price: "$1", buyUrl: "" }, { id: "tip-3", price: "$3", buyUrl: "" }, { id: "tip-5", price: "$5", buyUrl: "" }] }
];
