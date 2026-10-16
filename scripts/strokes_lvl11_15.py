#!/usr/bin/env python3
import math
from test_geo import circle, ellipse, arc, rect, tri, star, line

# ----------------------------------------------------------------------
# LEVEL 11: Mythology & Music Superstars (50 Words)
# ----------------------------------------------------------------------
L11_STROKES = {
  "dragon": [[[46, 50], [30, 40], [22, 42], [26, 54], [42, 60], [54, 74], [72, 70], [68, 54]], tri(42, 44, 58, 20, 60, 46), tri(50, 46, 72, 24, 68, 48), [[22, 42], [14, 40], [10, 44]], [[40, 36], [42, 28]], [[46, 38], [50, 30]]], # horned snout, wings & fire breath
  "unicorn": [ellipse(46, 52, 14, 18), tri(42, 34, 46, 14, 50, 34), line(44, 24, 48, 24), [[38, 40], [34, 30]], [[42, 36], [32, 48], [36, 62]], circle(48, 42, 2)], # spiral alicorn & mane
  "mermaid": [circle(50, 24, 7), rect(44, 31, 12, 16), [[44, 47], [56, 58], [48, 72], [54, 82]], [[54, 82], [42, 88], [52, 84]], [[54, 82], [66, 88], [56, 84]], [[42, 24], [36, 34], [40, 44]]], # torso, fin tail & long hair
  "vampire": [circle(50, 36, 12), [[38, 28], [24, 52], [38, 74]], [[62, 28], [76, 52], [62, 74]], tri(46, 42, 48, 46, 47, 42), tri(52, 42, 54, 46, 53, 42)], # high collar cape & sharp fangs
  "werewolf": [circle(50, 42, 14), tri(38, 30, 32, 18, 44, 26), tri(62, 30, 68, 18, 56, 26), [[42, 50], [50, 56], [58, 50]], line(36, 42, 30, 38), line(64, 42, 70, 38), circle(74, 22, 8)], # wolf ears, snout & full moon
  "zombie": [rect(40, 28, 20, 22), circle(45, 36, 3), circle(55, 36, 1.5), line(44, 44, 56, 44), line(48, 42, 48, 46), line(52, 42, 52, 46), line(38, 54, 20, 54), line(62, 54, 80, 54)], # stitch mouth & outstretched arms
  "ghost": [arc(50, 36, 18, math.pi, 2 * math.pi), [[32, 36], [32, 70], [38, 64], [44, 70], [50, 64], [56, 70], [62, 64], [68, 70], [68, 36]], ellipse(44, 38, 3, 5), ellipse(56, 38, 3, 5), ellipse(50, 50, 4, 6)], # wavy sheet & dark hollow eyes
  "witch": [circle(50, 42, 10), [[26, 34], [74, 34]], tri(36, 34, 50, 10, 64, 34), [[50, 42], [62, 44]], line(36, 68, 74, 54), line(74, 54, 84, 50)], # pointed cone hat & broomstick
  "wizard": [circle(50, 38, 10), tri(36, 30, 50, 12, 64, 30), star(50, 22, 4, 2, 5), [[42, 44], [50, 70], [58, 44]], line(64, 36, 76, 24), star(78, 22, 4, 1.5, 4)], # star robe, long beard & magic wand
  "fairy": [circle(50, 32, 7), tri(50, 39, 42, 62, 58, 62), tri(44, 42, 20, 26, 36, 54), tri(56, 42, 80, 26, 64, 54), line(58, 48, 74, 40), star(76, 38, 3, 1, 4)], # gossamer wings & wand
  "gnome": [circle(50, 44, 10), tri(36, 36, 50, 12, 64, 36), [[42, 46], [50, 72], [58, 46]], circle(50, 44, 4)], # pointy red hat, giant round nose & bushy beard
  "troll": [circle(50, 42, 16), [[34, 40], [22, 36], [30, 48]], [[66, 40], [78, 36], [70, 48]], tri(46, 52, 48, 46, 50, 52), tri(52, 52, 54, 46, 56, 52), rect(68, 38, 8, 36)], # pointed ears, tusks & giant wooden club
  "ogre": [circle(50, 42, 18), circle(50, 46, 6), tri(44, 54, 46, 48, 48, 54), tri(52, 54, 54, 48, 56, 54), rect(36, 60, 28, 24)], # wide snout, protruding tusks & loincloth
  "giant": [circle(50, 18, 6), line(50, 24, 50, 54), line(50, 54, 38, 86), line(50, 54, 62, 86), line(50, 34, 24, 48), line(50, 34, 76, 48), rect(44, 82, 4, 6), rect(54, 82, 4, 6)], # towering stick figure above miniature house
  "cyclops": [circle(50, 44, 18), circle(50, 38, 9), circle(50, 38, 4), arc(50, 54, 8, 0, math.pi), tri(48, 26, 50, 18, 52, 26)], # single giant eye in center of forehead
  "minotaur": [circle(50, 46, 14), [[38, 38], [24, 20], [18, 28]], [[62, 38], [76, 20], [82, 28]], ellipse(50, 54, 8, 5), circle(47, 54, 1.5), circle(53, 54, 1.5), rect(66, 32, 6, 48), tri(60, 32, 78, 32, 69, 22)], # bull horns, snout & battleaxe
  "phoenix": [circle(50, 38, 8), tri(50, 46, 44, 68, 56, 68), [[44, 48], [18, 32], [28, 58], [44, 56]], [[56, 48], [82, 32], [72, 58], [56, 56]], [[48, 68], [42, 86], [50, 80], [58, 86], [52, 68]], [[54, 36], [66, 36]]], # fire bird with flaming plumage
  "griffin": [circle(42, 38, 10), [[48, 36], [62, 40], [52, 46]], tri(48, 48, 68, 24, 56, 56), [[46, 58], [74, 58], [74, 76]], [[74, 68], [86, 60], [84, 72]]], # eagle head/wings & lion hindquarters
  "kraken": [ellipse(50, 38, 18, 16), circle(42, 42, 3), circle(58, 42, 3), [[34, 54], [22, 68], [24, 82]], [[44, 54], [38, 70], [42, 86]], [[56, 54], [62, 70], [58, 86]], [[66, 54], [78, 68], [76, 82]], [[16, 76], [84, 76]]], # giant squid tentacles destroying waves
  "Bigfoot": [ellipse(50, 44, 16, 22), circle(50, 26, 10), line(34, 66, 28, 84), line(66, 66, 72, 84), ellipse(26, 84, 8, 4), ellipse(74, 84, 8, 4)], # massive footprints & ape body
  "Loch Ness monster": [arc(36, 60, 10, math.pi, 2 * math.pi), arc(56, 60, 10, math.pi, 2 * math.pi), [[26, 60], [22, 34], [30, 28], [34, 34]], circle(30, 30, 1.5), line(14, 60, 84, 60)], # triple humps in loch
  "chupacabra": [circle(50, 38, 12), tri(42, 28, 38, 16, 46, 24), tri(58, 28, 62, 16, 54, 24), circle(44, 36, 3), circle(56, 36, 3), [[50, 26], [50, 68]], line(50, 36, 56, 32), line(50, 48, 56, 44), line(50, 60, 56, 56)], # red eyes & spinal quills
  "yeti": [circle(50, 32, 12), ellipse(50, 56, 20, 24), [[34, 44], [22, 64], [26, 72]], [[66, 44], [78, 64], [74, 72]], line(42, 80, 40, 88), line(58, 80, 60, 88)], # white shaggy abominable snowman
  "leprechaun": [circle(50, 40, 9), rect(40, 22, 20, 12), [[32, 34], [68, 34]], [[44, 46], [50, 62], [56, 46]], circle(50, 50, 2)], # buckle top hat & red beard
  "genie": [circle(50, 26, 8), [[44, 34], [36, 48], [64, 48], [56, 34]], [[50, 48], [44, 64], [58, 72], [48, 82], [36, 78]], rect(30, 76, 12, 6)], # smoke vapor from magic oil lamp
  "sphinx": [[[32, 72], [68, 72], [68, 52], [48, 52], [42, 42], [42, 72]], circle(42, 36, 8), [[36, 32], [48, 32], [48, 44]], line(68, 72, 80, 72)], # pharaoh headdress & lion body
  "medusa": [circle(50, 44, 12), [[42, 34], [34, 22], [40, 16]], [[46, 32], [44, 18], [50, 14]], [[54, 32], [56, 18], [50, 14]], [[58, 34], [66, 22], [60, 16]], circle(46, 42, 2), circle(54, 42, 2)], # hair of coiling vipers
  "hydra": [ellipse(50, 66, 16, 14), [[42, 60], [32, 40], [38, 32]], [[50, 60], [50, 34], [56, 26]], [[58, 60], [68, 40], [62, 32]], circle(38, 32, 3), circle(56, 26, 3), circle(62, 32, 3)], # 3 serpent heads
  "cerberus": [ellipse(50, 60, 18, 16), circle(36, 38, 7), circle(50, 34, 8), circle(64, 38, 7), line(36, 60, 32, 82), line(64, 60, 68, 82)], # 3 hound heads
  "pegasus": [ellipse(46, 56, 14, 16), ellipse(38, 40, 8, 6), tri(48, 48, 68, 24, 64, 52), tri(54, 50, 76, 28, 72, 54), line(40, 72, 38, 86), line(52, 72, 54, 86)], # winged divine horse
  "centaur": [circle(38, 22, 6), rect(34, 28, 8, 16), ellipse(54, 56, 18, 14), line(44, 70, 42, 84), line(64, 70, 66, 84)], # human torso on horse body
  "satyr": [circle(50, 26, 6), line(50, 32, 50, 52), [[46, 22], [42, 14]], [[54, 22], [58, 14]], line(50, 52, 42, 68), line(42, 68, 44, 82), line(50, 52, 58, 68), line(58, 68, 56, 82)], # goat horns & cloven hooves
  "nymph": [circle(50, 28, 7), arc(50, 24, 9, math.pi, 2 * math.pi), tri(50, 35, 42, 64, 58, 64), line(36, 24, 38, 44), line(64, 24, 62, 44)], # floral wreath & flowing gown
  "valkyrie": [circle(50, 30, 7), tri(44, 24, 36, 14, 46, 20), tri(56, 24, 64, 14, 54, 20), line(62, 24, 62, 78), circle(40, 46, 8)], # winged helmet, spear & round shield
  "samurai": [circle(50, 34, 9), arc(50, 28, 14, math.pi, 2 * math.pi), line(50, 20, 50, 12), line(44, 14, 56, 14), rect(38, 43, 24, 26), line(66, 36, 76, 76)], # kabuto crest & katana
  "ninja": [circle(50, 34, 10), rect(44, 32, 12, 4), rect(38, 44, 24, 34), star(72, 38, 6, 2, 4)], # shinobi mask & shuriken
  "viking": [circle(50, 38, 9), arc(50, 32, 12, math.pi, 2 * math.pi), [[40, 30], [30, 16], [36, 22]], [[60, 30], [70, 16], [64, 22]], [[44, 46], [50, 68], [56, 46]]], # horned helm & braided beard
  "pirate": [circle(50, 36, 10), line(34, 26, 66, 26), [[38, 26], [42, 16], [58, 16], [62, 26]], circle(46, 36, 3), line(44, 34, 54, 40), [[38, 46], [32, 54], [30, 62]], [[60, 46], [68, 54], [72, 50]]], # tricorn, eye patch & hook hand
  "knight": [circle(50, 32, 10), rect(46, 32, 8, 4), line(48, 34, 52, 34), rect(38, 42, 24, 30), line(64, 34, 64, 82), circle(38, 54, 8)], # close helm visor, sword & shield
  "gladiator": [circle(50, 32, 10), line(50, 22, 50, 14), line(44, 16, 56, 16), circle(36, 54, 10), line(62, 42, 74, 32), tri(74, 32, 78, 30, 76, 36)], # crest helm, round parma & gladius
  "cowboy": [circle(50, 40, 9), [[26, 32], [74, 32], [68, 24], [56, 20], [44, 20], [32, 24], [26, 32]], [[44, 48], [50, 56], [56, 48]], rect(40, 52, 20, 26)], # ten-gallon hat & bandana
  "matador": [circle(50, 30, 8), [[42, 24], [58, 24]], rect(42, 22, 16, 4), rect(40, 38, 20, 28), line(62, 40, 78, 56), [[62, 44], [80, 54], [76, 76], [58, 64]]], # montera cap, bolero jacket & red muleta cape
  "Michael Jackson": [circle(50, 38, 12), [[32, 26], [68, 26]], rect(40, 16, 20, 10), line(48, 38, 54, 44), [[64, 50], [74, 44], [78, 54], [70, 60]], star(72, 50, 2, 0.8, 4)], # fedora, curl & sparkling white glove
  "Taylor Swift": [circle(50, 38, 12), [[38, 28], [50, 20], [62, 28]], line(40, 32, 60, 32), ellipse(70, 64, 10, 8), rect(69, 44, 2, 20), rect(48, 54, 4, 18)], # blonde bangs, acoustic guitar & mic
  "Beyoncé": [circle(50, 38, 12), star(50, 24, 10, 5, 5), [[36, 32], [32, 54]], [[64, 32], [68, 54]], rect(48, 56, 4, 20)], # queen crown, flowing locks & microphone
  "Freddie Mercury": [circle(50, 38, 12), rect(44, 44, 12, 3), rect(42, 50, 16, 24), line(60, 54, 76, 24), rect(74, 22, 4, 6)], # thick mustache, sleeveless tank & bottomless mic stand
  "Elton John": [circle(50, 38, 12), star(42, 36, 6, 3, 5), star(58, 36, 6, 3, 5), line(48, 36, 52, 36), rect(34, 62, 32, 16), line(34, 70, 66, 70)], # oversized star spectacles & piano keys
  "Madonna": [circle(50, 38, 12), tri(42, 54, 46, 44, 50, 54), tri(50, 54, 54, 44, 58, 54), [[50, 30], [58, 24], [54, 18]], line(60, 38, 64, 46)], # conical corset cups & blonde ponytail
  "Prince": [circle(50, 38, 12), arc(50, 48, 10, math.pi, 2 * math.pi), arc(50, 54, 14, math.pi, 2 * math.pi), ellipse(66, 62, 10, 8), [[66, 54], [72, 44], [64, 44]]], # ruffled purple collar & symbol guitar
  "David Bowie": [circle(50, 40, 14), [[48, 22], [54, 36], [48, 40], [56, 56]], [[52, 22], [58, 36], [52, 40], [60, 56]], arc(50, 48, 5, 0, math.pi)] # Aladdin Sane lightning bolt face
}

# ----------------------------------------------------------------------
# LEVEL 12: Sports & Iconic Athletes (50 Words)
# ----------------------------------------------------------------------
L12_STROKES = {
  "soccer ball": [circle(50, 50, 26), star(50, 50, 9, 9, 5), line(44, 43, 32, 36), line(56, 43, 68, 36), line(58, 56, 72, 60), line(50, 60, 50, 74), line(42, 56, 28, 60)], # classic Telstar pentagon & seams
  "basketball": [circle(50, 50, 26), line(24, 50, 76, 50), line(50, 24, 50, 76), arc(34, 50, 16, -0.4 * math.pi, 0.4 * math.pi), arc(66, 50, 16, 0.6 * math.pi, 1.4 * math.pi)], # ribs & channels
  "football": [ellipse(50, 50, 28, 16), line(22, 50, 78, 50), line(44, 46, 44, 54), line(50, 46, 50, 54), line(56, 46, 56, 54)], # pigskin laces
  "baseball": [circle(50, 50, 24), arc(40, 50, 14, -0.4 * math.pi, 0.4 * math.pi), arc(60, 50, 14, 0.6 * math.pi, 1.4 * math.pi)], # twin red curved seams
  "tennis racket": [ellipse(50, 36, 16, 20), line(50, 16, 50, 56), line(34, 36, 66, 36), rect(48, 56, 4, 30), circle(74, 50, 5)], # strung oval head, grip & tennis ball
  "golf club": [line(48, 16, 48, 76), [[48, 76], [62, 76], [66, 72], [48, 72]], circle(70, 74, 3)], # iron head & dimpled golf ball
  "bowling ball": [circle(50, 50, 26), circle(44, 42, 3), circle(56, 42, 3), circle(50, 56, 3.5)], # 3 finger holes
  "boxing gloves": [circle(42, 46, 14), circle(58, 46, 14), rect(36, 60, 12, 14), rect(52, 60, 12, 14)], # padded knuckles & lace cuffs
  "hockey stick": [line(44, 18, 44, 76), [[44, 76], [66, 76], [64, 70], [44, 70]], ellipse(74, 74, 6, 3)], # curved blade & puck
  "lacrosse stick": [line(48, 36, 48, 84), ellipse(48, 26, 10, 14), line(48, 12, 48, 40), line(38, 26, 58, 26), circle(64, 40, 4)], # netted pocket & ball
  "cricket bat": [rect(46, 18, 4, 22), rect(43, 40, 14, 42), [[43, 82], [50, 86], [57, 82]], circle(68, 62, 4)], # cane handle, blade & ball
  "ping pong paddle": [circle(50, 38, 18), rect(47, 56, 6, 24), circle(72, 38, 4)], # rubber round paddle & celluloid ball
  "badminton racket": [ellipse(50, 34, 14, 18), line(50, 52, 50, 84), tri(68, 48, 76, 40, 76, 56)], # oval head & feathered shuttlecock
  "volleyball": [circle(50, 50, 26), line(50, 24, 50, 76), arc(36, 50, 14, 0, math.pi), arc(64, 50, 14, math.pi, 2 * math.pi)], # 3-panel wave seams
  "rugby": [ellipse(50, 50, 30, 18), line(20, 50, 80, 50), line(35, 42, 35, 58), line(65, 42, 65, 58)], # oval leather panels
  "snowboarding": [ellipse(50, 68, 34, 8), rect(36, 64, 6, 6), rect(58, 64, 6, 6), circle(50, 30, 6), line(50, 36, 50, 58)], # board, bindings & rider
  "skydiving": [arc(50, 28, 28, math.pi, 2 * math.pi), line(22, 28, 50, 64), line(78, 28, 50, 64), circle(50, 66, 4), line(50, 70, 50, 82)], # parachute & skydiver
  "bungee jumping": [line(20, 20, 80, 20), [[50, 20], [48, 34], [52, 48], [48, 62], [50, 74]], circle(50, 78, 4), line(50, 82, 50, 88)], # elastic bungee cord rebound
  "rock climbing": [[[20, 20], [30, 44], [24, 68], [28, 86]], circle(46, 42, 6), line(46, 48, 46, 64), line(46, 52, 30, 44), line(46, 64, 28, 68)], # cliff face & harness
  "parkour": [rect(20, 54, 20, 30), rect(60, 44, 20, 40), circle(48, 34, 6), line(48, 40, 44, 54), line(44, 54, 54, 46)], # leaping between rooftops
  "gymnastics": [line(24, 56, 76, 56), circle(50, 32, 6), line(50, 38, 50, 56), line(50, 56, 36, 48), line(50, 56, 64, 48)], # balance beam split leap
  "figure skating": [circle(50, 26, 6), line(50, 32, 50, 54), line(50, 54, 38, 74), line(50, 54, 66, 50), line(50, 38, 36, 28), line(50, 38, 64, 38)], # arabesque glide on ice
  "speed skating": [circle(38, 34, 6), line(38, 40, 50, 54), line(50, 54, 38, 72), line(50, 54, 66, 66), line(34, 74, 46, 72), line(62, 68, 74, 66)], # low crouch sprint
  "bobsled": [ellipse(50, 58, 32, 12), line(22, 70, 78, 70), circle(38, 48, 4), circle(48, 48, 4), circle(58, 48, 4), circle(68, 48, 4)], # 4 crew helmets in sled
  "luge": [ellipse(50, 62, 28, 8), line(24, 70, 76, 70), circle(36, 56, 5), line(41, 58, 68, 58)], # feet-first slider on sled
  "curling": [ellipse(50, 60, 22, 12), rect(44, 44, 12, 6), line(44, 46, 56, 46), circle(50, 60, 6)], # heavy granite curling stone & handle
  "archery": [arc(40, 50, 24, -0.4 * math.pi, 0.4 * math.pi), line(40, 28, 40, 72), line(32, 50, 74, 50), tri(74, 47, 82, 50, 74, 53)], # drawn recurve bow & arrow
  "fencing": [line(38, 42, 78, 42), circle(38, 42, 6), rect(28, 40, 10, 4), circle(26, 28, 6), rect(22, 34, 12, 24)], # foil epee blade, guard & mask
  "judo": [circle(50, 28, 7), rect(40, 38, 20, 26), line(40, 54, 60, 54), line(50, 54, 50, 64)], # gi uniform & black belt knot
  "karate": [circle(50, 28, 7), rect(40, 38, 20, 26), line(40, 52, 60, 52), line(60, 42, 76, 32)], # side chop strike
  "taekwondo": [circle(46, 26, 7), line(46, 33, 46, 54), line(46, 54, 42, 78), line(46, 54, 78, 36)], # dynamic flying high kick
  "sumo wrestling": [circle(50, 26, 8), ellipse(50, 54, 22, 20), rect(42, 62, 16, 8), line(38, 74, 32, 84), line(62, 74, 68, 84)], # heavy mawashi belt & stance
  "arm wrestling": [rect(26, 68, 48, 12), line(44, 68, 48, 44), line(56, 68, 52, 44), circle(50, 44, 5)], # locked hands on table
  "tug of war": [line(16, 50, 84, 50), rect(48, 46, 4, 8), circle(32, 42, 5), circle(68, 42, 5)], # center marker ribbon & pullers
  "marathon": [line(20, 36, 80, 36), line(20, 36, 20, 80), line(80, 36, 80, 80), circle(50, 44, 6), line(50, 50, 50, 70)], # finish line tape banner
  "triathlon": [circle(30, 38, 8), circle(50, 38, 8), circle(70, 38, 8), line(22, 56, 38, 56), circle(50, 64, 8)], # swim, bike & run iconography
  "decathlon": [circle(50, 50, 26), star(50, 50, 18, 9, 10)], # 10-star laurel crown
  "steeplechase": [rect(30, 54, 40, 8), line(34, 62, 30, 80), line(66, 62, 70, 80), ellipse(76, 76, 12, 6)], # barrier hurdle & water pit
  "pole vault": [line(30, 80, 56, 24), circle(54, 20, 6), line(46, 26, 70, 26)], # bending fiberglass pole & high crossbar
  "high jump": [line(26, 38, 74, 38), line(26, 38, 26, 80), line(74, 38, 74, 80), arc(50, 36, 16, 0.9 * math.pi, 2.1 * math.pi)], # backward Fosbury flop arc
  "javelin": [line(22, 74, 78, 26), tri(78, 26, 84, 22, 80, 30), rect(46, 48, 8, 4)], # spear shaft, pointed tip & grip
  "Michael Jordan": [circle(50, 24, 7), rect(44, 32, 12, 18), [[44, 50], [32, 66]], [[56, 50], [68, 66]], [[44, 34], [30, 20]], [[56, 34], [70, 18]], circle(74, 14, 5)], # Jumpman spread-eagle dunking
  "LeBron James": [circle(50, 30, 9), star(50, 18, 6, 3, 5), rect(42, 40, 16, 26), circle(70, 50, 8)], # king crown, headband & basketball
  "Serena Williams": [circle(50, 30, 9), line(42, 24, 58, 24), ellipse(68, 46, 8, 12), line(68, 58, 68, 74)], # headband & champion tennis racket
  "Tiger Woods": [circle(50, 30, 9), [[40, 24], [60, 24]], rect(42, 40, 16, 24), line(66, 44, 66, 76)], # red polo shirt, Nike cap & golf club
  "Muhammad Ali": [circle(50, 28, 9), rect(42, 38, 16, 24), circle(34, 46, 7), circle(66, 46, 7), rect(40, 54, 20, 8)], # red boxing gloves & WBC championship belt
  "Tom Brady": [circle(50, 30, 9), ellipse(68, 48, 10, 6), circle(36, 54, 3), circle(42, 54, 3), circle(48, 54, 3), circle(54, 54, 3), circle(60, 54, 3), circle(66, 54, 3), circle(72, 54, 3)], # football & 7 Super Bowl rings
  "Cristiano Ronaldo": [circle(50, 28, 8), rect(42, 37, 16, 22), line(46, 37, 46, 59), line(50, 42, 54, 42), line(54, 42, 50, 52), [[42, 40], [28, 62]], [[58, 40], [72, 62]]], # jersey #7 & iconic 'Siu' landing pose
  "Simone Biles": [line(24, 62, 76, 62), circle(50, 28, 7), line(50, 35, 50, 52), line(42, 40, 30, 26), line(58, 40, 70, 26), circle(50, 48, 4)], # balance beam routine & gold medal
  "Usain Bolt": [circle(50, 28, 7), line(50, 35, 46, 54), line(46, 38, 22, 24), line(46, 38, 76, 28), circle(50, 48, 4)] # lightning bolt victory point
}

# ----------------------------------------------------------------------
# LEVEL 13: Cinema & Hollywood Stars (50 Words)
# ----------------------------------------------------------------------
L13_STROKES = {
  "movie projector": [rect(30, 42, 28, 24), circle(34, 30, 10), circle(54, 30, 10), [[58, 48], [76, 38], [76, 60], [58, 52]], line(44, 66, 36, 84), line(44, 66, 52, 84)], # dual reels, projector body & lens beam
  "film reel": [circle(50, 50, 26), circle(50, 50, 8), circle(38, 38, 5), circle(62, 38, 5), circle(38, 62, 5), circle(62, 62, 5)], # celluloid sprocket spokes
  "clapperboard": [rect(26, 42, 48, 36), [[26, 42], [74, 28]], line(36, 39, 44, 37), line(52, 35, 60, 33), line(30, 52, 70, 52), line(30, 62, 70, 62)], # clapstick slates & stripes
  "director's chair": [line(32, 30, 32, 78), line(68, 30, 68, 78), rect(32, 32, 36, 12), rect(30, 52, 40, 6), line(32, 58, 68, 82), line(68, 58, 32, 82)], # folding canvas back & X-legs
  "spotlight": [[[36, 28], [64, 28], [72, 48], [28, 48], [36, 28]], line(28, 48, 16, 84), line(72, 48, 84, 84), ellipse(50, 84, 34, 8)], # lamp housing & cone beam
  "red carpet": [[[38, 26], [62, 26], [82, 84], [18, 84], [38, 26]], line(18, 38, 18, 80), line(82, 38, 82, 80)], # perspective carpet & stanchion ropes
  "paparazzi": [circle(38, 36, 8), rect(46, 34, 18, 14), circle(55, 41, 4), star(72, 34, 10, 4, 4)], # telephoto camera & blinding flash
  "autograph": [rect(26, 30, 48, 42), [[32, 48], [42, 44], [38, 56], [54, 46], [64, 52]], line(56, 58, 68, 58)], # signature cursive pen flourish
  "fan mail": [rect(28, 36, 44, 30), line(28, 36, 50, 54), line(72, 36, 50, 54), [[50, 46], [46, 40], [54, 40], [50, 46]]], # sealed envelope & heart sticker
  "box office": [rect(30, 26, 40, 56), arc(50, 48, 10, math.pi, 2 * math.pi), rect(44, 54, 12, 6)], # ticket booth window & money slot
  "blockbuster": [rect(26, 32, 48, 40), star(50, 52, 16, 8, 8)], # explosive starburst explosion
  "sequel": [rect(24, 36, 22, 30), rect(54, 36, 22, 30), line(62, 44, 62, 58), line(68, 44, 68, 58), line(46, 51, 54, 51)], # Roman numeral II & arrow
  "prequel": [rect(24, 36, 22, 30), rect(54, 36, 22, 30), line(54, 51, 46, 51), tri(46, 48, 40, 51, 46, 54)], # reverse rewind arrow
  "remake": [circle(50, 50, 22), tri(68, 36, 76, 44, 66, 48), tri(32, 64, 24, 56, 34, 52)], # looping recycle circular arrows
  "plot twist": [[[26, 50], [48, 50], [48, 32], [66, 32], [66, 68], [34, 68]], tri(34, 64, 26, 68, 34, 72)], # U-turn spiral loop
  "cliffhanger": [[[20, 28], [48, 28], [48, 80]], circle(58, 38, 5), line(58, 43, 58, 58), line(58, 45, 48, 34)], # figure dangling off jagged cliff edge
  "cameo": [ellipse(50, 48, 20, 26), circle(50, 44, 10), [[44, 54], [56, 54]]], # antique Victorian portrait cameo
  "stunt double": [circle(38, 32, 6), line(38, 38, 38, 62), circle(62, 32, 6), line(62, 38, 62, 62), line(38, 44, 62, 44)], # twin matched stand-ins
  "green screen": [rect(22, 26, 56, 46), rect(44, 40, 12, 20), line(22, 72, 78, 72)], # chroma studio cyclorama wall
  "special effects": [star(50, 48, 22, 8, 4), star(32, 32, 8, 3, 4), star(68, 62, 8, 3, 4)], # visual FX explosion sparks
  "stop motion": [rect(28, 40, 10, 14), rect(44, 36, 10, 14), rect(60, 32, 10, 14), line(22, 62, 78, 62)], # frame-by-frame pose claymation
  "animation": [rect(24, 28, 32, 42), rect(44, 36, 32, 42), circle(40, 48, 4), circle(60, 56, 4)], # light table animation paper layers
  "cartoon": [circle(50, 44, 18), circle(42, 38, 6), circle(58, 38, 6), arc(50, 48, 8, 0, math.pi), tri(36, 28, 44, 18, 46, 26)], # exaggerated toon features
  "anime": [circle(50, 44, 16), ellipse(42, 40, 5, 8), ellipse(58, 40, 5, 8), circle(43, 38, 2), circle(59, 38, 2), [[34, 34], [44, 18], [54, 26], [66, 18], [64, 34]]], # large expressive eyes & spiky hair
  "superhero": [circle(50, 26, 7), rect(44, 33, 12, 18), [[44, 34], [28, 54], [34, 76]], [[56, 34], [72, 54], [66, 76]], star(50, 42, 4, 2, 5)], # fluttering cape & chest emblem
  "supervillain": [circle(50, 28, 7), [[38, 26], [22, 44], [36, 74]], [[62, 26], [78, 44], [64, 74]], arc(50, 36, 6, 0.2 * math.pi, 0.8 * math.pi)], # spiked dark mantle & evil smirk
  "sidekick": [circle(42, 26, 7), rect(36, 33, 12, 20), circle(64, 34, 5), rect(60, 39, 8, 16)], # hero & smaller companion
  "secret identity": [circle(50, 40, 14), rect(36, 34, 28, 10), line(36, 39, 64, 39)], # superhero domino mask
  "origin story": [rect(26, 26, 48, 52), star(50, 44, 12, 5, 4), line(32, 64, 68, 64)], # comic book issue #1 first appearance
  "trilogy": [rect(22, 30, 16, 42), rect(42, 30, 16, 42), rect(62, 30, 16, 42)], # 3 matching volume book / VHS set
  "cult classic": [circle(50, 46, 18), circle(44, 42, 3), circle(56, 42, 3), [[42, 54], [58, 54]], star(74, 26, 6, 2, 4)], # cult symbol film icon
  "indie film": [rect(30, 38, 28, 20), circle(36, 30, 8), circle(52, 30, 8), rect(68, 38, 6, 14)], # portable 16mm indie film camera
  "documentary": [rect(26, 32, 38, 26), line(64, 40, 78, 32), line(78, 32, 78, 58), line(64, 50, 78, 58)], # film camera lens capture
  "mockumentary": [rect(26, 32, 38, 26), circle(45, 45, 6), arc(50, 72, 8, 0, math.pi)], # documentary camera & comedy smirk
  "biopic": [rect(30, 26, 40, 50), circle(50, 44, 10), line(38, 62, 62, 62)], # gilded life-story portrait frame
  "musical": [circle(50, 32, 8), line(50, 40, 50, 64), line(42, 22, 58, 22), rect(46, 18, 8, 4), circle(68, 38, 4), line(72, 38, 72, 26)], # top hat, cane & musical note
  "silent film": [rect(24, 30, 52, 40), rect(28, 34, 44, 32), line(32, 44, 68, 44), line(32, 54, 68, 54)], # vintage text intertitle card
  "black and white": [circle(50, 50, 24), line(50, 26, 50, 74), line(50, 32, 70, 32), line(50, 44, 74, 44), line(50, 56, 72, 56), line(50, 68, 68, 68)], # half-shaded monochromatic disc
  "3D glasses": [rect(24, 42, 22, 16), rect(54, 42, 22, 16), line(46, 48, 54, 48), line(28, 46, 42, 54), line(58, 46, 72, 54)], # classic red & cyan stereoscopic frames
  "drive-in theater": [rect(22, 24, 56, 36), rect(36, 64, 28, 14), circle(42, 78, 4), circle(58, 78, 4)], # giant outdoor screen & car in lot
  "concession stand": [rect(24, 42, 52, 38), rect(30, 28, 16, 14), rect(54, 28, 12, 14), line(20, 42, 80, 42)], # counter with popcorn bucket & soda
  "Tom Hanks": [rect(26, 52, 48, 10), line(32, 62, 32, 78), line(68, 62, 68, 78), circle(50, 34, 8), rect(44, 48, 12, 8)], # Forrest Gump park bench & box of chocolates
  "Leonardo DiCaprio": [[[16, 72], [46, 46], [84, 72]], circle(46, 32, 8), line(46, 40, 46, 56), line(24, 36, 68, 36)], # Titanic ship bow with arms outstretched
  "Brad Pitt": [circle(50, 38, 12), rect(40, 34, 20, 8), rect(42, 50, 16, 26), line(38, 50, 32, 68)], # Fight Club red shades & leather jacket
  "Angelina Jolie": [circle(50, 36, 12), [[42, 26], [32, 48], [36, 64]], rect(42, 34, 16, 6)], # Lara Croft long ponytail braid & shades
  "Dwayne Johnson": [circle(50, 38, 14), arc(44, 32, 5, math.pi, 2 * math.pi), arc(56, 28, 6, 0.8 * math.pi, 1.8 * math.pi), circle(68, 50, 8)], # raised People's Eyebrow & flexed bicep
  "Keanu Reeves": [circle(50, 34, 12), rect(40, 32, 20, 6), rect(40, 46, 20, 36), line(50, 46, 50, 82)], # Matrix sunglasses & long trench coat
  "Will Smith": [circle(50, 34, 12), rect(42, 32, 16, 6), rect(42, 46, 16, 34), rect(64, 40, 4, 18), circle(66, 38, 2)], # Men in Black dark suit & neuralyzer
  "Jennifer Lawrence": [circle(50, 30, 8), arc(64, 44, 18, -0.4 * math.pi, 0.4 * math.pi), line(64, 28, 64, 60), line(52, 44, 74, 44)], # Katniss Everdeen bow and arrow
  "Robert Downey Jr.": [circle(50, 36, 12), line(46, 44, 54, 44), line(50, 44, 50, 50), circle(50, 62, 7), circle(50, 62, 3)] # Tony Stark goatee & glowing arc reactor
}

# ----------------------------------------------------------------------
# LEVEL 14: Sci-Fi, Space & Geniuses (50 Words)
# ----------------------------------------------------------------------
L14_STROKES = {
  "test tube": [rect(46, 22, 8, 48), arc(50, 70, 4, 0, math.pi), line(44, 22, 56, 22), line(46, 54, 54, 54)], # tube rim, meniscus & liquid
  "beaker": [rect(34, 28, 32, 46), arc(50, 74, 16, 0, math.pi), line(32, 28, 34, 28), line(34, 52, 66, 52)], # pouring spout & measurement marks
  "bunsen burner": [rect(46, 38, 8, 36), rect(36, 74, 28, 6), line(40, 66, 46, 66), [[50, 38], [44, 24], [50, 14], [56, 24], [50, 38]]], # chimney, gas inlet, base & flame
  "petri dish": [ellipse(50, 56, 32, 14), ellipse(50, 54, 28, 12), circle(42, 54, 3), circle(54, 50, 4), circle(58, 58, 2.5)], # agar plate with bacterial colonies
  "DNA helix": [[[36, 16], [64, 34], [36, 52], [64, 70], [36, 88]], [[64, 16], [36, 34], [64, 52], [36, 70], [64, 88]], line(40, 25, 60, 25), line(40, 43, 60, 43), line(40, 61, 60, 61), line(40, 79, 60, 79)], # double helix base pairs
  "atom": [circle(50, 50, 7), ellipse(50, 50, 28, 10), [[32, 34], [68, 66]], [[68, 34], [32, 66]]], # nucleus & intersecting orbital electron rings
  "molecule": [circle(36, 44, 8), circle(64, 44, 8), circle(50, 66, 10), line(42, 48, 46, 60), line(58, 48, 54, 60)], # bonded atoms (water molecule H2O)
  "periodic table": [rect(20, 28, 60, 44), line(20, 42, 80, 42), line(20, 56, 80, 56), line(32, 28, 32, 72), line(44, 28, 44, 72), line(56, 28, 56, 72), line(68, 28, 68, 72)], # Mendeleev element grid
  "chemical reaction": [tri(38, 68, 52, 68, 45, 52), [[45, 52], [45, 42]], circle(45, 36, 4), circle(52, 28, 3), circle(40, 22, 2.5)], # effervescent bubbles rising
  "lab coat": [rect(36, 24, 28, 58), line(50, 24, 50, 82), tri(42, 24, 50, 36, 50, 24), tri(58, 24, 50, 36, 50, 24), rect(38, 52, 8, 10)], # lapels, buttons & pocket
  "safety goggles": [rect(26, 42, 20, 14), rect(54, 42, 20, 14), line(46, 48, 54, 48), line(26, 48, 18, 44), line(74, 48, 82, 44)], # protective wrap-around lenses
  "robot": [rect(36, 24, 28, 24), circle(43, 34, 3), circle(57, 34, 3), rect(44, 42, 12, 3), rect(32, 52, 36, 30), line(50, 24, 50, 16), circle(50, 14, 3)], # boxy head, antenna & meters
  "android": [circle(50, 36, 16), arc(50, 36, 16, math.pi, 2 * math.pi), circle(44, 32, 2), circle(56, 32, 2), line(44, 22, 38, 14), line(56, 22, 62, 14)], # green dome android head
  "cyborg": [circle(50, 40, 16), line(50, 24, 50, 56), circle(44, 38, 2), rect(54, 36, 8, 5), circle(58, 38, 2)], # half human, half bionic glowing red optic
  "artificial intelligence": [circle(50, 50, 24), circle(50, 50, 6), line(50, 26, 50, 44), line(50, 56, 50, 74), line(26, 50, 44, 50), line(56, 50, 74, 50), circle(26, 50, 3), circle(74, 50, 3)], # neural circuit nodes
  "virtual reality": [rect(28, 36, 44, 20), line(28, 44, 18, 40), line(72, 44, 82, 40), arc(50, 56, 8, 0, math.pi)], # VR headset visor & straps
  "hologram": [ellipse(50, 76, 24, 8), [[32, 76], [42, 36], [58, 36], [68, 76]], star(50, 46, 8, 4, 4)], # projection base & glowing 3D wireframe
  "laser": [rect(18, 48, 24, 6), line(42, 51, 86, 51), star(86, 51, 6, 2, 4)], # emitter diode & pinpoint beam
  "satellite": [rect(44, 44, 12, 12), rect(22, 46, 20, 8), rect(58, 46, 20, 8), line(22, 50, 42, 50), line(58, 50, 78, 50), arc(50, 38, 6, math.pi, 2 * math.pi)], # solar panels & dish
  "space station": [circle(50, 50, 10), rect(20, 46, 24, 8), rect(56, 46, 24, 8), rect(46, 22, 8, 22), rect(46, 56, 8, 22)], # ISS modular cross & solar wings
  "black hole": [circle(50, 50, 12), ellipse(50, 50, 36, 12), arc(50, 50, 26, 0.8 * math.pi, 2.2 * math.pi)], # event horizon sphere & accretion disk
  "supernova": [star(50, 50, 34, 10, 8), circle(50, 50, 10), star(50, 50, 20, 6, 8)], # cataclysmic stellar burst
  "galaxy": [circle(50, 50, 6), arc(50, 50, 16, 0, 1.2 * math.pi), arc(50, 50, 26, math.pi, 2.2 * math.pi)], # spiral milky way arms
  "nebula": [circle(42, 46, 12), circle(58, 48, 14), circle(50, 36, 10), star(42, 46, 3, 1, 4), star(58, 48, 3, 1, 4)], # interstellar gas cloud & newborn stars
  "comet": [circle(34, 64, 8), [[36, 58], [76, 22]], [[40, 64], [84, 26]], [[36, 70], [78, 34]]], # icy nucleus & trailing ion tail
  "meteor shower": [circle(28, 70, 3), line(28, 70, 50, 44), circle(46, 60, 3), line(46, 60, 68, 34), circle(64, 50, 3), line(64, 50, 86, 24)], # shooting stars streak
  "solar eclipse": [circle(50, 50, 18), circle(48, 50, 18), star(50, 50, 28, 22, 12)], # moon occulting sun & fiery corona
  "lunar eclipse": [circle(50, 50, 20), arc(50, 50, 20, -0.4 * math.pi, 0.4 * math.pi), arc(50, 50, 14, -0.4 * math.pi, 0.4 * math.pi)], # blood moon shadow bite
  "time machine": [circle(50, 48, 24), line(50, 48, 50, 32), line(50, 48, 62, 48), rect(44, 74, 12, 10), arc(50, 48, 28, 0, 1.8 * math.pi)], # clock dial, temporal vortex
  "teleportation": [ellipse(50, 28, 16, 6), ellipse(50, 74, 16, 6), line(42, 30, 42, 72), line(58, 30, 58, 72), circle(50, 50, 4)], # twin portal rings & beam
  "invisibility cloak": [arc(50, 32, 16, math.pi, 2 * math.pi), [[34, 32], [26, 76], [74, 76], [66, 32]], line(40, 48, 60, 48)], # shimmering transparent cowl
  "force field": [circle(50, 50, 26), arc(50, 50, 26, 0.2 * math.pi, 0.8 * math.pi), arc(50, 50, 26, 1.2 * math.pi, 1.8 * math.pi)], # glowing energy shield bubble
  "ray gun": [rect(26, 42, 34, 10), rect(28, 52, 8, 18), circle(64, 47, 6), circle(72, 47, 4), circle(78, 47, 2)], # retro sci-fi blaster & concentric rings
  "jetpack": [rect(36, 34, 12, 32), rect(52, 34, 12, 32), line(48, 40, 52, 40), tri(38, 66, 42, 82, 46, 66), tri(54, 66, 58, 82, 62, 66)], # twin propulsion rocket thrusters & flames
  "hoverboard": [ellipse(50, 58, 32, 10), ellipse(50, 62, 32, 10), circle(36, 58, 4), circle(64, 58, 4)], # floating repulsor deck
  "drone": [circle(50, 50, 8), line(34, 34, 66, 66), line(34, 66, 66, 34), circle(34, 34, 6), circle(66, 66, 6), circle(34, 66, 6), circle(66, 34, 6)], # quadcopter arms & propellers
  "3D printer": [rect(24, 26, 52, 52), line(24, 44, 76, 44), rect(46, 40, 8, 8), tri(48, 48, 52, 48, 50, 54), rect(36, 64, 28, 4)], # extruder gantry & print bed
  "solar panel": [[[26, 38], [74, 38], [82, 70], [18, 70], [26, 38]], line(50, 38, 50, 70), line(38, 38, 34, 70), line(62, 38, 66, 70), line(22, 54, 78, 54)], # photovoltaic silicon grid
  "wind turbine": [line(50, 42, 50, 86), circle(50, 42, 4), line(50, 42, 50, 16), line(50, 42, 28, 54), line(50, 42, 72, 54)], # tall mast & 3 aerodynamic blades
  "electric car": [rect(20, 50, 60, 20), [[34, 50], [42, 36], [62, 36], [70, 50]], circle(32, 70, 6), circle(68, 70, 6), [[48, 56], [54, 56], [50, 64], [56, 64]]], # lightning bolt logo on chassis
  "smartphone": [rect(34, 20, 32, 60), rect(36, 26, 28, 46), circle(50, 75, 2.5), line(46, 23, 54, 23)], # screen bezel, speaker slit & home button
  "Albert Einstein": [circle(50, 42, 14), [[32, 38], [24, 24], [34, 16], [50, 14], [66, 16], [76, 24], [68, 38]], [[40, 48], [46, 54], [54, 54], [60, 48]], arc(50, 44, 4, 0, math.pi)], # wild shock of white hair & bushy mustache
  "Marie Curie": [circle(50, 36, 12), [[40, 26], [50, 20], [60, 26]], [[44, 48], [44, 76], [56, 76], [56, 48]], star(50, 62, 6, 2, 4)], # laboratory flask & glowing radium
  "Isaac Newton": [circle(50, 36, 12), [[36, 30], [32, 46], [38, 54]], [[64, 30], [68, 46], [62, 54]], circle(72, 38, 4), line(72, 30, 72, 34), line(72, 46, 72, 72)], # powdered wig & falling apple
  "Stephen Hawking": [circle(50, 32, 10), rect(44, 30, 12, 4), rect(38, 46, 24, 28), circle(34, 74, 8), circle(66, 74, 8)], # spectacles & motorized wheelchair
  "Nikola Tesla": [circle(50, 38, 12), line(38, 28, 62, 28), line(44, 46, 56, 46), [[28, 64], [38, 44], [34, 38], [42, 28]], [[72, 64], [62, 44], [66, 38], [58, 28]]], # center part, neat mustache & lightning coils
  "Thomas Edison": [circle(50, 38, 14), circle(74, 40, 8), line(74, 48, 74, 54), rect(72, 54, 4, 4), star(74, 40, 4, 2, 4)], # bulb inventor with glowing lamp
  "Charles Darwin": [circle(50, 38, 14), [[38, 46], [42, 68], [50, 76], [58, 68], [62, 46]], arc(44, 34, 4, math.pi, 2 * math.pi), arc(56, 34, 4, math.pi, 2 * math.pi)], # prominent brow & massive white beard
  "Neil Armstrong": [circle(50, 32, 14), ellipse(50, 32, 10, 8), line(70, 30, 70, 78), rect(70, 30, 16, 10), line(20, 78, 80, 78)], # astronaut helmet & lunar flag
  "Elon Musk": [circle(50, 36, 13), tri(74, 22, 68, 42, 80, 42), rect(70, 42, 8, 24), line(42, 34, 48, 34), line(52, 34, 58, 34)] # SpaceX falcon rocket & tech silhouette
}

# ----------------------------------------------------------------------
# LEVEL 15: Ancient Empires & Leaders (50 Words)
# ----------------------------------------------------------------------
L15_STROKES = {
  "sarcophagus": [[[42, 16], [58, 16], [64, 28], [60, 82], [40, 82], [36, 28], [42, 16]], circle(50, 28, 6), line(44, 44, 56, 44), line(44, 58, 56, 58)], # Egyptian mummy coffin
  "mummy": [ellipse(50, 32, 10, 12), rect(42, 44, 16, 38), line(42, 32, 58, 32), line(42, 40, 58, 40), line(42, 52, 58, 52), line(42, 64, 58, 64)], # cloth bandages wrap
  "hieroglyphics": [rect(26, 24, 48, 56), circle(38, 36, 4), [[54, 34], [62, 40], [54, 46]], arc(42, 56, 6, 0, math.pi), line(56, 54, 64, 62)], # papyrus glyph carvings
  "scroll": [rect(30, 24, 40, 52), arc(30, 50, 6, 0.5 * math.pi, 1.5 * math.pi), arc(70, 50, 6, -0.5 * math.pi, 0.5 * math.pi), line(38, 38, 62, 38), line(38, 50, 62, 50)], # parchment parchment roll
  "quill": [[[34, 76], [52, 48], [66, 24], [58, 20], [46, 44], [34, 76]], line(34, 76, 62, 22), ellipse(32, 78, 6, 4)], # feather vane & inkwell pot
  "abacus": [rect(24, 30, 52, 42), line(24, 44, 76, 44), line(36, 30, 36, 72), line(50, 30, 50, 72), line(64, 30, 64, 72), circle(36, 38, 2.5), circle(50, 38, 2.5), circle(64, 38, 2.5), circle(36, 56, 2.5), circle(50, 56, 2.5), circle(64, 56, 2.5)], # counting frame & sliding beads
  "sundial": [circle(50, 54, 22), line(50, 54, 50, 34), tri(50, 54, 50, 36, 40, 54), circle(50, 54, 3)], # gnomon shadow pointer
  "hourglass": [tri(32, 24, 68, 24, 50, 50), tri(32, 76, 68, 76, 50, 50), line(30, 24, 70, 24), line(30, 76, 70, 76), circle(50, 66, 3)], # glass bulbs & falling sand
  "compass": [circle(50, 50, 24), circle(50, 50, 20), tri(50, 28, 46, 50, 54, 50), tri(50, 72, 46, 50, 54, 50)], # magnetic north needle
  "astrolabe": [circle(50, 50, 24), circle(50, 24, 4), line(50, 26, 50, 74), line(26, 50, 74, 50), line(34, 34, 66, 66)], # brass celestial navigation rings
  "crown": [[[26, 66], [74, 66], [78, 42], [62, 54], [50, 36], [38, 54], [22, 42], [26, 66]], circle(50, 36, 2.5), circle(22, 42, 2.5), circle(78, 42, 2.5)], # royal peaks & jewels
  "throne": [rect(28, 20, 44, 44), rect(24, 54, 52, 16), line(26, 70, 26, 84), line(74, 70, 74, 84), tri(42, 20, 50, 12, 58, 20)], # high carved back & gilded armrests
  "scepter": [line(50, 26, 50, 84), circle(50, 22, 6), star(50, 22, 4, 1.5, 4), rect(46, 80, 8, 4)], # golden rod & jeweled orb
  "royal guard": [circle(50, 38, 8), rect(44, 18, 12, 20), rect(42, 46, 16, 38), line(62, 30, 62, 84)], # towering bearskin hat & red tunic
  "coronation": [circle(50, 48, 10), [[34, 30], [66, 30], [68, 18], [58, 24], [50, 14], [42, 24], [32, 18], [34, 30]], line(36, 58, 64, 58)], # placing crown upon sovereign
  "catapult": [line(22, 74, 78, 74), line(34, 74, 48, 50), line(48, 50, 72, 32), circle(72, 32, 5), circle(34, 74, 6), circle(66, 74, 6)], # wooden throwing arm & wheels
  "trebuchet": [line(26, 76, 74, 76), tri(42, 76, 58, 76, 50, 46), line(34, 36, 68, 60), rect(30, 34, 8, 10)], # massive counterweight pivot
  "moat": [rect(26, 30, 48, 36), [[16, 66], [84, 66], [76, 80], [24, 80], [16, 66]], line(46, 50, 54, 50)], # castle walls & surrounding water trench
  "dungeon": [rect(26, 26, 48, 54), line(36, 26, 36, 80), line(46, 26, 46, 80), line(56, 26, 56, 80), line(66, 26, 66, 80), circle(32, 54, 3)], # iron cell door bars & padlock
  "armor": [rect(36, 26, 28, 32), line(50, 26, 50, 58), [[36, 26], [26, 40]], [[64, 26], [74, 40]], rect(38, 58, 24, 18)], # steel breastplate & pauldrons
  "shield": [[[30, 26], [70, 26], [70, 56], [50, 80], [30, 56], [30, 26]], line(50, 26, 50, 80), line(30, 50, 70, 50)], # heraldic knight heater shield & cross
  "sword": [line(50, 16, 50, 72), line(38, 72, 62, 72), rect(48, 72, 4, 12), circle(50, 86, 3)], # steel blade, crossguard & pommel
  "broadsword": [line(48, 14, 48, 70), line(52, 14, 52, 70), tri(48, 14, 52, 14, 50, 10), line(34, 70, 66, 70), rect(47, 70, 6, 14)], # two-handed heavy blade
  "chariot": [circle(36, 72, 10), [[44, 54], [62, 54], [60, 72], [38, 72]], line(62, 60, 86, 60), rect(42, 44, 4, 10)], # war cart body, wheel & draft pole
  "pantheon": [tri(18, 36, 50, 18, 82, 36), arc(50, 36, 14, math.pi, 2 * math.pi), line(26, 36, 26, 78), line(42, 36, 42, 78), line(58, 36, 58, 78), line(74, 36, 74, 78)], # rotunda dome & portico
  "forum": [line(20, 80, 80, 80), line(26, 34, 26, 80), line(40, 42, 40, 80), line(54, 38, 54, 80), line(68, 48, 68, 80), line(22, 34, 30, 34)], # ancient ruin pillars & capitals
  "viking ship": [[[14, 44], [22, 68], [78, 68], [86, 44], [74, 58], [26, 58], [14, 44]], line(50, 58, 50, 22), rect(36, 26, 28, 22)], # dragon prow longship & striped sail
  "caravel": [[[20, 66], [80, 66], [74, 80], [26, 80], [20, 66]], line(40, 66, 40, 22), line(64, 66, 64, 30), tri(40, 24, 56, 44, 40, 44)], # Age of Discovery galleon masts
  "steam engine": [rect(24, 44, 44, 24), rect(56, 30, 12, 38), rect(28, 32, 8, 12), circle(34, 74, 7), circle(54, 74, 7)], # boiler, tall smokestack & piston drive
  "telegraph": [rect(30, 48, 40, 14), line(36, 48, 58, 36), circle(58, 36, 4), line(48, 62, 52, 62)], # brass tapper key & sounder base
  "morse code": [circle(28, 50, 3), circle(38, 50, 3), line(46, 50, 56, 50), line(62, 50, 72, 50)], # dot dot dash dash pulses
  "pony express": [circle(50, 40, 12), ellipse(62, 54, 14, 10), rect(44, 52, 12, 10), line(44, 70, 40, 84)], # rider saddlebag & galloping mount
  "covered wagon": [rect(26, 52, 48, 16), arc(50, 52, 22, math.pi, 2 * math.pi), circle(32, 74, 8), circle(68, 74, 8)], # conestoga canvas hoop top & wheels
  "gold rush": [ellipse(50, 60, 24, 8), circle(44, 58, 3), circle(52, 60, 4), circle(58, 58, 3), star(50, 40, 8, 3, 4)], # panning pan & gleaming gold nuggets
  "industrial revolution": [rect(24, 44, 52, 34), rect(32, 20, 8, 24), rect(46, 16, 8, 28), circle(36, 16, 4), circle(50, 12, 5)], # factory chimneys belching steam
  "renaissance": [rect(28, 24, 44, 46), circle(50, 44, 10), star(50, 44, 8, 4, 4)], # Vitruvian human study in square
  "stone age": [line(38, 34, 58, 76), ellipse(36, 32, 10, 8), line(32, 30, 40, 38)], # bound flint stone axe on wooden haft
  "bronze age": [tri(46, 18, 54, 18, 50, 58), line(42, 58, 58, 58), rect(48, 58, 4, 16)], # cast bronze spearhead & ferrule
  "ice age": [[[24, 66], [42, 44], [60, 48], [76, 66]], arc(40, 48, 10, 0.5 * math.pi, 1.5 * math.pi), arc(60, 48, 10, 1.5 * math.pi, 2.5 * math.pi)], # woolly mammoth curved tusks
  "dinosaur": [[[26, 38], [38, 32], [44, 42], [62, 44], [78, 62], [84, 56], [74, 40], [54, 38]], line(50, 56, 46, 78), line(62, 56, 64, 78)], # T-Rex skull silhouette & jaws
  "fossil": [ellipse(50, 50, 24, 20), [[50, 36], [58, 44], [52, 54], [44, 48], [48, 42]], line(50, 36, 50, 54)], # spiral ammonite fossil shell in rock
  "Abraham Lincoln": [circle(50, 44, 12), rect(40, 14, 20, 24), [[32, 38], [68, 38]], [[42, 48], [46, 62], [54, 62], [58, 48]]], # tall stovepipe hat & chinstrap beard
  "George Washington": [circle(50, 42, 12), tri(36, 26, 64, 26, 50, 32), circle(36, 38, 5), circle(64, 38, 5)], # tricorn hat & powdered colonial wig rolls
  "Cleopatra": [circle(50, 42, 12), [[34, 26], [66, 26], [62, 56], [58, 34], [42, 34], [38, 56], [34, 26]], [[50, 26], [50, 18], [54, 16]]], # nemes headdress & royal asp cobra
  "Julius Caesar": [circle(50, 42, 12), arc(50, 34, 14, math.pi, 2 * math.pi), [[36, 32], [32, 26]], [[64, 32], [68, 26]], [[40, 54], [50, 64], [62, 54]]], # Roman laurel wreath crown & toga
  "Napoleon": [circle(50, 44, 12), [[24, 32], [76, 32], [64, 22], [36, 22], [24, 32]], [[44, 56], [54, 56], [50, 64]]], # bicorn cocked hat & hand tucked in jacket
  "Joan of Arc": [circle(50, 34, 9), arc(50, 28, 12, math.pi, 2 * math.pi), rect(42, 44, 16, 28), line(64, 20, 64, 82), rect(64, 20, 16, 12)], # helmet, breastplate & battle banner
  "Martin Luther King Jr.": [circle(50, 34, 11), rect(42, 46, 16, 30), rect(44, 52, 12, 18), rect(46, 38, 8, 6)], # pastoral collar & March on Washington podium
  "Winston Churchill": [circle(50, 42, 15), [[38, 30], [62, 30]], arc(50, 30, 12, math.pi, 2 * math.pi), line(56, 48, 66, 44), line(30, 40, 32, 26), line(34, 40, 38, 26)], # bowler hat, cigar & famous V for victory sign
  "Mahatma Gandhi": [circle(50, 40, 14), circle(44, 38, 4), circle(56, 38, 4), line(48, 38, 52, 38), circle(70, 62, 10)] # round wire glasses & charkha spinning wheel
}

print("Loaded L11-L15: Total words =", len(L11_STROKES) + len(L12_STROKES) + len(L13_STROKES) + len(L14_STROKES) + len(L15_STROKES))
