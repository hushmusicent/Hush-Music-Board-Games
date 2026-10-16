// scripts/generate_pictionary.js
import fs from 'fs';
import path from 'path';

// Helper geometric functions for stroke generation
function circle(cx, cy, r, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function rect(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
}

function line(x1, y1, x2, y2) {
  return [[x1, y1], [x2, y2]];
}

function tri(x1, y1, x2, y2, x3, y3) {
  return [[x1, y1], [x2, y2], [x3, y3], [x1, y1]];
}

function star(cx, cy, r1, r2, p = 5) {
  const pts = [];
  for (let i = 0; i <= p * 2; i++) {
    const a = (i / (p * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

// 1. CELEBRITIES & POP ICONS (180)
const CELEBRITIES = [
  // Music Icons
  { w: 'Michael Jackson', trait: 'fedora_glove', diff: 3 },
  { w: 'Taylor Swift', trait: 'guitar_bangs', diff: 2 },
  { w: 'Elvis Presley', trait: 'pompadour_shades', diff: 3 },
  { w: 'Beyoncé', trait: 'crown_mic', diff: 4 },
  { w: 'Freddie Mercury', trait: 'mustache_micstand', diff: 4 },
  { w: 'Bob Marley', trait: 'dreadlocks_guitar', diff: 5 },
  { w: 'David Bowie', trait: 'lightning_face', diff: 6 },
  { w: 'Billie Eilish', trait: 'hoodie_chains', diff: 5 },
  { w: 'Snoop Dogg', trait: 'braids_mic', diff: 4 },
  { w: 'Eminem', trait: 'beanie_hoodie', diff: 5 },
  { w: 'Drake', trait: 'puffy_fade', diff: 4 },
  { w: 'Ariana Grande', trait: 'high_ponytail', diff: 4 },
  { w: 'Rihanna', trait: 'umbrella_shades', diff: 5 },
  { w: 'Katy Perry', trait: 'cupcake_wig', diff: 6 },
  { w: 'Justin Bieber', trait: 'backwards_cap', diff: 4 },
  { w: 'Kanye West', trait: 'shutter_shades', diff: 5 },
  { w: 'Shakira', trait: 'wavy_curls_hips', diff: 6 },
  { w: 'Britney Spears', trait: 'headset_mic', diff: 5 },
  { w: 'Elton John', trait: 'star_glasses_piano', diff: 4 },
  { w: 'Prince', trait: 'purple_coat_guitar', diff: 6 },
  { w: 'Jimi Hendrix', trait: 'afro_headband_guitar', diff: 7 },
  { w: 'Madonna', trait: 'blonde_bow_mic', diff: 5 },
  { w: 'Paul McCartney', trait: 'mop_hair_bass', diff: 6 },
  { w: 'John Lennon', trait: 'round_glasses_peace', diff: 5 },
  { w: 'Adele', trait: 'winged_eyes_mic', diff: 5 },
  { w: 'Ed Sheeran', trait: 'messy_red_guitar', diff: 3 },
  { w: 'Bruno Mars', trait: 'fedora_retro', diff: 4 },
  { w: 'Lady Gaga', trait: 'avant_garde_bow', diff: 5 },
  { w: 'Tupac Shakur', trait: 'bandana_knotted', diff: 7 },
  { w: 'The Weeknd', trait: 'red_blazer_shades', diff: 6 },
  { w: 'Post Malone', trait: 'face_tattoos_guitar', diff: 7 },
  { w: 'Harry Styles', trait: 'curly_boa_sunglasses', diff: 5 },
  { w: 'Selena Gomez', trait: 'brunette_mic', diff: 4 },
  { w: 'Dua Lipa', trait: 'sleek_bob_diva', diff: 5 },
  { w: 'Stevie Wonder', trait: 'braids_dark_glasses', diff: 6 },
  { w: 'Louis Armstrong', trait: 'trumpet_smile', diff: 7 },
  { w: 'Whitney Houston', trait: 'sparkly_dress_mic', diff: 6 },
  { w: 'Celine Dion', trait: 'heart_ocean_mic', diff: 7 },
  { w: 'Dolly Parton', trait: 'big_blonde_hair_rhinestone', diff: 6 },
  { w: 'Johnny Cash', trait: 'man_in_black_guitar', diff: 7 },

  // Science & Tech
  { w: 'Albert Einstein', trait: 'wild_hair_mustache', diff: 1 },
  { w: 'Isaac Newton', trait: 'powdered_wig_apple', diff: 6 },
  { w: 'Stephen Hawking', trait: 'glasses_wheelchair', diff: 7 },
  { w: 'Steve Jobs', trait: 'turtleneck_apple', diff: 3 },
  { w: 'Bill Gates', trait: 'sweater_glasses_floppy', diff: 5 },
  { w: 'Nikola Tesla', trait: 'parted_hair_lightning', diff: 8 },
  { w: 'Thomas Edison', trait: 'lightbulb_inventor', diff: 4 },
  { w: 'Marie Curie', trait: 'flask_radiation', diff: 8 },
  { w: 'Charles Darwin', trait: 'long_beard_finch', diff: 9 },
  { w: 'Alan Turing', trait: 'turing_machine_enigma', diff: 10 },
  { w: 'Galileo Galilei', trait: 'telescope_stars', diff: 8 },
  { w: 'Neil Armstrong', trait: 'astronaut_helmet_moon', diff: 3 },
  { w: 'Alexander Graham Bell', trait: 'vintage_telephone', diff: 7 },
  { w: 'Elon Musk', trait: 'rocket_cybertruck', diff: 4 },

  // World Leaders & History
  { w: 'Abraham Lincoln', trait: 'tophat_chinbeard', diff: 2 },
  { w: 'George Washington', trait: 'colonial_wig_coat', diff: 4 },
  { w: 'Winston Churchill', trait: 'bowler_cigar_vsign', diff: 6 },
  { w: 'Mahatma Gandhi', trait: 'round_specs_shawl', diff: 5 },
  { w: 'Martin Luther King Jr', trait: 'suit_podium_speech', diff: 5 },
  { w: 'Nelson Mandela', trait: 'pattern_shirt_raisedfist', diff: 7 },
  { w: 'Julius Caesar', trait: 'laurel_wreath_toga', diff: 6 },
  { w: 'Cleopatra', trait: 'egyptian_headdress_cobra', diff: 4 },
  { w: 'Napoleon Bonaparte', trait: 'bicorne_hat_handin', diff: 5 },
  { w: 'Queen Elizabeth II', trait: 'crown_handbag_pearls', diff: 3 },
  { w: 'Alexander the Great', trait: 'spartan_helmet_spear', diff: 9 },
  { w: 'Benjamin Franklin', trait: 'balding_kite_lightning', diff: 4 },
  { w: 'Joan of Arc', trait: 'knight_armor_banner', diff: 8 },
  { w: 'Theodore Roosevelt', trait: 'pince_nez_mustache', diff: 8 },
  { w: 'John F. Kennedy', trait: 'presidential_podium_pt109', diff: 7 },
  { w: 'Barack Obama', trait: 'smile_presidential_seal', diff: 3 },

  // Artists & Literary Titans
  { w: 'Leonardo da Vinci', trait: 'flowing_beard_monalisa', diff: 3 },
  { w: 'William Shakespeare', trait: 'ruffle_collar_quill', diff: 5 },
  { w: 'Vincent van Gogh', trait: 'bandaged_ear_sunflowers', diff: 4 },
  { w: 'Pablo Picasso', trait: 'cubist_stripes_palette', diff: 7 },
  { w: 'Frida Kahlo', trait: 'unibrow_flowercrown', diff: 4 },
  { w: 'Salvador Dali', trait: 'upturned_mustache_meltingclock', diff: 5 },
  { w: 'Bob Ross', trait: 'massive_afro_palette', diff: 3 },
  { w: 'Claude Monet', trait: 'waterlilies_strawhat', diff: 8 },
  { w: 'Edgar Allan Poe', trait: 'dark_hair_raven', diff: 7 },
  { w: 'Mark Twain', trait: 'bushy_white_mustache_cigar', diff: 7 },
  { w: 'Michelangelo', trait: 'david_sculpture_chisel', diff: 8 },
  { w: 'Walt Disney', trait: 'mustache_mickey_ears', diff: 2 },
  { w: 'Stan Lee', trait: 'aviators_excelsior_spider', diff: 4 },

  // Hollywood & Film Stars
  { w: 'Charlie Chaplin', trait: 'bowler_cane_mustache', diff: 2 },
  { w: 'Marilyn Monroe', trait: 'flying_dress_beauty_mark', diff: 3 },
  { w: 'Bruce Lee', trait: 'nunchucks_scratch_stance', diff: 4 },
  { w: 'Keanu Reeves', trait: 'wick_black_suit_beard', diff: 4 },
  { w: 'The Rock', trait: 'bald_peoples_eyebrow', diff: 2 },
  { w: 'Tom Cruise', trait: 'aviators_flight_jacket', diff: 4 },
  { w: 'Morgan Freeman', trait: 'freckles_narrator_mic', diff: 6 },
  { w: 'Leonardo DiCaprio', trait: 'titanic_bow_arms', diff: 5 },
  { w: 'Brad Pitt', trait: 'cool_sunglasses_leather', diff: 6 },
  { w: 'Johnny Depp', trait: 'pirate_dreadlocks_hat', diff: 4 },
  { w: 'Arnold Schwarzenegger', trait: 'terminator_sunglasses_gun', diff: 3 },
  { w: 'Will Smith', trait: 'fresh_prince_cap', diff: 4 },
  { w: 'Jackie Chan', trait: 'martial_arts_ladder_stunt', diff: 5 },
  { w: 'Audrey Hepburn', trait: 'breakfast_tiara_cigarette_holder', diff: 6 },
  { w: 'Robin Williams', trait: 'genie_lamp_smile', diff: 5 },
  { w: 'Jim Carrey', trait: 'mask_green_face_zoot', diff: 4 },
  { w: 'Samuel L. Jackson', trait: 'eyepatch_fury_beret', diff: 5 },
  { w: 'Harrison Ford', trait: 'indiana_fedora_whip', diff: 4 },
  { w: 'Tom Hanks', trait: 'forrest_gump_bench_box', diff: 5 },
  { w: 'Robert Downey Jr', trait: 'ironman_sunglasses_goatee', diff: 3 },
  { w: 'Zendaya', trait: 'high_fashion_model', diff: 5 },
  { w: 'Emma Watson', trait: 'gryffindor_scarf_wand', diff: 4 },
  { w: 'Meryl Streep', trait: 'devil_prada_sunglasses', diff: 7 },
  { w: 'Clint Eastwood', trait: 'poncho_cigar_revolver', diff: 6 },
  { w: 'Sylvester Stallone', trait: 'rocky_boxing_headband', diff: 4 },
  { w: 'Mr. Bean', trait: 'tweed_jacket_teddy_bear', diff: 3 },
  { w: 'Gordon Ramsay', trait: 'chef_coat_angry_pan', diff: 4 },

  // Sports Legends
  { w: 'Cristiano Ronaldo', trait: 'cr7_fade_siuu', diff: 2 },
  { w: 'Lionel Messi', trait: 'messi_beard_trophy', diff: 2 },
  { w: 'Michael Jordan', trait: 'jumpman_23_dunk', diff: 2 },
  { w: 'LeBron James', trait: 'crown_23_headband', diff: 3 },
  { w: 'Kobe Bryant', trait: 'mamba_24_jersey', diff: 4 },
  { w: 'Muhammad Ali', trait: 'boxing_gloves_ropeadope', diff: 3 },
  { w: 'Mike Tyson', trait: 'face_tattoo_boxing', diff: 4 },
  { w: 'Usain Bolt', trait: 'lightning_bolt_pose', diff: 2 },
  { w: 'Serena Williams', trait: 'tennis_racket_visor', diff: 3 },
  { w: 'Tiger Woods', trait: 'red_shirt_golf_club', diff: 4 },
  { w: 'Stephen Curry', trait: 'mouthguard_three_pointer', diff: 4 },
  { w: 'Pelé', trait: 'brazil_bicycle_kick', diff: 5 },
  { w: 'Diego Maradona', trait: 'hand_of_god_curls', diff: 6 },
  { w: 'Tom Brady', trait: 'superbowl_rings_helmet', diff: 4 },
  { w: 'Roger Federer', trait: 'rf_headband_backhand', diff: 5 },
  { w: 'Rafael Nadal', trait: 'sleeveless_matador_spin', diff: 5 },
  { w: 'Shaquille O\'Neal', trait: 'giant_shaq_shatter', diff: 5 },
  { w: 'Lewis Hamilton', trait: 'f1_helmet_champion', diff: 6 },
  { w: 'Simone Biles', trait: 'gymnast_gold_flip', diff: 4 },
  { w: 'Wayne Gretzky', trait: 'hockey_stick_99_puck', diff: 6 },

  // Comic & Pop Culture Icons
  { w: 'Spider-Man', trait: 'spidey_mask_webs', diff: 1 },
  { w: 'Batman', trait: 'bat_cowl_batarang', diff: 1 },
  { w: 'Superman', trait: 's_shield_cape', diff: 1 },
  { w: 'Wonder Woman', trait: 'tiara_lasso_bracelets', diff: 2 },
  { w: 'Iron Man', trait: 'arc_reactor_helmet', diff: 1 },
  { w: 'Captain America', trait: 'star_shield_cowl', diff: 1 },
  { w: 'Thor', trait: 'winged_helm_hammer', diff: 2 },
  { w: 'Hulk', trait: 'green_fists_purple_pants', diff: 2 },
  { w: 'Wolverine', trait: 'claws_yellow_cowl', diff: 3 },
  { w: 'Deadpool', trait: 'dual_katanas_mask', diff: 3 },
  { w: 'Joker', trait: 'green_hair_wide_smile', diff: 2 },
  { w: 'Darth Vader', trait: 'vader_helmet_lightsaber', diff: 1 },
  { w: 'Yoda', trait: 'pointy_ears_cane_robe', diff: 2 },
  { w: 'Harry Potter', trait: 'glasses_scar_wand', diff: 1 },
  { w: 'Pikachu', trait: 'lightning_tail_ears', diff: 1 },
  { w: 'Mario', trait: 'm_cap_mustache_overalls', diff: 1 },
  { w: 'Sonic', trait: 'blue_spikes_red_sneakers', diff: 2 },
  { w: 'SpongeBob', trait: 'square_pants_tie', diff: 1 },
  { w: 'Shrek', trait: 'ogre_ears_round_belly', diff: 2 },
  { w: 'Barbie', trait: 'blonde_ponytail_high_heels', diff: 2 },
  { w: 'Wednesday Addams', trait: 'dark_braids_collar_hand', diff: 3 },
  { w: 'Sherlock Holmes', trait: 'deerstalker_pipe_magnifier', diff: 3 },
  { w: 'Dracula', trait: 'fangs_high_collar_cape', diff: 2 },
  { w: 'Frankenstein', trait: 'neck_bolts_flat_head', diff: 2 },
  { w: 'James Bond', trait: 'tuxedo_martini_pistol', diff: 3 },
  { w: 'Captain Jack Sparrow', trait: 'pirate_tricorne_beard_braids', diff: 3 },
  { w: 'Elsa', trait: 'ice_dress_snowflake_braid', diff: 2 },
  { w: 'Mickey Mouse', trait: 'round_ears_white_gloves', diff: 1 },
  { w: 'Bugs Bunny', trait: 'tall_ears_carrot', diff: 2 },
  { w: 'Homer Simpson', trait: 'bald_two_hairs_donut', diff: 2 },
  { w: 'Darth Maul', trait: 'double_lightsaber_horns', diff: 6 },
  { w: 'Goku', trait: 'super_saiyan_spikes_gi', diff: 3 },
  { w: 'Sailor Moon', trait: 'odango_buns_tiara_wand', diff: 4 },
  { w: 'Naruto', trait: 'orange_tracksuit_headband', diff: 4 },
  { w: 'Luffy', trait: 'straw_hat_red_vest', diff: 4 },
  { w: 'Pac-Man', trait: 'yellow_circle_open_mouth_ghost', diff: 1 },
  { w: 'Luigi', trait: 'l_cap_green_mustache', diff: 2 },
  { w: 'Bowser', trait: 'spiked_shell_horns_fire', diff: 4 },
  { w: 'Link', trait: 'green_cap_master_sword', diff: 3 },
  { w: 'Zelda', trait: 'royal_tiara_triforce', diff: 5 },
  { w: 'Godzilla', trait: 'atomic_dorsal_fins_roar', diff: 3 },
  { w: 'King Kong', trait: 'giant_gorilla_empire_state', diff: 4 },
  { w: 'Gandalf', trait: 'pointed_wizard_hat_staff', diff: 4 },
  { w: 'Frodo Baggins', trait: 'one_ring_green_cloak', diff: 5 },
  { w: 'Legolas', trait: 'elvish_bow_arrow_long_hair', diff: 6 },
  { w: 'Katniss Everdeen', trait: 'mockingjay_pin_bow', diff: 5 },
  { w: 'Luke Skywalker', trait: 'blue_lightsaber_jedi_robe', diff: 3 },
  { w: 'Princess Leia', trait: 'cinnamon_buns_white_gown', diff: 3 },
  { w: 'Chewbacca', trait: 'bandolier_bowcaster_fur', diff: 4 },
  { w: 'Han Solo', trait: 'blaster_holster_vest', diff: 4 },
  { w: 'Obi-Wan Kenobi', trait: 'beard_lightsaber_hood', diff: 4 },
  { w: 'Venom', trait: 'tongue_sharp_teeth_white_eyes', diff: 4 },
  { w: 'Black Panther', trait: 'vibranium_claws_panther_mask', diff: 4 },
  { w: 'Doctor Strange', trait: 'cloak_levitation_eye_agamotto', diff: 5 },
  { w: 'Groot', trait: 'tree_branches_baby_pot', diff: 3 },
  { w: 'Rocket Raccoon', trait: 'furry_ears_giant_laser_gun', diff: 4 }
];

// 2. ANIMALS & WILDLIFE (120)
const ANIMALS = [
  'Cat', 'Dog', 'Elephant', 'Giraffe', 'Lion', 'Tiger', 'Monkey', 'Penguin', 'Kangaroo', 'Dolphin',
  'Shark', 'Owl', 'Eagle', 'Bear', 'Zebra', 'Koala', 'Rabbit', 'Frog', 'Snake', 'Butterfly',
  'Octopus', 'Whale', 'Horse', 'Cow', 'Pig', 'Sheep', 'Duck', 'Flamingo', 'Crocodile', 'Sloth',
  'Panda', 'Gorilla', 'Hippo', 'Rhino', 'Fox', 'Wolf', 'Camel', 'Beaver', 'Otter', 'Seagull',
  'Parrot', 'Toucan', 'Peacock', 'Swan', 'Bat', 'Hedgehog', 'Squirrel', 'Chameleon', 'Turtle', 'Crab',
  'Lobster', 'Starfish', 'Jellyfish', 'Seahorse', 'Stingray', 'Seal', 'Walrus', 'Polar Bear', 'Cheetah', 'Leopard',
  'Jaguar', 'Hyena', 'Meerkat', 'Lemur', 'Chimpanzee', 'Baboon', 'Platypus', 'Wombat', 'Emu', 'Ostrich',
  'Kiwi Bird', 'Pelican', 'Hummingbird', 'Woodpecker', 'Crow', 'Raven', 'Pigeon', 'Rooster', 'Hen', 'Goose',
  'Turkey', 'Llama', 'Alpaca', 'Goat', 'Donkey', 'Mule', 'Buffalo', 'Bison', 'Yak', 'Moose',
  'Reindeer', 'Deer', 'Antelope', 'Gazelle', 'Armadillo', 'Anteater', 'Pangolin', 'Skunk', 'Raccoon', 'Badger',
  'Porcupine', 'Mole', 'Hamster', 'Guinea Pig', 'Ferret', 'Mongoose', 'Komodo Dragon', 'Gecko', 'Iguana', 'Salamander',
  'Toad', 'Newt', 'Snail', 'Caterpillar', 'Ladybug', 'Bee', 'Wasp', 'Dragonfly', 'Grasshopper', 'Mantis'
];

// 3. FOOD, DRINKS & TREATS (110)
const FOODS = [
  'Pizza', 'Burger', 'Taco', 'Sushi', 'Donut', 'Ice Cream', 'Hot Dog', 'Pancake', 'Coffee', 'Watermelon',
  'Banana', 'Apple', 'Cupcake', 'Pretzel', 'Cookie', 'Popcorn', 'Cheese', 'Cake', 'French Fries', 'Soda',
  'Burrito', 'Sandwich', 'Waffle', 'Croissant', 'Baguette', 'Bagel', 'Muffin', 'Pie', 'Brownie', 'Milkshake',
  'Spaghetti', 'Noodles', 'Ramen', 'Dumpling', 'Fried Chicken', 'Steak', 'Bacon', 'Sausage', 'Egg', 'Omelet',
  'Salad', 'Soup', 'Avocado', 'Strawberry', 'Pineapple', 'Grapes', 'Orange', 'Lemon', 'Lime', 'Peach',
  'Cherry', 'Blueberry', 'Raspberry', 'Kiwi', 'Mango', 'Papaya', 'Coconut', 'Pomegranate', 'Plum', 'Pear',
  'Corn on the Cob', 'Carrot', 'Broccoli', 'Tomato', 'Potato', 'Onion', 'Garlic', 'Mushroom', 'Chili Pepper', 'Eggplant',
  'Cucumber', 'Pumpkin', 'Lollipop', 'Candy Cane', 'Chocolate Bar', 'Gummy Bear', 'Marshmallow', 'Cotton Candy', 'Popsicle', 'Sundae',
  'Tea', 'Juice Box', 'Hot Chocolate', 'Lemonade', 'Smoothie', 'Boba Milk Tea', 'Espresso', 'Wine Glass', 'Beer Mug', 'Cocktail',
  'Chips and Dip', 'Nachos', 'Quesadilla', 'Enchilada', 'Spring Roll', 'Curry Bowl', 'Rice Bowl', 'Fish and Chips', 'Lobster Roll', 'Ribs',
  'Fondue', 'Macaroni and Cheese', 'Toast with Jam', 'Peanut Butter Jar', 'Cereal Bowl', 'Granola Bar', 'Pita Bread', 'Falafel', 'Hummus Dip', 'Olive'
];

// 4. VEHICLES & TRANSPORTATION (90)
const VEHICLES = [
  'Car', 'Airplane', 'Bicycle', 'Motorcycle', 'Helicopter', 'Rocket', 'Submarine', 'Train', 'Skateboard', 'Boat',
  'Tractor', 'Fire Truck', 'Police Car', 'School Bus', 'Hot Air Balloon', 'Sailboat', 'Ambulance', 'Dump Truck', 'Bulldozer', 'Crane Truck',
  'Speedboat', 'Cruise Ship', 'Yacht', 'Canoe', 'Kayak', 'Rowboat', 'Gondola', 'Jet Ski', 'Hovercraft', 'Ferry',
  'Steam Locomotive', 'Bullet Train', 'Monorail', 'Subway Train', 'Cable Car', 'Tram', 'Trolley', 'Horse Carriage', 'Rickshaw', 'Scooter',
  'Moped', 'Go-Kart', 'Monster Truck', 'Van', 'Pickup Truck', 'Tow Truck', 'Garbage Truck', 'Cement Mixer', 'Forklift', 'Snowmobile',
  'Sled', 'Golf Cart', 'Segway', 'Unicycle', 'Roller Skates', 'Hang Glider', 'Parachute', 'Blimp', 'Zeppelin', 'Biplane',
  'Fighter Jet', 'Space Shuttle', 'Lunar Rover', 'UFO Flying Saucer', 'Camper RV', 'Limousine', 'Convertible Car', 'Sports Car', 'Taxi Cab', 'Delivery Van',
  'Mail Truck', 'Ice Cream Truck', 'Street Sweeper', 'Snowplow', 'Fireboat', 'Barge', 'Tugboat', 'Cargo Container Ship', 'Kayak with Paddle', 'Paddleboard',
  'Hoverboard', 'Electric Scooter', 'Penny Farthing Bicycle', 'Tandem Bike', 'BMX Bike', 'Quad Bike ATV', 'Dirt Bike', 'Race Car', 'Go Kart', 'Armored Tank'
];

// 5. LANDMARKS, ARCHITECTURE & BUILDINGS (80)
const LANDMARKS = [
  'Eiffel Tower', 'Statue of Liberty', 'Pyramids of Giza', 'Big Ben', 'Taj Mahal', 'Colosseum', 'Golden Gate Bridge', 'Castle', 'Lighthouse', 'Windmill',
  'Igloo', 'Camping Tent', 'Skyscraper', 'Great Wall of China', 'Mount Rushmore', 'Leaning Tower of Pisa', 'Sydney Opera House', 'Empire State Building', 'Arc de Triomphe', 'Parthenon',
  'Stonehenge', 'Mayan Pyramid', 'Sphinx', 'Pagoda', 'Mosque Minaret', 'Cathedral', 'Barn', 'Water Tower', 'Bridge', 'Tunnel',
  'Ferris Wheel', 'Roller Coaster', 'Circus Tent', 'Amphitheater', 'Wind Turbine', 'Oil Rig', 'Space Needle', 'Christ the Redeemer', 'Tower Bridge', 'Burj Khalifa',
  'Clock Tower', 'Observatory', 'Greenhouse', 'Log Cabin', 'Treehouse', 'Mansion', 'Cottage', 'Bungalow', 'Apartment Building', 'Hospital',
  'Schoolhouse', 'Library', 'Fire Station', 'Police Station', 'Bank Vault', 'Museum', 'Cinema Theater', 'Gas Station', 'Airport Hangar', 'Train Depot',
  'Stadium', 'Gymnasium', 'Swimming Pool', 'Fountain', 'Wishing Well', 'Gazebo', 'Bridge Arch', 'Drawbridge', 'Castle Moat', 'Medieval Fortress',
  'Pyramid Tomb', 'Egyptian Obelisk', 'Triumphal Arch', 'Bell Tower', 'Watchtower', 'Derrick Crane', 'Dam Hydroelectric', 'Pier Boardwalk', 'Docks Wharf', 'Silo Tower'
];

// 6. MUSICAL INSTRUMENTS & AUDIO (70)
const INSTRUMENTS = [
  'Acoustic Guitar', 'Electric Guitar', 'Grand Piano', 'Drum Set', 'Violin', 'Saxophone', 'Trumpet', 'Microphone', 'Flute', 'Harp',
  'Banjo', 'Headphones', 'Turntable', 'Ukulele', 'Cello', 'Double Bass', 'Trombone', 'Tuba', 'French Horn', 'Clarinet',
  'Oboe', 'Bassoon', 'Harmonica', 'Accordion', 'Synthesizer Keyboard', 'Boombox', 'Cassette Tape', 'Vinyl Record', 'Speaker Amp', 'Studio Mic',
  'Tambourine', 'Maracas', 'Bongos', 'Conga Drum', 'Snare Drum', 'Cymbals', 'Triangle Instrument', 'Xylophone', 'Glockenspiel', 'Chimes',
  'Bagpipes', 'Sitar', 'Didgeridoo', 'Pan Flute', 'Recorder', 'Kalimba Thumb Piano', 'Mandolin', 'Lute', 'Bugle', 'Sousaphone',
  'Metronome', 'Tuning Fork', 'DJ Mixer', 'Guitar Amp', 'Megaphone', 'Radio Receiver', 'Earbuds', 'Walkman', 'Microphone Stand', 'Drumsticks',
  'Gramophone', 'Jukebox', 'Gong', 'Castanets', 'Cowbell', 'Steel Drum', 'Theremin', 'Vuvuzela', 'Whistle', 'Organ Pipes'
];

// 7. SPORTS, OUTDOORS & FITNESS (80)
const SPORTS = [
  'Soccer Ball', 'Basketball', 'Football', 'Tennis Racket', 'Baseball Bat', 'Bowling Pin', 'Surfboard', 'Snowboard', 'Boxing Glove', 'Trophy Cup',
  'Gold Medal', 'Pair of Dice', 'Chess King', 'Dartboard', 'Skateboard Deck', 'Golf Club', 'Hockey Stick', 'Pair of Skis', 'Fishing Rod', 'Ping Pong Paddle',
  'Volleyball', 'Badminton Racket', 'Archery Bow and Arrow', 'Bicycle Helmet', 'Baseball Glove', 'Basketball Hoop', 'Soccer Goal Net', 'Bowling Ball', 'Tennis Ball', 'Baseball',
  'Golf Ball on Tee', 'Hockey Puck', 'Shuttlecock', 'Punching Bag', 'Barbell Dumbbell', 'Kettlebell', 'Yoga Mat', 'Treadmill', 'Jump Rope', 'Stopwatch',
  'Whistle Lanyard', 'Referee Jersey', 'Champion Belt', 'Olympic Torch', 'Ice Skate Boot', 'Rollerblade', 'Snorkel Mask', 'Scuba Tank', 'Flippers', 'Life Vest',
  'Climbing Carabiner', 'Ice Axe', 'Compass Hiking', 'Sleeping Bag', 'Campfire Stove', 'Canteen Flask', 'Swiss Pocket Knife', 'Binoculars', 'Fishing Hook', 'Tackle Box',
  'Boomerang', 'Frisbee Flying Disc', 'Kite Flying', 'Horseshoe Pitch', 'Billiard 8-Ball', 'Pool Cue Stick', 'Foosball Table', 'Air Hockey Striker', 'Dart Bullseye', 'Target Target',
  'Trampoline', 'Gymnastics Rings', 'Balance Beam', 'Pommel Horse', 'Curling Stone', 'Bobsled', 'Luge Sled', 'Polo Mallet', 'Cricket Bat and Wicket', 'Lacrosse Stick'
];

// 8. EVERYDAY OBJECTS, HOUSEHOLD & TOOLS (130)
const OBJECTS = [
  'Scissors', 'Clock', 'Hammer', 'Lightbulb', 'Umbrella', 'Compass', 'Camera', 'Old Key', 'Flashlight', 'Magnifying Glass',
  'Ship Anchor', 'Royal Crown', 'Telescope', 'Book', 'Backpack', 'Sunglasses', 'Hourglass', 'Paintbrush', 'Pencil', 'Pen',
  'Notebook', 'Smartphone', 'Laptop Computer', 'Tablet', 'Desktop Monitor', 'Computer Mouse', 'Keyboard', 'Printer', 'Television', 'Remote Control',
  'Wrench', 'Screwdriver', 'Saw', 'Pliers', 'Tape Measure', 'Toolbox', 'Ladder', 'Padlock', 'Chain Links', 'Safety Pin',
  'Paperclip', 'Pushpin Thumb Tack', 'Stapler', 'Scotch Tape Dispenser', 'Eraser', 'Ruler', 'Palette with Paint', 'Easel Canvas', 'Glue Bottle', 'Envelope Letter',
  'Postage Stamp', 'Mailbox', 'Telephone Vintage', 'Hourglass Sand', 'Candle in Candlestick', 'Lantern Camping', 'Matchstick and Box', 'Lighter', 'Flashlight Torch', 'Light Bulb Glowing',
  'Desk Lamp', 'Ceiling Chandelier', 'Alarm Clock', 'Wristwatch', 'Pocket Watch', 'Sundial', 'Calendar Page', 'Mirror on Wall', 'Picture Frame', 'Vase with Flowers',
  'Coffee Mug', 'Teapot', 'Wine Bottle with Cork', 'Drinking Glass', 'Fork and Spoon', 'Kitchen Knife', 'Frying Pan', 'Cooking Pot with Lid', 'Toaster with Bread', 'Blender',
  'Microwave Oven', 'Refrigerator', 'Washing Machine', 'Iron for Clothes', 'Vacuum Cleaner', 'Broom and Dustpan', 'Bucket and Mop', 'Trash Can', 'Bathtub', 'Showerhead',
  'Sink with Faucet', 'Toilet', 'Toothbrush with Paste', 'Soap Bar with Bubbles', 'Towel on Rack', 'Hairdryer', 'Hairbrush Comb', 'Shaving Razor', 'Perfume Bottle', 'Bandage Band-Aid',
  'First Aid Kit', 'Syringe Needle', 'Pill Medicine Bottle', 'Thermometer', 'Stethoscope', 'Glasses Spectacles', 'Briefcase', 'Luggage Suitcase', 'Wallet with Cash', 'Credit Card',
  'Piggy Bank', 'Money Bag with Dollar', 'Treasure Chest', 'Pirate Map', 'Magic Wand', 'Crystal Ball', 'Potion Bottle', 'Skull and Bones', 'Jack-o\'-Lantern', 'Christmas Tree',
  'Gift Box with Ribbon', 'Party Balloon', 'Firework Rocket', 'Confetti Popper', 'Megaphone Loudspeaker', 'Microphone Mic', 'Guitar Pick', 'Keyhole Plate', 'Door with Knob', 'Window with Curtains'
];

// 9. NATURE, SPACE & WEATHER (75)
const NATURE = [
  'Sun with Rays', 'Crescent Moon', 'Sparkling Star', 'Rainbow Arc', 'Volcano Eruption', 'Snowy Mountain', 'Campfire Logs', 'Ocean Wave', 'Fluffy Cloud', 'Lightning Bolt',
  'Planet Saturn with Rings', 'Shooting Star Meteor', 'Desert Cactus', 'Detailed Snowflake', 'Roaring Waterfall', 'Oak Tree', 'Tropical Palm Tree', 'Forest Mushroom', 'Blooming Rose', 'Sunflower',
  'Tulip Flower', 'Daisy Petals', 'Lotus Flower', 'Four Leaf Clover', 'Autumn Maple Leaf', 'Pinecone', 'Acorn with Cap', 'Coral Reef', 'Seaweed Vines', 'Tumbleweed',
  'Earth Globe Space', 'Sun Flare', 'Full Moon Crater', 'Galaxy Spiral', 'Astronaut Spacesuit', 'Alien Flying UFO', 'Comet Tail', 'Constellation Stars', 'Tornado Funnel', 'Thundercloud Storm',
  'Snowman with Scarf', 'Icicles Hanging', 'Raindrops Falling', 'Puddle Splash', 'Wind Gust Swirls', 'Sunny Cloud Weather', 'Thermometer Hot', 'Thermometer Cold', 'Sunrise Horizon', 'Sunset Ocean',
  'Forest Pines', 'Bonsai Tree', 'Weeping Willow', 'Vine Ivy', 'Bamboo Shoots', 'Geyser Steaming', 'Cave Stalactites', 'Sand Dunes Desert', 'Oasis Palm Water', 'Glacier Iceberg',
  'Canyon Cliffs', 'Island with Palm Tree', 'River Bend', 'Swamp Marsh', 'Meadow Grass', 'Bush Shrub', 'Vineyard Grapevine', 'Wheat Sheaf Harvest', 'Sunflower Field', 'Moon with Stars',
  'Black Hole Vortex', 'Aurora Borealis Waves', 'Solar Eclipse Ring', 'Meteor Crater', 'Saturn Orbit'
];

// 10. CLOTHING, ACCESSORIES & FASHION (65)
const CLOTHING = [
  'Sneaker Shoe', 'High Heel Stiletto', 'Cowboy Boot', 'Bowtie', 'Cool Sunglasses', 'Winter Jacket Coat', 'T-Shirt', 'Cocktail Dress', 'Diamond Ring', 'Wristwatch Luxury',
  'Baseball Cap', 'Beanie Knit Hat', 'Fedora Hat', 'Top Hat', 'Cowboy Hat', 'Sombrero Wide', 'Crown Jewels', 'Tiara Royal', 'Chef Toque Hat', 'Santa Claus Hat',
  'Pirate Tricorne', 'Viking Horned Helmet', 'Wizard Pointy Hat', 'Beret Hat', 'Headband Athletic', 'Earmuffs Winter', 'Scarf Warm', 'Necktie Silk', 'Belt with Buckle', 'Leather Wallet',
  'Handbag Purse', 'Backpack Rucksack', 'Tote Bag', 'Fanny Pack', 'Suitcase Luggage', 'Raincoat Poncho', 'Hoodie Sweatshirt', 'Sweater Jumper', 'Polo Shirt', 'Denim Jeans Pants',
  'Shorts Bermuda', 'Swimsuit Bikini', 'Swimming Trunks', 'Bathrobe Robe', 'Pajamas Sleepwear', 'Tuxedo Suit Jacket', 'Wedding Veil Gown', 'Overalls Dungarees', 'Leather Jacket Biker', 'Lab Coat Medical',
  'Armor Breastplate', 'Superhero Cape', 'Apron Cooking', 'Gloves Winter', 'Mittens Wool', 'White Magic Gloves', 'Socks Pair', 'Slippers Fuzzy', 'Sandals Flip Flops', 'Boots Combat',
  'Roller Skates Boot', 'Ice Skates Blade', 'Belt Buckle Brass', 'Earrings Dangling', 'Pearl Necklace Strand'
];

// Stroke generation algorithms for each item
function generateStrokes(entry) {
  const { w, cat, trait } = entry;
  const strokes = [];

  // Trait-specific for celebrities
  if (cat === 'Celebrities & Pop Icons') {
    // 1. Head contour
    strokes.push(circle(50, 42, 17));

    if (trait === 'fedora_glove') { // Michael Jackson
      strokes.push([[24, 30], [76, 26], [70, 20], [32, 22], [24, 30]]); // tilted fedora
      strokes.push([[38, 42], [48, 42]], [[52, 42], [62, 42]]); // sunglasses
      strokes.push([[48, 30], [50, 48]]); // signature curl
      strokes.push([[75, 70], [85, 62], [88, 75], [80, 85], [75, 70]]); // single white glove
    } else if (trait === 'guitar_bangs') { // Taylor Swift
      strokes.push([[34, 30], [66, 30]]); // bangs
      strokes.push([[30, 32], [26, 60]], [[70, 32], [74, 60]]); // long hair
      strokes.push([[46, 52], [54, 52]]); // red lips
      strokes.push(circle(75, 75, 12)); // guitar body
      strokes.push([[75, 63], [75, 38]]); // guitar neck
    } else if (trait === 'pompadour_shades') { // Elvis Presley
      strokes.push([[32, 28], [50, 14], [68, 28]]); // pompadour hair
      strokes.push([[36, 42], [48, 42]], [[52, 42], [64, 42]]); // aviator sunglasses
      strokes.push([[33, 40], [33, 52]], [[67, 40], [67, 52]]); // sideburns
      strokes.push([[35, 60], [25, 75], [50, 68], [75, 75], [65, 60]]); // high collar
    } else if (trait === 'crown_mic') { // Beyoncé
      strokes.push([[36, 26], [43, 16], [50, 24], [57, 16], [64, 26], [36, 26]]); // tiara
      strokes.push([[28, 32], [22, 70]], [[72, 32], [78, 70]]); // flowing hair
      strokes.push([[72, 60], [80, 75]], circle(72, 60, 4)); // mic
    } else if (trait === 'mustache_micstand') { // Freddie Mercury
      strokes.push([[42, 48], [58, 48]]); // thick chevron mustache
      strokes.push([[38, 28], [62, 28]]); // slick hair
      strokes.push([[50, 60], [50, 92]], [[35, 92], [65, 92]]); // mic stand
      strokes.push([[44, 58], [56, 58]]); // tank top collar
    } else if (trait === 'wild_hair_mustache') { // Albert Einstein
      strokes.push([[32, 40], [18, 30], [22, 18], [36, 24], [50, 16], [64, 24], [78, 18], [82, 30], [68, 40]]); // wild hair
      strokes.push([[40, 48], [60, 48]]); // thick mustache
      strokes.push(circle(42, 38, 4), circle(58, 38, 4)); // wide eyes
      strokes.push([[40, 32], [46, 32]], [[54, 32], [60, 32]]); // furrowed brows
      strokes.push([[72, 65], [78, 65]], [[74, 75], [82, 75]]); // chalk E=mc²
    } else if (trait === 'tophat_chinbeard') { // Abraham Lincoln
      strokes.push([[30, 28], [70, 28]], rect(38, 2, 24, 26)); // tall stovepipe hat
      strokes.push([[35, 45], [38, 60], [50, 64], [62, 60], [65, 45]]); // chin curtain beard
      strokes.push([[45, 66], [55, 66], [50, 69], [45, 66]]); // bowtie
    } else if (trait === 'bowler_cane_mustache') { // Charlie Chaplin
      strokes.push([[28, 28], [72, 28]], circle(50, 24, 14)); // bowler hat
      strokes.push(rect(46, 45, 8, 4)); // toothbrush mustache
      strokes.push([[76, 55], [76, 90], [70, 92]]); // cane hook
    } else if (trait === 'glasses_scar_wand') { // Harry Potter
      strokes.push(circle(41, 40, 6), circle(59, 40, 6), [[47, 40], [53, 40]]); // round glasses
      strokes.push([[48, 24], [52, 28], [49, 30], [53, 34]]); // lightning scar
      strokes.push([[70, 65], [86, 50]]); // wand
      strokes.push([[38, 60], [62, 60], [62, 72], [38, 72], [38, 60]]); // Gryffindor scarf
    } else if (trait === 'spidey_mask_webs') { // Spider-Man
      strokes.push(tri(36, 36, 46, 42, 40, 46, 36, 36)); // left spidey eye
      strokes.push(tri(64, 36, 54, 42, 60, 46, 64, 36)); // right spidey eye
      strokes.push([[50, 25], [50, 59]], [[33, 42], [67, 42]]); // web cross lines
      strokes.push([[42, 30], [58, 30]], [[40, 54], [60, 54]]); // web concentric
    } else if (trait === 'bat_cowl_batarang') { // Batman
      strokes.push([[35, 26], [30, 10], [42, 24]], [[65, 26], [70, 10], [58, 24]]); // bat ears
      strokes.push([[38, 38], [46, 42], [38, 44]], [[62, 38], [54, 42], [62, 44]]); // cowl eyes
      strokes.push([[42, 54], [50, 50], [58, 54], [50, 58], [42, 54]]); // chin opening
      strokes.push([[35, 75], [50, 70], [65, 75], [50, 80], [35, 75]]); // batarang
    } else if (trait === 'vader_helmet_lightsaber') { // Darth Vader
      strokes.push([[26, 26], [74, 26], [68, 14], [32, 14], [26, 26]]); // helmet dome
      strokes.push(tri(50, 36, 42, 52, 58, 52, 50, 36)); // triangular respirator
      strokes.push([[36, 34], [44, 36]], [[64, 34], [56, 36]]); // eye lenses
      strokes.push([[75, 85], [88, 35]]); // lightsaber blade
    } else if (trait === 'lightning_tail_ears') { // Pikachu
      strokes.push([[34, 26], [22, 6], [38, 18]], [[66, 26], [78, 6], [62, 18]]); // ears with tips
      strokes.push(circle(36, 48, 4), circle(64, 48, 4)); // round rosy cheeks
      strokes.push([[75, 70], [85, 60], [78, 50], [92, 40]]); // lightning bolt tail
    } else if (trait === 'm_cap_mustache_overalls') { // Mario
      strokes.push([[30, 26], [70, 26], [65, 16], [35, 16], [30, 26]]); // cap
      strokes.push(circle(50, 21, 4)); // 'M' circle
      strokes.push([[38, 46], [46, 50], [54, 50], [62, 46]]); // giant mustache
      strokes.push([[38, 65], [38, 85]], [[62, 65], [62, 85]]); // overall suspenders
    } else {
      // General celebrity caricature
      strokes.push([[32, 28], [50, 20], [68, 28]]); // hair/hat line
      strokes.push([[38, 38], [44, 38]], [[56, 38], [62, 38]]); // eyes/glasses
      strokes.push([[46, 48], [54, 48]]); // smile/mustache
      strokes.push([[35, 60], [50, 68], [65, 60]]); // collar/shoulders
      strokes.push([[50, 68], [50, 88]]); // body line
      strokes.push(star(80, 25, 8, 4)); // stardom star
    }
    return strokes;
  }

  // Category specific shapes
  if (cat === 'Animals & Wildlife') {
    strokes.push(circle(50, 40, 16)); // head
    strokes.push([[38, 28], [34, 15], [46, 24]], [[62, 28], [66, 15], [54, 24]]); // ears
    strokes.push([[42, 42], [44, 42]], [[56, 42], [58, 42]]); // eyes
    strokes.push(rect(34, 58, 32, 22)); // torso
    strokes.push([[38, 80], [38, 92]], [[62, 80], [62, 92]]); // legs
    strokes.push([[66, 68], [82, 60]]); // tail
  } else if (cat === 'Food & Beverage') {
    if (w.includes('Pizza')) {
      strokes.push(tri(50, 18, 25, 78, 75, 78, 50, 18));
      strokes.push([[22, 78], [78, 78]]);
      strokes.push(circle(48, 45, 4), circle(40, 62, 4), circle(58, 62, 4));
    } else if (w.includes('Burger') || w.includes('Sandwich')) {
      strokes.push(circle(50, 40, 24));
      strokes.push([[24, 52], [76, 52]]);
      strokes.push(rect(24, 54, 52, 10));
      strokes.push([[24, 66], [76, 66]]);
    } else if (w.includes('Coffee') || w.includes('Tea') || w.includes('Mug')) {
      strokes.push(rect(32, 40, 36, 40));
      strokes.push([[68, 48], [78, 54], [78, 66], [68, 72]]);
      strokes.push([[42, 34], [44, 22]], [[50, 34], [52, 20]], [[58, 34], [60, 22]]);
    } else {
      strokes.push(circle(50, 50, 22));
      strokes.push([[50, 28], [50, 16]], [[50, 20], [62, 14]]);
      strokes.push([[38, 50], [62, 50]]);
    }
  } else if (cat === 'Vehicles & Transport') {
    if (w.includes('Airplane') || w.includes('Jet')) {
      strokes.push([[15, 50], [85, 50], [78, 44], [25, 44], [15, 50]]);
      strokes.push([[42, 44], [35, 20], [52, 44]], [[42, 50], [35, 74], [52, 50]]);
      strokes.push([[75, 44], [82, 28], [86, 44]]);
    } else if (w.includes('Bicycle') || w.includes('Bike')) {
      strokes.push(circle(28, 68, 14), circle(72, 68, 14));
      strokes.push([[28, 68], [48, 68], [62, 48], [40, 48], [28, 68]]);
      strokes.push([[48, 68], [46, 42]], [[62, 48], [72, 68], [68, 36]]);
    } else if (w.includes('Boat') || w.includes('Ship')) {
      strokes.push([[20, 65], [80, 65], [70, 85], [30, 85], [20, 65]]);
      strokes.push([[50, 65], [50, 25]]);
      strokes.push(tri(50, 25, 50, 58, 74, 58, 50, 25));
    } else {
      strokes.push(rect(16, 52, 68, 20));
      strokes.push([[30, 52], [38, 36], [62, 36], [70, 52]]);
      strokes.push(circle(32, 74, 8), circle(68, 74, 8));
    }
  } else if (cat === 'Landmarks & Architecture') {
    if (w.includes('Tower') || w.includes('Eiffel')) {
      strokes.push([[50, 12], [32, 85]], [[50, 12], [68, 85]]);
      strokes.push([[38, 48], [62, 48]], [[34, 68], [66, 68]]);
      strokes.push([[40, 85], [50, 72], [60, 85]]);
    } else if (w.includes('Pyramid')) {
      strokes.push(tri(50, 22, 18, 78, 82, 78, 50, 22));
      strokes.push([[30, 60], [70, 60]], [[40, 42], [60, 42]]);
    } else {
      strokes.push(rect(28, 45, 44, 42));
      strokes.push(tri(50, 20, 24, 45, 76, 45, 50, 20));
      strokes.push(rect(44, 65, 12, 22));
      strokes.push(rect(34, 50, 10, 10), rect(56, 50, 10, 10));
    }
  } else if (cat === 'Musical Instruments') {
    if (w.includes('Guitar') || w.includes('Violin')) {
      strokes.push(circle(50, 66, 16));
      strokes.push(circle(50, 46, 11));
      strokes.push([[50, 35], [50, 10]]);
      strokes.push([[45, 10], [55, 10]]);
      strokes.push(circle(50, 66, 5));
    } else if (w.includes('Piano')) {
      strokes.push(rect(20, 40, 60, 30));
      strokes.push([[20, 60], [80, 60]]);
      for (let x = 25; x <= 75; x += 10) strokes.push([[x, 60], [x, 70]]);
      strokes.push([[26, 70], [26, 88]], [[74, 70], [74, 88]]);
    } else {
      strokes.push(rect(35, 30, 30, 45));
      strokes.push([[50, 20], [50, 30]], [[42, 75], [58, 75]]);
    }
  } else if (cat === 'Sports & Fitness') {
    if (w.includes('Ball')) {
      strokes.push(circle(50, 50, 25));
      strokes.push([[32, 32], [68, 68]], [[68, 32], [32, 68]]);
    } else if (w.includes('Trophy') || w.includes('Medal')) {
      strokes.push([[34, 30], [66, 30], [62, 58], [50, 68], [38, 58], [34, 30]]);
      strokes.push([[34, 38], [24, 44], [36, 54]], [[66, 38], [76, 44], [64, 54]]);
      strokes.push([[50, 68], [50, 78]], rect(38, 78, 24, 8));
    } else {
      strokes.push(rect(24, 46, 52, 12));
      strokes.push(circle(20, 52, 10), circle(80, 52, 10));
    }
  } else if (cat === 'Nature & Space') {
    if (w.includes('Sun')) {
      strokes.push(circle(50, 50, 18));
      strokes.push([[50, 22], [50, 12]], [[50, 78], [50, 88]], [[22, 50], [12, 50]], [[78, 50], [88, 50]]);
      strokes.push([[30, 30], [22, 22]], [[70, 70], [78, 78]], [[70, 30], [78, 22]], [[30, 70], [22, 78]]);
    } else if (w.includes('Tree')) {
      strokes.push(rect(45, 65, 10, 25));
      strokes.push(tri(50, 12, 28, 48, 72, 48, 50, 12));
      strokes.push(tri(50, 28, 32, 65, 68, 65, 50, 28));
    } else if (w.includes('Star')) {
      strokes.push(star(50, 50, 28, 12));
    } else {
      strokes.push(circle(50, 50, 20));
      strokes.push([[20, 50], [80, 50]]);
    }
  } else if (cat === 'Clothing & Fashion') {
    if (w.includes('Hat') || w.includes('Cap')) {
      strokes.push([[20, 65], [80, 65]]);
      strokes.push(circle(50, 50, 20));
    } else if (w.includes('Shoe') || w.includes('Boot') || w.includes('Sneaker')) {
      strokes.push([[25, 45], [45, 45], [52, 60], [78, 60], [80, 75], [20, 75], [20, 55], [25, 45]]);
      strokes.push([[18, 75], [82, 75]]);
    } else {
      strokes.push(rect(30, 35, 40, 50));
      strokes.push([[30, 35], [20, 48]], [[70, 35], [80, 48]]);
    }
  } else {
    // Objects & Tools default
    strokes.push(rect(30, 30, 40, 40));
    strokes.push(circle(50, 50, 12));
    strokes.push([[30, 30], [70, 70]], [[70, 30], [30, 70]]);
  }

  return strokes;
}

// Assemble exact 1000 items
const ALL_ITEMS = [];
const seenWords = new Set();

function register(word, cat, diff = 1, trait = '') {
  const norm = word.trim();
  if (seenWords.has(norm.toLowerCase())) return;
  seenWords.add(norm.toLowerCase());
  ALL_ITEMS.push({
    w: norm,
    cat: cat,
    diff: diff,
    trait: trait
  });
}

CELEBRITIES.forEach(c => register(c.w, 'Celebrities & Pop Icons', c.diff, c.trait));
ANIMALS.forEach((a, idx) => register(a, 'Animals & Wildlife', (idx % 20) + 1));
FOODS.forEach((f, idx) => register(f, 'Food & Beverage', (idx % 20) + 1));
VEHICLES.forEach((v, idx) => register(v, 'Vehicles & Transport', (idx % 20) + 1));
LANDMARKS.forEach((l, idx) => register(l, 'Landmarks & Architecture', (idx % 20) + 1));
INSTRUMENTS.forEach((i, idx) => register(i, 'Musical Instruments', (idx % 20) + 1));
SPORTS.forEach((s, idx) => register(s, 'Sports & Fitness', (idx % 20) + 1));
OBJECTS.forEach((o, idx) => register(o, 'Objects & Household', (idx % 20) + 1));
NATURE.forEach((n, idx) => register(n, 'Nature & Space', (idx % 20) + 1));
CLOTHING.forEach((c, idx) => register(c, 'Clothing & Fashion', (idx % 20) + 1));

// Trim or pad to exact 1000
if (ALL_ITEMS.length > 1000) {
  ALL_ITEMS.length = 1000;
}

// Generate stroke coordinates for all 1000 items
const FINAL_WORDS = ALL_ITEMS.map((item, index) => {
  return {
    id: index + 1,
    w: item.w,
    cat: item.cat,
    diff: item.diff,
    s: generateStrokes(item)
  };
});

console.log('Successfully generated', FINAL_WORDS.length, 'pictionary words!');

// Write to src/pictionaryData.ts
const code = `// src/pictionaryData.ts
// Generated Pictionary Catalog with 1,000 Pictures including Celebrities and 20 Difficulty Levels

export interface PictionaryLevel {
  level: number;
  title: string;
  subtitle: string;
  timeSec: number;
  revealSpeedMs: number;
  wordComplexity: string;
  icon: string;
}

export const PICTIONARY_LEVELS: PictionaryLevel[] = [
  { level: 1, title: 'Novice Doodler', subtitle: 'Simple everyday shapes & icons', timeSec: 35, revealSpeedMs: 1000, wordComplexity: 'Easy', icon: '🖍️' },
  { level: 2, title: 'Crayon Cadet', subtitle: 'Common objects & animals', timeSec: 34, revealSpeedMs: 960, wordComplexity: 'Approachable', icon: '✏️' },
  { level: 3, title: 'Sketch Rookie', subtitle: 'First pop stars & fast sketches', timeSec: 33, revealSpeedMs: 920, wordComplexity: 'Standard', icon: '🎨' },
  { level: 4, title: 'Pad Explorer', subtitle: 'Animals, vehicles, and food', timeSec: 32, revealSpeedMs: 890, wordComplexity: 'Standard', icon: '📓' },
  { level: 5, title: 'Ink Apprentice', subtitle: 'Famous stars & sports icons', timeSec: 31, revealSpeedMs: 860, wordComplexity: 'Moderate', icon: '✒️' },
  { level: 6, title: 'Canvas Crafter', subtitle: 'Musical instruments & world food', timeSec: 30, revealSpeedMs: 830, wordComplexity: 'Moderate', icon: '🖼️' },
  { level: 7, title: 'Doodle Scout', subtitle: 'Hollywood stars & world landmarks', timeSec: 29, revealSpeedMs: 800, wordComplexity: 'Challenging', icon: '🧭' },
  { level: 8, title: 'Brush Bandit', subtitle: 'Famous characters & machines', timeSec: 28, revealSpeedMs: 770, wordComplexity: 'Challenging', icon: '🖌️' },
  { level: 9, title: 'Studio Stylist', subtitle: 'History legends & tech innovators', timeSec: 27, revealSpeedMs: 740, wordComplexity: 'Skilled', icon: '🏛️' },
  { level: 10, title: 'Pencil Virtuoso', subtitle: 'Iconic pop legends & rapid draw', timeSec: 26, revealSpeedMs: 710, wordComplexity: 'Advanced', icon: '🌟' },
  { level: 11, title: 'Line Artisan', subtitle: 'Complex architecture & exotic wildlife', timeSec: 25, revealSpeedMs: 680, wordComplexity: 'Advanced', icon: '📐' },
  { level: 12, title: 'Gallery Guru', subtitle: 'Art history icons & science titans', timeSec: 24, revealSpeedMs: 650, wordComplexity: 'Expert', icon: '🎭' },
  { level: 13, title: 'Vivid Visionary', subtitle: 'Detailed vehicles & world monuments', timeSec: 23, revealSpeedMs: 620, wordComplexity: 'Expert', icon: '🔮' },
  { level: 14, title: 'Charcoal Champion', subtitle: 'Rare wildlife & high-energy poses', timeSec: 22, revealSpeedMs: 590, wordComplexity: 'Master', icon: '🌋' },
  { level: 15, title: 'Fresco Phenom', subtitle: 'Legendary leaders & world champions', timeSec: 21, revealSpeedMs: 560, wordComplexity: 'Master', icon: '🏛️' },
  { level: 16, title: 'Palette Prodigy', subtitle: 'Fast stroke reveals & subtle traits', timeSec: 20, revealSpeedMs: 530, wordComplexity: 'Elite', icon: '🌈' },
  { level: 17, title: 'Museum Maestro', subtitle: 'High-speed guessing under pressure', timeSec: 19, revealSpeedMs: 500, wordComplexity: 'Grandmaster', icon: '🎖️' },
  { level: 18, title: 'Master Illustrator', subtitle: '18s lightning rounds across all 1,000 items', timeSec: 18, revealSpeedMs: 470, wordComplexity: 'Heroic', icon: '🖋️' },
  { level: 19, title: 'Legendary Artist', subtitle: 'Razor sharp reflexes & instant guesses', timeSec: 17, revealSpeedMs: 440, wordComplexity: 'Legendary', icon: '👑' },
  { level: 20, title: 'Grandmaster Da Vinci', subtitle: '16s speedrun of master sketches & celebrities', timeSec: 16, revealSpeedMs: 400, wordComplexity: 'Da Vinci Peak', icon: '🏆' }
];

export function getPictionaryLevel(lvl: number): PictionaryLevel {
  const cl = Math.max(1, Math.min(20, Math.floor(lvl || 1)));
  return PICTIONARY_LEVELS[cl - 1];
}

export interface PictionaryWord {
  id: number;
  w: string;
  cat: string;
  diff: number;
  s: number[][][];
}

export const PICTIONARY_WORDS: PictionaryWord[] = ${JSON.stringify(FINAL_WORDS)};

/**
 * Pick a random word from the 1000-word catalog for the session.
 * STRICTLY GUARANTEES:
 * 1. Never repeats the same picture back-to-back.
 * 2. Never repeats any picture used already during this game session (until all 1,000 exhausted).
 */
export function pickSessionWord(level: number, sessionUsedWords: Set<string>, lastWord?: string): PictionaryWord {
  const lvl = Math.max(1, Math.min(20, level || 1));
  
  // Available pool excluding any words already seen in this session and the immediate last word
  let pool = PICTIONARY_WORDS.filter(item => {
    if (sessionUsedWords && sessionUsedWords.has(item.w.toLowerCase())) return false;
    if (lastWord && item.w.toLowerCase() === lastWord.toLowerCase()) return false;
    return true;
  });

  // If session exhausted all 1000 words, clear the session but still avoid immediate last word
  if (pool.length === 0) {
    if (sessionUsedWords) sessionUsedWords.clear();
    pool = PICTIONARY_WORDS.filter(item => !lastWord || item.w.toLowerCase() !== lastWord.toLowerCase());
  }

  // Soft preference: try to sample words around the selected difficulty, while keeping celebrities available
  const preferred = pool.filter(item => {
    // Always include celebrities in pool for higher engagement
    if (item.cat === 'Celebrities & Pop Icons') return true;
    return item.diff <= lvl + 3 && item.diff >= Math.max(1, lvl - 4);
  });

  const targetList = preferred.length >= 10 ? preferred : pool;
  const pick = targetList[Math.floor(Math.random() * targetList.length)];
  
  if (sessionUsedWords) sessionUsedWords.add(pick.w.toLowerCase());
  return pick;
}

/**
 * Pick 4 unique multiple-choice options (1 correct, 3 distinct distractors).
 */
export function pickPictionaryOptions(correctWord: PictionaryWord): string[] {
  const distractors = PICTIONARY_WORDS
    .filter(x => x.w.toLowerCase() !== correctWord.w.toLowerCase());
  
  // Try to pick distractors from same or related category for better gameplay
  const sameCat = distractors.filter(x => x.cat === correctWord.cat);
  const pool = sameCat.length >= 3 ? sameCat : distractors;
  
  // Shuffle and pick 3 distinct
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const pickedDistractors = shuffled.slice(0, 3).map(x => x.w);
  
  // Combine with correct and shuffle
  const allOpts = [correctWord.w, ...pickedDistractors];
  return allOpts.sort(() => Math.random() - 0.5);
}
`;

fs.writeFileSync(path.join(process.cwd(), 'src/pictionaryData.ts'), code);
console.log('Successfully wrote src/pictionaryData.ts!');
