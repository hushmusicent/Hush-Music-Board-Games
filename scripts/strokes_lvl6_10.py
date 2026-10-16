#!/usr/bin/env python3
import math
from test_geo import circle, ellipse, arc, rect, tri, star, line

# ----------------------------------------------------------------------
# LEVEL 6: Tools & Musical Instruments (50 Words)
# ----------------------------------------------------------------------
L6_STROKES = {
  "hammer": [rect(46, 38, 8, 48), rect(30, 24, 40, 14), line(30, 28, 20, 36)], # handle, steel head & claw
  "nail": [rect(48, 26, 4, 48), rect(44, 22, 12, 4), tri(48, 74, 52, 74, 50, 80)], # shaft, flat head & point
  "screw": [rect(47, 26, 6, 46), rect(42, 22, 16, 4), line(45, 24, 55, 24), line(47, 36, 53, 40), line(47, 46, 53, 50), line(47, 56, 53, 60)], # thread ridges
  "screwdriver": [rect(47, 46, 6, 38), rect(44, 18, 12, 28), line(47, 84, 53, 84)], # shaft, fluted handle & flat blade
  "wrench": [rect(47, 34, 6, 48), circle(50, 26, 12), rect(46, 14, 8, 14)], # open-ended jaw
  "pliers": [rect(42, 54, 5, 32), rect(53, 54, 5, 32), circle(50, 50, 4), rect(44, 26, 4, 22), rect(52, 26, 4, 22)], # pivot & gripping jaws
  "saw": [rect(26, 38, 12, 24), [[38, 40], [78, 46], [78, 54], [38, 58]], [[38, 58], [44, 55], [48, 58], [54, 55], [58, 58], [64, 55], [68, 58], [74, 55], [78, 54]]], # handle & serrated saw teeth
  "drill": [rect(30, 36, 34, 18), rect(34, 54, 10, 26), line(64, 45, 82, 45)], # power drill body, grip & bit
  "ladder": [line(36, 16, 36, 84), line(64, 16, 64, 84), line(36, 28, 64, 28), line(36, 42, 64, 42), line(36, 56, 64, 56), line(36, 70, 64, 70)], # rungs
  "toolbox": [rect(24, 38, 52, 36), rect(42, 28, 16, 10), line(24, 50, 76, 50), rect(46, 46, 8, 8)], # box, handle & metal latch
  "flashlight": [rect(38, 42, 16, 40), [[34, 22], [66, 22], [54, 42], [46, 42], [34, 22]], rect(44, 52, 4, 8), line(26, 14, 34, 20), line(74, 14, 66, 20)], # beam rays
  "battery": [rect(36, 30, 28, 50), rect(44, 24, 12, 6), line(50, 42, 50, 50), line(46, 46, 54, 46)], # plus terminal
  "light bulb": [circle(50, 42, 18), [[42, 56], [42, 68], [58, 68], [58, 56]], rect(42, 68, 16, 8), line(46, 44, 50, 36), line(50, 36, 54, 44)], # glass globe, screw base & filament
  "switch": [rect(36, 28, 28, 44), rect(45, 42, 10, 16), line(45, 50, 55, 50)], # wall plate & toggle
  "plug": [rect(38, 42, 24, 26), line(44, 42, 44, 24), line(56, 42, 56, 24), line(50, 68, 50, 84)], # prongs & cord
  "cord": [[[24, 30], [40, 46], [32, 64], [58, 54], [72, 70]], circle(24, 30, 3), circle(72, 70, 3)],
  "extension cord": [circle(50, 50, 24), circle(50, 50, 18), rect(44, 44, 12, 12), line(74, 50, 84, 56)],
  "fan": [circle(50, 42, 22), rect(47, 64, 6, 20), rect(36, 84, 28, 4), circle(50, 42, 6), [[50, 36], [44, 24], [50, 22]], [[56, 42], [68, 48], [70, 42]], [[44, 46], [36, 58], [42, 60]]], # cage, blades, stand
  "heater": [rect(26, 32, 48, 44), line(26, 42, 74, 42), line(26, 52, 74, 52), line(26, 62, 74, 62), line(32, 76, 28, 84), line(68, 76, 72, 84)], # radiator fins & feet
  "air conditioner": [rect(22, 34, 56, 28), line(28, 50, 72, 50), line(28, 54, 72, 54), line(68, 40, 68, 44)], # louver vents & LED
  "thermostat": [circle(50, 50, 24), circle(50, 50, 18), line(46, 50, 54, 50), circle(56, 44, 2)], # digital dial
  "smoke detector": [circle(50, 50, 26), circle(50, 50, 12), circle(50, 50, 3), circle(64, 50, 2)], # sensor vents & light
  "guitar": [ellipse(50, 68, 16, 14), ellipse(50, 48, 12, 10), rect(48, 14, 4, 34), circle(50, 64, 5), line(48, 14, 52, 14)], # acoustic body, neck, soundhole & pegs
  "piano": [rect(20, 36, 60, 32), line(20, 56, 80, 56), line(26, 56, 26, 68), line(32, 56, 32, 68), line(38, 56, 38, 68), line(44, 56, 44, 68), line(50, 56, 50, 68), line(56, 56, 56, 68), line(62, 56, 62, 68), line(68, 56, 68, 68), line(74, 56, 74, 68), line(26, 68, 26, 86), line(74, 68, 74, 86)], # keys & legs
  "violin": [[[42, 50], [34, 64], [44, 78], [56, 78], [66, 64], [58, 50], [64, 42], [54, 36], [46, 36], [36, 42], [42, 50]], rect(48, 14, 4, 22), line(44, 56, 46, 62), line(56, 56, 54, 62)], # f-holes & waist
  "trumpet": [rect(24, 46, 36, 8), [[60, 46], [82, 34], [82, 66], [60, 54]], rect(40, 34, 4, 12), rect(46, 34, 4, 12), rect(52, 34, 4, 12)], # valves & flared bell
  "saxophone": [[[38, 24], [44, 24], [44, 58], [50, 74], [64, 74], [72, 58], [76, 58]], circle(76, 54, 8), circle(44, 40, 2), circle(44, 46, 2), circle(44, 52, 2)], # curved tube & bell keys
  "flute": [rect(18, 48, 64, 4), circle(26, 50, 2), circle(42, 50, 1.5), circle(48, 50, 1.5), circle(54, 50, 1.5), circle(60, 50, 1.5), circle(66, 50, 1.5)], # tone holes
  "clarinet": [rect(47, 20, 6, 56), [[44, 76], [56, 76], [60, 84], [40, 84], [44, 76]], circle(50, 36, 2), circle(50, 46, 2), circle(50, 56, 2)], # keys & bell
  "trombone": [rect(22, 44, 40, 6), [[62, 44], [84, 32], [84, 62], [62, 50]], rect(26, 50, 32, 6)], # slide & bell
  "harmonica": [rect(24, 42, 52, 16), line(28, 46, 28, 54), line(34, 46, 34, 54), line(40, 46, 40, 54), line(46, 46, 46, 54), line(52, 46, 52, 54), line(58, 46, 58, 54), line(64, 46, 64, 54), line(70, 46, 70, 54)], # reed holes
  "accordion": [rect(20, 32, 12, 36), rect(68, 32, 12, 36), [[32, 32], [38, 40], [32, 48], [38, 56], [32, 64], [38, 68], [68, 68], [62, 60], [68, 52], [62, 44], [68, 36], [62, 32], [32, 32]]], # bellows & key panels
  "banjo": [circle(50, 64, 18), rect(48, 14, 4, 36), circle(50, 64, 4), line(46, 14, 54, 14)], # drum body & long neck
  "ukulele": [ellipse(50, 66, 12, 14), ellipse(50, 50, 9, 8), rect(48, 22, 4, 28), circle(50, 62, 4)], # mini guitar body
  "cello": [ellipse(50, 64, 18, 20), rect(48, 12, 4, 32), line(50, 84, 50, 92), line(42, 60, 44, 66), line(58, 60, 56, 66)], # endpin & body
  "harp": [[[30, 24], [70, 24], [64, 78], [30, 78], [30, 24]], line(38, 24, 38, 78), line(46, 24, 46, 78), line(54, 24, 54, 78), line(62, 24, 62, 78)], # frame & strings
  "xylophone": [rect(20, 36, 10, 36), rect(32, 38, 10, 32), rect(44, 40, 10, 28), rect(56, 42, 10, 24), rect(68, 44, 10, 20), line(30, 26, 46, 38), circle(30, 26, 3)], # bars & mallet
  "tambourine": [circle(50, 50, 22), circle(36, 36, 4), circle(64, 36, 4), circle(64, 64, 4), circle(36, 64, 4)], # ring & jingle cymbals
  "maracas": [circle(42, 40, 10), rect(40, 50, 4, 26), circle(58, 40, 10), rect(56, 50, 4, 26)], # shaker pair
  "cymbals": [ellipse(38, 52, 16, 8), ellipse(62, 48, 16, 8), line(38, 44, 38, 38), line(62, 40, 62, 34)], # crashing brass discs & straps
  "metronome": [tri(50, 20, 34, 78, 66, 78), line(50, 74, 40, 32), circle(40, 32, 4)], # pyramid & swinging pendulum
  "microphone": [circle(50, 32, 10), line(44, 32, 56, 32), line(50, 22, 50, 42), rect(47, 42, 6, 34), rect(40, 76, 20, 6)], # mesh ball, handle & stand
  "speaker": [rect(30, 24, 40, 52), circle(50, 42, 6), circle(50, 60, 10), circle(50, 60, 4)], # cabinet, tweeter & woofer
  "headphones": [arc(50, 38, 22, math.pi, 2 * math.pi), rect(24, 38, 8, 18), rect(68, 38, 8, 18), line(24, 38, 28, 38)], # headband & earpads
  "radio": [rect(24, 34, 52, 36), circle(40, 52, 10), rect(56, 42, 14, 8), line(28, 34, 20, 18)], # speaker grille, tuning dial & antenna
  "television": [rect(20, 26, 60, 44), rect(24, 30, 44, 36), circle(72, 38, 3), circle(72, 48, 3), line(50, 26, 42, 16), line(50, 26, 58, 16)], # rabbit ear antennas
  "remote control": [rect(36, 22, 28, 56), circle(44, 32, 3), circle(56, 32, 3), circle(44, 42, 3), circle(56, 42, 3), circle(50, 56, 6)], # D-pad & buttons
  "antenna": [line(50, 20, 50, 78), line(30, 32, 70, 32), line(36, 44, 64, 44), line(40, 56, 60, 56), rect(44, 78, 12, 6)], # mast & crossbars
  "camera": [rect(24, 36, 52, 34), circle(50, 53, 12), circle(50, 53, 6), rect(32, 30, 10, 6), circle(64, 42, 3)], # body, lens & shutter
  "tripod": [line(50, 32, 28, 82), line(50, 32, 50, 84), line(50, 32, 72, 82), rect(44, 26, 12, 6)] # 3 legs & camera mount
}

# ----------------------------------------------------------------------
# LEVEL 7: Actions, Verbs & Dynamics (50 Words)
# ----------------------------------------------------------------------
L7_STROKES = {
  "running": [circle(50, 24, 6), line(50, 30, 46, 52), line(46, 52, 34, 70), line(34, 70, 24, 68), line(46, 52, 60, 64), line(60, 64, 72, 78), line(48, 38, 34, 44), line(48, 38, 62, 40)], # runner sprint
  "walking": [circle(50, 24, 6), line(50, 30, 50, 54), line(50, 54, 42, 76), line(50, 54, 58, 76), line(50, 38, 38, 48), line(50, 38, 62, 48)], # stroll stance
  "jumping": [circle(50, 20, 6), line(50, 26, 50, 48), line(50, 48, 36, 60), line(36, 60, 44, 72), line(50, 48, 64, 60), line(64, 60, 56, 72), line(50, 34, 34, 24), line(50, 34, 66, 24)], # arms up in air
  "skipping": [circle(50, 24, 6), line(50, 30, 48, 52), line(48, 52, 42, 74), line(48, 52, 60, 60), line(60, 60, 58, 70), arc(50, 40, 26, 0.2 * math.pi, 0.8 * math.pi)],
  "hopping": [circle(50, 26, 6), line(50, 32, 50, 52), line(50, 52, 48, 76), line(50, 52, 58, 60), line(58, 60, 54, 68), line(40, 78, 56, 78)], # on one leg
  "swimming": [circle(26, 44, 6), line(32, 44, 68, 44), line(68, 44, 78, 38), line(68, 44, 78, 50), line(16, 58, 84, 58), line(16, 68, 84, 68)], # strokes & water waves
  "diving": [circle(66, 68, 6), line(62, 64, 38, 38), line(38, 38, 28, 26), line(38, 38, 26, 32), line(56, 54, 74, 74), line(50, 76, 84, 76)], # head first splash
  "surfing": [line(22, 68, 78, 68), circle(50, 26, 6), line(50, 32, 50, 50), line(50, 50, 38, 66), line(50, 50, 60, 66), [[16, 78], [40, 72], [60, 78], [84, 72]]], # board on barrel wave
  "skiing": [circle(50, 24, 6), line(50, 30, 46, 52), line(46, 52, 40, 72), line(46, 52, 56, 72), line(28, 76, 54, 70), line(44, 76, 70, 70), line(42, 38, 32, 66), line(52, 38, 62, 66)], # skis & poles
  "skating": [circle(50, 24, 6), line(50, 30, 46, 52), line(46, 52, 36, 72), line(46, 52, 64, 64), line(32, 74, 44, 74), line(60, 66, 72, 66)], # skate blades
  "dancing": [circle(50, 22, 6), line(50, 28, 50, 50), line(50, 50, 34, 68), line(50, 50, 62, 62), line(62, 62, 70, 74), line(50, 34, 32, 26), line(50, 34, 68, 38), circle(74, 24, 2)], # graceful pose
  "singing": [circle(46, 34, 12), arc(52, 38, 4, 0, math.pi), rect(58, 42, 4, 34), circle(58, 42, 4), circle(70, 26, 2), line(72, 26, 72, 20)], # open mouth & mic
  "clapping": [circle(50, 28, 8), [[40, 48], [48, 50]], [[60, 48], [52, 50]], line(48, 46, 48, 40), line(52, 46, 54, 40), line(50, 54, 50, 60)], # hands together & sound marks
  "waving": [circle(46, 30, 8), line(46, 38, 46, 66), line(46, 42, 34, 54), line(46, 42, 64, 30), line(64, 30, 68, 22), line(68, 20, 74, 24)], # raised hand waving
  "pointing": [circle(40, 32, 8), line(40, 40, 40, 68), line(40, 46, 70, 46), line(70, 46, 78, 46), tri(78, 43, 86, 46, 78, 49)], # extended pointing arm
  "pushing": [circle(36, 32, 7), line(36, 39, 44, 58), line(44, 58, 34, 78), line(44, 58, 52, 76), line(40, 46, 62, 46), rect(62, 26, 16, 54)], # leaning against heavy block
  "pulling": [circle(64, 34, 7), line(64, 41, 56, 58), line(56, 58, 68, 78), line(56, 58, 46, 76), line(60, 46, 36, 46), rect(20, 36, 16, 44)], # rope pulling box
  "lifting": [circle(50, 26, 7), line(50, 33, 50, 54), line(50, 54, 38, 74), line(50, 54, 62, 74), line(50, 40, 32, 26), line(50, 40, 68, 26), line(22, 26, 78, 26), circle(22, 26, 6), circle(78, 26, 6)], # barbell clean & jerk
  "carrying": [circle(46, 30, 7), line(46, 37, 46, 62), line(46, 62, 40, 80), line(46, 62, 54, 80), line(46, 44, 56, 48), rect(54, 36, 20, 20)], # box held in arms
  "throwing": [circle(38, 30, 7), line(38, 37, 44, 58), line(44, 58, 32, 78), line(44, 58, 56, 76), line(40, 42, 66, 32), circle(72, 28, 4)], # windup & ball in flight
  "catching": [circle(50, 32, 7), line(50, 39, 50, 60), line(50, 60, 42, 78), line(50, 60, 58, 78), line(50, 44, 36, 38), line(50, 44, 64, 38), circle(50, 34, 4)], # arms cradling ball
  "kicking": [circle(46, 26, 7), line(46, 33, 46, 54), line(46, 54, 42, 78), line(46, 54, 72, 48), circle(80, 44, 5)], # high kick striking ball
  "punching": [circle(40, 30, 7), line(40, 37, 44, 58), line(44, 58, 36, 78), line(44, 58, 54, 76), line(42, 42, 74, 42), circle(76, 42, 4)], # forward boxing glove strike
  "boxing": [circle(44, 28, 7), line(44, 35, 46, 56), circle(36, 44, 6), circle(58, 42, 6), line(46, 56, 38, 78), line(46, 56, 54, 78)], # guard stance with gloves
  "wrestling": [circle(40, 32, 6), circle(60, 32, 6), line(40, 38, 46, 54), line(60, 38, 54, 54), line(46, 54, 54, 54), line(46, 54, 38, 76), line(54, 54, 62, 76)], # grapple clinch
  "climbing": [line(32, 16, 32, 84), line(68, 16, 68, 84), circle(50, 32, 6), line(50, 38, 50, 58), line(50, 44, 32, 36), line(50, 44, 68, 36), line(50, 58, 32, 66), line(50, 58, 68, 66)], # climbing rungs
  "crawling": [circle(30, 50, 6), line(36, 50, 62, 50), line(40, 50, 38, 70), line(58, 50, 56, 70), line(56, 70, 64, 70)], # on hands and knees
  "digging": [circle(38, 30, 7), line(38, 37, 46, 56), line(46, 42, 62, 58), line(62, 58, 70, 76), tri(68, 76, 74, 76, 71, 84), line(60, 84, 82, 84)], # spade in dirt mound
  "planting": [line(20, 68, 80, 68), arc(50, 68, 10, math.pi, 2 * math.pi), line(50, 58, 50, 42), [[50, 46], [42, 40]], [[50, 46], [58, 40]]], # soil mound & seedling
  "watering": [circle(50, 62, 8), [[32, 38], [52, 38], [54, 56], [30, 56], [32, 38]], arc(41, 38, 8, math.pi, 2 * math.pi), [[52, 44], [68, 34]], line(68, 34, 64, 52), line(70, 36, 66, 54)], # watering can & droplets
  "cooking": [rect(30, 50, 40, 18), arc(50, 50, 18, math.pi, 2 * math.pi), line(22, 54, 30, 54), line(70, 54, 78, 54), line(46, 32, 48, 22), line(54, 32, 52, 22)], # pot on stove & steam
  "baking": [rect(26, 32, 48, 48), rect(32, 42, 36, 24), line(42, 54, 58, 54), circle(50, 36, 2)], # oven window & bread inside
  "frying": [circle(46, 50, 18), line(64, 50, 84, 50), circle(44, 48, 5), circle(52, 52, 4)], # pan, handle & sizzling eggs
  "boiling": [rect(32, 44, 36, 32), line(32, 56, 68, 56), circle(42, 62, 3), circle(54, 66, 3), circle(48, 58, 2.5), line(44, 38, 46, 26), line(54, 38, 52, 26)], # pot with bubbling water
  "grilling": [rect(30, 42, 40, 10), line(34, 42, 34, 52), line(42, 42, 42, 52), line(50, 42, 50, 52), line(58, 42, 58, 52), line(66, 42, 66, 52), line(36, 52, 28, 80), line(64, 52, 72, 80)], # barbecue grill & tripod
  "chopping": [line(24, 70, 76, 70), rect(38, 62, 24, 8), [[44, 36], [62, 46], [66, 56], [48, 46], [44, 36]], line(36, 28, 44, 36)], # knife chopping board
  "stirring": [ellipse(50, 58, 20, 10), line(50, 58, 50, 76), line(42, 32, 52, 60), circle(42, 32, 2)], # spoon stirring bowl
  "pouring": [[[34, 32], [54, 44], [46, 64], [26, 52], [34, 32]], [[52, 42], [62, 48]], line(62, 48, 62, 76), ellipse(62, 76, 8, 4)], # pitcher pouring liquid stream
  "drinking": [circle(44, 32, 8), line(44, 40, 44, 68), [[48, 40], [58, 38], [56, 46]], rect(54, 36, 8, 12)], # glass to mouth
  "eating": [circle(44, 32, 8), arc(48, 36, 3, 0, math.pi), line(58, 38, 50, 36), circle(60, 38, 4)], # food morsel entering mouth
  "chewing": [circle(50, 40, 16), arc(50, 48, 6, 0, math.pi), arc(44, 46, 4, 0, math.pi), arc(56, 46, 4, 0, math.pi)], # moving jaw chew
  "sleeping": [circle(42, 50, 10), line(36, 48, 44, 48), [[54, 34], [62, 34], [54, 42], [62, 42]], [[64, 24], [72, 24], [64, 32], [72, 32]]], # closed eyes & ZZZ
  "snoring": [circle(40, 52, 10), circle(46, 54, 3), [[56, 38], [66, 38], [56, 48], [66, 48]], [[68, 22], [78, 22], [68, 32], [78, 32]], line(48, 54, 52, 52)], # open mouth snore & ZZZ
  "yawning": [circle(48, 44, 14), circle(52, 48, 6), line(42, 38, 46, 40), line(56, 40, 60, 38)], # wide open yawn circle mouth
  "sneezing": [circle(46, 42, 12), line(40, 40, 44, 42), line(50, 42, 54, 40), [[52, 46], [62, 44], [66, 50]], circle(68, 42, 1.5), circle(72, 48, 1.5), circle(70, 54, 1.5)], # tissue & spray
  "coughing": [circle(44, 40, 12), arc(50, 44, 4, 0, math.pi), [[52, 46], [48, 54], [56, 56]], arc(60, 44, 6, -0.4 * math.pi, 0.4 * math.pi), arc(66, 44, 8, -0.4 * math.pi, 0.4 * math.pi)], # fist to mouth & cough waves
  "crying": [circle(50, 46, 16), arc(42, 42, 4, math.pi, 2 * math.pi), arc(58, 42, 4, math.pi, 2 * math.pi), arc(50, 54, 6, 0.1 * math.pi, 0.9 * math.pi), [[42, 46], [42, 62]], [[58, 46], [58, 62]], circle(42, 64, 2), circle(58, 64, 2)], # teardrops flowing
  "laughing": [circle(50, 44, 16), arc(40, 38, 4, math.pi, 2 * math.pi), arc(60, 38, 4, math.pi, 2 * math.pi), [[36, 46], [50, 58], [64, 46], [36, 46]], line(40, 48, 60, 48)], # big open laughing smile
  "giggling": [circle(50, 44, 14), arc(42, 40, 3, math.pi, 2 * math.pi), arc(58, 40, 3, math.pi, 2 * math.pi), arc(50, 48, 5, 0, math.pi), [[46, 52], [54, 52], [50, 58]]], # hand over mouth giggle
  "whispering": [circle(38, 44, 10), circle(62, 44, 10), [[42, 46], [46, 48]], arc(58, 44, 4, 0.5 * math.pi, 1.5 * math.pi), line(44, 40, 56, 40)] # two heads close whispering
}

# ----------------------------------------------------------------------
# LEVEL 8: Places & Professions (50 Words)
# ----------------------------------------------------------------------
L8_STROKES = {
  "school": [rect(26, 40, 48, 40), tri(22, 40, 50, 20, 78, 40), rect(44, 12, 12, 12), circle(50, 18, 3), rect(44, 62, 12, 18)], # schoolhouse & bell tower
  "classroom": [rect(20, 24, 60, 52), rect(26, 30, 28, 18), rect(60, 34, 12, 24), line(24, 66, 48, 66), line(28, 66, 28, 74)], # chalkboard & student desks
  "library": [rect(22, 34, 56, 46), tri(18, 34, 50, 18, 82, 34), line(30, 34, 30, 80), line(42, 34, 42, 80), line(58, 34, 58, 80), line(70, 34, 70, 80), rect(48, 60, 4, 14)], # classical pillars & books
  "museum": [tri(16, 36, 50, 16, 84, 36), rect(20, 36, 60, 8), line(26, 44, 26, 80), line(42, 44, 42, 80), line(58, 44, 58, 80), line(74, 44, 74, 80), rect(18, 80, 64, 4)], # greek temple facade
  "zoo": [rect(24, 34, 52, 46), line(32, 34, 32, 80), line(44, 34, 44, 80), line(56, 34, 56, 80), line(68, 34, 68, 80), circle(50, 54, 8)], # enclosure cage bars & animal silhouette
  "aquarium": [rect(24, 34, 52, 44), ellipse(46, 54, 10, 6), tri(56, 54, 62, 48, 62, 60), circle(42, 50, 1.5), circle(50, 42, 2), circle(54, 38, 2)], # tank, fish & rising bubbles
  "park": [rect(20, 74, 60, 6), rect(46, 48, 8, 26), circle(50, 38, 14), rect(26, 62, 16, 4), line(28, 66, 28, 74), line(40, 66, 40, 74)], # tree & park bench
  "playground": [line(24, 74, 36, 34), line(36, 34, 64, 68), line(64, 68, 76, 74), rect(68, 44, 4, 26)], # slide & swing set
  "beach": [arc(50, 84, 46, 1.1 * math.pi, 1.9 * math.pi), arc(50, 34, 20, math.pi, 2 * math.pi), line(50, 34, 50, 70), circle(74, 24, 8)], # shore, umbrella & sun
  "pool": [ellipse(50, 60, 34, 16), line(32, 60, 68, 60), line(68, 50, 68, 34), line(64, 50, 64, 34), line(64, 40, 68, 40)], # pool & ladder
  "gym": [line(24, 50, 76, 50), circle(24, 50, 14), circle(24, 50, 9), circle(76, 50, 14), circle(76, 50, 9)], # heavy barbell weights
  "stadium": [ellipse(50, 52, 36, 20), ellipse(50, 52, 24, 12), line(50, 40, 50, 64), line(30, 52, 70, 52)], # arena bowl & field
  "hospital": [rect(26, 30, 48, 52), rect(44, 62, 12, 20), rect(46, 38, 8, 16), rect(42, 42, 16, 8)], # building with red medical cross
  "doctor": [circle(50, 28, 10), rect(40, 40, 20, 42), line(40, 46, 46, 58), line(60, 46, 54, 58), circle(50, 62, 4)], # lab coat & stethoscope
  "nurse": [circle(50, 32, 10), rect(44, 18, 12, 8), line(50, 20, 50, 24), line(48, 22, 52, 22), rect(40, 44, 20, 38)], # nurse cap with cross
  "dentist": [circle(50, 28, 10), [[44, 48], [44, 74], [50, 74], [50, 60], [56, 74], [56, 48]], line(64, 36, 58, 48)], # giant molar tooth & dental mirror probe
  "teacher": [circle(36, 30, 8), line(36, 38, 36, 68), rect(48, 24, 32, 26), line(44, 44, 60, 34)], # blackboard & pointer
  "student": [circle(50, 30, 8), rect(38, 40, 24, 42), line(38, 44, 30, 60), rect(26, 58, 14, 12)], # desk & open backpack/book
  "principal": [circle(50, 28, 9), rect(38, 38, 24, 44), line(50, 38, 50, 56), tri(48, 40, 52, 40, 50, 46), rect(30, 68, 40, 14)], # suit, necktie & executive desk
  "police officer": [circle(50, 32, 9), rect(42, 20, 16, 6), tri(40, 20, 60, 20, 50, 26), star(50, 46, 5, 2, 5), rect(40, 42, 20, 40)], # police peaked cap & badge
  "firefighter": [circle(50, 34, 9), arc(50, 32, 14, math.pi, 2 * math.pi), rect(40, 44, 20, 38), line(62, 46, 62, 82), [[62, 46], [68, 44]]], # helmet with crest & fire axe
  "farmer": [circle(50, 34, 8), [[32, 28], [68, 28]], arc(50, 28, 12, math.pi, 2 * math.pi), line(64, 40, 64, 82), line(58, 40, 70, 40), line(58, 40, 58, 32), line(70, 40, 70, 32)], # straw hat & pitchfork
  "chef": [circle(50, 40, 9), [[42, 32], [36, 24], [44, 16], [50, 20], [56, 16], [64, 24], [58, 32]], rect(40, 50, 20, 32), circle(46, 56, 1.5), circle(54, 56, 1.5)], # tall toque hat & jacket
  "baker": [circle(50, 36, 9), arc(50, 30, 12, math.pi, 2 * math.pi), rect(42, 46, 16, 36), ellipse(50, 66, 14, 6), line(42, 66, 58, 66)], # chef hat & rolling pin
  "waiter": [circle(50, 28, 8), rect(42, 38, 16, 42), line(50, 40, 46, 48), line(50, 40, 54, 48), line(58, 46, 72, 42), ellipse(72, 42, 10, 4)], # bow tie & serving tray platter
  "cashier": [circle(50, 28, 8), rect(36, 48, 28, 24), line(40, 54, 60, 54), circle(44, 60, 2), circle(52, 60, 2), circle(60, 60, 2)], # cash register & till buttons
  "barber": [circle(50, 28, 8), rect(46, 38, 8, 44), line(46, 44, 54, 50), line(46, 54, 54, 60), line(46, 64, 54, 70)], # spinning striped barber pole
  "mechanic": [circle(50, 28, 8), rect(42, 38, 16, 44), line(34, 46, 26, 36), circle(24, 34, 4), line(66, 46, 74, 36)], # coveralls & open-ended wrench
  "plumber": [circle(50, 28, 8), rect(42, 38, 16, 44), line(60, 46, 72, 38), rect(70, 34, 8, 6), line(32, 64, 32, 80), line(24, 80, 32, 80)], # plunger & pipe
  "electrician": [circle(50, 28, 8), rect(42, 38, 16, 44), [[60, 46], [68, 42], [64, 54], [72, 50]], circle(60, 26, 4)], # hard hat & lightning voltage spark
  "carpenter": [circle(50, 28, 8), rect(42, 38, 16, 44), line(60, 46, 74, 38), rect(72, 34, 6, 12)], # tool belt & claw hammer
  "painter": [circle(50, 28, 8), ellipse(34, 52, 8, 6), circle(34, 52, 2), line(58, 42, 70, 32), [[70, 32], [74, 28]]], # artist palette & paintbrush
  "photographer": [circle(50, 28, 8), rect(42, 40, 20, 14), circle(52, 47, 5), line(42, 40, 44, 36)], # camera raised to eye
  "pilot": [circle(50, 30, 9), arc(50, 26, 12, math.pi, 2 * math.pi), rect(40, 24, 20, 4), star(50, 24, 3, 1, 5), rect(40, 42, 20, 40), line(42, 48, 48, 48)], # pilot visor cap with golden wings
  "sailor": [circle(50, 30, 9), [[38, 24], [62, 24], [58, 18], [42, 18], [38, 24]], rect(40, 42, 20, 40), [[44, 42], [50, 52], [56, 42]], line(50, 52, 50, 64)], # dixie cup hat & sailor flap collar
  "soldier": [circle(50, 30, 9), arc(50, 26, 13, math.pi, 2 * math.pi), rect(40, 42, 20, 40), line(62, 42, 72, 78)], # combat helmet & rifle
  "astronaut": [circle(50, 32, 14), ellipse(50, 32, 10, 8), rect(38, 48, 24, 34), rect(32, 48, 6, 26), rect(62, 48, 6, 26)], # bubble helmet, visor & life-support pack
  "scientist": [circle(50, 28, 8), rect(38, 38, 24, 44), line(50, 38, 50, 82), [[62, 46], [72, 58]], tri(68, 68, 76, 68, 72, 58)], # lab coat & Erlenmeyer flask
  "engineer": [circle(50, 30, 8), arc(50, 26, 12, math.pi, 2 * math.pi), rect(42, 40, 16, 42), line(34, 52, 44, 60), rect(28, 56, 14, 18)], # yellow hard hat & blueprint roll
  "lawyer": [circle(50, 28, 8), rect(38, 38, 24, 44), line(50, 38, 50, 60), rect(60, 52, 16, 12), line(66, 52, 66, 48)], # suit, tie & leather briefcase
  "judge": [circle(50, 28, 8), rect(36, 38, 28, 44), rect(44, 38, 12, 10), line(64, 52, 74, 44), rect(72, 38, 6, 12), rect(68, 54, 14, 4)], # black robe, collar, gavel & sound block
  "bank": [tri(16, 36, 50, 16, 84, 36), rect(20, 36, 60, 6), line(28, 42, 28, 78), line(42, 42, 42, 78), line(58, 42, 58, 78), line(72, 42, 72, 78), circle(50, 26, 4)], # classical bank colonnade & $
  "store": [rect(24, 42, 52, 40), [[20, 32], [28, 42], [36, 32], [44, 42], [52, 32], [60, 42], [68, 32], [76, 42], [80, 32]], rect(32, 52, 18, 18), rect(54, 52, 14, 30)], # striped awning, display window & door
  "mall": [rect(18, 32, 64, 50), arc(50, 32, 16, math.pi, 2 * math.pi), rect(42, 60, 16, 22), rect(24, 42, 14, 14), rect(62, 42, 14, 14)], # multi-story glass atrium & shops
  "restaurant": [rect(26, 38, 48, 44), tri(22, 38, 50, 22, 78, 38), line(38, 54, 38, 70), line(34, 54, 42, 54), ellipse(60, 58, 6, 8), rect(44, 62, 12, 20)], # fork & spoon crest on facade
  "hotel": [rect(30, 24, 40, 60), rect(44, 68, 12, 16), rect(34, 32, 8, 8), rect(46, 32, 8, 8), rect(58, 32, 8, 8), rect(34, 46, 8, 8), rect(46, 46, 8, 8), rect(58, 46, 8, 8)], # high-rise guest room windows
  "airport": [rect(24, 42, 52, 40), rect(44, 18, 12, 24), ellipse(50, 18, 10, 4), [[64, 26], [78, 20], [80, 24], [72, 30]]], # control tower & climbing jet
  "train station": [rect(22, 38, 56, 44), tri(18, 38, 50, 22, 82, 38), circle(50, 32, 6), line(50, 32, 50, 28), line(50, 32, 54, 32), line(16, 82, 84, 82), line(22, 82, 22, 86), line(78, 82, 78, 86)], # clock tower & railway tracks
  "bus stop": [rect(32, 32, 36, 46), rect(30, 30, 40, 4), line(36, 40, 36, 72), line(64, 40, 64, 72), rect(40, 60, 20, 4), line(76, 40, 76, 78), circle(76, 36, 5)], # glass shelter, bench & bus sign
  "church": [rect(32, 42, 36, 40), tri(28, 42, 50, 22, 72, 42), line(50, 10, 50, 22), line(46, 14, 54, 14), arc(50, 64, 6, math.pi, 2 * math.pi), rect(44, 64, 12, 18)] # steeple, cross & stained glass arch
}

# ----------------------------------------------------------------------
# LEVEL 9: Vehicles, Transport & Machines (50 Words)
# ----------------------------------------------------------------------
L9_STROKES = {
  "unicycle": [circle(50, 64, 14), line(50, 64, 50, 30), rect(44, 26, 12, 4), line(44, 64, 56, 64)], # wheel, post, saddle & pedals
  "motorcycle": [circle(26, 66, 12), circle(74, 66, 12), [[26, 66], [42, 46], [58, 46], [74, 66]], line(42, 46, 38, 34), line(34, 34, 44, 34)], # wheels, engine frame & handlebars
  "airplane": [rect(18, 48, 64, 8), [[44, 48], [34, 20], [54, 48]], [[44, 56], [34, 80], [54, 56]], [[74, 48], [82, 30], [86, 48]]], # fuselage, wings & tailplane
  "helicopter": [ellipse(44, 50, 18, 12), line(62, 50, 84, 50), line(84, 44, 84, 56), line(44, 38, 44, 28), line(20, 28, 68, 28), line(34, 64, 54, 64)], # cabin, tail rotor, mast & rotor blade
  "jet": [[[18, 50], [82, 50], [74, 44], [28, 44], [18, 50]], tri(36, 44, 52, 22, 54, 44), tri(36, 50, 52, 78, 54, 50), tri(72, 44, 82, 28, 84, 44)], # delta wings & afterburner fin
  "rocket": [[[50, 14], [34, 42], [34, 72], [66, 72], [66, 42], [50, 14]], tri(34, 72, 20, 86, 34, 86), tri(66, 72, 80, 86, 66, 86), circle(50, 42, 6)], # fuselage, launch fins & porthole
  "spaceship": [ellipse(50, 50, 34, 12), circle(50, 42, 10), circle(32, 52, 3), circle(50, 52, 3), circle(68, 52, 3)], # flying saucer dome & lights
  "submarine": [ellipse(50, 54, 34, 14), rect(44, 32, 12, 12), line(50, 32, 50, 20), line(50, 20, 56, 20), circle(36, 54, 3), circle(48, 54, 3), circle(60, 54, 3)], # conning tower, periscope & portholes
  "sailboat": [[[20, 68], [80, 68], [72, 84], [28, 84], [20, 68]], line(48, 68, 48, 20), tri(48, 22, 74, 58, 48, 58), tri(46, 26, 28, 58, 46, 58)], # hull & tall sails
  "yacht": [[[16, 66], [84, 66], [76, 82], [24, 82], [16, 66]], rect(32, 48, 36, 18), circle(40, 56, 2.5), circle(50, 56, 2.5), circle(60, 56, 2.5)], # cabin cruiser deck & cabin
  "canoe": [[[16, 54], [50, 68], [84, 54], [50, 60], [16, 54]], line(42, 36, 58, 64), ellipse(58, 64, 4, 8)], # sleek dugout hull & wooden paddle
  "kayak": [[[14, 52], [50, 62], [86, 52], [50, 46], [14, 52]], ellipse(50, 52, 8, 4), line(30, 36, 70, 68), ellipse(30, 36, 4, 8), ellipse(70, 68, 4, 8)], # cockpit & double-ended paddle
  "ferry": [rect(20, 52, 60, 22), rect(28, 36, 44, 16), line(20, 58, 80, 58), line(44, 36, 44, 26), line(56, 36, 56, 26)], # twin smokestacks & vehicle deck
  "cruise ship": [rect(16, 56, 68, 22), rect(24, 40, 52, 16), rect(32, 28, 36, 12), line(46, 28, 46, 18), line(54, 28, 54, 18), circle(32, 48, 2), circle(42, 48, 2), circle(52, 48, 2), circle(62, 48, 2)], # ocean liner decks & funnels
  "train": [rect(20, 40, 48, 32), rect(48, 28, 20, 44), rect(28, 28, 8, 12), circle(28, 76, 6), circle(44, 76, 6), circle(60, 76, 6), line(16, 82, 80, 82)], # steam loco, cab & wheels
  "subway": [rect(18, 34, 64, 38), rect(24, 40, 16, 18), rect(44, 40, 16, 18), rect(64, 40, 14, 18), line(18, 76, 82, 76)], # metro car doors & tracks
  "tram": [rect(22, 34, 56, 38), line(50, 34, 50, 20), line(40, 20, 60, 20), rect(28, 40, 12, 16), rect(44, 40, 12, 16), rect(60, 40, 12, 16)], # streetcar & pantograph wire
  "bulldozer": [rect(30, 42, 36, 24), ellipse(48, 70, 20, 8), [[66, 52], [78, 52], [82, 74], [70, 74]], rect(34, 32, 18, 12)], # tracks, cab & front dozer blade
  "crane": [rect(26, 62, 24, 14), line(38, 62, 70, 20), line(70, 20, 82, 20), line(82, 20, 82, 54), tri(78, 54, 86, 54, 82, 60)], # lattice boom & dangling hook
  "tractor": [circle(34, 64, 14), circle(68, 70, 8), [[28, 64], [52, 44], [68, 54]], rect(46, 32, 14, 14), line(60, 44, 60, 34)], # giant rear wheel, cab & exhaust pipe
  "fire truck": [rect(18, 42, 64, 28), line(30, 34, 76, 34), line(36, 34, 36, 42), line(50, 34, 50, 42), circle(30, 72, 6), circle(66, 72, 6), circle(26, 38, 3)], # ladder on roof & siren
  "ambulance": [rect(18, 40, 64, 30), rect(26, 46, 14, 12), line(46, 52, 54, 52), line(50, 48, 50, 56), circle(28, 72, 6), circle(68, 72, 6), circle(32, 36, 3)], # medical cross & roof light
  "police car": [rect(18, 46, 64, 24), [[32, 46], [40, 34], [60, 34], [68, 46]], circle(50, 30, 4), circle(28, 72, 6), circle(68, 72, 6)], # cruiser siren on roof
  "taxi": [rect(18, 46, 64, 24), [[32, 46], [40, 34], [60, 34], [68, 46]], rect(44, 28, 12, 6), circle(28, 72, 6), circle(68, 72, 6)], # roof taxi sign box
  "limousine": [rect(12, 48, 76, 20), [[26, 48], [34, 38], [72, 38], [78, 48]], circle(22, 70, 6), circle(78, 70, 6), line(44, 48, 44, 68), line(58, 48, 58, 68)], # stretched luxury body
  "pickup truck": [rect(18, 50, 64, 20), rect(22, 38, 22, 14), line(44, 50, 80, 50), circle(28, 72, 6), circle(68, 72, 6)], # cab & open flatbed
  "van": [rect(18, 38, 64, 32), rect(24, 44, 16, 14), rect(44, 44, 16, 14), circle(28, 72, 6), circle(68, 72, 6)], # boxy van body
  "RV": [rect(16, 36, 68, 34), rect(22, 42, 14, 12), rect(42, 42, 12, 12), rect(58, 42, 12, 12), circle(28, 72, 6), circle(68, 72, 6)], # motorhome windows & door
  "forklift": [rect(26, 46, 32, 24), rect(32, 34, 14, 14), line(58, 30, 58, 70), line(58, 68, 74, 68), circle(32, 72, 5), circle(52, 72, 5)], # cage & lifting prongs
  "excavator": [rect(26, 50, 30, 18), ellipse(41, 72, 18, 6), [[36, 50], [52, 32], [72, 46], [82, 64]], [[78, 60], [86, 66], [80, 72]]], # boom arm & toothed digging bucket
  "cement mixer": [rect(20, 54, 56, 18), ellipse(44, 46, 18, 12), line(34, 46, 54, 46), circle(28, 74, 6), circle(64, 74, 6)], # rotating drum
  "dump truck": [rect(18, 50, 20, 20), [[38, 60], [78, 46], [80, 70], [38, 70]], circle(26, 72, 6), circle(68, 72, 6)], # tilting dump bed
  "tow truck": [rect(18, 50, 24, 20), rect(42, 60, 36, 10), line(48, 60, 72, 40), line(72, 40, 78, 54), circle(28, 72, 6), circle(68, 72, 6)], # crane boom & towing hook
  "snowplow": [rect(24, 46, 54, 24), [[14, 44], [22, 72], [14, 74]], circle(36, 72, 6), circle(66, 72, 6)], # angled curved plow blade
  "golf cart": [rect(30, 50, 40, 20), rect(36, 32, 30, 4), line(38, 36, 36, 50), line(64, 36, 64, 50), circle(36, 72, 5), circle(64, 72, 5)], # canopy roof & tiny wheels
  "rickshaw": [circle(32, 64, 14), circle(68, 64, 14), rect(36, 44, 24, 18), line(24, 60, 16, 56)], # high wooden wheels & pull shafts
  "hot air balloon": [circle(50, 36, 22), [[34, 50], [44, 68], [56, 68], [66, 50]], rect(44, 74, 12, 10), line(44, 68, 44, 74), line(56, 68, 56, 74)], # striped envelope & wicker basket
  "blimp": [ellipse(50, 42, 36, 16), rect(44, 58, 14, 6), tri(82, 42, 90, 34, 88, 42), tri(82, 42, 90, 50, 88, 42)], # dirigible body, gondola & fins
  "parachute": [arc(50, 38, 26, math.pi, 2 * math.pi), line(24, 38, 76, 38), line(24, 38, 50, 72), line(40, 38, 50, 72), line(60, 38, 50, 72), line(76, 38, 50, 72), circle(50, 74, 3)], # dome, shroud lines & jumper
  "hang glider": [tri(50, 26, 16, 66, 84, 66), line(50, 26, 50, 66), line(36, 66, 64, 66), circle(50, 70, 3)], # triangular wing & pilot harness
  "segway": [circle(38, 72, 8), circle(62, 72, 8), rect(36, 68, 28, 4), line(50, 68, 50, 26), line(42, 26, 58, 26)], # dual wheels, platform & tall handlebar
  "combine harvester": [rect(26, 44, 44, 24), circle(32, 70, 10), circle(64, 72, 6), circle(16, 64, 8), line(16, 64, 26, 56)], # threshing reel cylinder
  "steamroller": [rect(38, 42, 34, 26), circle(26, 66, 14), circle(64, 70, 8), rect(44, 30, 16, 12)], # massive front steel roller drum
  "street sweeper": [rect(24, 44, 48, 24), circle(20, 68, 6), circle(34, 70, 6), circle(64, 70, 6)], # rotating disc gutter brushes
  "ice cream truck": [rect(18, 40, 64, 30), rect(24, 46, 16, 14), circle(28, 72, 6), circle(68, 72, 6), tri(50, 32, 44, 20, 56, 20), circle(50, 16, 4)], # giant cone sign on roof
  "food truck": [rect(18, 40, 64, 30), rect(36, 46, 24, 14), line(36, 46, 60, 46), circle(28, 72, 6), circle(68, 72, 6)], # service window hatch
  "moving truck": [rect(16, 36, 46, 34), rect(62, 48, 20, 22), circle(30, 72, 6), circle(70, 72, 6)], # large cargo box & cab
  "armored truck": [rect(18, 42, 64, 26), rect(24, 48, 8, 8), rect(38, 48, 8, 8), rect(68, 48, 8, 8), circle(28, 70, 6), circle(68, 70, 6)], # slot slit bulletproof windows
  "cable car": [rect(28, 40, 44, 32), line(16, 24, 84, 24), line(50, 24, 50, 40), rect(34, 46, 10, 14), rect(48, 46, 10, 14), rect(62, 46, 10, 14)], # overhead tram cable
  "monorail": [rect(16, 42, 68, 20), line(12, 64, 88, 64), line(32, 64, 32, 84), line(68, 64, 68, 84)] # straddle beam track
}

# ----------------------------------------------------------------------
# LEVEL 10: World Wonders & Pioneers (50 Words)
# ----------------------------------------------------------------------
L10_STROKES = {
  "Eiffel Tower": [[[50, 12], [32, 86]], [[50, 12], [68, 86]], line(38, 48, 62, 48), line(34, 68, 66, 68), [[40, 86], [50, 72], [60, 86]]], # lattice spire & arch base
  "Statue of Liberty": [rect(34, 68, 32, 20), [[44, 36], [56, 36], [58, 68], [42, 68], [44, 36]], circle(50, 28, 6), [[56, 32], [72, 18]], tri(70, 16, 76, 16, 73, 22)], # torch, crown & robe
  "Big Ben": [rect(40, 30, 20, 56), tri(40, 30, 50, 12, 60, 30), circle(50, 42, 7), line(50, 42, 50, 38), line(50, 42, 54, 42)], # clock tower & clock dial
  "pyramids": [tri(46, 26, 16, 78, 76, 78), tri(64, 36, 48, 78, 88, 78), line(28, 60, 64, 60), line(38, 44, 58, 44)], # stepped desert monuments
  "Taj Mahal": [rect(26, 48, 48, 36), arc(50, 48, 16, math.pi, 2 * math.pi), line(50, 32, 50, 22), arc(50, 70, 8, math.pi, 2 * math.pi), line(18, 32, 18, 84), line(82, 32, 82, 84)], # onion dome & minarets
  "Colosseum": [ellipse(50, 52, 34, 20), line(16, 52, 16, 72), line(84, 52, 84, 72), ellipse(50, 72, 34, 10), arc(32, 58, 4, math.pi, 2 * math.pi), arc(50, 58, 4, math.pi, 2 * math.pi), arc(68, 58, 4, math.pi, 2 * math.pi)], # arena tier arches
  "Great Wall of China": [[[16, 68], [36, 54], [58, 64], [84, 48]], rect(32, 44, 10, 12), rect(74, 38, 10, 12), line(16, 74, 84, 54)], # parapet wall & watchtowers
  "Sydney Opera House": [[[24, 74], [38, 48], [52, 74]], [[44, 74], [58, 42], [72, 74]], [[64, 74], [76, 50], [84, 74]], line(18, 74, 88, 74)], # interlocking sail shells
  "Space Needle": [ellipse(50, 34, 22, 6), line(50, 34, 50, 14), line(44, 38, 46, 84), line(56, 38, 54, 84), rect(40, 84, 20, 4)], # flying saucer observation deck & spire
  "Golden Gate Bridge": [line(32, 24, 32, 82), line(68, 24, 68, 82), arc(50, 24, 28, 0, math.pi), line(16, 60, 84, 60), line(42, 48, 42, 60), line(58, 48, 58, 60)], # suspension towers & cable sweep
  "Mount Rushmore": [[[20, 70], [32, 36], [44, 40], [56, 34], [68, 38], [80, 70]], circle(34, 46, 3), circle(46, 48, 3), circle(58, 46, 3), circle(70, 48, 3)], # carved mountain faces
  "Niagara Falls": [line(20, 40, 80, 40), line(30, 40, 30, 80), line(40, 40, 40, 80), line(50, 40, 50, 80), line(60, 40, 60, 80), line(70, 40, 70, 80), arc(50, 80, 30, 0, math.pi)], # cataract cascade & mist
  "Grand Canyon": [[[16, 36], [34, 50], [42, 72], [50, 80]], [[84, 36], [66, 50], [58, 72], [50, 80]], line(24, 44, 40, 44), line(60, 44, 76, 44)], # stratified canyon gorge
  "volcano": [tri(20, 80, 50, 36, 80, 80), ellipse(50, 36, 10, 4), [[50, 36], [46, 18]], [[50, 36], [54, 16]], line(46, 42, 42, 58), line(54, 42, 58, 58)], # crater & erupting lava
  "waterfall": [line(24, 32, 46, 32), line(54, 32, 76, 32), line(48, 32, 48, 78), line(52, 32, 52, 78), ellipse(50, 78, 24, 6)], # river plunge pool
  "geyser": [line(24, 76, 76, 76), [[46, 76], [44, 32], [50, 16], [56, 32], [54, 76]], arc(50, 18, 12, 0, math.pi)], # steam plume blast
  "glacier": [[[20, 74], [36, 38], [64, 44], [80, 74]], line(36, 38, 50, 74), line(64, 44, 58, 74)], # crevasses & blue ice
  "iceberg": [line(14, 50, 86, 50), tri(40, 50, 50, 24, 60, 50), [[34, 50], [30, 78], [68, 84], [64, 50]]], # tip above waterline & massive submerged body
  "desert": [[[16, 68], [42, 54], [66, 64], [84, 56]], circle(74, 26, 8), line(28, 58, 34, 62)], # sand dunes & blazing sun
  "oasis": [ellipse(50, 68, 24, 10), [[48, 68], [46, 40], [54, 36]], [[46, 40], [34, 32]], [[46, 40], [42, 26]], [[46, 40], [58, 28]], [[46, 40], [56, 34]]], # water pool & palm tree
  "castle": [rect(26, 44, 48, 38), rect(22, 32, 12, 50), rect(66, 32, 12, 50), tri(22, 32, 28, 18, 34, 32), tri(66, 32, 72, 18, 78, 32), arc(50, 74, 8, math.pi, 2 * math.pi)], # battlements & turrets
  "lighthouse": [[[38, 78], [42, 34], [58, 34], [62, 78]], rect(40, 26, 20, 8), tri(40, 26, 50, 16, 60, 26), line(60, 30, 84, 22), line(60, 30, 84, 38)], # beacon light beams
  "windmill": [tri(36, 80, 50, 40, 64, 80), circle(50, 40, 5), line(50, 40, 50, 16), line(50, 40, 50, 64), line(50, 40, 26, 40), line(50, 40, 74, 40)], # stone tower & 4 sails
  "igloo": [arc(50, 66, 26, math.pi, 2 * math.pi), line(24, 66, 76, 66), line(28, 52, 72, 52), arc(64, 66, 8, math.pi, 2 * math.pi)], # snow block dome & tunnel entry
  "teepee": [tri(50, 18, 24, 78, 76, 78), line(46, 24, 52, 12), line(54, 24, 48, 12), tri(46, 78, 50, 60, 54, 78)], # tent poles & door flap
  "pagoda": [[[32, 40], [50, 28], [68, 40]], [[28, 54], [50, 44], [72, 54]], [[24, 68], [50, 58], [76, 68]], rect(38, 68, 24, 14)], # tiered curved Asian roofs
  "temple": [tri(20, 36, 50, 18, 80, 36), line(28, 36, 28, 76), line(42, 36, 42, 76), line(58, 36, 58, 76), line(72, 36, 72, 76), rect(22, 76, 56, 6)], # pediment & fluted columns
  "cathedral": [rect(28, 40, 44, 42), tri(28, 40, 50, 18, 72, 40), circle(50, 34, 7), arc(50, 72, 8, math.pi, 2 * math.pi), line(50, 10, 50, 18), line(46, 14, 54, 14)], # rose window & steeple cross
  "mosque": [rect(30, 48, 40, 34), arc(50, 48, 16, math.pi, 2 * math.pi), line(50, 32, 50, 24), line(22, 28, 22, 82), line(78, 28, 78, 82)], # dome & minaret spires
  "synagogue": [rect(28, 40, 44, 42), star(50, 32, 9, 5, 6), arc(50, 72, 8, math.pi, 2 * math.pi)], # Star of David facade
  "skyscraper": [rect(36, 18, 28, 66), line(42, 26, 42, 80), line(50, 26, 50, 80), line(58, 26, 58, 80), line(50, 18, 50, 10)], # tower & spire
  "bridge": [line(16, 56, 84, 56), arc(34, 56, 12, math.pi, 2 * math.pi), arc(66, 56, 12, math.pi, 2 * math.pi), line(16, 68, 84, 68)], # arch bridge spans
  "dam": [[[22, 38], [78, 38], [72, 80], [28, 80], [22, 38]], line(22, 46, 78, 46), line(46, 58, 46, 80), line(54, 58, 54, 80)], # concrete reservoir wall
  "tunnel": [rect(26, 36, 48, 46), arc(50, 60, 16, math.pi, 2 * math.pi), line(42, 70, 38, 82), line(58, 70, 62, 82)], # mountain portal & train tracks
  "overpass": [line(16, 46, 84, 46), line(16, 54, 84, 54), line(38, 54, 38, 80), line(62, 54, 62, 80), line(50, 58, 50, 80)], # highway bridge & pillars
  "roundabout": [circle(50, 50, 24), circle(50, 50, 12), line(50, 26, 50, 16), line(50, 74, 50, 84), line(26, 50, 16, 50), line(74, 50, 84, 50)], # traffic circle
  "crosswalk": [rect(26, 34, 48, 44), line(34, 34, 34, 78), line(44, 34, 44, 78), line(56, 34, 56, 78), line(66, 34, 66, 78)], # zebra crossing stripes
  "traffic light": [rect(42, 22, 16, 46), circle(50, 30, 4), circle(50, 45, 4), circle(50, 60, 4), rect(48, 68, 4, 18)], # 3 signals & post
  "stop sign": [star(50, 40, 22, 22, 8), [[42, 38], [40, 44], [44, 44]], [[48, 36], [48, 44]], [[54, 38], [54, 44]], rect(48, 62, 4, 24)], # octagon sign & post
  "toll booth": [rect(38, 38, 24, 34), rect(34, 34, 32, 6), line(62, 52, 86, 42), circle(62, 52, 3)], # booth & barrier gate arm
  "drawbridge": [[[16, 68], [46, 42]], [[84, 68], [54, 42]], line(16, 68, 16, 82), line(84, 68, 84, 82)], # twin bascule bridge leaves raised
  "aqueduct": [line(16, 42, 84, 42), arc(28, 56, 8, math.pi, 2 * math.pi), arc(50, 56, 8, math.pi, 2 * math.pi), arc(72, 56, 8, math.pi, 2 * math.pi), line(20, 56, 20, 80), line(36, 56, 36, 80), line(58, 56, 58, 80), line(80, 56, 80, 80)], # Roman arches
  "observatory": [rect(32, 46, 36, 34), arc(50, 46, 18, math.pi, 2 * math.pi), line(46, 42, 60, 26), line(50, 44, 64, 28)], # dome & telescope slit
  "planetarium": [ellipse(50, 56, 32, 18), arc(50, 56, 24, math.pi, 2 * math.pi), star(42, 44, 3, 1, 4), star(58, 40, 3, 1, 4)], # projection dome & stars
  "greenhouse": [rect(26, 44, 48, 36), tri(26, 44, 50, 26, 74, 44), line(50, 26, 50, 80), line(38, 44, 38, 80), line(62, 44, 62, 80)], # glass panes
  "barn": [rect(24, 44, 52, 38), [[24, 44], [36, 26], [64, 26], [76, 44]], rect(42, 60, 16, 22), line(42, 60, 58, 82), line(58, 60, 42, 82)], # gambrel roof & X-brace barn door
  "silo": [rect(36, 32, 28, 50), arc(50, 32, 14, math.pi, 2 * math.pi), line(36, 44, 64, 44), line(36, 58, 64, 58), line(36, 72, 64, 72)], # cylindrical grain tower
  "Elvis Presley": [circle(50, 42, 14), [[34, 38], [34, 18], [52, 14], [64, 26], [58, 36]], line(36, 42, 36, 54), line(64, 42, 64, 54), rect(48, 60, 4, 22)], # pompadour hair, sideburns & microphone
  "Marilyn Monroe": [circle(50, 42, 14), [[36, 36], [32, 24], [44, 16], [56, 16], [66, 26], [62, 38]], circle(58, 48, 1.5), arc(50, 48, 5, 0, math.pi)], # blonde curls & beauty mark
  "Charlie Chaplin": [circle(50, 44, 13), [[34, 34], [66, 34]], arc(50, 34, 12, math.pi, 2 * math.pi), rect(46, 46, 8, 3), [[38, 64], [34, 82], [30, 82]]], # bowler hat, mustache & cane
}

print("Loaded L6-L10: Total words =", len(L6_STROKES) + len(L7_STROKES) + len(L8_STROKES) + len(L9_STROKES) + len(L10_STROKES))
