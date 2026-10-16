#!/usr/bin/env python3
import math
from test_geo import circle, ellipse, arc, rect, tri, star, line

# ----------------------------------------------------------------------
# LEVEL 16: Fine Arts, Literature & Masters (50 Words)
# ----------------------------------------------------------------------
L16_STROKES = {
  "paintbrush": [line(32, 68, 64, 26), rect(62, 24, 6, 8), [[64, 24], [72, 16], [74, 20], [68, 28]], ellipse(28, 72, 6, 3)], # wooden handle, ferrule, bristle & paint drop
  "palette": [ellipse(50, 52, 26, 18), circle(64, 56, 4), circle(36, 46, 3), circle(46, 42, 3), circle(56, 44, 3), circle(40, 58, 3)], # thumb hole & paint dollops
  "easel": [line(32, 20, 24, 82), line(68, 20, 76, 82), line(50, 20, 50, 84), line(22, 56, 78, 56), rect(34, 34, 32, 22)], # tripod legs, shelf & canvas
  "canvas": [rect(26, 26, 48, 44), rect(28, 28, 44, 40), tri(36, 60, 48, 44, 60, 60), circle(42, 38, 4)], # stretcher frame, mountain & sun art
  "mural": [rect(20, 28, 60, 44), line(20, 40, 80, 40), arc(50, 56, 16, math.pi, 2 * math.pi), star(68, 36, 6, 3, 5)], # vast painted wall tableau
  "fresco": [rect(24, 28, 52, 46), arc(50, 50, 14, 0, math.pi), line(30, 36, 70, 36)], # wet plaster classical fresco
  "mosaic": [rect(24, 26, 52, 48), line(24, 38, 76, 38), line(24, 50, 76, 50), line(24, 62, 76, 62), line(37, 26, 37, 74), line(50, 26, 50, 74), line(63, 26, 63, 74)], # tesserae tile grid
  "sculpture": [rect(36, 68, 28, 14), circle(50, 32, 8), [[46, 40], [42, 54], [58, 54], [54, 40]], line(40, 48, 60, 48)], # classical torso statue on marble plinth
  "bust": [rect(38, 72, 24, 10), circle(50, 34, 10), [[42, 44], [34, 58], [66, 58], [58, 44]], rect(46, 58, 8, 14)], # Roman portrait head & pedestal
  "statue": [rect(32, 74, 36, 10), circle(50, 28, 8), line(50, 36, 50, 58), line(50, 42, 36, 34), line(50, 42, 64, 34), line(50, 58, 42, 74), line(50, 58, 58, 74)], # marble monument figure
  "pottery": [[[38, 34], [62, 34]], [[38, 34], [32, 54], [40, 74], [60, 74], [68, 54], [62, 34]], ellipse(50, 34, 12, 4)], # ceramic vase amphora
  "kiln": [arc(50, 60, 26, math.pi, 2 * math.pi), line(24, 60, 76, 60), rect(42, 60, 16, 18), tri(46, 74, 50, 64, 54, 74)], # brick firing furnace & flame
  "origami": [[[50, 22], [32, 48], [50, 74], [68, 48], [50, 22]], line(50, 22, 50, 74), line(32, 48, 68, 48)], # folded geometric paper crane
  "calligraphy": [[[32, 70], [44, 44], [56, 32], [52, 28], [40, 44], [32, 70]], [[48, 42], [68, 46], [58, 60]]], # ink brush character stroke
  "watercolor": [ellipse(50, 54, 28, 18), circle(44, 50, 6), circle(56, 56, 8), arc(50, 54, 12, 0, 1.8 * math.pi)], # translucent blended paint wash
  "oil painting": [rect(26, 26, 48, 44), rect(30, 30, 40, 36), circle(42, 42, 5), [[30, 56], [44, 46], [56, 54], [70, 48]]], # ornate gilded frame & landscape
  "portrait": [rect(30, 24, 40, 52), circle(50, 42, 10), [[44, 52], [38, 66], [62, 66], [56, 52]], arc(50, 44, 4, 0, math.pi)], # framed human face study
  "landscape": [rect(24, 30, 52, 38), tri(28, 68, 46, 42, 60, 68), tri(48, 68, 62, 48, 72, 68), circle(64, 38, 4)], # scenic mountains, trees & sun
  "still life": [ellipse(50, 64, 28, 10), circle(42, 54, 6), circle(56, 52, 7), circle(50, 44, 5), [[42, 48], [44, 44]]], # fruit bowl arrangement (apple, orange)
  "self-portrait": [rect(28, 24, 44, 50), circle(50, 40, 10), rect(44, 38, 12, 4), line(56, 54, 66, 62)], # artist wearing glasses holding brush
  "caricature": [circle(50, 42, 16), [[46, 38], [54, 38]], arc(50, 48, 10, 0, math.pi), ellipse(50, 44, 4, 8)], # exaggerated huge nose & grin
  "comic strip": [rect(22, 32, 56, 36), line(50, 32, 50, 68), circle(36, 46, 6), rect(60, 42, 12, 12)], # two panels & speech balloon
  "graphic novel": [rect(28, 24, 44, 54), line(28, 24, 24, 28), line(24, 28, 24, 78), line(24, 78, 28, 74), line(34, 36, 66, 36), rect(34, 44, 32, 24)], # hardcover illustrated volume
  "manuscript": [rect(28, 24, 44, 54), rect(34, 30, 10, 10), line(48, 32, 66, 32), line(48, 38, 66, 38), line(34, 46, 66, 46), line(34, 54, 66, 54), line(34, 62, 66, 62)], # illuminated manuscript drop-cap
  "novel": [rect(30, 24, 40, 52), [[30, 24], [26, 28], [26, 76], [30, 72]], line(36, 40, 64, 40), line(36, 50, 56, 50)], # bound book spine & title text
  "poetry": [rect(32, 24, 36, 52), line(38, 34, 56, 34), line(40, 42, 58, 42), line(38, 50, 54, 50), line(42, 58, 60, 58)], # indented stanza verses
  "haiku": [line(36, 34, 64, 34), line(32, 46, 68, 46), line(36, 58, 64, 58), circle(50, 34, 2), circle(50, 46, 2), circle(50, 58, 2)], # 5-7-5 syllable poem lines
  "sonnet": [rect(32, 22, 36, 56), line(36, 30, 64, 30), line(36, 38, 64, 38), line(36, 46, 64, 46), line(36, 54, 64, 54), line(40, 64, 60, 64)], # 14-line Shakespearean structure
  "limerick": [line(32, 30, 68, 30), line(32, 38, 68, 38), line(40, 46, 60, 46), line(40, 54, 60, 54), line(32, 62, 68, 62)], # AABBA meter lines
  "fable": [circle(42, 48, 8), circle(60, 52, 6), [[38, 42], [34, 32]], [[44, 42], [48, 32]], ellipse(60, 58, 8, 4)], # tortoise & hare moral tale
  "fairy tale": [tri(36, 30, 50, 12, 64, 30), circle(50, 38, 10), line(64, 36, 76, 24), star(78, 22, 4, 1.5, 4), rect(36, 48, 28, 26)], # castle & fairy wand
  "legend": [line(50, 20, 50, 66), [[50, 20], [42, 28], [58, 28], [50, 20]], [[34, 66], [66, 66], [62, 78], [38, 78], [34, 66]]], # Excalibur sword in stone anvil
  "myth": [circle(50, 42, 16), star(50, 42, 24, 18, 8), [[46, 38], [54, 38]], arc(50, 48, 6, 0, math.pi)], # celestial deity radiant visage
  "epic": [rect(26, 26, 48, 50), line(50, 26, 50, 76), line(60, 38, 68, 34), tri(64, 46, 70, 36, 72, 48)], # Homeric heroic tome & spear
  "tragedy": [circle(50, 46, 18), arc(42, 40, 4, math.pi, 2 * math.pi), arc(58, 40, 4, math.pi, 2 * math.pi), arc(50, 58, 8, 0.1 * math.pi, 0.9 * math.pi)], # theater tragedy mask
  "comedy": [circle(50, 46, 18), arc(42, 42, 4, 0, math.pi), arc(58, 42, 4, 0, math.pi), arc(50, 50, 10, 0, math.pi)], # theater comedy smiling mask
  "satire": [circle(50, 44, 16), [[42, 38], [48, 38]], [[54, 36], [60, 38]], arc(52, 48, 8, 0.1 * math.pi, 0.7 * math.pi)], # arched eyebrow & wry smirk
  "parody": [circle(46, 44, 14), circle(58, 44, 14), arc(46, 50, 6, 0, math.pi), arc(58, 50, 6, 0, math.pi)], # duplicate goofy caricature mimic
  "allegory": [circle(50, 34, 8), line(50, 42, 50, 68), line(34, 46, 66, 46), tri(34, 46, 28, 60, 40, 60), tri(66, 46, 60, 60, 72, 60)], # blindfolded Lady Justice scales
  "metaphor": [circle(38, 50, 10), circle(62, 50, 10), line(48, 50, 52, 50), line(44, 48, 56, 52)], # bridge linking two disparate thoughts
  "typewriter": [rect(26, 44, 48, 26), rect(34, 32, 32, 12), line(22, 34, 78, 34), circle(36, 54, 2), circle(44, 54, 2), circle(52, 54, 2), circle(60, 54, 2), circle(40, 62, 2), circle(48, 62, 2), circle(56, 62, 2)], # roller platen & keys
  "Leonardo da Vinci": [circle(50, 36, 12), [[36, 44], [42, 70], [50, 76], [58, 70], [64, 44]], rect(70, 30, 16, 20), circle(78, 38, 3)], # grand philosopher beard & Mona Lisa easel
  "Vincent van Gogh": [circle(50, 38, 12), [[34, 28], [66, 28]], arc(50, 28, 12, math.pi, 2 * math.pi), rect(36, 36, 6, 12), [[44, 46], [50, 52], [56, 46]], star(74, 24, 6, 2, 4)], # straw hat, bandaged ear & starry night swirl
  "Pablo Picasso": [circle(50, 40, 14), line(50, 26, 50, 54), circle(44, 36, 3), rect(54, 40, 6, 4), line(36, 62, 64, 62), line(36, 68, 64, 68)], # cubist split face & striped shirt
  "Frida Kahlo": [circle(50, 40, 13), line(40, 34, 60, 34), circle(40, 24, 4), circle(50, 22, 4), circle(60, 24, 4)], # signature unibrow & floral hair crown
  "William Shakespeare": [circle(50, 36, 12), arc(50, 48, 12, math.pi, 2 * math.pi), arc(50, 52, 16, math.pi, 2 * math.pi), line(46, 44, 54, 44), line(64, 38, 76, 24)], # ruffled Elizabethan ruff collar & quill
  "Jane Austen": [circle(50, 36, 11), arc(50, 32, 12, math.pi, 2 * math.pi), line(38, 32, 42, 48), line(62, 32, 58, 48), [[50, 52], [56, 64], [52, 70]]], # Regency lace bonnet & inkwell
  "Mark Twain": [circle(50, 38, 13), [[34, 30], [28, 20], [42, 16], [58, 16], [72, 20], [66, 30]], [[40, 44], [46, 50], [54, 50], [60, 44]], line(56, 48, 72, 44)], # bushy white mane, mustache & cigar
  "Edgar Allan Poe": [circle(50, 36, 12), [[40, 26], [60, 26], [60, 32], [40, 32]], [[46, 44], [54, 44]], circle(72, 38, 5), [[72, 38], [80, 40], [74, 44]], [[70, 42], [74, 54]]], # brooding brow, mustache & perched raven
  "Bob Ross": [circle(50, 44, 12), circle(50, 34, 20), [[44, 50], [50, 56], [56, 50]], rect(68, 54, 16, 12), tri(72, 50, 76, 40, 80, 50)], # giant iconic afro perm & happy tree brush
}

# ----------------------------------------------------------------------
# LEVEL 17: Emotions, Humanity & TV Stars (50 Words)
# ----------------------------------------------------------------------
L17_STROKES = {
  "love": [circle(42, 42, 10), circle(58, 42, 10), tri(32, 45, 68, 45, 50, 74), line(34, 36, 38, 40)], # glowing twin-lobed heart
  "hate": [circle(50, 46, 18), line(38, 36, 48, 42), line(62, 36, 52, 42), line(40, 56, 60, 56)], # furrowed angled brows & severe line
  "joy": [circle(50, 44, 18), arc(40, 38, 4, math.pi, 2 * math.pi), arc(60, 38, 4, math.pi, 2 * math.pi), arc(50, 48, 10, 0, math.pi), star(26, 26, 4, 1.5, 4), star(74, 26, 4, 1.5, 4)], # beaming face & sparkle bursts
  "sorrow": [circle(50, 46, 18), line(40, 38, 46, 36), line(60, 38, 54, 36), arc(50, 58, 8, 0.1 * math.pi, 0.9 * math.pi), circle(42, 48, 2)], # down-turned lips & single teardrop
  "anger": [circle(50, 46, 18), line(36, 36, 48, 44), line(64, 36, 52, 44), rect(42, 52, 16, 6), [[30, 24], [34, 20], [38, 24]], [[62, 24], [66, 20], [70, 24]]], # steaming red fury brows
  "fear": [circle(50, 44, 18), circle(42, 38, 5), circle(58, 38, 5), ellipse(50, 52, 5, 8), [[32, 26], [36, 22]], [[68, 26], [64, 22]]], # wide trembling eyes & open mouth
  "courage": [circle(50, 44, 18), [[30, 26], [70, 26], [70, 56], [50, 80], [30, 56], [30, 26]], star(50, 48, 10, 4, 5)], # valiant crest shield & golden star
  "hope": [line(20, 74, 80, 74), arc(50, 74, 20, math.pi, 2 * math.pi), line(50, 54, 50, 38), line(34, 58, 24, 46), line(66, 58, 76, 46)], # rising dawn sun over horizon
  "despair": [circle(50, 38, 14), [[38, 46], [44, 36], [50, 46]], [[50, 46], [56, 36], [62, 46]], line(40, 56, 60, 56)], # head buried in hands
  "jealousy": [circle(50, 44, 16), ellipse(42, 40, 4, 2), ellipse(58, 40, 4, 2), arc(50, 52, 6, 0.2 * math.pi, 0.8 * math.pi), line(36, 34, 46, 38)], # green-eyed monster sideways glare
  "envy": [circle(50, 44, 16), circle(42, 40, 3), circle(58, 40, 3), arc(50, 50, 6, math.pi, 2 * math.pi), star(72, 32, 5, 2, 4)], # covetous longing gaze
  "pride": [circle(50, 44, 16), arc(50, 36, 14, 0.2 * math.pi, 0.8 * math.pi), arc(50, 48, 8, 0, math.pi), star(50, 22, 6, 3, 5)], # chin held high & winner laurel
  "humility": [circle(50, 34, 8), line(50, 42, 46, 62), line(46, 62, 38, 80), line(46, 62, 54, 80), line(46, 48, 38, 54), line(46, 48, 54, 54)], # bowing reverent posture
  "greed": [circle(50, 44, 18), [[42, 34], [42, 46]], [[40, 36], [44, 36]], [[40, 44], [44, 44]], [[58, 34], [58, 46]], arc(50, 52, 8, 0, math.pi)], # dollar signs in eyes & smirking grin
  "generosity": [circle(50, 34, 8), [[32, 54], [46, 52], [54, 46]], [[68, 54], [54, 52], [46, 46]], star(50, 44, 6, 2, 4)], # open outstretched giving palms
  "kindness": [circle(50, 42, 14), arc(42, 38, 3, 0, math.pi), arc(58, 38, 3, 0, math.pi), arc(50, 48, 6, 0, math.pi), [[34, 62], [42, 56], [50, 62], [58, 56], [66, 62], [50, 78], [34, 62]]], # warm smile & heart in hands
  "cruelty": [circle(50, 44, 18), line(36, 34, 48, 42), line(64, 34, 52, 42), [[40, 54], [46, 50], [54, 50], [60, 54]], line(68, 46, 78, 36)], # malicious sneer & striking whip
  "mercy": [circle(50, 32, 8), line(50, 40, 50, 64), line(44, 48, 32, 56), line(56, 48, 68, 56), arc(50, 24, 12, math.pi, 2 * math.pi)], # open sheltering wings & halo
  "justice": [line(50, 24, 50, 78), line(30, 32, 70, 32), tri(30, 32, 22, 52, 38, 52), tri(70, 32, 62, 52, 78, 52), rect(44, 78, 12, 6)], # balanced brass scale pans
  "injustice": [line(50, 24, 50, 78), line(30, 26, 70, 38), tri(30, 26, 22, 46, 38, 46), tri(70, 38, 62, 58, 78, 58), rect(44, 78, 12, 6)], # lopsided unbalanced scales
  "freedom": [circle(50, 30, 8), line(50, 38, 50, 60), line(50, 44, 26, 30), line(50, 44, 74, 30), line(38, 52, 34, 48), line(62, 52, 66, 48)], # soaring open arms & broken chain links
  "oppression": [rect(24, 30, 52, 10), line(50, 40, 50, 68), circle(50, 72, 8), line(38, 76, 34, 86), line(62, 76, 66, 86)], # crushing heavy weight on figure
  "peace": [circle(50, 50, 24), line(50, 26, 50, 74), line(50, 50, 32, 66), line(50, 50, 68, 66)], # classic peace symbol
  "war": [line(28, 28, 72, 72), line(28, 72, 72, 28), tri(28, 28, 34, 24, 24, 34), tri(72, 72, 66, 76, 76, 66)], # crossed fighting steel broadswords
  "victory": [line(46, 62, 42, 38), line(54, 62, 58, 38), line(42, 38, 38, 24), line(58, 38, 62, 24), arc(50, 62, 8, 0, math.pi)], # hand flashing two-finger 'V'
  "defeat": [circle(50, 46, 8), line(50, 54, 50, 76), line(50, 62, 38, 70), line(50, 62, 62, 70), line(44, 76, 40, 86), line(56, 76, 60, 86)], # slumping bowed head
  "success": [rect(38, 54, 24, 24), [[34, 24], [66, 24], [62, 48], [50, 54], [38, 48], [34, 24]], [[34, 30], [24, 36], [34, 44]], [[66, 30], [76, 36], [66, 44]]], # golden championship trophy cup
  "failure": [circle(50, 46, 18), line(38, 36, 48, 44), line(48, 36, 38, 44), line(54, 36, 64, 44), line(64, 36, 54, 44), arc(50, 58, 6, 0.1 * math.pi, 0.9 * math.pi)], # X-eyes & flat frown
  "luck": [circle(50, 44, 5), circle(44, 38, 6), circle(56, 38, 6), circle(44, 50, 6), circle(56, 50, 6), [[50, 49], [50, 68]]], # four-leaf clover & stalk
  "fate": [circle(50, 50, 24), line(50, 26, 50, 74), line(26, 50, 74, 50), circle(50, 50, 4), star(50, 50, 16, 8, 8)], # Wheel of Fortune zodiac spokes
  "destiny": [line(50, 84, 50, 42), star(50, 30, 16, 7, 5), star(50, 30, 8, 3, 5)], # guiding North Star beacon & path
  "karma": [arc(50, 50, 22, 0.2 * math.pi, 0.9 * math.pi), tri(36, 66, 44, 68, 40, 60), arc(50, 50, 22, 1.2 * math.pi, 1.9 * math.pi), tri(64, 34, 56, 32, 60, 40)], # circular yin-yang boomerang arrows
  "déjà vu": [rect(26, 32, 22, 34), rect(52, 32, 22, 34), circle(37, 44, 4), circle(63, 44, 4)], # identical duplicate mirror frames
  "nostalgia": [ellipse(50, 48, 22, 28), circle(50, 44, 10), [[44, 54], [56, 54]], arc(50, 48, 26, 0.8 * math.pi, 1.2 * math.pi)], # sepia oval antique photo
  "homesickness": [tri(36, 48, 50, 34, 64, 48), rect(40, 48, 20, 18), circle(50, 50, 24), line(46, 58, 46, 66)], # home encased in memory thought bubble
  "wanderlust": [circle(50, 50, 24), tri(50, 30, 46, 50, 54, 50), line(50, 50, 50, 70), [[26, 50], [34, 46], [38, 54], [44, 50]]], # compass rose pointing to mountains
  "curiosity": [circle(50, 38, 12), arc(50, 36, 8, -0.2 * math.pi, 1.2 * math.pi), line(50, 44, 50, 48), circle(50, 52, 2)], # giant luminous question mark
  "boredom": [circle(50, 44, 16), line(40, 38, 46, 38), line(54, 38, 60, 38), line(42, 50, 58, 50), [[38, 48], [34, 60], [42, 64]]], # resting chin in palm, flat expression
  "excitement": [circle(50, 34, 8), line(50, 42, 50, 64), line(50, 46, 30, 28), line(50, 46, 70, 28), star(28, 24, 4, 1.5, 4), star(72, 24, 4, 1.5, 4)], # jumping arms raised with star bursts
  "surprise": [circle(50, 44, 16), circle(42, 36, 4), circle(58, 36, 4), circle(50, 52, 5), [[42, 30], [42, 26]], [[58, 30], [58, 26]]], # raised high brows & 'O' mouth
  "confusion": [circle(50, 44, 16), line(40, 36, 46, 40), line(54, 40, 60, 36), arc(50, 52, 6, 0.4 * math.pi, 1.6 * math.pi), [[66, 26], [72, 24], [70, 30], [70, 34]], circle(70, 38, 1)], # asymmetric eyes, wavy mouth & question mark
  "Oprah Winfrey": [circle(50, 38, 12), [[34, 28], [28, 44], [34, 56]], [[66, 28], [72, 44], [66, 56]], rect(26, 62, 48, 18), rect(48, 48, 4, 16)], # talk show couch & microphone
  "Ellen DeGeneres": [circle(50, 38, 12), [[40, 26], [50, 22], [60, 26]], line(40, 26, 60, 26), line(44, 52, 34, 68), line(56, 52, 68, 62)], # blonde pixie haircut & dancing sneakers
  "Gordon Ramsay": [circle(50, 38, 13), [[42, 28], [58, 28]], line(42, 34, 48, 36), line(58, 34, 52, 36), arc(50, 46, 6, 0, math.pi), rect(42, 54, 16, 22)], # chef whites & enraged shouting mouth
  "David Attenborough": [circle(50, 36, 12), [[40, 28], [60, 28]], rect(42, 48, 16, 24), ellipse(68, 62, 10, 6), [[68, 56], [74, 52]]], # safari khaki shirt & binoculars
  "Bill Nye": [circle(50, 36, 12), rect(44, 48, 12, 6), tri(44, 48, 50, 54, 44, 54), tri(56, 48, 50, 54, 56, 54), rect(42, 54, 16, 26)], # blue lab coat & iconic polka bow tie
  "Steve Irwin": [circle(50, 36, 12), [[38, 28], [62, 28]], rect(42, 48, 16, 24), [[64, 58], [78, 56], [82, 64], [64, 66]]], # khaki shirt & holding a crocodile
  "Julia Child": [circle(50, 36, 13), [[40, 28], [42, 20], [58, 20], [60, 28]], rect(42, 50, 16, 28), line(64, 52, 74, 44), ellipse(76, 42, 4, 6)], # tall chef apron & wire balloon whisk
  "Mr. Rogers": [circle(50, 36, 12), [[40, 26], [60, 26]], rect(42, 48, 16, 28), line(50, 48, 50, 76), line(42, 78, 36, 84), line(58, 78, 64, 84)], # red zippered cardigan & lace-up sneakers
  "Bob Barker": [circle(50, 36, 12), [[38, 28], [62, 28]], rect(42, 48, 16, 28), line(60, 52, 74, 26), circle(74, 26, 3)] # suit & skinny thin game show microphone
}

# ----------------------------------------------------------------------
# LEVEL 18: Politics, Law & World Voices (50 Words)
# ----------------------------------------------------------------------
L18_STROKES = {
  "democracy": [rect(36, 38, 28, 34), rect(42, 34, 16, 4), line(46, 36, 54, 36), rect(44, 22, 12, 14), line(46, 28, 52, 28)], # ballot box & voting card drop
  "dictatorship": [circle(50, 28, 8), rect(42, 38, 16, 44), rect(36, 68, 28, 12), line(50, 38, 72, 30)], # combat boot stepping on freedom
  "capitalism": [circle(50, 50, 24), line(50, 32, 50, 68), [[56, 38], [46, 42], [54, 52], [44, 58], [54, 62]], [[26, 68], [44, 52], [62, 56], [74, 34]]], # dollar sign & ascending profit graph
  "socialism": [rect(28, 30, 44, 32), line(50, 30, 50, 62), circle(38, 46, 4), circle(62, 46, 4), line(24, 72, 76, 72)], # raised clasped hands in solidarity
  "communism": [[[42, 34], [48, 24], [58, 26], [62, 38], [52, 54], [44, 66]], line(40, 66, 64, 30), rect(38, 64, 6, 8)], # hammer and sickle emblem
  "monarchy": [[[28, 62], [72, 62], [74, 40], [60, 50], [50, 34], [40, 50], [26, 40], [28, 62]], circle(50, 34, 2.5), rect(44, 64, 12, 18)], # royal imperial crown & velvet mantle
  "anarchy": [circle(50, 50, 24), [[34, 68], [50, 26], [66, 68]], line(30, 52, 70, 52)], # circled letter 'A' symbol
  "revolution": [circle(50, 38, 10), line(50, 48, 50, 78), line(50, 54, 68, 34), rect(68, 26, 18, 12)], # raised fist & waving red banner
  "protest": [circle(50, 48, 7), line(50, 55, 50, 80), line(50, 58, 40, 42), line(40, 42, 40, 24), rect(28, 24, 24, 14)], # activist holding cardboard placard
  "boycott": [circle(50, 50, 24), line(33, 33, 67, 67), rect(40, 42, 20, 16)], # prohibition slashed circle over shopping cart
  "election": [rect(34, 42, 32, 36), rect(40, 38, 20, 4), [[44, 24], [56, 24], [54, 38], [46, 38], [44, 24]], [[48, 30], [52, 30]]], # ballot dropping into ballot box
  "campaign": [circle(42, 38, 8), line(42, 46, 42, 74), [[46, 42], [58, 38]], [[58, 32], [74, 24], [74, 52], [58, 44]]], # politician speaking into megaphone
  "debate": [rect(26, 46, 18, 30), rect(56, 46, 18, 30), circle(35, 34, 6), circle(65, 34, 6), line(35, 40, 35, 46), line(65, 40, 65, 46)], # two opposing candidate podiums
  "filibuster": [circle(50, 34, 8), rect(42, 46, 16, 32), line(50, 46, 50, 78), circle(70, 38, 8), line(70, 38, 70, 34), line(70, 38, 74, 38)], # endless speech clock running
  "veto": [rect(24, 34, 52, 32), [[30, 42], [40, 58]], [[40, 42], [30, 58]], line(46, 50, 70, 50)], # giant red 'X' stamp on law document
  "impeachment": [rect(28, 28, 44, 52), line(60, 38, 72, 28), rect(70, 24, 6, 12), rect(66, 40, 14, 4)], # gavel smashing down on bill
  "constitution": [rect(28, 22, 44, 56), arc(28, 50, 6, 0.5 * math.pi, 1.5 * math.pi), [[34, 32], [42, 28], [50, 34], [62, 30]], line(34, 42, 64, 42), line(34, 50, 64, 50)], # parchment scroll 'We the People'
  "bill of rights": [rect(30, 24, 40, 54), circle(50, 70, 4), line(36, 34, 64, 34), line(36, 42, 64, 42), line(36, 50, 64, 50), line(36, 58, 64, 58)], # 10 numbered constitutional amendments
  "amendment": [rect(30, 26, 40, 50), line(36, 36, 64, 36), line(36, 46, 64, 46), [[54, 58], [66, 58], [60, 66], [54, 58]]], # pen adding seal amendment
  "referendum": [rect(32, 28, 36, 46), rect(38, 40, 8, 8), line(39, 44, 42, 47), line(42, 47, 46, 41), rect(38, 54, 8, 8)], # Yes / No ballot checkboxes
  "propaganda": [[[36, 42], [54, 32], [54, 62], [36, 52], [36, 42]], arc(60, 47, 8, -0.4 * math.pi, 0.4 * math.pi), arc(66, 47, 12, -0.4 * math.pi, 0.4 * math.pi)], # loudspeaker broadcasting state dogma
  "censorship": [rect(26, 32, 48, 38), rect(32, 42, 36, 6), rect(32, 54, 28, 6)], # heavy black redacted text bars
  "conspiracy": [tri(50, 22, 26, 70, 74, 70), circle(50, 50, 7), circle(50, 50, 3), line(36, 54, 64, 54)], # all-seeing eye in pyramid
  "scandal": [rect(24, 28, 52, 44), line(28, 38, 72, 38), line(28, 44, 72, 44), star(50, 54, 8, 4, 6)], # newspaper front-page bombshell
  "cover-up": [rect(28, 40, 44, 32), [[22, 34], [78, 34], [72, 46], [28, 46], [22, 34]]], # carpet swept over documents
  "whistleblower": [circle(50, 38, 10), [[44, 46], [42, 56], [32, 56], [32, 50], [44, 46]], circle(36, 53, 2), line(28, 52, 22, 48)], # blowing police whistle
  "leak": [rect(36, 26, 28, 36), [[36, 44], [46, 48], [42, 52], [50, 50]], circle(48, 70, 3), circle(48, 78, 2)], # document with dripping water droplets
  "wiretap": [circle(42, 46, 8), circle(58, 46, 8), line(42, 54, 58, 54), [[50, 54], [50, 74]], circle(50, 74, 3)], # telephone handset bug & antenna
  "interrogation": [circle(50, 54, 10), rect(44, 64, 12, 18), [[44, 20], [56, 20], [64, 34], [36, 34], [44, 20]], line(36, 34, 26, 64), line(64, 34, 74, 64)], # harsh overhead interrogation spotlight
  "alibi": [circle(50, 46, 20), line(50, 46, 50, 34), line(50, 46, 58, 46), rect(42, 70, 16, 10)], # verified clock time & travel ticket
  "motive": [circle(50, 40, 10), [[44, 50], [56, 50]], circle(50, 66, 8), line(50, 62, 50, 70)], # thought bubble with stolen bag of money
  "evidence": [rect(30, 28, 40, 48), circle(50, 46, 10), rect(44, 60, 12, 10)], # labeled plastic forensic evidence bag
  "trial": [tri(24, 40, 50, 20, 76, 40), line(30, 40, 30, 76), line(70, 40, 70, 76), line(44, 48, 56, 48)], # courthouse portico & bench
  "verdict": [rect(30, 26, 40, 52), [[36, 42], [42, 48], [54, 36]], line(36, 58, 64, 58)], # jury slip signed with checkmark
  "appeal": [rect(30, 34, 40, 44), line(50, 64, 50, 44), tri(46, 44, 54, 44, 50, 38)], # upward legal petition arrow
  "parole": [rect(28, 30, 44, 48), line(38, 30, 38, 78), line(48, 30, 48, 78), line(58, 30, 58, 78), line(48, 54, 68, 44)], # jail cell door swinging open
  "probation": [circle(50, 32, 8), rect(44, 40, 12, 28), rect(42, 68, 6, 8)], # GPS electronic ankle monitoring bracelet
  "jury duty": [circle(36, 34, 6), circle(50, 34, 6), circle(64, 34, 6), rect(28, 44, 44, 28), line(28, 56, 72, 56)], # 3 citizens seated in jury box
  "hung jury": [rect(26, 38, 48, 32), line(50, 38, 50, 70), circle(38, 54, 5), circle(62, 54, 5)], # deadlock split 6-6 division
  "plea bargain": [rect(26, 36, 48, 32), line(34, 52, 46, 52), line(54, 52, 66, 52), circle(50, 52, 3)], # handshake deal over legal contract
  "statute of limitations": [circle(50, 46, 20), line(50, 46, 50, 32), line(50, 46, 62, 46), line(32, 68, 68, 68), line(32, 68, 32, 74)], # hourglass clock sand running out
  "Barack Obama": [circle(50, 36, 12), [[40, 28], [60, 28]], rect(42, 48, 16, 28), [[58, 52], [72, 38], [76, 26]]], # signature wave & tailored suit
  "Nelson Mandela": [circle(50, 36, 13), [[40, 26], [60, 26]], line(30, 20, 30, 80), line(36, 20, 36, 80), [[56, 52], [68, 40], [64, 32]]], # prison cell bars to raised victory fist
  "Mother Teresa": [circle(50, 38, 11), [[36, 26], [64, 26], [62, 68], [38, 68]], line(38, 30, 62, 30), line(38, 34, 62, 34)], # blue-bordered white sari veil
  "Dalai Lama": [circle(50, 38, 12), rect(44, 34, 12, 5), arc(50, 46, 6, 0, math.pi), [[38, 50], [44, 74], [62, 58]]], # glasses, smile & draped maroon robe
  "Malala Yousafzai": [circle(50, 36, 11), arc(50, 32, 14, math.pi, 2 * math.pi), [[36, 32], [34, 60], [66, 60], [64, 32]], rect(42, 60, 16, 14)], # headscarf & school textbook
  "Greta Thunberg": [circle(50, 36, 12), [[38, 44], [34, 68]], [[62, 44], [66, 68]], rect(32, 68, 36, 14), line(44, 74, 56, 74)], # twin side braids & school strike sign
  "Ruth Bader Ginsburg": [circle(50, 34, 11), rect(44, 32, 12, 4), arc(50, 45, 8, math.pi, 2 * math.pi), rect(42, 45, 16, 32)], # jabot lace collar & judge glasses
  "Stephen Colbert": [circle(50, 36, 12), rect(44, 34, 12, 4), arc(52, 46, 5, 0.2 * math.pi, 0.8 * math.pi), rect(42, 48, 16, 28)], # rimless spectacles & satirical smirk
  "John Oliver": [circle(50, 36, 12), rect(42, 32, 16, 5), rect(36, 58, 28, 18), rect(42, 48, 16, 28)] # black-rimmed glasses & broadcast desk
}

# ----------------------------------------------------------------------
# LEVEL 19: Philosophy, Paradoxes & Thinkers (50 Words)
# ----------------------------------------------------------------------
L19_STROKES = {
  "solipsism": [circle(50, 46, 16), circle(50, 46, 6), [[34, 46], [20, 38]], [[66, 46], [80, 38]], arc(50, 46, 28, 0, 2 * math.pi)], # lone mind projecting universe
  "paradox": [circle(50, 50, 24), [[36, 50], [26, 38], [18, 50], [26, 62], [50, 50], [74, 38], [82, 50], [74, 62], [50, 50]], circle(50, 50, 4)], # endless Mobius infinity loop
  "irony": [circle(50, 46, 18), arc(42, 40, 3, math.pi, 2 * math.pi), arc(58, 40, 3, 0, math.pi), arc(50, 52, 6, 0.2 * math.pi, 0.8 * math.pi)], # knowing asymmetric smirk
  "sarcasm": [circle(50, 46, 18), arc(54, 48, 8, 0.1 * math.pi, 0.6 * math.pi), [[40, 34], [46, 38]], [[54, 38], [60, 34]]], # rolling eyes & sarcastic smirk
  "oxymoron": [circle(42, 50, 12), circle(58, 50, 12), tri(38, 44, 46, 44, 42, 56), star(58, 50, 6, 2, 4)], # fire & ice clash
  "enigma": [circle(50, 44, 18), arc(50, 40, 8, -0.3 * math.pi, 1.2 * math.pi), line(50, 48, 50, 52), circle(50, 58, 2.5)], # glowing question mark rune
  "mystery": [circle(50, 36, 12), [[34, 32], [66, 32]], arc(50, 32, 10, math.pi, 2 * math.pi), rect(44, 36, 12, 4), circle(68, 56, 8), line(74, 62, 82, 72)], # fedora silhouette & magnifying glass
  "riddle": [rect(30, 28, 40, 48), arc(50, 46, 8, -0.3 * math.pi, 1.2 * math.pi), circle(50, 60, 2)], # scroll parchment with question mark
  "conundrum": [circle(50, 50, 24), [[36, 36], [64, 64]], [[36, 64], [64, 36]], circle(50, 50, 6)], # tangled Gordian knot
  "dilemma": [line(50, 78, 50, 52), line(50, 52, 30, 28), line(50, 52, 70, 28), tri(26, 28, 34, 28, 30, 22), tri(66, 28, 74, 28, 70, 22)], # fork in the road two paths
  "quandary": [circle(50, 50, 22), [[42, 38], [58, 62]], [[58, 38], [42, 62]], circle(50, 50, 4)], # maze crossroads
  "catch-22": [circle(50, 50, 22), arc(50, 50, 22, 0.2 * math.pi, 0.9 * math.pi), tri(36, 66, 44, 68, 40, 60), arc(50, 50, 22, 1.2 * math.pi, 1.9 * math.pi), tri(64, 34, 56, 32, 60, 40)], # circular entrapment loop
  "double bind": [rect(36, 42, 28, 20), line(24, 52, 36, 52), line(64, 52, 76, 52), line(50, 30, 50, 42), line(50, 62, 50, 74)], # pinned from all 4 directions
  "moral dilemma": [line(50, 26, 50, 74), line(30, 34, 70, 34), circle(30, 50, 8), circle(70, 50, 8)], # weighing two souls on scales
  "trolley problem": [rect(24, 48, 24, 16), circle(28, 64, 4), circle(44, 64, 4), line(48, 56, 68, 38), line(48, 56, 68, 74), circle(72, 38, 3), circle(72, 74, 3)], # runaway cart & track switch
  "butterfly effect": [line(50, 34, 50, 66), [[50, 42], [32, 30], [28, 50], [50, 56]], [[50, 42], [68, 30], [72, 50], [50, 56]], arc(74, 50, 14, 0, 1.8 * math.pi)], # small wing flap causing hurricane vortex
  "domino effect": [rect(24, 46, 6, 26), [[36, 48], [44, 72]], [[48, 52], [58, 72]], [[60, 56], [72, 72]], rect(74, 46, 6, 26)], # chain reaction falling tiles
  "ripple effect": [circle(50, 50, 5), circle(50, 50, 12), circle(50, 50, 20), circle(50, 50, 28)], # expanding concentric water ripples
  "chain reaction": [circle(28, 50, 6), circle(44, 50, 6), circle(60, 50, 6), circle(76, 50, 6), line(34, 50, 38, 50), line(50, 50, 54, 50), line(66, 50, 70, 50)], # interlocking progressive links
  "vicious cycle": [circle(50, 50, 22), tri(70, 42, 74, 52, 64, 48), tri(30, 58, 26, 48, 36, 52)], # cyclical downward trap
  "self-fulfilling prophecy": [circle(50, 48, 16), star(50, 48, 24, 18, 4), circle(50, 48, 6)], # inner vision realizing reality
  "placebo effect": [ellipse(44, 50, 10, 6), circle(62, 50, 8), line(44, 44, 44, 56)], # sugar pill capsule & positive pulse
  "Stockholm syndrome": [circle(42, 42, 8), circle(62, 42, 8), line(36, 62, 68, 62), [[48, 56], [50, 52], [52, 56], [50, 60]]], # captive embracing bond
  "imposter syndrome": [circle(50, 44, 16), [[38, 38], [44, 38]], [[56, 38], [62, 38]], arc(50, 52, 6, 0.1 * math.pi, 0.9 * math.pi), rect(44, 20, 12, 10)], # mask slipping off face
  "cognitive dissonance": [circle(40, 46, 12), circle(60, 46, 12), line(46, 38, 54, 54), line(54, 38, 46, 54)], # two brain gears grinding in conflict
  "confirmation bias": [circle(50, 46, 20), rect(42, 38, 16, 16), line(46, 46, 54, 46)], # selective filter window blocking truth
  "sunk cost fallacy": [line(24, 76, 76, 76), line(32, 76, 68, 36), circle(68, 36, 5), [[68, 36], [74, 76]]], # throwing good money down drain
  "analysis paralysis": [circle(50, 44, 16), circle(50, 44, 6), line(30, 30, 42, 38), line(70, 30, 58, 38), line(30, 64, 42, 54), line(70, 64, 58, 54)], # frozen by infinite choices
  "decision fatigue": [circle(50, 44, 16), line(40, 40, 46, 40), line(54, 40, 60, 40), arc(50, 54, 8, 0.1 * math.pi, 0.9 * math.pi), rect(42, 68, 16, 8)], # drained battery bar indicator
  "writer's block": [rect(30, 24, 40, 52), rect(36, 32, 28, 36), line(60, 68, 70, 58)], # blank empty page & stalled pen
  "artist's block": [rect(26, 26, 48, 44), line(36, 74, 44, 48), line(64, 74, 56, 48)], # pristine empty white canvas
  "stage fright": [circle(50, 42, 14), circle(44, 38, 4), circle(56, 38, 4), circle(50, 50, 4), [[30, 24], [44, 36]], [[70, 24], [56, 36]]], # frozen in glare of footlights
  "performance anxiety": [circle(50, 42, 14), line(44, 36, 44, 40), line(56, 36, 56, 40), arc(50, 52, 6, 0.1 * math.pi, 0.9 * math.pi), circle(62, 34, 2)], # cold bead of sweat on brow
  "fear of missing out": [circle(42, 48, 10), rect(58, 34, 20, 34), circle(68, 48, 4), line(48, 46, 58, 42)], # staring through window at party
  "fear of failure": [circle(50, 36, 12), line(50, 48, 50, 68), line(30, 78, 70, 78), line(36, 78, 50, 68)], # edge of abyss
  "perfectionism": [rect(28, 28, 44, 44), line(50, 28, 50, 72), line(28, 50, 72, 50), circle(50, 50, 3)], # obsessive microscopic alignment
  "procrastination": [circle(50, 44, 18), line(50, 44, 50, 32), line(50, 44, 60, 44), rect(32, 70, 36, 10)], # ticking clock & sleeping snooze bar
  "insomnia": [circle(50, 44, 16), circle(42, 40, 5), circle(58, 40, 5), circle(42, 40, 2), circle(58, 40, 2), line(36, 68, 64, 68)], # bloodshot wide-open sleepless eyes at 3AM
  "sleep paralysis": [rect(26, 56, 48, 18), circle(36, 48, 8), ellipse(58, 42, 10, 14)], # shadowy figure perched on sleeper chest
  "lucid dreaming": [circle(50, 42, 14), [[42, 42], [48, 42]], [[52, 42], [58, 42]], star(50, 24, 8, 3, 4)], # glowing third eye conscious awareness
  "out-of-body experience": [ellipse(50, 68, 24, 8), circle(50, 34, 10), line(50, 44, 50, 54), [[50, 44], [38, 38]], [[50, 44], [62, 38]]], # astral spirit floating above body
  "Sigmund Freud": [circle(50, 36, 12), rect(42, 32, 16, 5), [[42, 44], [46, 58], [54, 58], [58, 44]], line(54, 48, 68, 46), rect(30, 68, 40, 12)], # spectacles, trimmed beard, cigar & couch
  "Carl Jung": [circle(50, 36, 12), rect(44, 32, 12, 4), [[54, 44], [62, 54], [68, 48]], circle(70, 46, 3)], # rimless spectacles & smoking briar pipe
  "Friedrich Nietzsche": [circle(50, 38, 12), [[36, 38], [42, 54], [58, 54], [64, 38], [50, 44], [36, 38]], line(40, 32, 46, 36), line(60, 32, 54, 36)], # massive iconic walrus mustache
  "Socrates": [circle(50, 36, 13), [[38, 44], [44, 66], [56, 66], [62, 44]], [[40, 58], [48, 76], [58, 64]], ellipse(68, 56, 6, 8)], # balding sage, beard, toga & hemlock cup
  "Plato": [circle(50, 36, 13), [[38, 44], [44, 68], [56, 68], [62, 44]], rect(64, 38, 12, 22), line(64, 44, 76, 44)], # broad forehead, beard & cave allegory scroll
  "Aristotle": [circle(50, 36, 12), [[40, 44], [50, 62], [60, 44]], line(36, 56, 44, 74), line(64, 56, 56, 74)], # classic tutor robes & Lyceum podium
  "Confucius": [circle(50, 38, 12), rect(40, 20, 20, 8), [[44, 46], [48, 64], [50, 64], [52, 64], [56, 46]], rect(38, 54, 24, 24)], # official scholar hat, drooping beard & robes
  "Buddha": [circle(50, 34, 10), circle(50, 22, 3), [[38, 46], [50, 58], [62, 46], [38, 46]], arc(50, 72, 18, math.pi, 2 * math.pi)], # ushnisha topknot, lotus meditation pose
  "Rumi": [circle(50, 36, 10), arc(50, 28, 12, math.pi, 2 * math.pi), [[42, 46], [50, 62], [58, 46]], [[34, 56], [50, 78], [66, 56]]], # Sufi turban & whirling dervish skirt flare
}

# ----------------------------------------------------------------------
# LEVEL 20: Advanced Science, Tech & Visionaries (50 Words)
# ----------------------------------------------------------------------
L20_STROKES = {
  "quantum mechanics": [circle(50, 50, 6), ellipse(50, 50, 28, 10), [[34, 36], [66, 64]], [[66, 36], [34, 64]], star(50, 50, 4, 1.5, 4)], # probabilistic orbital wave clouds
  "relativity": [circle(50, 50, 20), line(22, 50, 78, 50), line(50, 22, 50, 78), arc(50, 50, 24, 0, math.pi), arc(50, 50, 16, 0, math.pi)], # warped spacetime curvature grid
  "string theory": [[[20, 50], [32, 38], [44, 62], [56, 38], [68, 62], [80, 50]], circle(32, 38, 2), circle(56, 38, 2), circle(44, 62, 2)], # vibrating multidimensional strings
  "dark matter": [circle(50, 50, 22), circle(50, 50, 14), circle(50, 50, 6), star(30, 30, 4, 1, 4), star(70, 70, 4, 1, 4)], # gravitational lensing halo
  "dark energy": [circle(50, 50, 8), line(50, 42, 50, 20), line(50, 58, 50, 80), line(42, 50, 20, 50), line(58, 50, 80, 50), tri(50, 20, 46, 26, 54, 26), tri(50, 80, 46, 74, 54, 74)], # accelerating cosmological expansion arrows
  "multiverse": [circle(36, 42, 12), circle(64, 42, 12), circle(50, 64, 12), line(44, 46, 56, 46)], # overlapping bubble universe spheres
  "wormhole": [ellipse(30, 50, 10, 20), ellipse(70, 50, 10, 20), line(30, 30, 70, 30), line(30, 70, 70, 70), circle(30, 50, 4), circle(70, 50, 4)], # Einstein-Rosen bridge throat
  "event horizon": [circle(50, 50, 16), ellipse(50, 50, 36, 12), line(50, 20, 50, 34), line(50, 66, 50, 80)], # black hole silhouette & relativistic jets
  "singularity": [circle(50, 50, 4), line(24, 50, 46, 50), line(54, 50, 76, 50), line(50, 24, 50, 46), line(50, 54, 50, 76)], # infinitely dense gravitational point
  "entropy": [rect(26, 34, 18, 32), circle(32, 44, 2), circle(38, 54, 2), [[56, 36], [64, 46], [74, 40], [68, 56], [78, 62]], circle(62, 40, 2), circle(72, 52, 2)], # ordered lattice decaying to disorder
  "chaos theory": [circle(50, 50, 4), arc(42, 50, 12, 0, 1.8 * math.pi), arc(58, 50, 12, math.pi, 2.8 * math.pi)], # Lorenz strange attractor butterfly
  "game theory": [rect(30, 30, 40, 40), line(50, 30, 50, 70), line(30, 50, 70, 50), circle(40, 40, 3), circle(60, 60, 3)], # 2x2 payoff matrix
  "prisoner's dilemma": [rect(26, 28, 48, 44), line(50, 28, 50, 72), line(26, 50, 74, 50), circle(38, 39, 4), circle(62, 61, 4)], # defect vs cooperate payoff
  "Nash equilibrium": [circle(50, 50, 22), line(32, 32, 68, 68), line(32, 68, 68, 32), star(50, 50, 6, 2, 4)], # optimal saddle intersection point
  "invisible hand": [ellipse(50, 58, 20, 10), line(30, 58, 40, 42), line(50, 58, 50, 36), line(70, 58, 60, 42), line(20, 74, 80, 74)], # Adam Smith market equilibrium
  "supply and demand": [line(24, 26, 24, 76), line(24, 76, 78, 76), line(30, 34, 72, 70), line(30, 70, 72, 34), circle(51, 52, 3)], # Marshallian scissor curves & equilibrium
  "inflation": [circle(36, 60, 8), circle(56, 44, 14), circle(68, 32, 20), [[50, 60], [54, 46], [62, 34]]], # ballooning price balloon
  "deflation": [circle(42, 34, 18), circle(58, 56, 10), [[44, 38], [54, 52]]], # shrinking economy cycle
  "recession": [line(22, 32, 22, 78), line(22, 78, 80, 78), [[26, 38], [42, 46], [58, 64], [74, 72]], tri(74, 72, 70, 66, 78, 68)], # plummeting GDP bear market
  "depression": [line(22, 30, 22, 80), line(22, 80, 80, 80), [[26, 36], [42, 48], [58, 74], [76, 76]], rect(38, 58, 24, 14)], # catastrophic economic trough
  "stagflation": [line(22, 32, 22, 78), line(22, 78, 80, 78), line(26, 56, 74, 56), [[26, 64], [44, 52], [62, 42], [74, 36]], [[26, 44], [44, 54], [62, 64], [74, 70]]], # stagnant flatline with rising inflation
  "hyperinflation": [circle(46, 52, 18), line(46, 42, 46, 62), line(42, 48, 50, 48), [[64, 44], [70, 32], [76, 36], [82, 24]]], # exponential currency collapse spike
  "quantitative easing": [rect(30, 36, 40, 28), circle(50, 50, 6), [[34, 36], [24, 24]], [[66, 36], [76, 24]], [[34, 64], [24, 76]], [[66, 64], [76, 76]]], # central bank liquidity helicopter printing
  "trickle-down economics": [ellipse(50, 28, 16, 6), line(50, 34, 50, 44), ellipse(50, 50, 22, 8), line(42, 58, 38, 70), line(58, 58, 62, 70), ellipse(50, 76, 28, 8)], # champagne glass pyramid cascade
  "globalization": [circle(50, 50, 22), ellipse(50, 50, 22, 8), ellipse(50, 50, 8, 22), line(28, 50, 72, 50)], # interconnected world trade globe
  "outsourcing": [rect(22, 42, 18, 18), rect(60, 42, 18, 18), line(40, 51, 60, 51), tri(60, 48, 64, 51, 60, 54)], # transfer arrow across border
  "automation": [rect(34, 40, 24, 22), circle(46, 51, 4), circle(50, 32, 8), line(44, 28, 44, 20), line(56, 28, 56, 20), line(34, 62, 22, 68), line(58, 62, 70, 68)], # robotic factory assembly arm
  "artificial general intelligence": [circle(50, 46, 18), circle(50, 46, 6), star(50, 46, 26, 20, 8), line(50, 28, 50, 18), line(50, 64, 50, 74)], # self-aware digital superintelligence
  "machine learning": [circle(32, 38, 5), circle(32, 62, 5), circle(50, 50, 5), circle(68, 38, 5), circle(68, 62, 5), line(37, 38, 45, 50), line(37, 62, 45, 50), line(55, 50, 63, 38), line(55, 50, 63, 62)], # deep neural network weights
  "neural network": [circle(30, 34, 4), circle(30, 50, 4), circle(30, 66, 4), circle(50, 42, 4), circle(50, 58, 4), circle(70, 50, 4), line(34, 34, 46, 42), line(34, 50, 46, 42), line(34, 66, 46, 58), line(54, 42, 66, 50), line(54, 58, 66, 50)], # multi-layer perceptron topology
  "deepfake": [circle(50, 44, 16), line(50, 28, 50, 60), circle(42, 40, 3), rect(54, 38, 6, 4), arc(50, 52, 6, 0, math.pi)], # synthetic split mask face
  "blockchain": [rect(20, 42, 14, 16), rect(44, 42, 14, 16), rect(68, 42, 14, 16), line(34, 50, 44, 50), line(58, 50, 68, 50)], # cryptographic distributed ledger blocks
  "cryptocurrency": [circle(50, 50, 24), circle(50, 50, 20), [[44, 34], [54, 34], [58, 42], [52, 50], [60, 58], [54, 66], [44, 66]], line(48, 30, 48, 70)], # Bitcoin gold token
  "NFT": [rect(26, 28, 48, 44), [[34, 48], [42, 40], [54, 54], [64, 44]], circle(40, 38, 3), rect(44, 60, 12, 6)], # tokenized digital art frame
  "metaverse": [rect(28, 38, 44, 18), circle(50, 52, 26), line(38, 47, 44, 47), line(56, 47, 62, 47)], # VR headset merged into digital avatar globe
  "augmented reality": [circle(50, 50, 22), rect(36, 38, 28, 24), line(36, 46, 64, 46), star(68, 32, 4, 1.5, 4)], # physical view HUD heads-up overlay
  "digital divide": [rect(20, 36, 24, 28), rect(24, 40, 16, 16), line(48, 26, 48, 74), line(60, 58, 76, 58)], # technology gap between worlds
  "echo chamber": [circle(50, 50, 22), arc(40, 50, 8, -0.5 * math.pi, 0.5 * math.pi), arc(60, 50, 8, 0.5 * math.pi, 1.5 * math.pi), circle(50, 50, 4)], # closed acoustic feedback loop
  "filter bubble": [circle(50, 50, 22), circle(50, 44, 6), line(50, 50, 50, 64), arc(50, 50, 26, 0.7 * math.pi, 1.3 * math.pi)], # isolated personalized information sphere
  "cancel culture": [circle(50, 50, 24), line(32, 32, 68, 68), line(32, 68, 68, 32), circle(50, 50, 10)], # scarlet 'X' deletion strike
  "virtue signaling": [circle(50, 32, 7), arc(50, 22, 10, math.pi, 2 * math.pi), rect(44, 40, 12, 24), [[36, 46], [24, 38], [18, 44]]], # halo & performative loudspeaker
  "performative activism": [circle(50, 32, 7), rect(44, 40, 12, 24), rect(58, 28, 16, 12), line(58, 36, 74, 36)], # photogenic protest sign for social media
  "Alan Turing": [circle(50, 36, 12), [[40, 26], [60, 26]], rect(32, 54, 36, 18), circle(70, 46, 5), [[70, 41], [72, 36]]], # codebreaking Enigma machine & apple
  "Ada Lovelace": [circle(50, 36, 11), arc(50, 32, 14, math.pi, 2 * math.pi), rect(40, 50, 20, 26), line(64, 44, 76, 32)], # Victorian lace bonnet & Bernoulli algorithm card
  "Grace Hopper": [circle(50, 36, 11), rect(40, 24, 20, 6), star(50, 24, 2, 0.8, 5), rect(40, 48, 20, 28), circle(68, 48, 4)], # Navy admiral cap & computer bug moth
  "Katherine Johnson": [circle(50, 34, 11), rect(44, 32, 12, 4), arc(50, 62, 22, 0.8 * math.pi, 2.2 * math.pi), circle(68, 48, 3)], # NASA orbital trajectory calculation arcs
  "Richard Feynman": [circle(50, 36, 12), [[40, 26], [60, 26]], circle(38, 64, 8), circle(62, 64, 8), [[46, 44], [52, 48], [48, 54], [54, 58]]], # bongo drums & Feynman particle diagram
  "Carl Sagan": [circle(50, 36, 12), rect(42, 48, 16, 10), star(72, 26, 6, 2, 4), star(30, 26, 4, 1.5, 4)], # turtleneck sweater & 'billions and billions' cosmos stars
  "Jane Goodall": [circle(50, 36, 12), [[40, 26], [60, 26]], rect(42, 48, 16, 26), circle(68, 54, 7), circle(62, 54, 3)], # safari khaki & chimpanzee companion
  "Jacques Cousteau": [circle(50, 36, 12), arc(50, 26, 10, math.pi, 2 * math.pi), rect(42, 26, 16, 4), rect(44, 52, 12, 20), line(56, 44, 64, 40)] # red watch cap & Aqua-Lung regulator
}

print("Loaded L16-L20: Total words =", len(L16_STROKES) + len(L17_STROKES) + len(L18_STROKES) + len(L19_STROKES) + len(L20_STROKES))
