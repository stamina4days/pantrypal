/* Pal's voice in English. Edit these freely: each list is a set of lines Pal picks from.
   {name} is filled in with a food's name. Keep lines short enough to read in a speech bubble. */
const PAL_VOICE_EN = {
  // When you tap Pal
  tap: [
    "Hi! I'm keeping everything nice and cold in here.",
    "Hey, chef. Want to cook something?",
    "That tickles. Fridges are very ticklish.",
    "I hum when I'm happy. You can't hear it, but trust me.",
    "The back of the fridge is where food goes to be forgotten. Not on my watch.",
    "Leftovers are just dinner that wants a sequel.",
    "I counted. Everything's still here.",
    "Boop.",
    "I'm 40 degrees of pure friendship.",
    "If you open me and stare for a while, that's okay. I do it too."
  ],
  // Greetings by time of day, used when nothing needs eating soon
  morning: ["Good morning! Coffee first, then let's talk breakfast.", "Morning, chef. I kept everything cold all night.", "Rise and shine. What sounds good today?"],
  afternoon: ["Good afternoon! Lunch plans, or are we winging it?", "Afternoon check-in: everything's looking fresh.", "Hey there. Snack break?"],
  evening: ["Evening! Let's figure out dinner.", "Dinner time is my favorite time.", "Long day? I can find you something quick."],
  night: ["It's late. Midnight snack, or just saying hi?", "Still up? Me too. I never sleep. I'm a fridge.", "Shh. The vegetables are sleeping."],
  // When you use food in its last few days
  rescue: ["Saved it just in time!", "That's a rescue. I'm so proud I could defrost.", "Nothing wasted. That's how we do it.", "Hero move, chef."],
  // When you finish food normally
  used: ["All gone. Delicious work.", "Clean plate club!", "Another one eaten. I love to see it."],
  // When food gets tossed
  tossed: ["It happens. We'll catch the next one.", "No judgment. I'll warn you sooner next time.", "Goodbye, old friend. On to fresher things."],
  // When you add food
  added: ["Ooh, groceries! I'll keep an eye on these.", "Welcome to the fridge, {name}!", "Fresh stuff! I'll tell you when it needs eating."],
  // Seasonal lines (Pal also wears a seasonal outfit)
  winter: ["It's cold out. I can relate.", "Soup weather. I'm here for it."],
  "winter-holiday": ["Big meals coming? I'm ready to hold the leftovers.", "Ho, ho, hold the door. You're letting the cold out."],
  spring: ["Spring is here. Fresh greens are back!", "I put a flower on. Do you like it?"],
  summer: ["It's hot out. Good thing I'm the coolest one in the house.", "Fresh fruit season! Fill me up."],
  fall: ["Cozy season. Time for soups and stews.", "Sweater weather. Well, scarf weather for me."],
  "fall-pumpkin": ["I dressed up. Do you like my pumpkin?", "Spooky season! The scariest thing in here is old milk."]
};
