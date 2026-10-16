#!/usr/bin/env python3
import json
import math
import os
import re

def circle(cx, cy, r, n=14):
    pts = []
    for i in range(n + 1):
        a = (i / n) * math.pi * 2
        pts.append([round((cx + r * math.cos(a)) * 10) / 10, round((cy + r * math.sin(a)) * 10) / 10])
    return pts

def ellipse(cx, cy, rx, ry, n=14):
    pts = []
    for i in range(n + 1):
        a = (i / n) * math.pi * 2
        pts.append([round((cx + rx * math.cos(a)) * 10) / 10, round((cy + ry * math.sin(a)) * 10) / 10])
    return pts

def arc(cx, cy, r, a1, a2, n=10):
    pts = []
    for i in range(n + 1):
        a = a1 + (i / n) * (a2 - a1)
        pts.append([round((cx + r * math.cos(a)) * 10) / 10, round((cy + r * math.sin(a)) * 10) / 10])
    return pts

def rect(x, y, w, h):
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]

def tri(x1, y1, x2, y2, x3, y3):
    return [[x1, y1], [x2, y2], [x3, y3], [x1, y1]]

def star(cx, cy, r1, r2, p=5):
    pts = []
    for i in range(p * 2 + 1):
        a = (i / (p * 2)) * math.pi * 2 - math.pi / 2
        r = r1 if i % 2 == 0 else r2
        pts.append([round((cx + r * math.cos(a)) * 10) / 10, round((cy + r * math.sin(a)) * 10) / 10])
    return pts

def line(x1, y1, x2, y2):
    return [[x1, y1], [x2, y2]]

print("Python geometric helpers defined successfully")
