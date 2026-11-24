/* The Show Benji my kitchen checklist: [name, amount, unit] for each food you can tap. */
const AUDIT = [
  ["fridge", "Fridge", "Fridge", [
    ["Eggs", 12, ""], ["Milk", 1, "gallon"], ["Butter", 1, "lb"], ["Cheddar cheese", 8, "oz"],
    ["Mozzarella", 8, "oz"], ["Parmesan", 4, "oz"], ["Yogurt", 32, "oz"], ["Sour cream", 16, "oz"],
    ["Heavy cream", 1, "pint"], ["Bacon", 12, "oz"], ["Ham", 8, "oz"], ["Chicken breast", 2, "lb"],
    ["Chicken thighs", 2, "lb"], ["Ground beef", 1, "lb"], ["Sausage", 1, "lb"], ["Tofu", 14, "oz"],
    ["Salsa", 16, "oz"], ["Mayonnaise", 30, "oz"], ["Mustard", null, ""], ["Tortillas", 10, ""]]],
  ["produce", "Produce", "Fridge", [
    ["Onions", 3, ""], ["Garlic", 1, "head"], ["Potatoes", 5, "lb"], ["Sweet potatoes", 3, ""], ["Carrots", 1, "lb"],
    ["Celery", 1, "bunch"], ["Bell peppers", 3, ""], ["Broccoli", 1, "head"], ["Cauliflower", 1, "head"],
    ["Spinach", 10, "oz"], ["Lettuce", 1, "head"], ["Tomatoes", 4, ""], ["Cucumber", 1, ""], ["Zucchini", 2, ""],
    ["Mushrooms", 8, "oz"], ["Cabbage", 1, "head"], ["Avocados", 3, ""], ["Lemons", 2, ""],
    ["Limes", 3, ""], ["Bananas", 6, ""], ["Apples", 6, ""], ["Berries", 16, "oz"], ["Cilantro", 1, "bunch"],
    ["Scallions", 1, "bunch"], ["Jalapenos", 2, ""], ["Ginger", 3, "oz"]]],
  ["freezer", "Freezer", "Freezer", [
    ["Frozen peas", 16, "oz"], ["Frozen corn", 16, "oz"], ["Frozen broccoli", 12, "oz"],
    ["Frozen spinach", 10, "oz"], ["Frozen berries", 16, "oz"], ["Frozen mango", 16, "oz"],
    ["Shrimp", 1, "lb"], ["Salmon fillets", 4, ""], ["Frozen chicken breast", 3, "lb"],
    ["Frozen ground beef", 1, "lb"]]],
  ["pantry", "Pantry", "Pantry", [
    ["Rice", 2, "lb"], ["Pasta", 1, "lb"], ["Spaghetti", 1, "lb"], ["Oats", 2, "lb"], ["Bread", 1, "loaf"],
    ["Canned tomatoes", 2, "cans"], ["Tomato sauce", 24, "oz"], ["Tomato paste", 6, "oz"],
    ["Black beans", 2, "cans"], ["Kidney beans", 2, "cans"], ["Chickpeas", 2, "cans"], ["Lentils", 1, "lb"],
    ["Broth", 32, "oz"], ["Coconut milk", 1, "can"], ["Tuna", 2, "cans"], ["Peanut butter", 16, "oz"],
    ["Honey", 12, "oz"], ["Granola", 12, "oz"], ["Breadcrumbs", 8, "oz"]]],
  ["basics", "Spices and basics", null, [
    ["Salt"], ["Pepper"], ["Olive oil"], ["Vegetable oil"], ["Flour"], ["Sugar"],
    ["Baking powder"], ["Baking soda"], ["Soy sauce"], ["Vinegar"], ["Cornstarch"],
    ["Cinnamon"], ["Cumin"], ["Chili powder"], ["Paprika"], ["Oregano"],
    ["Italian seasoning"], ["Curry powder"], ["Vanilla"], ["Red pepper flakes"]]]
];
const EQUIP_LABEL = { oven: "Oven", microwave: "Microwave", blender: "Blender", slowcooker: "Slow cooker", pressure: "Pressure cooker (like an Instant Pot)", airfryer: "Air fryer" };
const weekdayName = n => new Date(2023, 0, 1 + n).toLocaleDateString(locale(), { weekday: "long" });   // Jan 1 2023 was a Sunday
