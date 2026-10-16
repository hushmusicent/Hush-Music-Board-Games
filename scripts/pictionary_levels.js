// scripts/generate_all_1000_distinct_strokes.js
import fs from 'fs';
import path from 'path';
import { circle, ellipse, arc, rect, tri, star, line } from './stroke_helpers.js';

// Load LEVEL_DATA from existing build script or define it cleanly
const LEVEL_DATA = [
  {
    level: 1,
    title: 'First Words & Basics',
    subtitle: 'Everyday household shapes & basics',
    timeSec: 35,
    revealSpeedMs: 1000,
    icon: '🍎',
    items: "apple, banana, sun, moon, star, heart, ball, dog, cat, fish, bird, tree, flower, house, car, hat, shoe, key, door, bed, egg, cup, book, chair, table, eye, nose, mouth, hand, foot, smile, cloud, rain, boat, kite, box, drum, bell, ring, coin, spoon, fork, plate, lamp, candle, pillow, blanket, sock, shirt, window"
  },
  {
    level: 2,
    title: 'Food, Fruits & Pantry',
    subtitle: 'Delicious snacks, produce & drinks',
    timeSec: 34,
    revealSpeedMs: 960,
    icon: '🍕',
    items: "orange, grapes, strawberry, watermelon, ice cream, cake, cookie, pizza, hamburger, hot dog, sandwich, cheese, milk, juice, candy, lollipop, donut, popcorn, pretzel, pancake, waffle, bread, butter, honey, carrot, potato, tomato, corn, pumpkin, onion, yogurt, lemon, lime, peach, pear, plum, cherry, pineapple, coconut, avocado, broccoli, celery, cucumber, lettuce, pepper, salt, sugar, coffee, tea, soda"
  },
  {
    level: 3,
    title: 'Animals & Wildlife',
    subtitle: 'Wild beasts, pets, birds & sea creatures',
    timeSec: 33,
    revealSpeedMs: 920,
    icon: '🦁',
    items: "lion, tiger, bear, elephant, giraffe, zebra, monkey, kangaroo, panda, koala, penguin, owl, eagle, parrot, duck, chicken, rooster, pig, cow, horse, sheep, goat, donkey, rabbit, squirrel, mouse, rat, hamster, turtle, frog, snake, lizard, crocodile, alligator, shark, whale, dolphin, octopus, crab, lobster, shrimp, jellyfish, seahorse, starfish, spider, ant, bee, butterfly, ladybug, worm"
  },
  {
    level: 4,
    title: 'Clothing, Weather & Nature',
    subtitle: 'Outfits, weather storms & outdoor elements',
    timeSec: 32,
    revealSpeedMs: 890,
    icon: '🧥',
    items: "pants, dress, jacket, coat, sweater, shorts, skirt, tie, scarf, gloves, boots, sandals, glasses, sunglasses, watch, bracelet, necklace, earrings, backpack, purse, wallet, umbrella, toothbrush, toothpaste, soap, towel, comb, brush, mirror, snow, snowflake, snowman, rainbow, lightning, thunder, wind, fog, ice, puddle, leaf, branch, root, seed, acorn, pinecone, cactus, mushroom, vine, moss, pebble"
  },
  {
    level: 5,
    title: 'Toys, Classroom & Home',
    subtitle: 'Playground gear, stationary & furniture',
    timeSec: 31,
    revealSpeedMs: 860,
    icon: '🧸',
    items: "teddy bear, doll, blocks, puzzle, crayon, marker, pencil, pen, eraser, ruler, scissors, glue, tape, notebook, chalk, desk, blackboard, globe, sofa, armchair, coffee table, bookshelf, dresser, closet, curtains, rug, fireplace, stairs, elevator, skylight, roof, chimney, fence, gate, mailbox, driveway, garage, porch, swing, slide, seesaw, sandbox, trampoline, tricycle, wagon, scooter, skateboard, roller skates, jump rope, hula hoop"
  },
  {
    level: 6,
    title: 'Tools & Musical Instruments',
    subtitle: 'Hardware gear, electronics & instruments',
    timeSec: 30,
    revealSpeedMs: 830,
    icon: '🎸',
    items: "hammer, nail, screw, screwdriver, wrench, pliers, saw, drill, ladder, toolbox, flashlight, battery, light bulb, switch, plug, cord, extension cord, fan, heater, air conditioner, thermostat, smoke detector, guitar, piano, violin, trumpet, saxophone, flute, clarinet, trombone, harmonica, accordion, banjo, ukulele, cello, harp, xylophone, tambourine, maracas, cymbals, metronome, microphone, speaker, headphones, radio, television, remote control, antenna, camera, tripod"
  },
  {
    level: 7,
    title: 'Actions, Verbs & Dynamics',
    subtitle: 'Motion, human actions, athletic movements',
    timeSec: 29,
    revealSpeedMs: 800,
    icon: '🏃',
    items: "running, walking, jumping, skipping, hopping, swimming, diving, surfing, skiing, skating, dancing, singing, clapping, waving, pointing, pushing, pulling, lifting, carrying, throwing, catching, kicking, punching, boxing, wrestling, climbing, crawling, digging, planting, watering, cooking, baking, frying, boiling, grilling, chopping, stirring, pouring, drinking, eating, chewing, sleeping, snoring, yawning, sneezing, coughing, crying, laughing, giggling, whispering"
  },
  {
    level: 8,
    title: 'Places & Professions',
    subtitle: 'City landmarks, occupations & buildings',
    timeSec: 28,
    revealSpeedMs: 770,
    icon: '🏥',
    items: "school, classroom, library, museum, zoo, aquarium, park, playground, beach, pool, gym, stadium, hospital, doctor, nurse, dentist, teacher, student, principal, police officer, firefighter, farmer, chef, baker, waiter, cashier, barber, mechanic, plumber, electrician, carpenter, painter, photographer, pilot, sailor, soldier, astronaut, scientist, engineer, lawyer, judge, bank, store, mall, restaurant, hotel, airport, train station, bus stop, church"
  },
  {
    level: 9,
    title: 'Vehicles, Transport & Machines',
    subtitle: 'Airplanes, ships, emergency trucks & heavy gear',
    timeSec: 27,
    revealSpeedMs: 740,
    icon: '🚀',
    items: "unicycle, motorcycle, airplane, helicopter, jet, rocket, spaceship, submarine, sailboat, yacht, canoe, kayak, ferry, cruise ship, train, subway, tram, bulldozer, crane, tractor, fire truck, ambulance, police car, taxi, limousine, pickup truck, van, RV, forklift, excavator, cement mixer, dump truck, tow truck, snowplow, golf cart, rickshaw, hot air balloon, blimp, parachute, hang glider, segway, combine harvester, steamroller, street sweeper, ice cream truck, food truck, moving truck, armored truck, cable car, monorail"
  },
  {
    level: 10,
    title: 'World Wonders & Pioneers',
    subtitle: 'Monuments, landscapes & early pop legends',
    timeSec: 26,
    revealSpeedMs: 710,
    icon: '🏛️',
    items: "Eiffel Tower, Statue of Liberty, Big Ben, pyramids, Taj Mahal, Colosseum, Great Wall of China, Sydney Opera House, Space Needle, Golden Gate Bridge, Mount Rushmore, Niagara Falls, Grand Canyon, volcano, waterfall, geyser, glacier, iceberg, desert, oasis, castle, lighthouse, windmill, igloo, teepee, pagoda, temple, cathedral, mosque, synagogue, skyscraper, bridge, dam, tunnel, overpass, roundabout, crosswalk, traffic light, stop sign, toll booth, drawbridge, aqueduct, observatory, planetarium, greenhouse, barn, silo, Elvis Presley (pompadour & sideburns), Marilyn Monroe (blonde curls & beauty mark), Charlie Chaplin (bowler hat & toothbrush mustache)"
  },
  {
    level: 11,
    title: 'Mythology & Music Superstars',
    subtitle: 'Mythical beasts, warriors & legendary vocalists',
    timeSec: 25,
    revealSpeedMs: 680,
    icon: '🐉',
    items: "dragon, unicorn, mermaid, vampire, werewolf, zombie, ghost, witch, wizard, fairy, gnome, troll, ogre, giant, cyclops, minotaur, phoenix, griffin, kraken, Bigfoot, Loch Ness monster, chupacabra, yeti, leprechaun, genie, sphinx, medusa, hydra, cerberus, pegasus, centaur, satyr, nymph, valkyrie, samurai, ninja, viking, pirate, knight, gladiator, cowboy, matador, Michael Jackson (fedora & white glove), Taylor Swift (guitar & microphone), Beyoncé (crown & microphone), Freddie Mercury (mustache & microphone stand), Elton John (star sunglasses & piano), Madonna (cone bodice & headset mic), Prince (purple ruffled collar & guitar), David Bowie (lightning bolt face & microphone)"
  },
  {
    level: 12,
    title: 'Sports & Iconic Athletes',
    subtitle: 'Olympic feats, athletic gear & historic champions',
    timeSec: 24,
    revealSpeedMs: 650,
    icon: '⚽',
    items: "soccer ball, basketball, football, baseball, tennis racket, golf club, bowling ball, boxing gloves, hockey stick, lacrosse stick, cricket bat, ping pong paddle, badminton racket, volleyball, rugby, snowboarding, skydiving, bungee jumping, rock climbing, parkour, gymnastics, figure skating, speed skating, bobsled, luge, curling, archery, fencing, judo, karate, taekwondo, sumo wrestling, arm wrestling, tug of war, marathon, triathlon, decathlon, steeplechase, pole vault, high jump, javelin, Michael Jordan (jersey 23 & dunking), LeBron James (crown & basketball), Serena Williams (tennis racket & headband), Tiger Woods (golf club & red polo), Muhammad Ali (boxing gloves & championship belt), Tom Brady (football & 7 rings), Cristiano Ronaldo (soccer jersey 7 & celebration), Simone Biles (gymnastics beam & gold medal), Usain Bolt (lightning bolt pose & gold medal)"
  },
  {
    level: 13,
    title: 'Cinema & Hollywood Stars',
    subtitle: 'Film set equipment, genres & screen legends',
    timeSec: 23,
    revealSpeedMs: 620,
    icon: '🎬',
    items: "movie projector, film reel, clapperboard, director's chair, spotlight, red carpet, paparazzi, autograph, fan mail, box office, blockbuster, sequel, prequel, remake, plot twist, cliffhanger, cameo, stunt double, green screen, special effects, stop motion, animation, cartoon, anime, superhero, supervillain, sidekick, secret identity, origin story, trilogy, cult classic, indie film, documentary, mockumentary, biopic, musical, silent film, black and white, 3D glasses, drive-in theater, concession stand, Tom Hanks (Forrest Gump bench & box of chocolates), Leonardo DiCaprio (Titanic ship bow & arms spread), Brad Pitt (Fight Club shades & leather jacket), Angelina Jolie (Tomb Raider braid & sunglasses), Dwayne Johnson (raised eyebrow & bicep flex), Keanu Reeves (Matrix trenchcoat & shades), Will Smith (Men in Black suit & neuralyzer), Jennifer Lawrence (Hunger Games bow & arrow), Robert Downey Jr. (Iron Man goatee & arc reactor)"
  },
  {
    level: 14,
    title: 'Sci-Fi, Space & Geniuses',
    subtitle: 'Cosmos, future tech & historic inventors',
    timeSec: 22,
    revealSpeedMs: 590,
    icon: '🔬',
    items: "test tube, beaker, bunsen burner, petri dish, DNA helix, atom, molecule, periodic table, chemical reaction, lab coat, safety goggles, robot, android, cyborg, artificial intelligence, virtual reality, hologram, laser, satellite, space station, black hole, supernova, galaxy, nebula, comet, meteor shower, solar eclipse, lunar eclipse, time machine, teleportation, invisibility cloak, force field, ray gun, jetpack, hoverboard, drone, 3D printer, solar panel, wind turbine, electric car, smartphone, Albert Einstein (wild bushy hair & mustache), Marie Curie (laboratory flask & radium glow), Isaac Newton (apple falling from tree & prism), Stephen Hawking (wheelchair & chalkboard equations), Nikola Tesla (mustache & Tesla coil lightning), Thomas Edison (light bulb & phonograph), Charles Darwin (white beard & finches), Neil Armstrong (astronaut helmet & Moon flag), Elon Musk (rocket & electric car)"
  },
  {
    level: 15,
    title: 'Ancient Empires & Leaders',
    subtitle: 'Antiquity relics, medieval castles & historic titans',
    timeSec: 21,
    revealSpeedMs: 560,
    icon: '👑',
    items: "sarcophagus, mummy, hieroglyphics, scroll, quill, abacus, sundial, hourglass, compass, astrolabe, crown, throne, scepter, royal guard, coronation, catapult, trebuchet, moat, dungeon, armor, shield, sword, broadsword, chariot, pantheon, forum, viking ship, caravel, steam engine, telegraph, morse code, pony express, covered wagon, gold rush, industrial revolution, renaissance, stone age, bronze age, ice age, dinosaur, fossil, Abraham Lincoln (tall stovepipe hat & beard), George Washington (powdered wig & tricorn hat), Cleopatra (pharaoh headdress & cobra), Julius Caesar (laurel wreath crown & toga), Napoleon (bicorn hat & hand in coat), Joan of Arc (knight armor & banner), Martin Luther King Jr. (suit & microphone at podium), Winston Churchill (bowler hat & cigar & V sign), Mahatma Gandhi (round spectacles & spinning wheel)"
  },
  {
    level: 16,
    title: 'Fine Arts, Literature & Masters',
    subtitle: 'Canvases, poetry, drama & iconic creators',
    timeSec: 20,
    revealSpeedMs: 530,
    icon: '🎨',
    items: "paintbrush, palette, easel, canvas, mural, fresco, mosaic, sculpture, bust, statue, pottery, kiln, origami, calligraphy, watercolor, oil painting, portrait, landscape, still life, self-portrait, caricature, comic strip, graphic novel, manuscript, novel, poetry, haiku, sonnet, limerick, fable, fairy tale, legend, myth, epic, tragedy, comedy, satire, parody, allegory, metaphor, typewriter, Leonardo da Vinci (long beard & Mona Lisa easel), Vincent van Gogh (straw hat & bandaged ear), Pablo Picasso (striped marinière shirt & cubist face), Frida Kahlo (floral crown & unibrow), William Shakespeare (ruffled Tudor collar & quill), Jane Austen (bonnet & inkwell), Mark Twain (white bushy mustache & cigar), Edgar Allan Poe (dark suit & raven perched on shoulder), Bob Ross (giant afro perm & happy tree paintbrush)"
  },
  {
    level: 17,
    title: 'Emotions, Humanity & TV Stars',
    subtitle: 'Deep feelings, virtue & broadcast legends',
    timeSec: 19,
    revealSpeedMs: 500,
    icon: '💖',
    items: "love, hate, joy, sorrow, anger, fear, courage, hope, despair, jealousy, envy, pride, humility, greed, generosity, kindness, cruelty, mercy, justice, injustice, freedom, oppression, peace, war, victory, defeat, success, failure, luck, fate, destiny, karma, déjà vu, nostalgia, homesickness, wanderlust, curiosity, boredom, excitement, surprise, confusion, Oprah Winfrey (talk show couch & microphone), Ellen DeGeneres (blonde pixie & dance moves), Gordon Ramsay (chef coat & angry shout), David Attenborough (khakis & wildlife), Bill Nye (bow tie & lab coat), Steve Irwin (khaki shirt & crocodile), Julia Child (tall chef & whisk), Mr. Rogers (cardigan & sneakers), Bob Barker (microphone & game show)"
  },
  {
    level: 18,
    title: 'Politics, Law & World Voices',
    subtitle: 'Governance, trials, activism & civil icons',
    timeSec: 18,
    revealSpeedMs: 470,
    icon: '⚖️',
    items: "democracy, dictatorship, capitalism, socialism, communism, monarchy, anarchy, revolution, protest, boycott, election, campaign, debate, filibuster, veto, impeachment, constitution, bill of rights, amendment, referendum, propaganda, censorship, conspiracy, scandal, cover-up, whistleblower, leak, wiretap, interrogation, alibi, motive, evidence, trial, verdict, appeal, parole, probation, jury duty, hung jury, plea bargain, statute of limitations, Barack Obama (suit & wave), Nelson Mandela (prison bars to president), Mother Teresa (blue-bordered sari), Dalai Lama (maroon robes & smile), Malala Yousafzai (headscarf & book), Greta Thunberg (braids & protest sign), Ruth Bader Ginsburg (collar & gavel), Stephen Colbert (suit & smirk), John Oliver (glasses & desk)"
  },
  {
    level: 19,
    title: 'Philosophy, Paradoxes & Thinkers',
    subtitle: 'Mind puzzles, psychology & historic sages',
    timeSec: 17,
    revealSpeedMs: 440,
    icon: '🧠',
    items: "solipsism, paradox, irony, sarcasm, oxymoron, enigma, mystery, riddle, conundrum, dilemma, quandary, catch-22, double bind, moral dilemma, trolley problem, butterfly effect, domino effect, ripple effect, chain reaction, vicious cycle, self-fulfilling prophecy, placebo effect, Stockholm syndrome, imposter syndrome, cognitive dissonance, confirmation bias, sunk cost fallacy, analysis paralysis, decision fatigue, writer's block, artist's block, stage fright, performance anxiety, fear of missing out, fear of failure, perfectionism, procrastination, insomnia, sleep paralysis, lucid dreaming, out-of-body experience, Sigmund Freud (beard & cigar & couch), Carl Jung (pipe & archetypes), Friedrich Nietzsche (mustache & overman), Socrates (toga & hemlock), Plato (scroll & cave allegory), Aristotle (beard & lyceum), Confucius (robes & analects), Buddha (meditation pose & lotus), Rumi (whirling dervish & poetry)"
  },
  {
    level: 20,
    title: 'Advanced Science, Tech & Visionaries',
    subtitle: 'Quantum physics, economics & frontier minds',
    timeSec: 16,
    revealSpeedMs: 400,
    icon: '🌌',
    items: "quantum mechanics, relativity, string theory, dark matter, dark energy, multiverse, wormhole, event horizon, singularity, entropy, chaos theory, game theory, prisoner's dilemma, Nash equilibrium, invisible hand, supply and demand, inflation, deflation, recession, depression, stagflation, hyperinflation, quantitative easing, trickle-down economics, globalization, outsourcing, automation, artificial general intelligence, machine learning, neural network, deepfake, blockchain, cryptocurrency, NFT, metaverse, augmented reality, digital divide, echo chamber, filter bubble, cancel culture, virtue signaling, performative activism, Alan Turing (codebreaker & apple), Ada Lovelace (Victorian dress & algorithm), Grace Hopper (navy uniform & compiler), Katherine Johnson (NASA & calculations), Richard Feynman (bongos & diagrams), Carl Sagan (turtleneck & cosmos), Jane Goodall (chimpanzee & khaki), Jacques Cousteau (red cap & aqualung)"
  }
];

export { LEVEL_DATA };
