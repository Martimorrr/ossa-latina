# -*- coding: utf-8 -*-
"""Черновое сопоставление латинских терминов с английскими метками Z-Anatomy.

   Латинское слово раскладывается по основе в набор английских синонимов,
   метка — в набор слов; побеждает метка с наибольшим покрытием. Результат
   ОБЯЗАТЕЛЬНО вычитывается вручную: омонимы вроде processus styloideus
   (лучевой/локтевой/височной) автоматика различить не может.
"""
import json, sys, re, collections

# основа -> английские варианты
STEM = {
 # роды образований
 "tubercul":"tubercle", "tuberosit":"tuberosity", "tuber":"tuber tuberosity",
 "foss":"fossa", "fove":"fovea", "foramen":"foramen", "foramin":"foramen",
 "process":"process", "condyl":"condyle", "epicondyl":"epicondyle",
 "sulc":"sulcus groove", "crist":"crest", "line":"line", "spin":"spine spinous",
 "incisur":"notch incisure", "canal":"canal", "meat":"meatus", "sinus":"sinus",
 "apertur":"aperture opening", "cavit":"cavity", "fissur":"fissure",
 "hiat":"hiatus", "arc":"arch", "angul":"angle", "margo":"border margin",
 "marg":"border margin", "squam":"squama squamous part", "lamin":"lamina plate",
 "ala":"ala wing", "alae":"ala wing", "protuberanti":"protuberance",
 "eminenti":"eminence", "trochle":"trochlea", "trochlear":"trochlear",
 "capitul":"capitulum", "caput":"head", "capit":"head", "collum":"neck",
 "corpus":"body", "corpor":"body", "basis":"base", "bas":"base",
 "apex":"apex", "extremitas":"extremity end", "extremit":"extremity end",
 "facies":"surface facet", "faci":"surface", "pars":"part", "part":"part",
 "ramus":"ramus branch", "ram":"ramus branch", "sutur":"suture",
 "symphys":"symphysis", "discus":"disc", "disc":"disc", "septum":"septum",
 "spati":"space", "concha":"concha", "conch":"concha", "sell":"sella",
 "clivus":"clivus", "glabell":"glabella", "acromion":"acromion",
 "acromial":"acromial", "olecranon":"olecranon", "olecran":"olecranon",
 "trochanter":"trochanter", "trochanteric":"trochanteric",
 "malleol":"malleolus", "promontori":"promontory", "fonticul":"fontanelle",
 "labyrinth":"labyrinth", "dens":"dens", "dental":"dental", "alveol":"alveolar alveoli",
 "palat":"palate palatine", "orbit":"orbit orbital", "patell":"patella",
 "cartilag":"cartilage", "manubri":"manubrium", "acetabul":"acetabulum",
 # кости
 "os":"bone", "ossa":"bones", "ossis":"bone", "cranii":"skull cranium",
 "crani":"skull cranium", "occipital":"occipital", "frontal":"frontal",
 "pariet":"parietal", "tempor":"temporal", "sphenoid":"sphenoid",
 "ethmoid":"ethmoid", "maxill":"maxilla maxillary", "mandibul":"mandible mandibular",
 "mandibula":"mandible", "zygomatic":"zygomatic", "nasal":"nasal", "nasi":"nose nasal",
 "lacrimal":"lacrimal", "palatin":"palatine", "vomer":"vomer", "hyoid":"hyoid",
 "vertebr":"vertebra vertebral", "sacr":"sacrum sacral", "coccyg":"coccyx coccygeal",
 "atlas":"atlas", "axis":"axis", "sternum":"sternum", "stern":"sternal sternum",
 "cost":"rib costal", "thorac":"thoracic thorax", "thoracis":"thorax",
 "clavicul":"clavicle clavicular", "scapul":"scapula scapular",
 "humer":"humerus", "radi":"radius radial", "uln":"ulna ulnar",
 "carp":"carpal carpus wrist", "metacarp":"metacarpal metacarpus",
 "phalan":"phalanx phalanges", "pelvis":"pelvis pelvic", "pelvi":"pelvis pelvic",
 "cox":"hip", "ili":"ilium iliac", "ischi":"ischium ischial", "pub":"pubis pubic",
 "femur":"femur", "femor":"femur femoral", "tibi":"tibia tibial",
 "fibul":"fibula fibular", "tars":"tarsal tarsus", "metatars":"metatarsal metatarsus",
 "talus":"talus", "tal":"talus", "calcane":"calcaneus calcaneal",
 "navicular":"navicular", "cuneiform":"cuneiform", "cuboid":"cuboid",
 "ped":"foot", "pedis":"foot", "scaphoid":"scaphoid", "lunat":"lunate",
 "triquetr":"triquetral triquetrum", "pisiform":"pisiform", "trapezium":"trapezium",
 "trapezoid":"trapezoid", "capitat":"capitate", "hamat":"hamate",
 # прилагательные и уточнения
 "major":"greater major", "majus":"greater major", "minor":"lesser minor",
 "minus":"lesser minor", "magnum":"magnum great", "superior":"superior",
 "inferior":"inferior", "anterior":"anterior", "posterior":"posterior",
 "medial":"medial", "median":"median", "media":"middle", "medi":"medial middle",
 "lateral":"lateral", "extern":"external", "intern":"internal",
 "transvers":"transverse", "articular":"articular", "intervertebral":"intervertebral",
 "intercostal":"intercostal", "intertubercular":"intertubercular",
 "supraspinat":"supraspinous supraspinatus", "infraspinat":"infraspinous infraspinatus",
 "subscapular":"subscapular", "glenoid":"glenoid", "coracoid":"coracoid",
 "coronoid":"coronoid", "coronal":"coronal", "sagittal":"sagittal",
 "lambdoid":"lambdoid", "styloid":"styloid", "mastoid":"mastoid",
 "pterygoid":"pterygoid", "pterygopalatin":"pterygopalatine",
 "xiphoid":"xiphoid", "jugular":"jugular", "jugulare":"jugular",
 "carotic":"carotid", "opticus":"optic", "optic":"optic", "nervi":"nerve",
 "nerv":"nerve", "deltoid":"deltoid", "anatomic":"anatomical",
 "chirurgic":"surgical", "obturat":"obturator obturated", "terminal":"terminal",
 "subpubic":"subpubic", "aspera":"aspera linea", "intercondylar":"intercondylar",
 "intercondylaris":"intercondylar", "trochanteric":"trochanteric",
 "cervical":"cervical", "lumbal":"lumbar", "lumb":"lumbar",
 "verae":"true", "spuriae":"false", "fluctuantes":"floating",
 "cribros":"cribriform", "galli":"galli crista", "petros":"petrous",
 "squamos":"squamous", "tympanic":"tympanic", "acustic":"acoustic auditory",
 "infraorbital":"infraorbital", "supraciliar":"superciliary",
 "superciliar":"superciliary", "mental":"mental", "condylar":"condylar",
 "spinos":"spinous", "spinosum":"spinosum spinous", "ovale":"ovale oval",
 "rotundum":"rotundum round", "lacerum":"lacerum", "durum":"hard",
 "piriform":"piriform", "longitudinal":"longitudinal", "distal":"distal",
 "sacral":"sacral", "vertebrale":"vertebral", "stylomastoid":"stylomastoid",
 "turcica":"turcica sella", "radialis":"radial", "ulnaris":"ulnar",
}
ORDER = sorted(STEM, key=len, reverse=True)

def toks(word):
    for s in ORDER:
        if word.startswith(s): return set(STEM[s].split())
    return set()

STOP = {"of","the","and","for"}
def label_words(name):
    return set(re.findall(r"[a-z]+", name.lower())) - STOP

def main(terms_path, labels_path, out_path):
    terms = json.load(open(terms_path))
    labels = json.load(open(labels_path))
    # метка -> список костей (правая сторона как канон)
    pool = []
    for bone, labs in labels.items():
        if bone.endswith(".l"): continue
        for l in labs:
            nm = l[:-2] if l[-2:] in (".t", ".s") else l
            pool.append((bone, nm, label_words(nm)))

    res = {}
    for t in terms:
        want = set()
        unknown = []
        for w in t["la"].split():
            tk = toks(w)
            if not tk: unknown.append(w)
            want |= tk
        if not want: continue
        best = []
        for bone, nm, lw in pool:
            inter = want & lw
            if not inter: continue
            # покрытие термина важнее, но длинные метки штрафуем
            score = len(inter) / len(want) - 0.08 * len(lw - want)
            best.append((score, bone, nm))
        best.sort(reverse=True)
        if best:
            res[t["id"]] = {"la": t["la"], "ru": t["ru"], "sec": t["sec"],
                            "unknown": unknown,
                            "cand": [{"b": b, "n": n, "s": round(s, 2)} for s, b, n in best[:4]]}
    json.dump(res, open(out_path, "w"), ensure_ascii=False, indent=1)
    strong = sum(1 for v in res.values() if v["cand"][0]["s"] >= 0.95)
    print(f"### терминов с кандидатами: {len(res)}  уверенных: {strong}")

if __name__ == "__main__":
    main(*sys.argv[1:4])
