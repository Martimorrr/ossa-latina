#!/usr/bin/env python3
"""Режет спрайт озвучки на отдельные файлы — по одному на термин.

Отдельный файл играется целиком, без перемотки и декодирования всего словаря,
поэтому надёжно работает на телефонах. Нужны ossa.wav и sprite.json,
которые оставляет build_sprite.py.
"""
import array, json, os, shutil, subprocess, wave

idx = json.load(open("sprite.json"))
w = wave.open("ossa.wav"); sr = w.getframerate()
pcm = array.array("h"); pcm.frombytes(w.readframes(w.getnframes())); w.close()

out = "audio"
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
for tid, (st, dur) in idx.items():
    seg = pcm[int(st * sr):int((st + dur + 0.05) * sr)]
    f = wave.open("clip.wav", "w"); f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr)
    f.writeframes(seg.tobytes()); f.close()
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", "clip.wav",
                    f"{out}/{tid}.mp4"], check=True, capture_output=True)
os.remove("clip.wav")
json.dump(sorted(x[:-4] for x in os.listdir(out)), open(f"{out}/index.json", "w"), ensure_ascii=False)
print(f"нарезано: {len(idx)} файлов в {out}/")
