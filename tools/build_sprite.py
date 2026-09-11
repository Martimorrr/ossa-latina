import torch, json, wave, numpy as np, time
m = torch.package.PackageImporter("/tmp/tts/v4_ru.pt").load_pickle("tts_models", "model")
m.to(torch.device("cpu"))
TERMS = json.load(open("/tmp/tts/terms.json"))
VOW = set("аеёиоуыэюя")
SR = 48000

def accented(t):
    out, cw = [], 0
    for s in t["syl"]:
        if s["w"] != cw: out.append(" "); cw = s["w"]
        w = s["ru"]
        if s["stress"]:
            i = next((k for k, ch in enumerate(w) if ch in VOW), None)
            if i is not None: w = w[:i] + "+" + w[i:]
        out.append(w)
    return "".join(out)

def trim(a, thr=0.012):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0: return a
    s = max(0, idx[0] - int(SR*0.02)); e = min(len(a), idx[-1] + int(SR*0.06))
    return a[s:e]

gap = np.zeros(int(SR*0.25), dtype=np.float32)
parts, index, pos, t0 = [], {}, 0.0, time.time()
for i, t in enumerate(TERMS):
    try:
        a = m.apply_tts(text=accented(t) + ".", speaker="xenia", sample_rate=SR,
                        put_accent=False, put_yo=False).numpy().astype(np.float32)
    except Exception as e:
        print("ОШИБКА", t["id"], e, flush=True); continue
    a = trim(a)
    rms = np.sqrt((a**2).mean()) or 1e-9
    a = a * min(0.18 / rms, 0.95 / max(np.abs(a).max(), 1e-9))   # ровная громкость
    index[t["id"]] = [round(pos, 3), round(len(a)/SR, 3)]
    parts += [a, gap]; pos += (len(a) + len(gap)) / SR
    if i % 40 == 0: print(f"{i}/{len(TERMS)}  {time.time()-t0:.0f}с", flush=True)

audio = np.clip(np.concatenate(parts), -1, 1)
pcm = (audio * 32767).astype(np.int16)
w = wave.open("/tmp/tts/ossa.wav","w"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(pcm.tobytes()); w.close()
json.dump(index, open("/tmp/tts/sprite.json","w"), ensure_ascii=False)
print(f"ГОТОВО: {len(index)} терминов, {pos:.1f} с, {time.time()-t0:.0f}с работы", flush=True)
