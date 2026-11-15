/* Storage tips Pal shares on food pages and the Tips page.
   [food name the matcher knows, where it keeps best, tip in English, tip in Spanish] */
const STORAGE_TIPS = [
  ["berries", "Fridge", "Don't wash berries until you eat them. Water makes them mold faster.", "No laves las bayas hasta que las vayas a comer. El agua hace que se enmohezcan más rápido."],
  ["strawberries", "Fridge", "Keep strawberries dry in a container lined with a paper towel.", "Guarda las fresas secas en un recipiente con una toalla de papel."],
  ["banana", "Counter", "Bananas brown other fruit. Give them their own spot, and freeze brown ones for smoothies or banana bread.", "Los plátanos maduran otras frutas. Dales su propio lugar y congela los que estén cafés para licuados o pan de plátano."],
  ["avocado", "Counter", "Ripen avocados on the counter, then move them to the fridge to buy a few more days.", "Madura los aguacates afuera y luego pásalos al refrigerador para ganar unos días más."],
  ["tomato", "Counter", "Tomatoes taste better on the counter. Only chill them once they're fully ripe.", "Los tomates saben mejor fuera del refrigerador. Refrigéralos solo cuando ya estén bien maduros."],
  ["potato", "Pantry", "Keep potatoes somewhere cool and dark, away from onions, so they don't sprout.", "Guarda las papas en un lugar fresco y oscuro, lejos de las cebollas, para que no germinen."],
  ["onion", "Pantry", "Whole onions like a dry, airy spot. Cut onions go in the fridge in a sealed container.", "Las cebollas enteras prefieren un lugar seco y ventilado. Las cortadas van al refrigerador en un recipiente cerrado."],
  ["garlic", "Pantry", "Garlic keeps for months in a dry, dark spot. Peeled cloves belong in the fridge.", "El ajo dura meses en un lugar seco y oscuro. Los dientes pelados van al refrigerador."],
  ["bread", "Counter", "Bread goes stale faster in the fridge. Freeze slices you won't eat in a few days and toast them straight from frozen.", "El pan se endurece más rápido en el refrigerador. Congela las rebanadas que no comerás pronto y tuéstalas congeladas."],
  ["milk", "Fridge", "Keep milk on a shelf, not in the door. The door is the warmest part of the fridge.", "Guarda la leche en un estante, no en la puerta. La puerta es la parte más tibia del refrigerador."],
  ["egg", "Fridge", "Eggs last longest in their carton on a middle shelf.", "Los huevos duran más en su cartón, en un estante del medio."],
  ["cheese", "Fridge", "Wrap cheese in wax or parchment paper, then loosely in plastic, so it can breathe.", "Envuelve el queso en papel encerado o para hornear, y luego suelto en plástico, para que respire."],
  ["butter", "Fridge", "Butter freezes beautifully. Keep a spare block in the freezer.", "La mantequilla se congela muy bien. Ten un bloque extra en el congelador."],
  ["yogurt", "Fridge", "Yogurt is often fine a few days past its date. Look, sniff, and taste a little before tossing it.", "El yogur suele estar bien unos días después de la fecha. Míralo, huélelo y pruébalo antes de tirarlo."],
  ["chicken", "Fridge", "Raw chicken goes on the bottom shelf so nothing drips on other food. Freeze it within two days.", "El pollo crudo va en el estante de abajo para que no gotee sobre otra comida. Congélalo en dos días."],
  ["ground beef", "Fridge", "Flatten ground beef in a freezer bag before freezing. It thaws in minutes.", "Aplana la carne molida en una bolsa antes de congelarla. Se descongela en minutos."],
  ["fish", "Fridge", "Cook fresh fish within a day or two, or freeze it right away.", "Cocina el pescado fresco en uno o dos días, o congélalo de inmediato."],
  ["lettuce", "Fridge", "Wrap lettuce in a dry towel inside a bag. Moisture is what turns it slimy.", "Envuelve la lechuga en una toalla seca dentro de una bolsa. La humedad es lo que la echa a perder."],
  ["spinach", "Fridge", "Spinach about to wilt is perfect for soups, eggs, and smoothies. You can freeze it too.", "La espinaca a punto de marchitarse es perfecta para sopas, huevos y licuados. También se puede congelar."],
  ["herbs", "Fridge", "Stand soft herbs like cilantro and parsley in a glass of water, like flowers.", "Pon las hierbas suaves como cilantro y perejil en un vaso con agua, como flores."],
  ["cilantro", "Fridge", "Trim the stems and stand cilantro in a jar of water with a bag over the top.", "Corta los tallos y pon el cilantro en un frasco con agua y una bolsa encima."],
  ["carrot", "Fridge", "Cut the green tops off carrots. They pull moisture out of the roots.", "Quita las hojas verdes de las zanahorias. Le quitan humedad a la raíz."],
  ["celery", "Fridge", "Wrap celery in foil and it stays crisp for weeks.", "Envuelve el apio en papel aluminio y se mantiene crujiente por semanas."],
  ["broccoli", "Fridge", "Broccoli keeps best unwashed in a loose bag. Yellow florets are still fine cooked.", "El brócoli dura más sin lavar en una bolsa suelta. Las partes amarillas todavía sirven cocidas."],
  ["mushrooms", "Fridge", "Keep mushrooms in a paper bag, not plastic, so they don't get slimy.", "Guarda los champiñones en bolsa de papel, no de plástico, para que no se pongan babosos."],
  ["apple", "Fridge", "Apples last weeks longer in the fridge than in a fruit bowl.", "Las manzanas duran semanas más en el refrigerador que en el frutero."],
  ["lemon", "Fridge", "Lemons and limes stay juicy for weeks in a sealed bag in the fridge.", "Los limones se mantienen jugosos por semanas en una bolsa cerrada en el refrigerador."],
  ["rice", "Pantry", "Cooked rice should be cooled fast and eaten within four days. It freezes well in flat bags.", "El arroz cocido debe enfriarse rápido y comerse en cuatro días. Se congela bien en bolsas planas."],
  ["flour", "Pantry", "Keep flour in an airtight container. Whole wheat flour lasts longer in the freezer.", "Guarda la harina en un recipiente hermético. La harina integral dura más en el congelador."],
  ["tortillas", "Fridge", "Tortillas freeze well. Put a piece of parchment between them so you can pull out just a few.", "Las tortillas se congelan bien. Pon papel entre ellas para sacar solo unas cuantas."],
  ["leftovers", "Fridge", "Label leftovers with the day you made them. Most are good for three to four days.", "Etiqueta las sobras con el día en que las hiciste. La mayoría dura de tres a cuatro días."],
  ["soup", "Freezer", "Freeze soup in single portions. Leave a little room at the top because it expands.", "Congela la sopa en porciones individuales. Deja un poco de espacio arriba porque se expande."],
  ["peppers", "Fridge", "Whole peppers last about a week. Slice extras and freeze them for stir-fries.", "Los chiles enteros duran como una semana. Rebana los que sobren y congélalos para salteados."],
  ["cucumber", "Fridge", "Cucumbers don't like the cold back of the fridge. Keep them near the front.", "A los pepinos no les gusta la parte fría del fondo. Guárdalos al frente."],
  ["grapes", "Fridge", "Frozen grapes make a great snack, like tiny popsicles.", "Las uvas congeladas son un gran bocadillo, como paletas pequeñitas."],
  ["corn", "Fridge", "Corn loses its sweetness fast. Cook it the day you buy it or freeze the kernels.", "El elote pierde su dulzura rápido. Cocínalo el día que lo compres o congela los granos."],
  ["beans", "Pantry", "Cooked beans freeze for months. Make a big pot and freeze it in portions.", "Los frijoles cocidos se congelan por meses. Haz una olla grande y congélalos en porciones."],
  ["nuts", "Freezer", "Nuts have oils that go stale. They stay fresh much longer in the freezer.", "Las nueces tienen aceites que se ponen rancios. Duran mucho más en el congelador."],
  ["coffee", "Pantry", "Keep coffee in an airtight container away from heat and light.", "Guarda el café en un recipiente hermético, lejos del calor y la luz."],
  ["honey", "Pantry", "Honey never really spoils. If it crystallizes, warm the jar in hot water.", "La miel casi nunca se echa a perder. Si se cristaliza, calienta el frasco en agua caliente."],
  ["ginger", "Freezer", "Freeze whole ginger and grate it frozen. No peeling needed.", "Congela el jengibre entero y rállalo congelado. No hace falta pelarlo."],
  ["tofu", "Fridge", "Once opened, cover tofu with fresh water and change it every day.", "Una vez abierto, cubre el tofu con agua limpia y cámbiala cada día."]
];

/* General tips for each place, shown when a food has no tip of its own. */
const PLACE_TIPS = {
  Fridge: ["Keep the fridge at 40F (4C) or colder. Put older food in front so it gets eaten first.", "Mantén el refrigerador a 4 °C (40 °F) o menos. Pon lo más viejo adelante para comerlo primero."],
  Freezer: ["Label everything you freeze with the date. Most food is best within three months.", "Etiqueta todo lo que congeles con la fecha. Casi todo es mejor antes de tres meses."],
  Pantry: ["Store dry goods in sealed containers and keep the oldest up front.", "Guarda los secos en recipientes cerrados y pon lo más viejo adelante."],
  Counter: ["Keep the counter for fruit that's still ripening, away from the stove and sunny windows.", "Deja en la barra la fruta que todavía está madurando, lejos de la estufa y del sol."]
};
