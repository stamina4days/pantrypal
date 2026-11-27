/* Benji's shop. Each item is paid for with a Square checkout link, then unlocked with the code the buyer gets.
   buyUrl: paste the item's Square payment link here. While it's empty, the shop shows "Coming soon".
   kind decides the preview in the shop. The tip jar has one Square link per amount (tiers).
   free: costs nothing. Tap Get it free in the shop to claim it, no code needed. */
const STORE_ITEMS = [
  { id: "bundle", kind: "bundle", name: "Everything bundle", price: "$9.99", was: "$14.93",
    desc: "Every item in the shop at once: all four kitchen themes, all four hat packs, the outfit pack, and the radio pack.",
    buyUrl: "https://square.link/u/bzliF3dr" },
  { id: "hats-anime", kind: "hats", name: "Anime hat pack", price: "Free", free: true,
    desc: "Eight anime looks for Benji, free for everyone. Tap Get it free to open the box: cat ears, hero hair, twin tails, a training headband, a festival fox mask, a crystal leaf tiara, a big ribbon bow, and messy hair. Rescue food to unlock new colors.",
    hats: ["cat-ears", "hero-hair", "twin-tails", "headband", "fox-mask", "tiara", "ribbon", "cowlick"] },
  { id: "themes", kind: "themes", name: "Kitchen theme pack", price: "$2.99",
    desc: "Four new looks for every room in the app, each with its own song: a diner, a log cabin, a beach shack, and a space station. Switch anytime in Settings.",
    buyUrl: "https://square.link/u/DaCGYXRu" },
  { id: "hats-fun", kind: "hats", name: "Fun hat pack", price: "$1.99",
    desc: "Four silly hats for Benji to wear: a cowboy hat, a pirate hat, a viking helmet, and a frog hat.",
    hats: ["cowboy", "pirate", "viking", "frog"], buyUrl: "https://square.link/u/nvIdItlL" },
  { id: "hats-holiday", kind: "hats", name: "Holiday hat pack", price: "$1.99",
    desc: "Dress Benji up for the holidays: an elf hat, reindeer antlers, a witch hat, and bunny ears.",
    hats: ["elf", "antlers", "witch", "bunny"], buyUrl: "https://square.link/u/tg9nRNjx" },
  { id: "hats-food", kind: "hats", name: "Food hat pack", price: "$1.99",
    desc: "Snack-sized hats: a taco, sushi, a pizza slice, and a cupcake.",
    hats: ["taco", "sushi", "pizza", "cupcake"], buyUrl: "https://square.link/u/5kveBX1E" },
  { id: "hats-jobs", kind: "hats", name: "Job hat pack", price: "$1.99",
    desc: "Benji clocks in: a firefighter helmet, a hard hat, a space helmet, and a pilot cap.",
    hats: ["firefighter", "hardhat", "astronaut", "pilot"], buyUrl: "https://square.link/u/FnnHuTrj" },
  { id: "outfits", kind: "outfits", name: "Benji's outfit pack", price: "$1.99",
    desc: "Round glasses, a bow tie, a cozy scarf, and a kitchen apron. Wear them with any hat.",
    buyUrl: "https://square.link/u/T19pQq4q" },
  { id: "radio", kind: "radio", name: "Kitchen radio pack", price: "$1.99",
    desc: "Four new stations for the kitchen radio, each with its own song: Coffee shop, Campfire, Ocean waves, and Holiday tunes.",
    buyUrl: "https://square.link/u/zeKqN2iA" },
  { id: "tip", kind: "tip", name: "Tip jar", price: "You pick",
    desc: "Just want to say thanks? Any tip helps keep Pantry Pal free, and earns you the Supporter badge and a golden sprout for Benji. The bigger the tip, the bigger the sprout: $1 grows a golden sprout, $3 a leafy one, and $5 a golden sprout in full bloom.",
    tiers: [{ id: "tip-1", price: "$1", buyUrl: "https://square.link/u/qx1ahyY2" }, { id: "tip-3", price: "$3", buyUrl: "https://square.link/u/TdOTuFH2" }, { id: "tip-5", price: "$5", buyUrl: "https://square.link/u/ZVcrkq6E" }] }
];
