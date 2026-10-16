import json
import math
import random

# Seed for deterministic generation
random.seed(42)

def circle(cx, cy, r, n=12):
    pts = []
    for i in range(n + 1):
        a = i / n * math.pi * 2
        pts.append([round(cx + r * math.cos(a), 1), round(cy + r * math.sin(a), 1)])
    return pts

def arc(cx, cy, r, a_start, a_end, n=8):
    pts = []
    for i in range(n + 1):
        a = a_start + (a_end - a_start) * (i / n)
        pts.append([round(cx + r * math.cos(a), 1), round(cy + r * math.sin(a), 1)])
    return pts

def rect(x, y, w, h):
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]

def tri(a, b, c):
    return [a, b, c, a]

def line(p1, p2):
    return [p1, p2]

# Celebrity generator with distinct attributes
def celeb_strokes(feature_type):
    base_head = circle(50, 36, 14)
    eyes = [[[44, 34], [46, 34]], [[54, 34], [56, 34]]]
    smile = arc(50, 38, 5, 0.2 * math.pi, 0.8 * math.pi)
    neck = line([50, 50], [50, 58])
    shoulders = [[32, 70], [42, 58], [58, 58], [68, 70], [68, 92], [32, 92], [32, 70]]
    strokes = [base_head, eyes[0], eyes[1], smile, neck, shoulders]
    
    if feature_type == 'sunglasses':
        glasses = [[[40, 31], [48, 31], [48, 37], [40, 37], [40, 31]], [[52, 31], [60, 31], [60, 37], [52, 37], [52, 31]], [[48, 33], [52, 33]]]
        strokes.extend(glasses)
    elif feature_type == 'hat_fedora':
        # Michael Jackson style fedora & glove
        fedora = [[[30, 26], [70, 26]], [[36, 26], [38, 12], [62, 12], [64, 26]]]
        glove = rect(22, 68, 8, 12)
        mic = [circle(78, 62, 4), line([78, 66], [82, 82])]
        strokes.extend([*fedora, glove, *mic])
    elif feature_type == 'crown_queen':
        # Beyonce / Queen / Freddie Mercury
        cr = [[[38, 24], [41, 14], [46, 20], [50, 12], [54, 20], [59, 14], [62, 24], [38, 24]]]
        mic = [circle(78, 62, 4), line([78, 66], [82, 82])]
        strokes.extend([*cr, *mic])
    elif feature_type == 'guitar_rock':
        # Elvis / Taylor Swift / Jimi Hendrix
        gt = [circle(24, 72, 10), line([24, 62], [24, 35]), rect(22, 30, 4, 6)]
        hair = [[[36, 30], [34, 18], [50, 16], [66, 18], [64, 30]]]
        strokes.extend([*gt, *hair])
    elif feature_type == 'wild_hair':
        # Albert Einstein
        wh = [[[32, 40], [25, 32], [30, 22], [42, 14], [58, 14], [70, 22], [75, 32], [68, 40]], [[44, 42], [50, 44], [56, 42]]]
        chalk = rect(72, 55, 20, 25)
        strokes.extend([*wh, chalk])
    elif feature_type == 'basketball_hoop':
        # LeBron / Jordan / Kobe
        bball = circle(78, 45, 9)
        hoop = [rect(68, 20, 24, 14), line([74, 34], [86, 34])]
        headband = line([38, 28], [62, 28])
        strokes.extend([bball, *hoop, headband])
    elif feature_type == 'soccer_ball':
        # Ronaldo / Messi / Pele
        sball = circle(78, 76, 10)
        num = line([48, 68], [52, 68])
        strokes.extend([sball, num])
    elif feature_type == 'top_hat_beard':
        # Abraham Lincoln
        tophat = [[[32, 24], [68, 24]], rect(38, 4, 24, 20)]
        beard = arc(50, 42, 8, 0, math.pi)
        strokes.extend([tophat[0], tophat[1], beard])
    elif feature_type == 'round_glasses_scar':
        # Harry Potter / Steve Jobs / John Lennon
        rglass = [circle(44, 34, 4), circle(56, 34, 4), line([48, 34], [52, 34])]
        wand = line([72, 70], [88, 50])
        strokes.extend([*rglass, wand])
    elif feature_type == 'mustache_cane':
        # Charlie Chaplin
        bhat = [circle(50, 22, 14), line([32, 26], [68, 26])]
        stache = rect(47, 40, 6, 3)
        cane = [arc(22, 65, 4, math.pi, 2 * math.pi), line([26, 65], [26, 92])]
        strokes.extend([*bhat, stache, *cane])
    elif feature_type == 'trophy_oscar':
        # Leonardo DiCaprio / Brad Pitt / Meryl Streep
        oscar = [rect(76, 50, 8, 20), circle(80, 46, 4), rect(74, 70, 12, 5)]
        bowtie = tri([46, 56], [54, 56], [50, 59])
        strokes.extend([*oscar, bowtie])
    else:
        # Default performer / superstar
        mic = [circle(74, 58, 4), line([74, 62], [76, 78])]
        hair = [[[35, 26], [38, 16], [50, 14], [62, 16], [65, 26]]]
        strokes.extend([*mic, *hair])
        
    return strokes

# Animal strokes
def animal_strokes(atype):
    if atype == 'lion':
        head = circle(50, 40, 14)
        mane = circle(50, 40, 22, n=16)
        body = rect(30, 54, 40, 26)
        legs = [line([34, 80], [34, 94]), line([42, 80], [42, 94]), line([58, 80], [58, 94]), line([66, 80], [66, 94])]
        tail = [arc(72, 62, 12, 0, math.pi)]
        return [head, mane, body, *legs, *tail]
    elif atype == 'elephant':
        head = circle(40, 40, 16)
        trunk = [[[32, 45], [24, 60], [28, 75], [36, 72]]]
        ears = [circle(54, 38, 12)]
        body = rect(48, 44, 36, 32)
        legs = [line([52, 76], [52, 94]), line([60, 76], [60, 94]), line([72, 76], [72, 94]), line([80, 76], [80, 94])]
        return [head, *trunk, *ears, body, *legs]
    elif atype == 'bird':
        body = circle(45, 55, 14)
        beak = tri([32, 52], [20, 55], [32, 58])
        wing = arc(52, 52, 10, math.pi, 2 * math.pi)
        legs = [line([42, 69], [42, 85]), line([48, 69], [48, 85])]
        return [body, beak, wing, *legs]
    elif atype == 'fish':
        body = circle(45, 50, 16)
        tail = tri([60, 50], [80, 34], [80, 66])
        fin = tri([45, 34], [52, 20], [58, 34])
        eye = circle(36, 46, 2)
        return [body, tail, fin, eye]
    else:
        # Generic 4-legged pet / mammal
        head = circle(36, 40, 12)
        ears = [tri([30, 32], [26, 20], [36, 28]), tri([38, 28], [44, 20], [46, 32])]
        body = rect(42, 48, 38, 24)
        legs = [line([46, 72], [46, 92]), line([54, 72], [54, 92]), line([68, 72], [68, 92]), line([76, 72], [76, 92])]
        tail = line([80, 50], [92, 40])
        return [head, *ears, body, *legs, tail]

# Object strokes
def object_strokes(otype):
    if otype == 'guitar':
        return [circle(50, 68, 16), circle(50, 48, 11), rect(47, 10, 6, 30), rect(45, 6, 10, 8), line([50, 14], [50, 65])]
    elif otype == 'car':
        return [rect(15, 55, 70, 20), [[30, 55], [38, 36], [62, 36], [70, 55]], circle(32, 78, 8), circle(68, 78, 8)]
    elif otype == 'house':
        return [[[20, 80], [20, 45], [50, 20], [80, 45], [80, 80], [20, 80]], rect(38, 58, 24, 22), rect(26, 52, 10, 10), rect(64, 52, 10, 10)]
    elif otype == 'tree':
        return [rect(46, 65, 8, 25), tri([50, 10], [26, 48], [74, 48]), tri([50, 26], [32, 60], [68, 60])]
    elif otype == 'sun':
        return [circle(50, 50, 16), line([50, 20], [50, 10]), line([50, 80], [50, 90]), line([20, 50], [10, 50]), line([80, 50], [90, 50]), line([28, 28], [20, 20]), line([72, 72], [80, 80]), line([72, 28], [80, 20]), line([28, 72], [20, 80])]
    elif otype == 'pizza':
        return [tri([50, 15], [20, 78], [80, 78]), arc(50, 78, 30, 0, math.pi), circle(45, 45, 4), circle(55, 60, 4), circle(40, 65, 3)]
    elif otype == 'clock':
        return [circle(50, 50, 32), line([50, 50], [50, 28]), line([50, 50], [68, 50]), circle(50, 50, 3)]
    elif otype == 'airplane':
        return [rect(15, 46, 70, 8), tri([45, 46], [60, 15], [52, 46]), tri([45, 54], [60, 85], [52, 54]), tri([15, 46], [22, 28], [28, 46])]
    elif otype == 'boat':
        return [[[20, 65], [80, 65], [68, 85], [32, 85], [20, 65]], line([50, 65], [50, 20]), tri([50, 20], [50, 58], [78, 58])]
    elif otype == 'flower':
        return [circle(50, 35, 8), circle(50, 20, 8), circle(65, 35, 8), circle(50, 50, 8), circle(35, 35, 8), line([50, 58], [50, 90]), line([50, 75], [38, 68])]
    elif otype == 'star':
        return [[[50, 15], [60, 40], [88, 40], [66, 56], [74, 84], [50, 68], [26, 84], [34, 56], [12, 40], [40, 40], [50, 15]]]
    elif otype == 'eiffel_tower':
        return [tri([50, 10], [30, 85], [70, 85]), line([38, 55], [62, 55]), line([34, 72], [66, 72]), arc(50, 85, 14, math.pi, 2 * math.pi)]
    elif otype == 'rocket':
        return [rect(42, 28, 16, 44), tri([42, 28], [50, 10], [58, 28]), tri([42, 60], [28, 76], [42, 72]), tri([58, 60], [72, 76], [58, 72]), circle(50, 45, 4)]
    elif otype == 'camera':
        return [rect(20, 36, 60, 42), circle(50, 57, 14), rect(32, 28, 14, 8), circle(68, 44, 3)]
    elif otype == 'crown':
        return [[[25, 68], [25, 35], [38, 50], [50, 30], [62, 50], [75, 35], [75, 68], [25, 68]], circle(38, 48, 2), circle(50, 28, 2), circle(62, 48, 2)]
    else:
        # Generic well-formed sketch
        return [rect(25, 30, 50, 45), circle(50, 52, 12), line([30, 30], [50, 15]), line([50, 15], [70, 30])]

print('Helper stroke functions loaded.')
