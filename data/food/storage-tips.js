/* Storage tips Benji shares on food pages and the Tips page.
   [food name the matcher knows, where it keeps best, tip] */
const STORAGE_TIPS = [
  ["berries", "Fridge", "Don't wash berries until you eat them. Water makes them mold faster."],
  ["strawberries", "Fridge", "Keep strawberries dry in a container lined with a paper towel."],
  ["banana", "Counter", "Bananas brown other fruit. Give them their own spot, and freeze brown ones for smoothies or banana bread."],
  ["avocado", "Counter", "Ripen avocados on the counter, then move them to the fridge to buy a few more days."],
  ["tomato", "Counter", "Tomatoes taste better on the counter. Only chill them once they're fully ripe."],
  ["potato", "Pantry", "Keep potatoes somewhere cool and dark, away from onions, so they don't sprout."],
  ["onion", "Pantry", "Whole onions like a dry, airy spot. Cut onions go in the fridge in a sealed container."],
  ["garlic", "Pantry", "Garlic keeps for months in a dry, dark spot. Peeled cloves belong in the fridge."],
  ["bread", "Counter", "Bread goes stale faster in the fridge. Freeze slices you won't eat in a few days and toast them straight from frozen."],
  ["milk", "Fridge", "Keep milk on a shelf, not in the door. The door is the warmest part of the fridge."],
  ["egg", "Fridge", "Eggs last longest in their carton on a middle shelf."],
  ["cheese", "Fridge", "Wrap cheese in wax or parchment paper, then loosely in plastic, so it can breathe."],
  ["butter", "Fridge", "Butter freezes beautifully. Keep a spare block in the freezer."],
  ["yogurt", "Fridge", "Yogurt is often fine a few days past its date. Look, sniff, and taste a little before tossing it."],
  ["chicken", "Fridge", "Raw chicken goes on the bottom shelf so nothing drips on other food. Freeze it within two days."],
  ["ground beef", "Fridge", "Flatten ground beef in a freezer bag before freezing. It thaws in minutes."],
  ["fish", "Fridge", "Cook fresh fish within a day or two, or freeze it right away."],
  ["lettuce", "Fridge", "Wrap lettuce in a dry towel inside a bag. Moisture is what turns it slimy."],
  ["spinach", "Fridge", "Spinach about to wilt is perfect for soups, eggs, and smoothies. You can freeze it too."],
  ["herbs", "Fridge", "Stand soft herbs like cilantro and parsley in a glass of water, like flowers."],
  ["cilantro", "Fridge", "Trim the stems and stand cilantro in a jar of water with a bag over the top."],
  ["carrot", "Fridge", "Cut the green tops off carrots. They pull moisture out of the roots."],
  ["celery", "Fridge", "Wrap celery in foil and it stays crisp for weeks."],
  ["broccoli", "Fridge", "Broccoli keeps best unwashed in a loose bag. Yellow florets are still fine cooked."],
  ["mushrooms", "Fridge", "Keep mushrooms in a paper bag, not plastic, so they don't get slimy."],
  ["apple", "Fridge", "Apples last weeks longer in the fridge than in a fruit bowl."],
  ["lemon", "Fridge", "Lemons and limes stay juicy for weeks in a sealed bag in the fridge."],
  ["rice", "Pantry", "Cooked rice should be cooled fast and eaten within four days. It freezes well in flat bags."],
  ["flour", "Pantry", "Keep flour in an airtight container. Whole wheat flour lasts longer in the freezer."],
  ["tortillas", "Fridge", "Tortillas freeze well. Put a piece of parchment between them so you can pull out just a few."],
  ["leftovers", "Fridge", "Label leftovers with the day you made them. Most are good for three to four days."],
  ["soup", "Freezer", "Freeze soup in single portions. Leave a little room at the top because it expands."],
  ["peppers", "Fridge", "Whole peppers last about a week. Slice extras and freeze them for stir-fries."],
  ["cucumber", "Fridge", "Cucumbers don't like the cold back of the fridge. Keep them near the front."],
  ["grapes", "Fridge", "Frozen grapes make a great snack, like tiny popsicles."],
  ["corn", "Fridge", "Corn loses its sweetness fast. Cook it the day you buy it or freeze the kernels."],
  ["beans", "Pantry", "Cooked beans freeze for months. Make a big pot and freeze it in portions."],
  ["nuts", "Freezer", "Nuts have oils that go stale. They stay fresh much longer in the freezer."],
  ["coffee", "Pantry", "Keep coffee in an airtight container away from heat and light."],
  ["honey", "Pantry", "Honey never really spoils. If it crystallizes, warm the jar in hot water."],
  ["ginger", "Freezer", "Freeze whole ginger and grate it frozen. No peeling needed."],
  ["tofu", "Fridge", "Once opened, cover tofu with fresh water and change it every day."]
];

/* General tips for each place, shown when a food has no tip of its own. */
const PLACE_TIPS = {
  Fridge: "Keep the fridge at 40F (4C) or colder. Put older food in front so it gets eaten first.",
  Freezer: "Label everything you freeze with the date. Most food is best within three months.",
  Pantry: "Store dry goods in sealed containers and keep the oldest up front.",
  Counter: "Keep the counter for fruit that's still ripening, away from the stove and sunny windows."
};
