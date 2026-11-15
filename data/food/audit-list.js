/* The pantry audit checklist. */
/* ---------- pantry audit list: [english, spanish, amount, unit] ---------- */
const AUDIT = [
  ["fridge", "Fridge", "Fridge", [
    ["Eggs", "Huevos", 12, ""], ["Milk", "Leche", 1, "gallon"], ["Butter", "Mantequilla", 1, "lb"], ["Cheddar cheese", "Queso cheddar", 8, "oz"],
    ["Mozzarella", "Queso mozzarella", 8, "oz"], ["Parmesan", "Queso parmesano", 4, "oz"], ["Yogurt", "Yogur", 32, "oz"], ["Sour cream", "Crema agria", 16, "oz"],
    ["Heavy cream", "Crema para batir", 1, "pint"], ["Bacon", "Tocino", 12, "oz"], ["Ham", "Jamón", 8, "oz"], ["Chicken breast", "Pechuga de pollo", 2, "lb"],
    ["Chicken thighs", "Muslos de pollo", 2, "lb"], ["Ground beef", "Carne molida", 1, "lb"], ["Sausage", "Salchicha", 1, "lb"], ["Tofu", "Tofu", 14, "oz"],
    ["Salsa", "Salsa", 16, "oz"], ["Mayonnaise", "Mayonesa", 30, "oz"], ["Mustard", "Mostaza", null, ""], ["Tortillas", "Tortillas", 10, ""]]],
  ["produce", "Produce", "Fridge", [
    ["Onions", "Cebollas", 3, ""], ["Garlic", "Ajo", 1, "head"], ["Potatoes", "Papas", 5, "lb"], ["Sweet potatoes", "Camotes", 3, ""], ["Carrots", "Zanahorias", 1, "lb"],
    ["Celery", "Apio", 1, "bunch"], ["Bell peppers", "Pimientos", 3, ""], ["Broccoli", "Brócoli", 1, "head"], ["Cauliflower", "Coliflor", 1, "head"],
    ["Spinach", "Espinaca", 10, "oz"], ["Lettuce", "Lechuga", 1, "head"], ["Tomatoes", "Tomates", 4, ""], ["Cucumber", "Pepino", 1, ""], ["Zucchini", "Calabacita", 2, ""],
    ["Mushrooms", "Champiñones", 8, "oz"], ["Cabbage", "Repollo", 1, "head"], ["Avocados", "Aguacates", 3, ""], ["Lemons", "Limones amarillos", 2, ""],
    ["Limes", "Limones", 3, ""], ["Bananas", "Plátanos", 6, ""], ["Apples", "Manzanas", 6, ""], ["Berries", "Moras", 16, "oz"], ["Cilantro", "Cilantro", 1, "bunch"],
    ["Scallions", "Cebollitas", 1, "bunch"], ["Jalapenos", "Jalapeños", 2, ""], ["Ginger", "Jengibre", 3, "oz"]]],
  ["freezer", "Freezer", "Freezer", [
    ["Frozen peas", "Chícharos congelados", 16, "oz"], ["Frozen corn", "Elote congelado", 16, "oz"], ["Frozen broccoli", "Brócoli congelado", 12, "oz"],
    ["Frozen spinach", "Espinaca congelada", 10, "oz"], ["Frozen berries", "Moras congeladas", 16, "oz"], ["Frozen mango", "Mango congelado", 16, "oz"],
    ["Shrimp", "Camarones", 1, "lb"], ["Salmon fillets", "Filetes de salmón", 4, ""], ["Frozen chicken breast", "Pechuga de pollo congelada", 3, "lb"],
    ["Frozen ground beef", "Carne molida congelada", 1, "lb"]]],
  ["pantry", "Pantry", "Pantry", [
    ["Rice", "Arroz", 2, "lb"], ["Pasta", "Pasta", 1, "lb"], ["Spaghetti", "Espagueti", 1, "lb"], ["Oats", "Avena", 2, "lb"], ["Bread", "Pan", 1, "loaf"],
    ["Canned tomatoes", "Tomates en lata", 2, "cans"], ["Tomato sauce", "Salsa de tomate", 24, "oz"], ["Tomato paste", "Pasta de tomate", 6, "oz"],
    ["Black beans", "Frijoles negros", 2, "cans"], ["Kidney beans", "Frijoles rojos", 2, "cans"], ["Chickpeas", "Garbanzos", 2, "cans"], ["Lentils", "Lentejas", 1, "lb"],
    ["Broth", "Caldo", 32, "oz"], ["Coconut milk", "Leche de coco", 1, "can"], ["Tuna", "Atún", 2, "cans"], ["Peanut butter", "Crema de cacahuate", 16, "oz"],
    ["Honey", "Miel", 12, "oz"], ["Granola", "Granola", 12, "oz"], ["Breadcrumbs", "Pan molido", 8, "oz"]]],
  ["basics", "Spices and basics", null, [
    ["Salt", "Sal"], ["Pepper", "Pimienta"], ["Olive oil", "Aceite de oliva"], ["Vegetable oil", "Aceite vegetal"], ["Flour", "Harina"], ["Sugar", "Azúcar"],
    ["Baking powder", "Polvo para hornear"], ["Baking soda", "Bicarbonato"], ["Soy sauce", "Salsa de soya"], ["Vinegar", "Vinagre"], ["Cornstarch", "Maicena"],
    ["Cinnamon", "Canela"], ["Cumin", "Comino"], ["Chili powder", "Chile en polvo"], ["Paprika", "Paprika"], ["Oregano", "Orégano"],
    ["Italian seasoning", "Hierbas italianas"], ["Curry powder", "Curry en polvo"], ["Vanilla", "Vainilla"], ["Red pepper flakes", "Hojuelas de chile"]]]
];
const EQUIP_LABEL = { oven: "Oven", microwave: "Microwave", blender: "Blender", slowcooker: "Slow cooker", pressure: "Pressure cooker (like an Instant Pot)", airfryer: "Air fryer" };
const weekdayName = n => new Date(2023, 0, 1 + n).toLocaleDateString(locale(), { weekday: "long" });   // Jan 1 2023 was a Sunday
