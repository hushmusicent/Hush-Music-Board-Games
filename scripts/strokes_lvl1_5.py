#!/usr/bin/env python3
import math
from test_geo import circle, ellipse, arc, rect, tri, star, line

# ----------------------------------------------------------------------
# LEVEL 1: First Words & Basics (50 Words)
# ----------------------------------------------------------------------
L1_STROKES = {
  "apple": [
    [[50, 28], [36, 20], [22, 34], [25, 65], [45, 82], [50, 80], [55, 82], [75, 65], [78, 34], [64, 20], [50, 28]],
    [[50, 28], [48, 14], [52, 10]],
    [[50, 20], [62, 14], [68, 18], [56, 22], [50, 20]],
    [[30, 36], [32, 50]]
  ],
  "banana": [
    [[25, 28], [32, 50], [50, 72], [76, 75], [82, 70]],
    [[25, 28], [38, 44], [52, 60], [70, 66], [82, 70]],
    [[26, 28], [36, 48], [51, 66], [74, 71], [82, 70]],
    [[25, 28], [20, 24], [22, 21], [27, 24]]
  ],
  "sun": [
    circle(50, 50, 16),
    line(50, 26, 50, 10), line(50, 74, 50, 90),
    line(26, 50, 10, 50), line(74, 50, 90, 50),
    line(33, 33, 22, 22), line(67, 67, 78, 78),
    line(67, 33, 78, 22), line(33, 67, 22, 78)
  ],
  "moon": [
    [[50, 15], [75, 30], [80, 50], [75, 70], [50, 85]],
    [[50, 15], [60, 34], [62, 50], [60, 66], [50, 85]],
    circle(66, 42, 3), circle(68, 58, 2.5)
  ],
  "star": [
    star(50, 50, 32, 14, 5),
    star(50, 50, 12, 5, 4)
  ],
  "heart": [
    [[50, 34], [40, 18], [24, 20], [16, 36], [22, 56], [50, 82]],
    [[50, 34], [60, 18], [76, 20], [84, 36], [78, 56], [50, 82]],
    [[28, 30], [22, 42]]
  ],
  "ball": [
    circle(50, 50, 26),
    [[26, 38], [50, 48], [74, 38]],
    [[26, 62], [50, 52], [74, 62]],
    line(50, 24, 50, 76)
  ],
  "dog": [
    circle(46, 38, 14),
    [[35, 32], [24, 42], [30, 52], [38, 44]], # left ear
    [[57, 32], [66, 42], [62, 52], [54, 44]], # right ear
    [[42, 44], [46, 46], [50, 44]], # nose/snout
    circle(46, 42, 2),
    [[42, 52], [42, 78], [72, 78], [72, 58], [54, 52]], # body & legs
    [[72, 64], [84, 52], [88, 56]] # wagging tail
  ],
  "cat": [
    circle(50, 40, 15),
    [[38, 28], [30, 12], [45, 24]], # left pointed ear
    [[62, 28], [70, 12], [55, 24]], # right pointed ear
    line(44, 44, 25, 42), line(44, 46, 24, 48), # whiskers left
    line(56, 44, 75, 42), line(56, 46, 76, 48), # whiskers right
    [[40, 55], [40, 80], [60, 80], [60, 55]], # body
    [[60, 75], [74, 75], [78, 62]] # upright tail
  ],
  "fish": [
    [[20, 50], [35, 32], [65, 36], [78, 50], [65, 64], [35, 68], [20, 50]],
    [[78, 50], [92, 34], [86, 50], [92, 66], [78, 50]], # tail fin
    circle(30, 46, 2.5), # eye
    [[40, 36], [44, 50], [40, 64]], # gill
    [[46, 34], [55, 22], [62, 36]] # top fin
  ],
  "bird": [
    circle(46, 48, 16),
    [[58, 44], [74, 48], [58, 52]], # beak
    circle(52, 44, 2), # eye
    [[35, 48], [44, 60], [32, 60], [35, 48]], # wing
    [[30, 52], [16, 58], [24, 62], [16, 68], [32, 60]], # tail
    line(42, 64, 42, 78), line(48, 64, 48, 78) # legs
  ],
  "tree": [
    rect(44, 58, 12, 30), # trunk
    tri(20, 60, 50, 36, 80, 60), # bottom foliage
    tri(26, 42, 50, 22, 74, 42), # middle foliage
    tri(34, 26, 50, 10, 66, 26)  # top foliage
  ],
  "flower": [
    circle(50, 40, 8), # center
    tri(45, 32, 50, 18, 55, 32), # top petal
    tri(45, 48, 50, 62, 55, 48), # bottom petal
    tri(42, 35, 28, 40, 42, 45), # left petal
    tri(58, 35, 72, 40, 58, 45), # right petal
    line(50, 62, 50, 90), # stem
    [[50, 75], [64, 70], [60, 80], [50, 78]] # leaf
  ],
  "house": [
    rect(26, 46, 48, 40), # walls
    tri(20, 46, 50, 18, 80, 46), # pitched roof
    rect(65, 18, 7, 20), # chimney
    rect(43, 62, 14, 24), # door
    rect(30, 52, 10, 10), line(35, 52, 35, 62), line(30, 57, 40, 57) # window
  ],
  "car": [
    rect(16, 54, 68, 18), # chassis
    [[30, 54], [38, 36], [62, 36], [70, 54]], # cabin roof
    circle(32, 74, 8), circle(68, 74, 8), # wheels
    line(50, 36, 50, 54) # divide
  ],
  "hat": [
    [[16, 68], [84, 68], [78, 74], [22, 74], [16, 68]], # wide brim
    rect(30, 30, 40, 38), # top hat cylinder
    line(30, 60, 70, 60) # hat ribbon
  ],
  "shoe": [
    line(18, 75, 82, 75), # sole
    [[18, 75], [18, 52], [34, 48], [46, 56], [72, 60], [82, 68], [82, 75]], # upper
    line(34, 48, 44, 48), line(42, 54, 48, 58), line(44, 58, 50, 62), # laces
    rect(18, 75, 16, 6) # heel
  ],
  "key": [
    circle(30, 50, 14), circle(30, 50, 5), # head
    line(44, 50, 85, 50), # shaft
    rect(72, 50, 6, 14), rect(80, 50, 5, 10) # teeth
  ],
  "door": [
    rect(30, 18, 40, 72), # frame
    circle(64, 56, 3), # doorknob
    rect(36, 26, 28, 22), rect(36, 56, 28, 26) # panels
  ],
  "bed": [
    rect(22, 34, 6, 44), # headboard
    rect(72, 52, 6, 26), # footboard
    rect(26, 58, 50, 12), # mattress
    rect(28, 52, 14, 6), # pillow
    line(44, 58, 44, 70) # folded sheet
  ],
  "egg": [
    [[50, 16], [68, 38], [72, 64], [58, 84], [42, 84], [28, 64], [32, 38], [50, 16]],
    line(40, 30, 36, 44) # shine
  ],
  "cup": [
    rect(30, 36, 40, 42), # mug
    [[70, 44], [84, 48], [84, 66], [70, 70]], # handle
    [[40, 30], [42, 18], [38, 12]], # steam 1
    [[50, 30], [52, 16], [48, 10]] # steam 2
  ],
  "book": [
    line(50, 35, 50, 75), # spine
    [[50, 35], [30, 30], [18, 34], [18, 74], [32, 70], [50, 75]], # left page
    [[50, 35], [70, 30], [82, 34], [82, 74], [68, 70], [50, 75]], # right page
    line(24, 44, 44, 42), line(56, 42, 76, 44) # lines
  ],
  "chair": [
    line(28, 54, 72, 54), # seat
    rect(30, 18, 40, 36), # backrest
    line(42, 18, 42, 54), line(56, 18, 56, 54), # slats
    line(34, 54, 34, 85), line(66, 54, 66, 85) # legs
  ],
  "table": [
    [[20, 42], [70, 42], [80, 52], [30, 52], [20, 42]], # top
    line(30, 52, 30, 86), line(76, 52, 76, 86), # front legs
    line(22, 44, 22, 76), line(68, 42, 68, 74) # back legs
  ],
  "eye": [
    [[20, 50], [35, 32], [65, 32], [80, 50]], # upper lid
    [[20, 50], [35, 68], [65, 68], [80, 50]], # lower lid
    circle(50, 50, 12), circle(50, 50, 5), # iris & pupil
    line(35, 32, 32, 22), line(50, 32, 50, 20), line(65, 32, 68, 22) # lashes
  ],
  "nose": [
    line(46, 24, 46, 60), # bridge
    [[46, 60], [42, 68], [50, 72], [58, 68], [54, 60]], # tip
    arc(38, 66, 4, 0, math.pi), arc(62, 66, 4, 0, math.pi) # nostrils
  ],
  "mouth": [
    [[25, 50], [38, 40], [50, 44], [62, 40], [75, 50]], # top lip
    [[25, 50], [36, 64], [64, 64], [75, 50]], # bottom lip
    line(25, 50, 75, 50) # mouth line
  ],
  "hand": [
    [[36, 85], [36, 65], [22, 58], [18, 52], [28, 48], [38, 54], [38, 30], [44, 30], [44, 52], [46, 24], [52, 24], [52, 52], [54, 28], [60, 28], [60, 54], [62, 38], [68, 38], [68, 65], [64, 85]],
    line(36, 64, 54, 64) # palm crease
  ],
  "foot": [
    [[38, 24], [38, 65], [32, 76], [42, 78], [56, 76], [74, 78], [82, 74], [82, 66], [70, 65], [46, 24]],
    line(78, 66, 78, 72), line(74, 67, 74, 73), line(70, 68, 70, 74) # toes
  ],
  "smile": [
    arc(50, 48, 28, 0.2 * math.pi, 0.8 * math.pi), # mouth arc
    arc(34, 38, 7, 1.1 * math.pi, 1.9 * math.pi), # left eye
    arc(66, 38, 7, 1.1 * math.pi, 1.9 * math.pi)  # right eye
  ],
  "cloud": [
    line(30, 68, 72, 68), # flat bottom
    arc(26, 56, 12, 0.5 * math.pi, 1.5 * math.pi),
    arc(48, 42, 16, 1.0 * math.pi, 2.0 * math.pi),
    arc(72, 54, 14, 1.5 * math.pi, 2.5 * math.pi)
  ],
  "rain": [
    [[25, 45], [35, 30], [55, 28], [68, 38], [78, 48], [65, 52], [28, 52], [25, 45]], # cloud
    line(30, 60, 26, 72), line(38, 68, 34, 80), line(48, 60, 44, 72), line(58, 68, 54, 80), line(68, 60, 64, 72)
  ],
  "boat": [
    [[18, 65], [82, 65], [72, 85], [28, 85], [18, 65]], # hull
    line(50, 65, 50, 20), # mast
    tri(50, 22, 76, 56, 50, 56), # main sail
    tri(48, 26, 30, 56, 48, 56), # jib sail
    [[15, 88], [30, 85], [45, 88], [60, 85], [75, 88], [90, 85]] # water waves
  ],
  "kite": [
    [[50, 16], [74, 44], [50, 76], [26, 44], [50, 16]], # diamond
    line(50, 16, 50, 76), line(26, 44, 74, 44), # spars
    [[50, 76], [56, 84], [48, 92], [54, 98]], # tail
    tri(52, 82, 60, 86, 56, 84), tri(46, 90, 52, 94, 48, 92) # ribbons
  ],
  "box": [
    rect(26, 44, 38, 38),
    [[26, 44], [42, 26], [80, 26], [64, 44]], # top
    [[64, 44], [80, 26], [80, 64], [64, 82]], # side
    line(45, 44, 45, 82), line(26, 63, 64, 63) # tape
  ],
  "drum": [
    ellipse(50, 34, 25, 8), # top
    line(25, 34, 25, 68), line(75, 34, 75, 68), ellipse(50, 68, 25, 8), # body
    [[25, 34], [37, 68], [50, 34], [63, 68], [75, 34]], # zigzag cords
    line(20, 20, 42, 34), line(80, 20, 58, 34) # drumsticks
  ],
  "bell": [
    circle(50, 20, 6), # loop
    [[44, 26], [40, 44], [26, 68], [74, 68], [60, 44], [56, 26]], # dome
    ellipse(50, 68, 24, 6), # rim
    circle(50, 76, 4) # clapper
  ],
  "ring": [
    circle(50, 58, 22), circle(50, 58, 17), # band
    tri(42, 36, 50, 24, 58, 36), # diamond top
    line(42, 36, 58, 36), line(50, 24, 50, 36), # facets
    line(38, 22, 34, 18), line(62, 22, 66, 18) # sparkles
  ],
  "coin": [
    circle(50, 50, 28), circle(50, 50, 23),
    line(50, 32, 50, 68), # vertical dollar line
    [[56, 38], [46, 42], [54, 52], [44, 58], [54, 62]] # dollar S curve
  ],
  "spoon": [
    ellipse(50, 36, 12, 18), # bowl
    rect(48, 54, 4, 32), # handle
    ellipse(50, 86, 4, 3) # tip
  ],
  "fork": [
    line(38, 22, 38, 44), line(46, 22, 46, 44), line(54, 22, 54, 44), line(62, 22, 62, 44), # tines
    [[38, 44], [50, 52], [62, 44]], # base
    rect(48, 52, 4, 34) # handle
  ],
  "plate": [
    ellipse(50, 50, 36, 18), # outer rim
    ellipse(50, 50, 24, 12), # inner depression
    arc(36, 46, 8, 0.7 * math.pi, 1.3 * math.pi) # shine
  ],
  "lamp": [
    [[34, 25], [66, 25], [74, 52], [26, 52], [34, 25]], # shade
    line(50, 52, 50, 82), # pole
    rect(34, 82, 32, 5), # base
    line(56, 52, 58, 62), circle(58, 64, 2) # pull chain
  ],
  "candle": [
    rect(42, 42, 16, 44), # wax body
    line(50, 42, 50, 34), # wick
    [[50, 16], [44, 28], [50, 34], [56, 28], [50, 16]], # flame
    circle(50, 27, 3), # flame core
    line(42, 48, 40, 56) # wax drip
  ],
  "pillow": [
    [[24, 34], [50, 30], [76, 34], [80, 50], [76, 66], [50, 70], [24, 66], [20, 50], [24, 34]], # cushion
    line(24, 34, 30, 40), line(76, 34, 70, 40), line(24, 66, 30, 60), line(76, 66, 70, 60), # corner tufts
    arc(50, 50, 8, 0, math.pi) # center crease
  ],
  "blanket": [
    rect(26, 40, 48, 12), rect(24, 52, 52, 14), rect(22, 66, 56, 14), # folded layers
    line(26, 80, 26, 86), line(38, 80, 38, 86), line(50, 80, 50, 86), line(62, 80, 62, 86), line(74, 80, 74, 86) # fringe
  ],
  "sock": [
    rect(34, 20, 22, 10), # cuff
    [[34, 30], [34, 56], [26, 68], [30, 78], [42, 80], [68, 74], [72, 62], [56, 56], [56, 30]], # body
    line(26, 68, 34, 66), line(60, 75, 64, 66) # heel & toe patches
  ],
  "shirt": [
    arc(50, 24, 8, 0, math.pi), # neck collar
    [[42, 24], [25, 30], [18, 46], [28, 50], [32, 44], [32, 82], [68, 82], [68, 44], [72, 50], [82, 46], [75, 30], [58, 24]], # torso & short sleeves
    line(32, 44, 25, 30), line(68, 44, 75, 30)
  ],
  "window": [
    rect(26, 24, 48, 52), # frame
    rect(22, 76, 56, 6), # sill ledge
    line(50, 24, 50, 76), line(26, 50, 74, 50), # cross panes
    line(32, 32, 36, 42), line(56, 58, 60, 68) # glass reflection
  ]
}

# ----------------------------------------------------------------------
# LEVEL 2: Food, Fruits & Pantry (50 Words)
# ----------------------------------------------------------------------
L2_STROKES = {
  "orange": [
    circle(50, 50, 26),
    line(50, 24, 50, 76), line(24, 50, 76, 50),
    line(32, 32, 68, 68), line(32, 68, 68, 32), # 8 citrus segments
    line(50, 24, 50, 16), [[50, 16], [58, 12], [54, 20]] # stem & leaf
  ],
  "grapes": [
    circle(50, 36, 7), circle(40, 46, 7), circle(60, 46, 7),
    circle(34, 58, 7), circle(50, 58, 7), circle(66, 58, 7),
    circle(42, 70, 7), circle(58, 70, 7), circle(50, 80, 7), # triangular cluster
    [[50, 30], [50, 16]], [[50, 20], [60, 14], [56, 22]] # stem & leaf
  ],
  "strawberry": [
    [[50, 26], [32, 34], [34, 62], [50, 84], [66, 62], [68, 34], [50, 26]], # berry
    tri(50, 26, 42, 18, 50, 26), tri(50, 26, 58, 18, 50, 26), line(50, 26, 50, 14), # cap leaves
    circle(44, 44, 1.5), circle(56, 44, 1.5), circle(50, 54, 1.5), circle(44, 64, 1.5), circle(56, 64, 1.5) # seeds
  ],
  "watermelon": [
    [[20, 65], [80, 65], [74, 78], [26, 78], [20, 65]], # green rind
    tri(20, 65, 50, 25, 80, 65), # red slice
    circle(40, 50, 2), circle(50, 44, 2), circle(60, 50, 2), circle(50, 56, 2), circle(45, 60, 2), circle(55, 60, 2) # black seeds
  ],
  "ice cream": [
    tri(50, 86, 34, 50, 66, 50), # waffle cone
    line(38, 56, 62, 80), line(44, 52, 58, 72), line(62, 56, 38, 80), # waffle grid
    circle(50, 38, 14), # scoop
    circle(50, 20, 4), line(50, 16, 56, 10) # cherry on top
  ],
  "cake": [
    rect(24, 52, 52, 28), # bottom tier
    rect(32, 34, 36, 18), # top tier
    line(40, 34, 40, 22), line(50, 34, 50, 22), line(60, 34, 60, 22), # 3 candles
    circle(40, 18, 2), circle(50, 18, 2), circle(60, 18, 2), # flames
    arc(38, 52, 6, 0, math.pi), arc(50, 52, 6, 0, math.pi), arc(62, 52, 6, 0, math.pi) # icing drips
  ],
  "cookie": [
    circle(50, 50, 26),
    circle(42, 40, 3), circle(58, 38, 3), circle(48, 50, 3), circle(38, 58, 3), circle(58, 58, 3), circle(50, 66, 2.5) # chocolate chips
  ],
  "pizza": [
    tri(50, 18, 24, 78, 76, 78), # slice
    [[22, 78], [50, 82], [78, 78]], # crust arc
    circle(48, 44, 4), circle(40, 62, 4), circle(58, 62, 4), circle(50, 72, 3.5), # pepperoni
    line(38, 52, 44, 56), line(56, 50, 60, 56) # cheese streaks
  ],
  "hamburger": [
    arc(50, 36, 24, math.pi, 2 * math.pi), line(26, 36, 74, 36), # top bun
    [[24, 40], [30, 44], [36, 40], [42, 44], [48, 40], [54, 44], [60, 40], [66, 44], [72, 40], [76, 44]], # wavy lettuce
    rect(24, 46, 52, 10), # patty
    [[30, 46], [42, 58], [54, 46]], # cheese drip
    rect(24, 60, 52, 12), # bottom bun
    line(36, 24, 38, 25), line(48, 20, 50, 21), line(60, 24, 62, 25) # sesame seeds
  ],
  "hot dog": [
    ellipse(50, 50, 34, 14), # bun
    ellipse(50, 50, 38, 8), # sausage
    [[24, 50], [30, 46], [38, 54], [46, 46], [54, 54], [62, 46], [70, 54], [76, 50]] # zigzag mustard
  ],
  "sandwich": [
    tri(24, 72, 76, 72, 76, 28), # bottom bread triangle
    tri(20, 68, 72, 68, 72, 24), # top bread triangle
    line(22, 70, 74, 70), line(74, 26, 74, 70), # filling layers
    [[34, 64], [46, 68], [58, 64]] # lettuce peek
  ],
  "cheese": [
    tri(24, 70, 78, 70, 62, 32), # wedge
    [[62, 32], [78, 38], [78, 70]], # 3D side
    circle(42, 58, 5), circle(56, 50, 6), circle(66, 60, 4), circle(48, 66, 3) # swiss holes
  ],
  "milk": [
    rect(34, 36, 32, 48), # carton body
    [[34, 36], [42, 20], [58, 20], [66, 36]], # gable top
    line(42, 20, 58, 20), line(50, 20, 50, 36), # fold
    rect(40, 50, 20, 20), line(44, 60, 56, 60) # label
  ],
  "juice": [
    rect(34, 36, 32, 48), # tumbler glass
    line(38, 50, 62, 50), # liquid level
    [[54, 50], [54, 16], [66, 10]], # drinking straw
    ellipse(40, 36, 8, 4) # lemon slice rim
  ],
  "candy": [
    ellipse(50, 50, 16, 12), # wrapper center
    tri(34, 50, 18, 38, 18, 62), # left twist
    tri(66, 50, 82, 38, 82, 62), # right twist
    line(44, 42, 56, 58), line(48, 40, 58, 52) # stripes
  ],
  "lollipop": [
    circle(50, 36, 18), # candy disc
    arc(50, 36, 12, 0, 1.8 * math.pi), arc(50, 36, 6, 0, 1.8 * math.pi), # spiral
    rect(48, 54, 4, 36) # stick
  ],
  "donut": [
    circle(50, 50, 26), circle(50, 50, 9), # ring
    arc(50, 50, 20, 0, 2 * math.pi), # icing border
    line(38, 36, 42, 38), line(58, 34, 62, 36), line(40, 62, 44, 60), line(56, 62, 60, 64) # sprinkles
  ],
  "popcorn": [
    [[34, 46], [66, 46], [60, 86], [40, 86], [34, 46]], # striped bucket
    line(42, 46, 46, 86), line(50, 46, 50, 86), line(58, 46, 54, 86), # vertical stripes
    circle(40, 38, 6), circle(50, 34, 7), circle(60, 38, 6), circle(44, 26, 6), circle(56, 26, 6) # fluffy kernels
  ],
  "pretzel": [
    circle(50, 50, 24), # outer outline
    [[32, 44], [44, 62], [50, 50], [56, 62], [68, 44]], # center knot
    circle(36, 48, 2), circle(64, 48, 2), circle(50, 62, 2) # salt flecks
  ],
  "pancake": [
    ellipse(50, 66, 28, 10), ellipse(50, 54, 28, 10), ellipse(50, 42, 28, 10), # 3 stacked cakes
    rect(46, 32, 8, 6), # butter pat
    [[48, 38], [48, 50], [52, 54]] # syrup drip
  ],
  "waffle": [
    rect(26, 26, 48, 48), # square waffle
    rect(32, 32, 10, 10), rect(46, 32, 10, 10), rect(60, 32, 10, 10),
    rect(32, 46, 10, 10), rect(46, 46, 10, 10), rect(60, 46, 10, 10),
    rect(32, 60, 10, 10), rect(46, 60, 10, 10), rect(60, 60, 10, 10) # 9 square pockets
  ],
  "bread": [
    ellipse(50, 48, 30, 18), # loaf
    [[32, 42], [36, 54]], [[44, 40], [48, 54]], [[56, 40], [60, 54]], [[68, 42], [72, 54]], # scoring cuts
    line(20, 52, 80, 52) # bottom crust line
  ],
  "butter": [
    rect(24, 46, 48, 22), # butter block
    [[24, 46], [34, 36], [82, 36], [72, 46]], # 3D top
    [[72, 46], [82, 36], [82, 58], [72, 68]], # 3D side
    rect(18, 68, 64, 4) # butter dish
  ],
  "honey": [
    [[36, 38], [64, 38], [70, 76], [30, 76], [36, 38]], # pot
    ellipse(50, 38, 14, 5), # rim
    circle(50, 58, 8), line(50, 54, 50, 62), # bee emblem
    [[66, 34], [78, 22]], circle(78, 22, 4) # honey dipper
  ],
  "carrot": [
    tri(36, 32, 64, 32, 50, 86), # conical root
    line(40, 44, 48, 44), line(52, 56, 58, 56), line(46, 68, 52, 68), # ridges
    [[50, 32], [42, 14]], [[50, 32], [50, 12]], [[50, 32], [58, 14]] # leafy greens
  ],
  "potato": [
    ellipse(50, 50, 28, 20),
    arc(38, 42, 3, 0, math.pi), arc(60, 44, 3, 0, math.pi), arc(46, 58, 3, 0, math.pi), arc(58, 56, 3, 0, math.pi) # potato eyes
  ],
  "tomato": [
    circle(50, 52, 24),
    star(50, 28, 8, 3, 5), # 5-point green calyx
    line(50, 28, 50, 20) # stem
  ],
  "corn": [
    ellipse(50, 52, 14, 30), # ear
    line(44, 36, 56, 36), line(42, 46, 58, 46), line(42, 56, 58, 56), line(44, 66, 56, 66), # kernel rows
    line(50, 24, 50, 78), # vertical divider
    [[36, 76], [30, 54], [40, 48]], [[64, 76], [70, 54], [60, 48]] # husks
  ],
  "pumpkin": [
    ellipse(50, 54, 28, 22),
    ellipse(50, 54, 18, 22), ellipse(50, 54, 8, 22), # ribbed lobes
    rect(48, 24, 5, 10), line(53, 24, 58, 22) # curled stem
  ],
  "onion": [
    [[50, 24], [68, 44], [68, 66], [50, 78], [32, 66], [32, 44], [50, 24]], # bulb
    line(50, 24, 50, 78), line(42, 34, 42, 74), line(58, 34, 58, 74), # skin layers
    line(46, 78, 44, 86), line(50, 78, 50, 88), line(54, 78, 56, 86) # root hairs
  ],
  "yogurt": [
    [[34, 40], [66, 40], [62, 80], [38, 80], [34, 40]], # cup
    ellipse(50, 40, 16, 5), # lid rim
    [[48, 38], [54, 18], [60, 16]], # spoon handle
    rect(40, 54, 20, 14) # brand box
  ],
  "lemon": [
    ellipse(50, 50, 26, 18),
    tri(24, 50, 20, 50, 24, 46), tri(76, 50, 80, 50, 76, 54), # pointed ends
    line(42, 48, 44, 48), line(54, 46, 56, 46), line(48, 54, 50, 54) # zest pores
  ],
  "lime": [
    circle(50, 50, 20),
    line(50, 30, 50, 70), line(30, 50, 70, 50),
    line(36, 36, 64, 64), line(36, 64, 64, 36) # citrus radial wedges
  ],
  "peach": [
    circle(50, 52, 22),
    [[50, 30], [50, 68]], # cleft groove
    line(50, 30, 50, 20), [[50, 20], [62, 16], [58, 26]] # leaf & stem
  ],
  "pear": [
    [[50, 26], [42, 36], [34, 54], [34, 72], [44, 82], [56, 82], [66, 72], [66, 54], [58, 36], [50, 26]], # teardrop pear
    [[50, 26], [48, 16], [54, 12]], # curved stem
    [[50, 18], [60, 16]] # leaf
  ],
  "plum": [
    circle(50, 52, 20),
    arc(48, 52, 14, 0.8 * math.pi, 1.4 * math.pi), # dimple indent
    line(50, 32, 50, 22), [[50, 22], [58, 20]] # stem
  ],
  "cherry": [
    circle(40, 62, 11), circle(64, 60, 11), # 2 round cherries
    [[40, 51], [50, 28]], [[64, 49], [50, 28]], # joined stems
    [[50, 28], [62, 24], [58, 34], [50, 28]] # connecting leaf
  ],
  "pineapple": [
    ellipse(50, 58, 18, 24), # pineapple fruit
    line(38, 44, 62, 68), line(34, 54, 64, 76), line(62, 44, 38, 68), line(66, 54, 36, 76), # diamond cross
    [[50, 34], [44, 16], [50, 24]], [[50, 34], [50, 12]], [[50, 34], [56, 16], [50, 24]] # spiky crown leaves
  ],
  "coconut": [
    circle(50, 50, 24), # coconut shell
    circle(44, 44, 3), circle(56, 44, 3), circle(50, 56, 3), # 3 germ eyes
    line(30, 36, 26, 32), line(70, 36, 74, 32), line(50, 74, 50, 80) # hairy fibers
  ],
  "avocado": [
    [[50, 24], [38, 38], [34, 62], [42, 78], [58, 78], [66, 62], [62, 38], [50, 24]], # outer pear skin
    circle(50, 60, 11), # large round pit
    circle(50, 60, 7) # pit highlight
  ],
  "broccoli": [
    rect(46, 56, 8, 26), # thick stalk
    circle(42, 46, 10), circle(58, 46, 10), circle(50, 34, 12), circle(36, 36, 8), circle(64, 36, 8), # floret cloud
    line(46, 62, 40, 54), line(54, 62, 60, 54) # branch stalks
  ],
  "celery": [
    line(42, 82, 40, 34), line(48, 84, 48, 28), line(54, 84, 54, 28), line(60, 82, 62, 34), # ribbed stalks
    [[40, 34], [32, 22]], [[48, 28], [48, 16]], [[62, 34], [70, 22]], # leaf branches
    rect(40, 82, 22, 4) # base root cut
  ],
  "cucumber": [
    [[28, 46], [72, 46], [76, 56], [72, 64], [28, 64], [24, 56], [28, 46]], # long body
    circle(38, 52, 1.5), circle(50, 58, 1.5), circle(62, 52, 1.5), circle(44, 58, 1.5), circle(56, 54, 1.5) # warts/bumps
  ],
  "lettuce": [
    circle(50, 54, 22), # outer round head
    [[34, 42], [42, 34], [50, 42], [58, 34], [66, 42]], # ruffled leaf edges
    arc(50, 56, 14, 0.2 * math.pi, 0.8 * math.pi),
    arc(50, 62, 8, 0.2 * math.pi, 0.8 * math.pi) # layered core
  ],
  "pepper": [
    [[36, 36], [42, 32], [50, 36], [58, 32], [64, 36], [66, 64], [58, 78], [50, 74], [42, 78], [34, 64], [36, 36]], # bell pepper lobes
    rect(48, 20, 5, 14), # stalk
    line(44, 38, 44, 72), line(56, 38, 56, 72) # vertical lobe lines
  ],
  "salt": [
    rect(36, 36, 28, 44), # shaker body
    ellipse(50, 36, 14, 5), # screw top
    line(44, 32, 44, 34), line(50, 31, 50, 33), line(56, 32, 56, 34), # dispensing holes
    [[46, 52], [54, 52], [54, 58], [46, 64], [54, 64]] # letter 'S'
  ],
  "sugar": [
    ellipse(50, 54, 24, 16), # sugar bowl
    [[32, 54], [32, 46], [68, 46], [68, 54]], # bowl rim
    arc(50, 46, 16, math.pi, 2 * math.pi), circle(50, 28, 3), # domed lid & handle
    line(58, 44, 72, 30), ellipse(72, 30, 4, 2) # sugar spoon
  ],
  "coffee": [
    rect(32, 42, 36, 36), # mug
    [[68, 48], [78, 54], [78, 66], [68, 72]], # mug handle
    ellipse(50, 78, 26, 6), # saucer
    [[42, 36], [44, 24], [40, 16]], [[52, 36], [54, 22], [50, 14]] # rising steam
  ],
  "tea": [
    ellipse(50, 58, 22, 14), # teacup
    [[72, 54], [80, 58], [80, 68], [72, 70]], # handle
    ellipse(50, 72, 28, 6), # saucer
    [[44, 54], [44, 42], [40, 44]], rect(38, 44, 6, 8) # tea bag tag dangling
  ],
  "soda": [
    rect(36, 30, 28, 52), # can
    ellipse(50, 30, 14, 4), ellipse(50, 82, 14, 4), # can rims
    circle(50, 30, 3), # pull tab
    circle(44, 48, 2), circle(54, 56, 2.5), circle(48, 64, 2) # fizz bubbles
  ]
}

# ----------------------------------------------------------------------
# LEVEL 3: Animals & Wildlife (50 Words)
# ----------------------------------------------------------------------
L3_STROKES = {
  "lion": [
    circle(50, 48, 24), # grand mane
    circle(50, 48, 14), # face
    tri(47, 48, 53, 48, 50, 54), # nose
    line(44, 42, 46, 42), line(54, 42, 56, 42), # eyes
    line(42, 54, 28, 52), line(58, 54, 72, 52), # whiskers
    circle(38, 32, 4), circle(62, 32, 4) # ears
  ],
  "tiger": [
    circle(50, 48, 16), # head
    tri(36, 36, 30, 24, 42, 30), tri(64, 36, 70, 24, 58, 30), # pointed ears
    line(42, 38, 48, 40), line(58, 38, 52, 40), # forehead stripes
    line(38, 48, 44, 48), line(62, 48, 56, 48), # cheek stripes
    tri(48, 52, 52, 52, 50, 56), # nose
    line(44, 56, 32, 56), line(56, 56, 68, 56) # whiskers
  ],
  "bear": [
    circle(50, 48, 18), # head
    circle(34, 34, 6), circle(66, 34, 6), # round ears
    ellipse(50, 54, 8, 6), circle(50, 52, 3), # snout & nose
    circle(42, 44, 2), circle(58, 44, 2) # eyes
  ],
  "elephant": [
    circle(52, 42, 18), # head
    arc(34, 42, 12, 0.4 * math.pi, 1.6 * math.pi), # giant left ear
    arc(70, 42, 12, 1.4 * math.pi, 2.6 * math.pi), # giant right ear
    [[48, 48], [46, 64], [52, 74], [60, 72], [58, 66], [50, 64]], # curved trunk
    [[42, 54], [36, 62]], [[58, 54], [64, 62]] # tusks
  ],
  "giraffe": [
    rect(45, 34, 10, 46), # tall neck
    ellipse(50, 28, 10, 7), # head
    line(46, 22, 45, 16), circle(45, 15, 2), # left ossicone (horn)
    line(54, 22, 55, 16), circle(55, 15, 2), # right ossicone
    rect(47, 42, 6, 6), rect(46, 56, 7, 7), rect(48, 68, 6, 6) # spots
  ],
  "zebra": [
    circle(50, 46, 16), # head
    tri(40, 32, 36, 20, 44, 26), tri(60, 32, 64, 20, 56, 26), # ears
    line(38, 42, 62, 42), line(36, 48, 64, 48), line(40, 54, 60, 54), # zebra stripes
    rect(46, 62, 8, 20) # striped neck
  ],
  "monkey": [
    circle(50, 46, 16), # face
    circle(30, 46, 7), circle(70, 46, 7), # big C-ears
    ellipse(50, 52, 10, 7), # muzzle
    circle(44, 42, 2), circle(56, 42, 2), # eyes
    [[62, 66], [74, 66], [82, 54], [78, 44]] # curled tail
  ],
  "kangaroo": [
    ellipse(50, 58, 16, 22), # body
    ellipse(50, 34, 8, 6), # head
    line(46, 28, 42, 14), line(52, 28, 54, 14), # tall ears
    arc(50, 62, 8, 0, math.pi), # pouch
    line(42, 78, 30, 84), line(56, 78, 68, 84), # large hind feet
    [[58, 70], [74, 76], [84, 82]] # heavy tail
  ],
  "panda": [
    circle(50, 48, 18), # head
    circle(34, 32, 6), circle(66, 32, 6), # black round ears
    ellipse(42, 46, 4, 6), ellipse(58, 46, 4, 6), # black eye patches
    circle(50, 54, 3) # nose
  ],
  "koala": [
    circle(50, 48, 16), # head
    circle(32, 38, 10), circle(68, 38, 10), # giant fuzzy ears
    ellipse(50, 52, 6, 9), # large dark nose
    circle(42, 44, 2), circle(58, 44, 2) # eyes
  ],
  "penguin": [
    ellipse(50, 52, 16, 24), # body
    ellipse(50, 54, 10, 18), # white tummy
    tri(47, 36, 53, 36, 50, 42), # beak
    circle(44, 34, 2), circle(56, 34, 2), # eyes
    [[34, 46], [24, 60], [34, 58]], [[66, 46], [76, 60], [66, 58]], # flippers
    line(42, 76, 36, 82), line(58, 76, 64, 82) # webbed feet
  ],
  "owl": [
    ellipse(50, 52, 18, 24), # body
    circle(42, 40, 7), circle(58, 40, 7), # giant circular eyes
    circle(42, 40, 3), circle(58, 40, 3), # pupils
    tri(48, 46, 52, 46, 50, 52), # beak
    tri(36, 32, 32, 20, 42, 28), tri(64, 32, 68, 20, 58, 28), # ear tufts
    line(26, 76, 74, 76) # branch perch
  ],
  "eagle": [
    circle(46, 44, 16), # feathered head
    [[58, 40], [76, 46], [68, 54], [58, 48]], # hooked sharp beak
    circle(50, 40, 3), # piercing eye
    [[38, 56], [30, 74], [46, 70]], # wing
    line(44, 72, 42, 82), line(48, 72, 50, 82) # talons
  ],
  "parrot": [
    ellipse(46, 50, 14, 22), # body
    [[54, 38], [68, 44], [62, 56], [54, 48]], # curved parrot beak
    circle(48, 38, 3), # eye
    [[42, 28], [44, 18], [48, 26]], # crest feathers
    [[42, 70], [38, 88], [44, 88]] # long tail feathers
  ],
  "duck": [
    circle(44, 38, 12), # head
    [[54, 38], [72, 38], [70, 46], [52, 44]], # flat duck bill
    circle(46, 34, 2), # eye
    [[32, 48], [24, 62], [42, 68], [64, 68], [68, 58], [48, 48]], # floating body
    [[24, 62], [16, 58]] # upturned tail
  ],
  "chicken": [
    ellipse(48, 54, 16, 18), # body
    tri(60, 44, 72, 48, 60, 52), # beak
    circle(54, 42, 2), # eye
    [[50, 36], [52, 26], [56, 34], [60, 28], [62, 36]], # red comb
    arc(62, 52, 3, 0, math.pi), # wattle
    line(44, 72, 40, 82), line(52, 72, 54, 82) # feet
  ],
  "rooster": [
    ellipse(46, 54, 16, 18), # body
    tri(58, 42, 72, 46, 58, 50), # beak
    [[48, 36], [50, 22], [54, 32], [58, 24], [62, 34]], # tall comb
    [[58, 50], [58, 60], [54, 56]], # long wattle
    [[32, 50], [16, 40], [22, 54], [14, 52], [28, 62]], # grand tail feathers
    line(44, 72, 42, 84), line(52, 72, 54, 84) # legs
  ],
  "pig": [
    circle(50, 50, 18), # face
    ellipse(50, 54, 9, 6), # snout
    circle(47, 54, 1.5), circle(53, 54, 1.5), # nostrils
    tri(36, 36, 30, 26, 42, 32), tri(64, 36, 70, 26, 58, 32), # floppy ears
    circle(42, 44, 2), circle(58, 44, 2), # eyes
    [[68, 56], [76, 52], [72, 60], [80, 58]] # corkscrew tail
  ],
  "cow": [
    ellipse(50, 46, 18, 14), # head
    ellipse(50, 58, 12, 7), # muzzle
    circle(46, 58, 1.5), circle(54, 58, 1.5), # nostrils
    [[34, 36], [24, 32], [32, 40]], [[66, 36], [76, 32], [68, 40]], # ears
    [[38, 34], [34, 22]], [[62, 34], [66, 22]], # horns
    rect(42, 40, 6, 6) # spot
  ],
  "horse": [
    [[38, 70], [38, 46], [48, 30], [64, 36], [56, 54], [64, 70]], # head profile
    tri(48, 30, 48, 18, 54, 26), # pointed ear
    circle(52, 38, 2), # eye
    circle(60, 58, 2), # nostril
    [[46, 32], [40, 36], [44, 46], [38, 50], [44, 60]] # flowing mane
  ],
  "sheep": [
    circle(50, 52, 22), # fluffy wool body
    arc(34, 44, 6, 0, 2 * math.pi), arc(66, 44, 6, 0, 2 * math.pi),
    arc(50, 32, 6, 0, 2 * math.pi), arc(36, 62, 6, 0, 2 * math.pi), arc(64, 62, 6, 0, 2 * math.pi), # puffs
    ellipse(50, 50, 10, 8), # face
    line(42, 74, 42, 84), line(58, 74, 58, 84) # legs
  ],
  "goat": [
    tri(40, 40, 60, 40, 50, 68), # triangular face
    [[42, 38], [34, 18], [28, 24]], [[58, 38], [66, 18], [72, 24]], # curved horns
    [[48, 68], [50, 78], [52, 68]], # chin beard
    circle(44, 44, 2), circle(56, 44, 2) # eyes
  ],
  "donkey": [
    ellipse(50, 50, 14, 18), # head
    rect(38, 14, 6, 24), rect(56, 14, 6, 24), # long upright donkey ears
    ellipse(50, 62, 10, 6), # muzzle
    circle(44, 46, 2), circle(56, 46, 2) # eyes
  ],
  "rabbit": [
    circle(50, 54, 16), # head
    ellipse(42, 24, 5, 18), ellipse(58, 24, 5, 18), # tall bunny ears
    circle(44, 50, 2), circle(56, 50, 2), # eyes
    tri(48, 56, 52, 56, 50, 60), # nose
    line(42, 58, 28, 56), line(58, 58, 72, 56) # whiskers
  ],
  "squirrel": [
    ellipse(44, 54, 12, 16), # body
    circle(44, 38, 8), # head
    [[52, 64], [68, 66], [76, 50], [70, 30], [58, 24]], # giant bushy curled tail
    circle(36, 50, 3) # holding acorn
  ],
  "mouse": [
    ellipse(50, 56, 16, 12), # body
    circle(40, 42, 8), circle(60, 42, 8), # big round mouse ears
    tri(48, 64, 52, 64, 50, 68), # pointed nose
    line(42, 66, 26, 64), line(58, 66, 74, 64), # whiskers
    [[34, 58], [20, 60], [14, 70]] # thin tail
  ],
  "rat": [
    [[30, 52], [62, 52], [76, 58], [62, 64], [30, 64], [30, 52]], # elongated body
    [[76, 58], [86, 60]], # pointed snout
    circle(68, 50, 5), # ear
    [[30, 60], [16, 64], [8, 60]] # long scaled tail
  ],
  "hamster": [
    circle(50, 50, 18), # chubby round body
    circle(38, 34, 4), circle(62, 34, 4), # tiny ears
    circle(42, 46, 2), circle(58, 46, 2), # eyes
    arc(38, 54, 6, 0.5 * math.pi, 1.5 * math.pi), arc(62, 54, 6, 1.5 * math.pi, 2.5 * math.pi), # chubby cheek pouches
    ellipse(50, 60, 4, 2) # seeds in paws
  ],
  "turtle": [
    circle(50, 50, 20), # domed shell
    line(36, 50, 64, 50), line(50, 36, 50, 64), # scute lines
    circle(50, 24, 7), # head
    line(34, 38, 24, 30), line(66, 38, 76, 30), # front flippers
    line(34, 62, 24, 70), line(66, 62, 76, 70) # hind flippers
  ],
  "frog": [
    circle(40, 38, 7), circle(60, 38, 7), # bulging eyes
    circle(40, 38, 3), circle(60, 38, 3), # pupils
    ellipse(50, 52, 22, 14), # head & body
    arc(50, 54, 12, 0.2 * math.pi, 0.8 * math.pi), # wide mouth
    [[30, 56], [22, 68], [32, 72]], [[70, 56], [78, 68], [68, 72]] # folded legs
  ],
  "snake": [
    [[20, 75], [35, 60], [50, 75], [65, 60], [78, 70], [80, 50], [74, 40], [60, 40], [56, 32], [64, 26], [74, 28]], # coiling body
    circle(64, 26, 2), # eye
    [[74, 28], [84, 26], [88, 22]], [[84, 26], [88, 30]] # forked tongue
  ],
  "lizard": [
    [[50, 20], [52, 34], [48, 52], [54, 68], [50, 84]], # spine
    circle(50, 20, 5), # head
    line(46, 34, 32, 28), line(54, 34, 68, 28), # front legs
    line(46, 54, 32, 60), line(54, 54, 68, 60) # hind legs
  ],
  "crocodile": [
    [[20, 50], [80, 50], [76, 44], [30, 44], [20, 50]], # long snout
    line(30, 44, 32, 38), circle(32, 38, 3), # eye ridge
    [[35, 50], [40, 47], [45, 50], [50, 47], [55, 50], [60, 47], [65, 50]], # jagged interlocking teeth
    [[40, 44], [50, 40], [60, 44], [70, 40]] # armored back scutes
  ],
  "alligator": [
    [[22, 52], [78, 52], [74, 42], [32, 42], [22, 52]], # wide snout
    circle(34, 40, 4), # eye bump
    line(28, 52, 72, 52), # jawline
    [[36, 42], [44, 36], [52, 42], [60, 36], [68, 42]] # armored ridges
  ],
  "shark": [
    [[20, 50], [45, 36], [75, 42], [84, 50], [75, 58], [45, 64], [20, 50]], # torpedo body
    tri(45, 36, 55, 16, 62, 38), # dorsal fin
    [[84, 50], [94, 36], [88, 50], [94, 64], [84, 50]], # tail fin
    line(35, 46, 35, 54), line(38, 46, 38, 54) # gill slits
  ],
  "whale": [
    [[18, 54], [40, 36], [72, 38], [80, 50], [72, 62], [38, 64], [18, 54]], # huge body
    [[80, 50], [92, 40], [86, 50], [92, 60], [80, 50]], # flukes
    [[46, 36], [46, 20], [40, 14]], [[46, 20], [52, 14]] # spouting water fountain
  ],
  "dolphin": [
    arc(50, 60, 36, 1.1 * math.pi, 1.9 * math.pi), # leaping body arc
    tri(48, 30, 56, 16, 58, 32), # dorsal fin
    [[78, 46], [88, 40], [84, 46], [88, 52], [78, 46]], # fluke
    [[24, 44], [16, 42]] # snout beak
  ],
  "octopus": [
    ellipse(50, 36, 16, 18), # bulbous head
    circle(44, 40, 2.5), circle(56, 40, 2.5), # eyes
    [[36, 52], [24, 64], [18, 78]], [[42, 52], [34, 68], [30, 84]],
    [[48, 52], [46, 70], [44, 86]], [[54, 52], [54, 70], [56, 86]],
    [[60, 52], [66, 68], [70, 84]], [[66, 52], [76, 64], [82, 78]] # 6+ curling tentacles
  ],
  "crab": [
    ellipse(50, 52, 18, 12), # shell
    circle(42, 42, 2.5), circle(58, 42, 2.5), # stalk eyes
    [[34, 48], [22, 36], [16, 42]], circle(18, 38, 4), # left claw pincer
    [[66, 48], [78, 36], [84, 42]], circle(82, 38, 4), # right claw pincer
    line(36, 58, 24, 68), line(64, 58, 76, 68) # walking legs
  ],
  "lobster": [
    ellipse(50, 48, 10, 16), # carapace
    [[50, 64], [50, 82], [44, 88], [56, 88]], # segmented tail
    [[42, 42], [28, 28], [20, 34]], circle(22, 30, 6), # left crusher claw
    [[58, 42], [72, 28], [80, 34]], circle(78, 30, 6), # right claw
    line(46, 32, 34, 18), line(54, 32, 66, 18) # antennae
  ],
  "shrimp": [
    arc(50, 50, 20, 0.8 * math.pi, 2.0 * math.pi), # curved body
    line(44, 36, 46, 42), line(52, 34, 54, 40), line(60, 38, 62, 44), # segment lines
    tri(68, 56, 78, 54, 74, 62), # fan tail
    [[34, 58], [24, 64], [16, 60]] # long antennae
  ],
  "jellyfish": [
    arc(50, 40, 22, math.pi, 2 * math.pi), line(28, 40, 72, 40), # umbrella bell
    [[34, 42], [32, 60], [36, 78]], [[44, 42], [46, 62], [42, 82]],
    [[56, 42], [54, 62], [58, 82]], [[66, 42], [68, 60], [64, 78]] # trailing wavy tentacles
  ],
  "seahorse": [
    [[50, 24], [58, 28], [54, 38], [46, 46], [48, 62], [44, 76], [48, 84], [54, 82], [52, 76]], # curved S-body & curled tail
    [[58, 28], [68, 28]], # snout
    circle(54, 28, 2), # eye
    [[46, 34], [40, 36], [46, 40]], # back fin
    line(48, 50, 54, 50), line(48, 56, 54, 56) # belly segments
  ],
  "starfish": [
    star(50, 50, 32, 12, 5), # 5 arms
    circle(50, 50, 4),
    circle(50, 30, 2), circle(64, 45, 2), circle(58, 66, 2), circle(42, 66, 2), circle(36, 45, 2) # suckers
  ],
  "spider": [
    circle(50, 44, 6), ellipse(50, 58, 10, 14), # head & abdomen
    line(44, 46, 24, 34), line(56, 46, 76, 34), # leg pair 1
    line(44, 48, 20, 46), line(56, 48, 80, 46), # leg pair 2
    line(44, 52, 22, 60), line(56, 52, 78, 60), # leg pair 3
    line(44, 56, 26, 74), line(56, 56, 74, 74), # leg pair 4
    line(50, 20, 50, 38) # silk thread
  ],
  "ant": [
    circle(36, 50, 5), ellipse(48, 50, 5, 4), ellipse(64, 50, 9, 6), # head, thorax, abdomen
    line(34, 46, 26, 38), line(34, 54, 26, 62), # antennae
    line(48, 46, 42, 34), line(50, 46, 58, 34), # legs top
    line(48, 54, 42, 66), line(50, 54, 58, 66) # legs bottom
  ],
  "bee": [
    ellipse(50, 52, 16, 12), # striped body
    line(44, 42, 44, 62), line(52, 42, 52, 62), line(60, 42, 60, 62), # stripes
    ellipse(46, 34, 8, 12), ellipse(54, 34, 8, 12), # wings
    tri(66, 52, 74, 52, 66, 50), # stinger
    line(38, 46, 30, 38) # antenna
  ],
  "butterfly": [
    line(50, 24, 50, 76), # body
    [[50, 36], [22, 22], [18, 48], [50, 54]], # upper left wing
    [[50, 36], [78, 22], [82, 48], [50, 54]], # upper right wing
    [[50, 54], [28, 74], [50, 66]], # lower left wing
    [[50, 54], [72, 74], [50, 66]], # lower right wing
    line(50, 24, 40, 16), line(50, 24, 60, 16) # antennae
  ],
  "ladybug": [
    circle(50, 52, 20), # round shell
    line(50, 32, 50, 72), # center split
    circle(50, 28, 6), # head
    circle(42, 42, 3), circle(58, 42, 3), circle(40, 58, 3), circle(60, 58, 3) # spots
  ],
  "worm": [
    [[18, 54], [28, 44], [40, 56], [54, 42], [68, 56], [82, 46]], # wavy body
    circle(82, 46, 2), # head
    line(46, 46, 48, 52) # clitellum band
  ]
}

# ----------------------------------------------------------------------
# LEVEL 4: Clothing, Weather & Nature (50 Words)
# ----------------------------------------------------------------------
L4_STROKES = {
  "pants": [
    rect(32, 20, 36, 10), # waistband
    [[32, 30], [28, 84], [44, 84], [50, 46], [56, 84], [72, 84], [68, 30]], # legs & crotch
    line(50, 20, 50, 42) # fly
  ],
  "dress": [
    [[42, 20], [50, 26], [58, 20]], # neckline
    [[42, 20], [36, 36], [64, 36], [58, 20]], # bodice
    [[36, 36], [20, 84], [80, 84], [64, 36]], # flared skirt
    line(36, 36, 64, 36) # waistline
  ],
  "jacket": [
    rect(32, 24, 36, 56), # body
    line(50, 24, 50, 80), # zipper
    [[32, 24], [18, 40], [22, 72], [32, 66]], # left sleeve
    [[68, 24], [82, 40], [78, 72], [68, 66]], # right sleeve
    tri(36, 24, 44, 36, 44, 24), tri(64, 24, 56, 36, 56, 24) # lapels
  ],
  "coat": [
    rect(30, 22, 40, 64), # long overcoat
    line(50, 22, 50, 86), # front closure
    circle(46, 40, 2), circle(46, 52, 2), circle(46, 64, 2), # buttons
    [[30, 22], [42, 34]], [[70, 22], [58, 34]] # large coat collar
  ],
  "sweater": [
    rect(32, 26, 36, 54), # knit torso
    rect(38, 20, 24, 6), # turtleneck collar
    line(18, 42, 32, 30), line(82, 42, 68, 30), # sleeves
    line(32, 74, 68, 74), line(32, 77, 68, 77) # ribbed hem
  ],
  "shorts": [
    rect(32, 26, 36, 8), # waistband
    [[32, 34], [28, 62], [46, 62], [50, 44], [54, 62], [72, 62], [68, 34]], # short legs
    line(50, 26, 50, 40) # seam
  ],
  "skirt": [
    rect(36, 26, 28, 8), # waistband
    [[36, 34], [22, 76], [78, 76], [64, 34]], # A-line skirt
    line(38, 34, 34, 76), line(50, 34, 50, 76), line(62, 34, 66, 76) # pleats
  ],
  "tie": [
    tri(46, 18, 54, 18, 50, 24), # knot
    [[48, 24], [44, 70], [50, 82], [56, 70], [52, 24]], # tie blade
    line(46, 42, 52, 36), line(45, 54, 53, 48) # diagonal stripes
  ],
  "scarf": [
    ellipse(50, 32, 20, 8), # neck loop
    rect(42, 38, 10, 44), # hanging end 1
    rect(54, 38, 8, 36), # hanging end 2
    line(42, 82, 52, 82), line(54, 74, 62, 74) # fringe
  ],
  "gloves": [
    [[34, 78], [34, 50], [24, 46], [22, 38], [32, 36], [36, 44], [36, 24], [42, 24], [42, 42], [44, 20], [50, 20], [50, 42], [52, 24], [58, 24], [58, 44], [60, 32], [66, 32], [66, 52], [62, 78]],
    line(34, 72, 62, 72) # wrist cuff
  ],
  "boots": [
    rect(34, 22, 18, 38), # tall boot shaft
    [[34, 60], [22, 74], [22, 80], [64, 80], [64, 74], [52, 60]], # foot
    rect(54, 80, 10, 6) # boot heel
  ],
  "sandals": [
    ellipse(50, 60, 24, 10), # sole
    arc(50, 56, 16, math.pi, 2 * math.pi), # front strap
    arc(50, 64, 14, math.pi, 2 * math.pi) # heel strap
  ],
  "glasses": [
    circle(36, 50, 12), circle(64, 50, 12), # round frames
    line(48, 50, 52, 50), # bridge
    line(24, 50, 16, 44), line(76, 50, 84, 44) # temples
  ],
  "sunglasses": [
    rect(24, 42, 22, 16), rect(54, 42, 22, 16), # dark lenses
    line(46, 48, 54, 48), # bridge
    line(24, 44, 16, 40), line(76, 44, 84, 40), # sides
    line(28, 46, 42, 54), line(58, 46, 72, 54) # glare
  ],
  "watch": [
    circle(50, 50, 16), # watch face
    rect(44, 14, 12, 20), rect(44, 66, 12, 20), # straps
    line(50, 50, 50, 40), line(50, 50, 58, 50) # clock hands
  ],
  "bracelet": [
    ellipse(50, 50, 26, 16), ellipse(50, 50, 22, 12), # bangle
    circle(50, 36, 4), circle(68, 50, 4), circle(50, 64, 4), circle(32, 50, 4) # inset gems
  ],
  "necklace": [
    arc(50, 34, 24, 0.1 * math.pi, 0.9 * math.pi), # chain loop
    circle(50, 62, 7), # pendant locket
    star(50, 62, 5, 2, 4) # sparkle
  ],
  "earrings": [
    circle(38, 36, 3), [[38, 39], [38, 54]], tri(34, 54, 42, 54, 38, 66), # left dangle
    circle(62, 36, 3), [[62, 39], [62, 54]], tri(58, 54, 66, 54, 62, 66)  # right dangle
  ],
  "backpack": [
    rect(32, 30, 36, 48), # pack
    arc(50, 30, 18, math.pi, 2 * math.pi), # top arch
    rect(38, 54, 24, 18), # front pocket
    line(32, 36, 24, 58), line(68, 36, 76, 58) # shoulder straps
  ],
  "purse": [
    rect(30, 42, 40, 36), # handbag body
    arc(50, 42, 16, math.pi, 2 * math.pi), # handle
    tri(46, 42, 54, 42, 50, 50), # clasp
    line(30, 52, 70, 52) # seam
  ],
  "wallet": [
    rect(26, 36, 48, 32), # folded leather
    line(26, 52, 74, 52), # bill fold
    rect(56, 46, 14, 12), circle(60, 52, 2) # snap strap
  ],
  "umbrella": [
    arc(50, 46, 28, math.pi, 2 * math.pi), line(22, 46, 78, 46), # canopy
    line(50, 18, 50, 14), # top tip
    line(50, 46, 50, 78), # shaft
    [[50, 78], [44, 84], [44, 90], [50, 90]] # J-hook handle
  ],
  "toothbrush": [
    rect(20, 48, 50, 6), # handle
    rect(68, 44, 16, 14), # bristle head
    line(72, 44, 72, 38), line(76, 44, 76, 38), line(80, 44, 80, 38) # bristle tufts
  ],
  "toothpaste": [
    [[24, 44], [64, 40], [68, 54], [24, 60], [24, 44]], # tube
    rect(68, 44, 8, 8), # cap
    [[76, 48], [82, 46], [86, 50]] # paste swirl
  ],
  "soap": [
    rect(30, 40, 40, 24), # bar
    arc(50, 52, 8, 0, math.pi), # engraved mark
    circle(68, 32, 4), circle(74, 26, 3), circle(64, 24, 2) # soap bubbles
  ],
  "towel": [
    rect(34, 24, 32, 56), # hanging towel
    line(30, 24, 70, 24), # towel bar
    line(34, 72, 66, 72), line(34, 76, 66, 76) # decorative border bands
  ],
  "comb": [
    rect(24, 38, 52, 10), # spine
    line(26, 48, 26, 64), line(32, 48, 32, 64), line(38, 48, 38, 64),
    line(44, 48, 44, 64), line(50, 48, 50, 64), line(56, 48, 56, 64),
    line(62, 48, 62, 64), line(68, 48, 68, 64), line(74, 48, 74, 64) # teeth
  ],
  "brush": [
    rect(30, 36, 24, 34), # brush head
    rect(38, 70, 8, 20), # handle
    circle(36, 44, 2), circle(44, 44, 2), circle(48, 44, 2),
    circle(36, 56, 2), circle(44, 56, 2), circle(48, 56, 2) # bristle pins
  ],
  "mirror": [
    ellipse(50, 44, 18, 24), ellipse(50, 44, 14, 20), # oval glass & frame
    rect(48, 68, 4, 22), # hand mirror handle
    line(42, 36, 48, 52) # glass gleam
  ],
  "snow": [
    circle(50, 72, 20), circle(50, 44, 14), # snow bank
    circle(30, 26, 3), circle(50, 20, 3), circle(70, 26, 3), circle(40, 36, 3), circle(60, 36, 3) # falling snowflakes
  ],
  "snowflake": [
    line(50, 16, 50, 84), line(16, 50, 84, 50), # cross
    line(26, 26, 74, 74), line(26, 74, 74, 26), # diagonals
    line(46, 24, 50, 20), line(54, 24, 50, 20), # v-tips
    line(46, 76, 50, 80), line(54, 76, 50, 80)
  ],
  "snowman": [
    circle(50, 72, 18), circle(50, 46, 13), circle(50, 26, 8), # 3 snowballs
    rect(44, 10, 12, 8), line(40, 18, 60, 18), # top hat
    tri(50, 26, 62, 28, 50, 30), # carrot nose
    circle(50, 42, 2), circle(50, 48, 2) # coal buttons
  ],
  "rainbow": [
    arc(50, 75, 34, math.pi, 2 * math.pi),
    arc(50, 75, 28, math.pi, 2 * math.pi),
    arc(50, 75, 22, math.pi, 2 * math.pi),
    arc(50, 75, 16, math.pi, 2 * math.pi) # concentric rainbow bands
  ],
  "lightning": [
    [[56, 14], [38, 46], [54, 46], [42, 86], [66, 42], [50, 42], [56, 14]], # primary jagged bolt
    [[46, 50], [36, 62], [42, 66]] # branch bolt fork
  ],
  "thunder": [
    [[24, 38], [34, 26], [54, 24], [68, 34], [78, 44], [66, 48], [26, 48], [24, 38]], # dark cloud
    [[48, 48], [42, 64], [52, 64], [44, 82], [58, 60], [50, 60], [54, 48]] # bolt bursting out
  ],
  "wind": [
    [[16, 38], [64, 38], [74, 32], [70, 24], [62, 28]], # breeze curl 1
    [[24, 50], [72, 50], [82, 44], [78, 36], [70, 40]], # breeze curl 2
    [[18, 62], [58, 62], [66, 56], [62, 50]] # breeze curl 3
  ],
  "fog": [
    line(20, 36, 80, 36), line(16, 44, 84, 44),
    line(24, 52, 76, 52), line(18, 60, 82, 60), line(26, 68, 74, 68) # horizontal mist lines
  ],
  "ice": [
    [[34, 34], [62, 28], [72, 52], [44, 58], [34, 34]], # ice cube
    [[34, 34], [34, 62], [44, 76], [44, 58]], # front
    [[44, 76], [72, 70], [72, 52]], # side
    line(48, 42, 58, 48) # crack
  ],
  "puddle": [
    ellipse(50, 60, 32, 14), # water puddle
    circle(50, 60, 8), circle(50, 60, 16), # ripples
    line(42, 28, 42, 40), line(58, 20, 58, 34) # raindrops hitting
  ],
  "leaf": [
    [[50, 16], [32, 44], [50, 84]], [[50, 16], [68, 44], [50, 84]], # leaf lobes
    line(50, 16, 50, 88), # center vein
    line(50, 40, 38, 34), line(50, 52, 40, 48), line(50, 40, 62, 34), line(50, 52, 60, 48) # side veins
  ],
  "branch": [
    line(20, 78, 78, 28), # main branch
    line(42, 58, 60, 52), # fork 1
    line(56, 46, 70, 42), # fork 2
    [[58, 50], [64, 48]], [[68, 40], [74, 38]] # buds
  ],
  "root": [
    line(20, 30, 80, 30), # ground line
    [[50, 30], [46, 54], [34, 74], [28, 86]], # main taproot
    line(46, 54, 60, 72), line(50, 64, 54, 82), line(40, 44, 28, 58) # lateral root fibers
  ],
  "seed": [
    ellipse(50, 56, 12, 18), # seed kernel
    line(50, 38, 50, 26), # sprout
    [[50, 26], [42, 20]], [[50, 26], [58, 20]] # twin cotyledon leaves
  ],
  "acorn": [
    rect(36, 32, 28, 12), # cupule cap
    [[38, 44], [38, 64], [50, 78], [62, 64], [62, 44]], # smooth nut
    line(50, 32, 50, 20) # stem
  ],
  "pinecone": [
    ellipse(50, 52, 16, 24), # cone body
    line(38, 40, 62, 40), line(34, 50, 66, 50), line(36, 60, 64, 60), # scale rows
    line(50, 30, 50, 22) # top stem
  ],
  "cactus": [
    rect(44, 28, 12, 54), # main trunk
    [[44, 48], [30, 48], [30, 34]], # left arm
    [[56, 54], [70, 54], [70, 40]], # right arm
    line(42, 34, 38, 34), line(58, 38, 62, 38), line(42, 64, 38, 64), line(58, 68, 62, 68) # prickle spines
  ],
  "mushroom": [
    arc(50, 44, 24, math.pi, 2 * math.pi), line(26, 44, 74, 44), # domed cap
    rect(44, 44, 12, 36), # stalk
    circle(38, 32, 3), circle(50, 26, 4), circle(62, 32, 3) # cap spots
  ],
  "vine": [
    [[30, 84], [44, 68], [36, 50], [54, 36], [46, 20]], # twisting stem
    [[40, 64], [50, 60]], [[38, 48], [26, 44]], [[50, 34], [60, 30]] # leaf nodes
  ],
  "moss": [
    line(20, 68, 80, 68), # rock edge
    arc(32, 68, 6, math.pi, 2 * math.pi), arc(44, 68, 8, math.pi, 2 * math.pi),
    arc(58, 68, 7, math.pi, 2 * math.pi), arc(70, 68, 6, math.pi, 2 * math.pi) # soft velvety cushions
  ],
  "pebble": [
    ellipse(50, 60, 22, 14), # smooth stone
    arc(42, 54, 6, 0.8 * math.pi, 1.4 * math.pi) # smooth polish shine
  ]
}

# ----------------------------------------------------------------------
# LEVEL 5: Toys, Classroom & Home (50 Words)
# ----------------------------------------------------------------------
L5_STROKES = {
  "teddy bear": [
    circle(50, 40, 14), # head
    circle(38, 28, 5), circle(62, 28, 5), # ears
    ellipse(50, 44, 6, 4), circle(50, 43, 2), # muzzle & nose
    ellipse(50, 64, 16, 18), # body
    circle(36, 68, 5), circle(64, 68, 5) # paws
  ],
  "doll": [
    circle(50, 28, 10), # head
    [[40, 24], [50, 18], [60, 24]], # hair
    tri(50, 38, 34, 72, 66, 72), # dress
    line(44, 72, 44, 86), line(56, 72, 56, 86) # legs
  ],
  "blocks": [
    rect(24, 52, 22, 22), rect(50, 52, 22, 22), rect(37, 28, 22, 22), # 3 stacked ABC toy blocks
    [[34, 44], [34, 34], [42, 34]], # letter A
    [[32, 66], [32, 58], [40, 58]]  # letter B
  ],
  "puzzle": [
    rect(28, 28, 44, 44), # square puzzle piece
    circle(50, 28, 4), circle(72, 50, 4), # puzzle tabs
    circle(50, 72, 4), circle(28, 50, 4)  # puzzle blanks
  ],
  "crayon": [
    rect(26, 44, 42, 12), # wrapper
    tri(68, 44, 82, 50, 68, 56), # pointed wax tip
    line(34, 44, 34, 56), line(60, 44, 60, 56) # stripes
  ],
  "marker": [
    rect(26, 44, 40, 14), # barrel
    rect(66, 44, 12, 14), # cap
    tri(26, 46, 16, 51, 26, 56) # chisel tip
  ],
  "pencil": [
    rect(24, 46, 46, 8), # wood body
    tri(70, 46, 82, 50, 70, 54), # sharpened tip
    rect(18, 46, 6, 8), # pink eraser
    line(24, 46, 24, 54) # ferrule
  ],
  "pen": [
    rect(24, 47, 48, 6), # pen barrel
    tri(72, 47, 80, 50, 72, 53), # ballpoint
    rect(18, 46, 6, 8), line(22, 46, 22, 40) # clicker & clip
  ],
  "eraser": [
    [[24, 54], [52, 34], [76, 50], [48, 70], [24, 54]], # wedge eraser
    line(50, 44, 40, 60) # color split
  ],
  "ruler": [
    rect(18, 42, 64, 16), # ruler body
    line(26, 42, 26, 48), line(34, 42, 34, 52), line(42, 42, 42, 48),
    line(50, 42, 50, 52), line(58, 42, 58, 48), line(66, 42, 66, 52), line(74, 42, 74, 48) # inch ticks
  ],
  "scissors": [
    circle(36, 74, 8), circle(64, 74, 8), # finger loops
    line(36, 68, 62, 26), line(64, 68, 38, 26), # crossed steel blades
    circle(50, 47, 2) # pivot screw
  ],
  "glue": [
    rect(36, 36, 28, 44), # bottle
    tri(44, 36, 56, 36, 50, 22), # nozzle tip
    rect(42, 50, 16, 18) # label
  ],
  "tape": [
    circle(50, 50, 22), circle(50, 50, 12), # roll
    [[68, 40], [80, 40], [80, 54]] # pulled tape strip
  ],
  "notebook": [
    rect(30, 22, 44, 56), # cover
    line(30, 28, 24, 28), line(30, 38, 24, 38), line(30, 48, 24, 48),
    line(30, 58, 24, 58), line(30, 68, 24, 68), # spiral wire rings
    rect(40, 36, 24, 16) # label box
  ],
  "chalk": [
    rect(30, 44, 38, 10), # chalk stick
    arc(68, 49, 5, -0.5 * math.pi, 0.5 * math.pi), # rounded chalk tip
    line(76, 46, 82, 42), line(76, 52, 82, 56) # chalk dust
  ],
  "desk": [
    rect(24, 36, 52, 8), # tabletop
    line(28, 44, 28, 80), line(48, 44, 48, 80), # leg left
    rect(52, 44, 20, 36), line(52, 56, 72, 56), line(52, 68, 72, 68) # drawer pedestal
  ],
  "blackboard": [
    rect(18, 24, 64, 42), # board frame
    rect(22, 28, 56, 34), # slate surface
    rect(24, 66, 52, 3), # chalk tray
    [[32, 42], [42, 42], [42, 52]], line(32, 47, 40, 47) # math / ABC writing
  ],
  "globe": [
    circle(50, 44, 18), # sphere
    arc(50, 44, 22, 0.4 * math.pi, 1.6 * math.pi), # meridian ring
    line(50, 66, 50, 82), rect(40, 82, 20, 4), # stand & base
    [[42, 40], [48, 36], [54, 44], [48, 52]] # continent
  ],
  "sofa": [
    rect(20, 36, 60, 24), # backrest
    rect(16, 46, 12, 22), rect(72, 46, 12, 22), # armrests
    rect(24, 54, 52, 18), # cushions
    line(24, 72, 24, 82), line(76, 72, 76, 82) # sofa feet
  ],
  "armchair": [
    rect(28, 30, 44, 26), # high back
    rect(22, 46, 10, 24), rect(68, 46, 10, 24), # plush arms
    rect(30, 54, 40, 18), # seat
    line(30, 72, 30, 82), line(70, 72, 70, 82) # legs
  ],
  "coffee table": [
    ellipse(50, 48, 30, 12), # oval top
    line(30, 56, 28, 78), line(70, 56, 72, 78), line(50, 58, 50, 82) # 3 splayed legs
  ],
  "bookshelf": [
    rect(28, 20, 44, 64), # case
    line(28, 36, 72, 36), line(28, 52, 72, 52), line(28, 68, 72, 68), # 3 shelves
    rect(32, 22, 6, 14), rect(40, 22, 5, 14), rect(58, 38, 8, 14), rect(34, 54, 6, 14) # books
  ],
  "dresser": [
    rect(30, 26, 40, 54), # dresser chest
    line(30, 42, 70, 42), line(30, 58, 70, 58), # 3 drawer dividers
    circle(46, 34, 2), circle(54, 34, 2), # knobs 1
    circle(46, 50, 2), circle(54, 50, 2), # knobs 2
    circle(46, 66, 2), circle(54, 66, 2)  # knobs 3
  ],
  "closet": [
    rect(28, 20, 44, 64), # wardrobe
    line(50, 20, 50, 84), # 2 doors
    circle(46, 52, 2), circle(54, 52, 2), # door handles
    line(28, 26, 72, 26) # cornice
  ],
  "curtains": [
    line(20, 20, 80, 20), # curtain rod
    circle(18, 20, 3), circle(82, 20, 3), # finials
    [[24, 20], [24, 80], [38, 76], [32, 20]], # left draped curtain
    [[76, 20], [76, 80], [62, 76], [68, 20]], # right curtain
    rect(36, 28, 28, 44) # window reveal
  ],
  "rug": [
    ellipse(50, 56, 34, 18), ellipse(50, 56, 28, 14), # oval rug borders
    star(50, 56, 10, 4, 6) # center medallion
  ],
  "fireplace": [
    rect(24, 24, 52, 58), # brick mantle
    rect(34, 46, 32, 36), # hearth opening
    tri(46, 76, 50, 56, 54, 76), # fire flame
    line(20, 24, 80, 24) # mantle shelf
  ],
  "stairs": [
    [[24, 78], [36, 78], [36, 64], [48, 64], [48, 50], [60, 50], [60, 36], [72, 36], [72, 24]], # step profile
    line(24, 78, 24, 84), line(72, 24, 78, 24)
  ],
  "elevator": [
    rect(30, 22, 40, 62), # shaft frame
    line(50, 22, 50, 84), # sliding doors
    tri(48, 16, 52, 16, 50, 10), tri(48, 18, 52, 18, 50, 22) # up/down indicator arrows
  ],
  "skylight": [
    [[30, 34], [70, 34], [82, 60], [18, 60], [30, 34]], # roof window frame
    line(50, 34, 50, 60), line(24, 47, 76, 47), # glass panes
    line(42, 40, 46, 52) # sunbeam
  ],
  "roof": [
    tri(16, 58, 50, 24, 84, 58), # pitched roof triangle
    rect(62, 26, 8, 18), # chimney
    line(26, 50, 74, 50), line(36, 42, 64, 42) # shingles
  ],
  "chimney": [
    rect(36, 34, 28, 48), # brick stack
    rect(32, 30, 36, 6), # chimney cap
    arc(50, 24, 6, 0, math.pi), arc(54, 16, 8, math.pi, 2 * math.pi) # smoke puffs
  ],
  "fence": [
    line(16, 44, 84, 44), line(16, 66, 84, 66), # horizontal rails
    tri(24, 40, 28, 30, 32, 40), line(28, 40, 28, 80), # picket 1
    tri(40, 40, 44, 30, 48, 40), line(44, 40, 44, 80), # picket 2
    tri(56, 40, 60, 30, 64, 40), line(60, 40, 60, 80), # picket 3
    tri(72, 40, 76, 30, 80, 40), line(76, 40, 76, 80)  # picket 4
  ],
  "gate": [
    rect(26, 30, 48, 50), # gate frame
    line(26, 30, 74, 80), line(74, 30, 26, 80), # cross braces
    circle(68, 54, 3) # latch
  ],
  "mailbox": [
    rect(34, 30, 32, 24), # box
    arc(50, 30, 16, math.pi, 2 * math.pi), # rounded top
    rect(46, 54, 8, 34), # wooden post
    line(66, 40, 76, 32) # red flag raised
  ],
  "driveway": [
    [[38, 28], [62, 28], [78, 84], [22, 84], [38, 28]], # perspective driveway
    line(50, 34, 50, 42), line(50, 50, 50, 62), line(50, 70, 50, 84) # center dashed line
  ],
  "garage": [
    rect(22, 36, 56, 48), # building
    tri(18, 36, 50, 18, 82, 36), # roof
    rect(30, 46, 40, 38), # rollup door
    line(30, 56, 70, 56), line(30, 66, 70, 66), line(30, 76, 70, 76) # panels
  ],
  "porch": [
    tri(20, 40, 50, 20, 80, 40), # porch roof
    line(26, 40, 26, 80), line(74, 40, 74, 80), # support pillars
    rect(22, 78, 56, 6) # deck platform
  ],
  "swing": [
    line(24, 22, 76, 22), # top beam
    line(30, 22, 18, 82), line(70, 22, 82, 82), # A-frame legs
    line(42, 22, 42, 66), line(58, 22, 58, 66), # ropes
    rect(38, 66, 24, 4) # swing seat
  ],
  "slide": [
    line(30, 82, 30, 34), line(22, 82, 30, 34), # ladder
    [[30, 34], [44, 44], [64, 74], [76, 78]], # slide chute
    line(76, 78, 76, 84) # bottom foot
  ],
  "seesaw": [
    line(20, 64, 80, 36), # tilted plank
    tri(50, 50, 44, 78, 56, 78), # center fulcrum pivot
    rect(18, 58, 6, 6), rect(76, 30, 6, 6) # seats
  ],
  "sandbox": [
    rect(24, 44, 52, 32), # square wooden box
    circle(40, 60, 6), # sand mound
    line(58, 48, 64, 62), tri(62, 62, 66, 62, 64, 68) # plastic spade
  ],
  "trampoline": [
    ellipse(50, 46, 32, 12), # jumping mat
    line(26, 52, 22, 78), line(74, 52, 78, 78), line(50, 58, 50, 80), # legs
    arc(50, 32, 10, math.pi, 2 * math.pi) # bounce arc
  ],
  "tricycle": [
    circle(32, 62, 12), # front big wheel
    circle(68, 68, 8), # rear wheel
    line(32, 62, 40, 38), line(36, 38, 46, 38), # handlebars
    line(32, 62, 54, 54), line(54, 54, 68, 68), # frame
    rect(48, 50, 8, 4) # saddle seat
  ],
  "wagon": [
    rect(26, 50, 48, 18), # red wagon tub
    circle(34, 74, 6), circle(66, 74, 6), # 2 wheels
    line(26, 56, 12, 38) # pull handle
  ],
  "scooter": [
    rect(32, 72, 36, 4), # foot deck
    circle(28, 72, 5), circle(70, 72, 5), # wheels
    line(32, 72, 34, 30), line(26, 30, 42, 30) # stem & T-bar handles
  ],
  "skateboard": [
    [[22, 62], [30, 66], [70, 66], [78, 62]], # curved skateboard deck
    circle(32, 72, 4), circle(68, 72, 4) # wheels
  ],
  "roller skates": [
    [[32, 40], [32, 66], [66, 66], [66, 56], [50, 40]], # boot
    circle(38, 74, 5), circle(60, 74, 5), # 2 wheels
    circle(68, 66, 2) # toe stopper
  ],
  "jump rope": [
    arc(50, 36, 32, 0.1 * math.pi, 0.9 * math.pi), # swinging rope loop
    rect(20, 30, 4, 14), rect(76, 30, 4, 14) # wooden handles
  ],
  "hula hoop": [
    ellipse(50, 50, 34, 16), ellipse(50, 50, 30, 13) # spinning ring hoop
  ]
}

print("Loaded L1-L5: Total words =", len(L1_STROKES) + len(L2_STROKES) + len(L3_STROKES) + len(L4_STROKES) + len(L5_STROKES))
