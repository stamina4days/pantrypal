/* Benji's shop. Each item is paid for with a Square checkout link, then unlocked with the code the buyer gets.
   buyUrl: paste the item's Square payment link here. While it's empty, the shop shows "Coming soon". */
const STORE_ITEMS = [
  { id: "hats-fun", name: "Fun hat pack", price: "$1.99",
    desc: "Four silly hats for Benji to wear: a cowboy hat, a pirate hat, a viking helmet, and a frog hat.",
    hats: ["cowboy", "pirate", "viking", "frog"], buyUrl: "https://square.link/u/nvIdItlL" }
];
