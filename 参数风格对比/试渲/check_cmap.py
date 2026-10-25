#!/usr/bin/env python3
"""检查 woff 字体里有没有需要的字形（WOFF1: zlib 解压 cmap 表）。"""
import sys, zlib, struct
from pathlib import Path

def read_cmap(path):
    data = Path(path).read_bytes()
    sig = data[:4]
    if sig == b'wOFF':
        n = struct.unpack('>H', data[12:14])[0]
        tab = None
        for i in range(n):
            o = 44 + i * 20
            tag = data[o:o+4]
            if tag == b'cmap':
                off, comp, orig = struct.unpack('>III', data[o+4:o+16])
                raw = data[off:off+comp]
                tab = zlib.decompress(raw) if comp < orig else raw
                break
    elif sig in (b'\x00\x01\x00\x00', b'OTTO'):
        n = struct.unpack('>H', data[4:6])[0]
        for i in range(n):
            o = 12 + i * 16
            if data[o:o+4] == b'cmap':
                off, ln = struct.unpack('>II', data[o+8:o+16])
                tab = data[off:off+ln]
                break
    else:
        raise ValueError('不认识的格式 ' + repr(sig))
    nt = struct.unpack('>H', tab[2:4])[0]
    chars = set()
    for i in range(nt):
        so = struct.unpack('>I', tab[4 + i*8 + 4:4 + i*8 + 8])[0]
        fmt = struct.unpack('>H', tab[so:so+2])[0]
        if fmt == 4:
            segX2 = struct.unpack('>H', tab[so+6:so+8])[0]
            ends, starts, deltas, ros = so+14, so+14+segX2+2, so+14+2*segX2+2, so+14+3*segX2+2
            for k in range(segX2//2):
                s = struct.unpack('>H', tab[starts+k*2:starts+k*2+2])[0]
                e = struct.unpack('>H', tab[ends+k*2:ends+k*2+2])[0]
                d = struct.unpack('>h', tab[deltas+k*2:deltas+k*2+2])[0]
                ro = struct.unpack('>H', tab[ros+k*2:ros+k*2+2])[0]
                for ch in range(s, e+1):
                    if ch == 0xFFFF: continue
                    g = (ch + d) & 0xFFFF if ro == 0 else None
                    if ro:
                        try:
                            g = struct.unpack('>H', tab[ros+k*2+ro+(ch-s)*2:ros+k*2+ro+(ch-s)*2+2])[0]
                            g = (g + d) & 0xFFFF if g else 0
                        except struct.error:
                            g = 0
                    if g: chars.add(ch)
        elif fmt in (12, 13):
            ng = struct.unpack('>I', tab[so+12:so+16])[0]
            for k in range(ng):
                o2 = so + 16 + k*12
                s, e, g = struct.unpack('>III', tab[o2:o2+12])
                for ch in range(s, e+1):
                    if fmt == 13 and g: chars.add(ch)
                    elif fmt == 12 and (g + ch - s): chars.add(ch)
    return chars

base = Path(sys.argv[1])
need = {
    'Cinzel-400.woff': '0123456789.BT+',
    'Cinzel-700.woff': '0123456789.-BT+',
    'LXGWWenKai-500.woff': '参数疯狂卷之外数据方法算力量',
}
for fn, chars in need.items():
    p = base / fn
    have = read_cmap(p)
    miss = [c for c in chars if ord(c) not in have]
    print(f'{fn}: 共 {len(have)} 字形，缺 {"".join(miss) if miss else "（无缺字）"}')
