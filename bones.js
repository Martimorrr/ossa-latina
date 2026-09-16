/* Скелет, названия костей и привязка терминов к структурам.
   Геометрия и метки: Z-Anatomy (CC BY-SA 4.0), построен на BodyParts3D
   (c) The Database Center for Life Science, CC BY-SA 2.1 Japan.

   TERM_3D: id термина -> [кость или список костей, имя метки или null].
   Метка null означает, что в модели структура отдельно не размечена —
   тогда показываем кость целиком, не обещая точку. */

const SKEL_BIN = "bones/skeleton.bin";
const SKEL_META = "bones/skeleton.json";
const BONE_DIR = "bones/";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
              seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };

/* Английское имя меша -> [латынь, русский] */
const BONE_NAMES = {
  "Frontal bone":   ["os frontale", "лобная кость"],
  "Parietal bone":  ["os parietale", "теменная кость"],
  "Occipital bone": ["os occipitale", "затылочная кость"],
  "Temporal bone":  ["os temporale", "височная кость"],
  "Sphenoid bone":  ["os sphenoidale", "клиновидная кость"],
  "Ethmoid bone":   ["os ethmoidale", "решётчатая кость"],
  "Maxilla":        ["maxilla", "верхняя челюсть"],
  "Mandible":       ["mandibula", "нижняя челюсть"],
  "Zygomatic bone": ["os zygomaticum", "скуловая кость"],
  "Nasal bone":     ["os nasale", "носовая кость"],
  "Lacrimal bone":  ["os lacrimale", "слёзная кость"],
  "Palatine bone":  ["os palatinum", "нёбная кость"],
  "Vomer":          ["vomer", "сошник"],
  "Inferior nasal concha bone": ["concha nasalis inferior", "нижняя носовая раковина"],
  "Hyoid bone":     ["os hyoideum", "подъязычная кость"],
  "Malleus":        ["malleus", "молоточек"],
  "Incus":          ["incus", "наковальня"],
  "Stapes":         ["stapes", "стремя"],
  "Sinus of frontal bone":  ["sinus frontalis", "лобная пазуха"],
  "Sinus of sphenoid bone": ["sinus sphenoidalis", "клиновидная пазуха"],

  "Atlas (C1)":     ["atlas", "атлант, I шейный позвонок"],
  "Axis (C2)":      ["axis", "осевой, II шейный позвонок"],
  "Sacrum":         ["os sacrum", "крестец"],
  "Coccyx":         ["os coccygis", "копчик"],

  "Manubrium of sternum": ["manubrium sterni", "рукоятка грудины"],
  "Body of sternum":      ["corpus sterni", "тело грудины"],
  "Xiphoid process":      ["processus xiphoideus", "мечевидный отросток"],

  "Clavicle":       ["clavicula", "ключица"],
  "Scapula":        ["scapula", "лопатка"],
  "Humerus":        ["humerus", "плечевая кость"],
  "Radius":         ["radius", "лучевая кость"],
  "Ulna":           ["ulna", "локтевая кость"],
  "Scaphoid bone":  ["os scaphoideum", "ладьевидная кость"],
  "Lunate bone":    ["os lunatum", "полулунная кость"],
  "Triquetrum bone":["os triquetrum", "трёхгранная кость"],
  "Pisiform bone":  ["os pisiforme", "гороховидная кость"],
  "Trapezium bone": ["os trapezium", "кость-трапеция"],
  "Trapezoid bone": ["os trapezoideum", "трапециевидная кость"],
  "Capitate bone":  ["os capitatum", "головчатая кость"],
  "Hamate bone":    ["os hamatum", "крючковидная кость"],

  "Hip bone":       ["os coxae", "тазовая кость"],
  "Femur":          ["femur", "бедренная кость"],
  "Patella":        ["patella", "надколенник"],
  "Tibia":          ["tibia", "большеберцовая кость"],
  "Fibula":         ["fibula", "малоберцовая кость"],
  "Talus":          ["talus", "таранная кость"],
  "Calcaneus":      ["calcaneus", "пяточная кость"],
  "Navicular bone": ["os naviculare", "ладьевидная кость стопы"],
  "Medial cuneiform bone":       ["os cuneiforme mediale", "медиальная клиновидная кость"],
  "Intermediate cuneiform bone": ["os cuneiforme intermedium", "промежуточная клиновидная кость"],
  "Lateral cuneiform bone":      ["os cuneiforme laterale", "латеральная клиновидная кость"],
  "Cuboid bone":    ["os cuboideum", "кубовидная кость"],
  "Sesamoid bones of foot": ["ossa sesamoidea", "сесамовидные кости стопы"]
};

/* Однотипные ряды проще построить, чем перечислять */
(function () {
  for (const w in ORD) {
    const i = ORD[w], W = w[0].toUpperCase() + w.slice(1);
    BONE_NAMES[W + " rib"] = ["costa " + ROMAN[i], ROMAN[i] + " ребро"];
    if (i <= 5) {
      BONE_NAMES[W + " metacarpal bone"] = ["os metacarpi " + ROMAN[i], ROMAN[i] + " пястная кость"];
      BONE_NAMES[W + " metatarsal bone"] = ["os metatarsi " + ROMAN[i], ROMAN[i] + " плюсневая кость"];
    }
  }
  const seg = { Proximal: ["proximalis", "проксимальная"], Middle: ["media", "средняя"],
                Distal: ["distalis", "дистальная"] };
  const limb = { hand: ["manus", "кисти"], foot: ["pedis", "стопы"] };
  for (const s in seg) for (const w in ORD) {
    const i = ORD[w]; if (i > 5) continue;
    if (s === "Middle" && i === 1) continue;   // у большого пальца средней фаланги нет
    for (const l in limb) {
      BONE_NAMES[`${s} phalanx of ${w} finger of ${l}`] =
        [`phalanx ${seg[s][0]} ${ROMAN[i]} ${limb[l][0]}`,
         `${seg[s][1]} фаланга ${ROMAN[i]} пальца ${limb[l][1]}`];
    }
  }
  for (const [pre, lat, ru] of [["C", "cervicalis", "шейный"], ["T", "thoracica", "грудной"],
                                ["L", "lumbalis", "поясничный"]]) {
    const n = pre === "T" ? 12 : pre === "L" ? 5 : 7;
    for (let i = pre === "C" ? 3 : 1; i <= n; i++)   // C1 и C2 — это atlas и axis
      BONE_NAMES["Vertebra " + pre + i] =
        ["vertebra " + lat + " " + ROMAN[i], ROMAN[i] + " " + ru + " позвонок"];
  }
})();

/* Наборы костей для собирательных терминов */
const G = {
  cranium: ["Frontal bone", "Parietal bone", "Occipital bone", "Temporal bone",
            "Sphenoid bone", "Ethmoid bone", "Maxilla", "Mandible", "Zygomatic bone",
            "Nasal bone", "Lacrimal bone", "Palatine bone", "Vomer",
            "Inferior nasal concha bone"],
  spineAll: [],  // заполняется ниже
  cerv: ["Atlas (C1)", "Axis (C2)", "Vertebra C3", "Vertebra C4", "Vertebra C5",
         "Vertebra C6", "Vertebra C7"],
  thor: [], lumb: [],
  ribsTrue: [], ribsFalse: [], ribsFloat: ["Eleventh rib", "Twelfth rib"],
  sternum: ["Manubrium of sternum", "Body of sternum", "Xiphoid process"],
  carpus: ["Scaphoid bone", "Lunate bone", "Triquetrum bone", "Pisiform bone",
           "Trapezium bone", "Trapezoid bone", "Capitate bone", "Hamate bone"],
  metacarpus: [], phalHand: [], phalFoot: [], distPhalFoot: [],
  metatarsus: [],
  tarsus: ["Talus", "Calcaneus", "Navicular bone", "Medial cuneiform bone",
           "Intermediate cuneiform bone", "Lateral cuneiform bone", "Cuboid bone"],
  cuneiform: ["Medial cuneiform bone", "Intermediate cuneiform bone",
              "Lateral cuneiform bone"],
  arch: ["Calcaneus", "Talus", "Navicular bone", "Medial cuneiform bone",
         "First metatarsal bone"],
  armAll: ["Clavicle", "Scapula", "Humerus", "Radius", "Ulna"],
  legAll: ["Hip bone", "Femur", "Patella", "Tibia", "Fibula"]
};
(function () {
  for (let i = 1; i <= 12; i++) G.thor.push("Vertebra T" + i);
  for (let i = 1; i <= 5; i++) G.lumb.push("Vertebra L" + i);
  G.spineAll = G.cerv.concat(G.thor, G.lumb, ["Sacrum", "Coccyx"]);
  const W = i => Object.keys(ORD).find(k => ORD[k] === i);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  for (let i = 1; i <= 12; i++) {
    const r = cap(W(i)) + " rib";
    (i <= 7 ? G.ribsTrue : G.ribsFalse).push(r);
  }
  for (let i = 1; i <= 5; i++) {
    G.metacarpus.push(cap(W(i)) + " metacarpal bone");
    G.metatarsus.push(cap(W(i)) + " metatarsal bone");
    for (const s of ["Proximal", "Middle", "Distal"]) {
      if (s === "Middle" && i === 1) continue;
      G.phalHand.push(`${s} phalanx of ${W(i)} finger of hand`);
      G.phalFoot.push(`${s} phalanx of ${W(i)} finger of foot`);
    }
    G.distPhalFoot.push(`Distal phalanx of ${W(i)} finger of foot`);
  }
  G.carpus = G.carpus.concat();
  G.armAll = G.armAll.concat(G.carpus, G.metacarpus, G.phalHand);
  G.legAll = G.legAll.concat(G.tarsus, G.metatarsus, G.phalFoot);
})();

const TERM_3D = {
  /* ─ общие понятия: показываем область целиком ─ */
  "cranium":             [G.cranium, null],
  "columna-vertebralis": [G.spineAll, null],
  "thorax":              [G.ribsTrue.concat(G.ribsFalse, G.sternum, G.thor), null],
  "pelvis":              [["Hip bone", "Sacrum", "Coccyx"], null],
  "membrum-superius":    [G.armAll, null],
  "membrum-inferius":    [G.legAll, null],

  /* ─ мозговой череп ─ */
  "os-frontale":     ["Frontal bone", "Squamous part of frontal bone"],
  "os-parietale":    ["Parietal bone", "External surface of parietal bone"],
  "os-occipitale":   ["Occipital bone", "Squamous part of occipital bone"],
  "os-temporale":    ["Temporal bone", "Squamous part of temporal bone"],
  "os-sphenoidale":  ["Sphenoid bone", "Body of sphenoid bone"],
  "os-ethmoidale":   ["Ethmoid bone", null],
  "squama-frontalis":["Frontal bone", "Squamous part of frontal bone"],
  "glabella":        ["Frontal bone", "Glabella"],
  "arcus-superciliaris": ["Frontal bone", "Superciliary arch"],
  "tuber-frontale":  ["Frontal bone", "Frontal eminence"],
  "sinus-frontalis": ["Sinus of frontal bone", null],
  "tuber-parietale": ["Parietal bone", "Parietal eminence"],
  "linea-temporalis":["Parietal bone", "Superior temporal line"],
  "squama-occipitalis": ["Occipital bone", "Squamous part of occipital bone"],
  "foramen-magnum":  ["Occipital bone", "Foramen magnum"],
  "condylus-occipitalis": ["Occipital bone", "Occipital condyle"],
  "protuberantia-occipitalis-externa": ["Occipital bone", "External occipital protuberance"],
  "clivus":          ["Occipital bone", "Basilar part of occipital bone"],
  "pars-petrosa":    ["Temporal bone", "Petrous part of temporal bone"],
  "pars-squamosa":   ["Temporal bone", "Squamous part of temporal bone"],
  "pars-tympanica":  ["Temporal bone", "Tympanic part of temporal bone"],
  "processus-mastoideus": ["Temporal bone", "Mastoid process"],
  "processus-styloideus": ["Temporal bone", "Styloid process of temporal bone"],
  "processus-zygomaticus": ["Temporal bone", null],
  "meatus-acusticus-externus": ["Temporal bone", "Tympanic part of temporal bone"],
  "meatus-acusticus-internus": ["Temporal bone", "Posterior surface of petrous part"],
  "fossa-mandibularis": ["Temporal bone", null],
  "cavitas-tympanica":  ["Temporal bone", "Tegmen tympani"],
  "sella-turcica":   ["Sphenoid bone", "Sella turcica"],
  "ala-major":       ["Sphenoid bone", "Greater wing"],
  "ala-minor":       ["Sphenoid bone", "Lesser wing"],
  "processus-pterygoideus": ["Sphenoid bone", "Pterygoid process"],
  "lamina-cribrosa": ["Ethmoid bone", null],
  "crista-galli":    ["Ethmoid bone", null],
  "labyrinthus-ethmoidalis": ["Ethmoid bone", null],
  "concha-nasalis-superior": ["Ethmoid bone", null],

  /* ─ лицевой череп ─ */
  "maxilla":           ["Maxilla", null],
  "corpus-maxillae":   ["Maxilla", null],
  "processus-alveolaris": ["Maxilla", "Maxillary dental arch"],
  "processus-palatinus":  ["Maxilla", null],
  "sinus-maxillaris":  ["Maxilla", null],
  "foramen-infraorbitale": ["Maxilla", null],
  "alveoli-dentales":  ["Maxilla", "Maxillary dental arch"],
  "mandibula":         ["Mandible", "Body of mandible"],
  "ramus-mandibulae":  ["Mandible", null],
  "angulus-mandibulae":["Mandible", "Base of mandible"],
  "processus-condylaris": ["Mandible", null],
  "processus-coronoideus": ["Mandible", null],
  "foramen-mentale":   ["Mandible", "Mental foramen"],
  "protuberantia-mentalis": ["Mandible", "Mental protuberance"],
  "os-zygomaticum":    ["Zygomatic bone", null],
  "os-nasale":         ["Nasal bone", null],
  "os-lacrimale":      ["Lacrimal bone", null],
  "os-palatinum":      ["Palatine bone", null],
  "vomer":             ["Vomer", null],
  "concha-nasalis-inferior": ["Inferior nasal concha bone", null],
  "os-hyoideum":       ["Hyoid bone", "Body of hyoid bone"],
  "arcus-zygomaticus": [["Zygomatic bone", "Temporal bone"], null],
  "orbita":            [["Frontal bone", "Maxilla", "Zygomatic bone", "Lacrimal bone",
                         "Sphenoid bone", "Ethmoid bone", "Palatine bone"], null],
  "cavitas-nasi":      [["Nasal bone", "Maxilla", "Vomer", "Inferior nasal concha bone",
                         "Ethmoid bone", "Palatine bone"], null],
  "septum-nasi":       [["Vomer", "Ethmoid bone"], null],
  "palatum-durum":     [["Maxilla", "Palatine bone"], null],
  "apertura-piriformis": [["Nasal bone", "Maxilla"], null],

  /* ─ топография черепа ─ */
  "basis-cranii":         [["Occipital bone", "Sphenoid bone", "Temporal bone",
                            "Frontal bone", "Ethmoid bone"], null],
  "fossa-cranii-anterior":[["Frontal bone", "Ethmoid bone", "Sphenoid bone"], null],
  "fossa-cranii-media":   [["Sphenoid bone", "Temporal bone"], null],
  "fossa-cranii-posterior":[["Occipital bone", "Temporal bone"], null],
  "canalis-opticus":      ["Sphenoid bone", "Optic canal"],
  "fissura-orbitalis-superior": ["Sphenoid bone", null],
  "foramen-rotundum":     ["Sphenoid bone", "Foramen rotundum"],
  "foramen-ovale":        ["Sphenoid bone", "Foramen ovale"],
  "foramen-spinosum":     ["Sphenoid bone", "Foramen spinosum"],
  "foramen-lacerum":      [["Sphenoid bone", "Temporal bone", "Occipital bone"], null],
  "foramen-jugulare":     ["Occipital bone", "Jugular notch of occipital bone"],
  "foramen-stylomastoideum": ["Temporal bone", "Styloid process of temporal bone"],
  "canalis-caroticus":    ["Temporal bone", "Petrous part of temporal bone"],
  "fossa-pterygopalatina":[["Sphenoid bone", "Maxilla", "Palatine bone"], null],
  "sutura-coronalis":     [["Frontal bone", "Parietal bone"], null],
  "sutura-sagittalis":    ["Parietal bone", "Sagittal border of parietal bone"],
  "sutura-lambdoidea":    [["Parietal bone", "Occipital bone"], null],
  "fonticulus-anterior":  [["Frontal bone", "Parietal bone"], null],

  /* ─ позвоночник ─ */
  "vertebra":             ["Vertebra L3", "Vertebra"],
  "vertebrae-cervicales": [G.cerv, null],
  "vertebrae-thoracicae": [G.thor, null],
  "vertebrae-lumbales":   [G.lumb, null],
  "os-sacrum":            ["Sacrum", "Sacrum"],
  "os-coccygis":          ["Coccyx", "Coccyx"],
  "atlas":                ["Atlas (C1)", "Atlas (C1)"],
  "axis":                 ["Axis (C2)", "Axis (C2)"],
  "dens-axis":            ["Axis (C2)", "Dens axis"],
  "corpus-vertebrae":     ["Vertebra L3", "Vertebral body"],
  "arcus-vertebrae":      ["Vertebra L3", "Vertebral arch"],
  "foramen-vertebrale":   ["Vertebra L3", "Vertebral foramen"],
  "canalis-vertebralis":  [G.spineAll, null],
  "processus-spinosus":   ["Vertebra L3", "Spinous process"],
  "processus-transversus":["Vertebra L3", "Transverse process"],
  "processus-articularis":["Vertebra L3", "Superior articular process of vertebra"],
  "foramen-intervertebrale": ["Vertebra L3", "Intervertebral foramen"],
  "foramen-transversarium":  ["Atlas (C1)", "(Canal for vertebral artery)"],
  "promontorium":         ["Sacrum", "Promontory"],
  "canalis-sacralis":     ["Sacrum", "Sacral canal"],
  "hiatus-sacralis":      ["Sacrum", "Sacral hiatus"],
  "crista-sacralis-mediana": ["Sacrum", "Median sacral crest"],

  /* ─ грудная клетка ─ */
  "sternum":            [G.sternum, null],
  "manubrium-sterni":   ["Manubrium of sternum", "Manubrium of sternum"],
  "corpus-sterni":      ["Body of sternum", "Sternum"],
  "processus-xiphoideus": ["Xiphoid process", "Xiphoid process"],
  "incisura-jugularis": ["Manubrium of sternum", null],
  "angulus-sterni":     ["Body of sternum", "Sternal angle"],
  "costa":              ["Sixth rib", "Rib"],
  "costae-verae":       [G.ribsTrue, null],
  "costae-spuriae":     [G.ribsFalse, null],
  "costae-fluctuantes": [G.ribsFloat, null],
  "caput-costae":       ["Sixth rib", "Head of rib"],
  "collum-costae":      ["Sixth rib", "Neck of rib"],
  "tuberculum-costae":  ["Sixth rib", "Tubercle of rib"],
  "angulus-costae":     ["Sixth rib", "Angle of rib"],
  "sulcus-costae":      ["Sixth rib", "Costal groove"],
  "apertura-thoracis-superior": [["First rib", "Manubrium of sternum", "Vertebra T1"], null],
  "spatium-intercostale": [["Sixth rib", "Seventh rib"], null],

  /* ─ пояс верхней конечности ─ */
  "clavicula":            ["Clavicle", "Body of clavicle"],
  "extremitas-sternalis": ["Clavicle", "Sternal end"],
  "extremitas-acromialis":["Clavicle", "Acromial end"],
  "scapula":              ["Scapula", "Scapula"],
  "acromion":             ["Scapula", "Acromion"],
  "processus-coracoideus":["Scapula", "Coracoid process"],
  "cavitas-glenoidalis":  ["Scapula", "Glenoid fossa"],
  "spina-scapulae":       ["Scapula", "Spine of scapula"],
  "fossa-supraspinata":   ["Scapula", "Supraspinous fossa"],
  "fossa-infraspinata":   ["Scapula", "Infraspinous fossa"],
  "fossa-subscapularis":  ["Scapula", "Subscapular fossa"],
  "collum-scapulae":      ["Scapula", "Neck of scapula"],
  "margo-medialis":       ["Scapula", "Medial border of scapula"],
  "margo-lateralis":      ["Scapula", "Lateral border of scapula"],
  "angulus-inferior":     ["Scapula", "Inferior angle of scapula"],

  /* ─ свободная верхняя конечность ─ */
  "humerus":              ["Humerus", "Humerus"],
  "caput-humeri":         ["Humerus", "Head of humerus"],
  "collum-anatomicum":    ["Humerus", "Anatomical neck of humerus"],
  "collum-chirurgicum":   ["Humerus", "Surgical neck of humerus"],
  "tuberculum-majus":     ["Humerus", "Greater tubercle"],
  "tuberculum-minus":     ["Humerus", "Lesser tubercle"],
  "sulcus-intertubercularis": ["Humerus", "Intertubercular sulcus"],
  "tuberositas-deltoidea":["Humerus", "Deltoid tuberosity"],
  "sulcus-nervi-radialis":["Humerus", "Radial groove"],
  "capitulum-humeri":     ["Humerus", "Capitulum of humerus"],
  "trochlea-humeri":      ["Humerus", "Trochlea of humerus"],
  "fossa-olecrani":       ["Humerus", "Olecranon fossa"],
  "fossa-coronoidea":     ["Humerus", "Coronoid fossa"],
  "epicondylus-medialis": ["Humerus", "Medial epicondyle of humerus"],
  "epicondylus-lateralis":["Humerus", "Lateral epicondyle of humerus"],
  "radius":               ["Radius", "Radius"],
  "ulna":                 ["Ulna", "Ulna"],
  "olecranon":            ["Ulna", "Olecranon"],
  "incisura-trochlearis": ["Ulna", "Trochlear notch"],
  "processus-styloideus-radii": ["Radius", "Radial styloid process"],
  "ossa-carpi":           [G.carpus, null],
  "os-scaphoideum":       ["Scaphoid bone", null],
  "os-lunatum":           ["Lunate bone", null],
  "os-triquetrum":        ["Triquetrum bone", null],
  "os-pisiforme":         ["Pisiform bone", null],
  "os-trapezium":         ["Trapezium bone", null],
  "os-trapezoideum":      ["Trapezoid bone", null],
  "os-capitatum":         ["Capitate bone", null],
  "os-hamatum":           ["Hamate bone", null],
  "ossa-metacarpi":       [G.metacarpus, null],
  "phalanges":            [G.phalHand, null],

  /* ─ таз ─ */
  "os-coxae":             ["Hip bone", "Hip bone"],
  "os-ilium":             ["Hip bone", "Ilium"],
  "os-ischii":            ["Hip bone", "Ischium"],
  "os-pubis":             ["Hip bone", "Pubis"],
  "acetabulum":           ["Hip bone", "Acetabulum"],
  "foramen-obturatum":    ["Hip bone", "Obturator foramen"],
  "crista-iliaca":        ["Hip bone", "Iliac crest"],
  "spina-iliaca-anterior-superior": ["Hip bone", "Anterior superior iliac spine"],
  "ala-ossis-ilii":       ["Hip bone", "Ala of ilium"],
  "fossa-iliaca":         ["Hip bone", "Iliac fossa"],
  "tuber-ischiadicum":    ["Hip bone", "Ischial tuberosity"],
  "incisura-ischiadica-major": ["Hip bone", "Greater sciatic notch"],
  "symphysis-pubica":     ["Hip bone", "Symphysial surface of pubis"],
  "tuberculum-pubicum":   ["Hip bone", "Pubic tubercle"],
  "linea-terminalis":     ["Hip bone", "Arcuate line of ilium"],
  "pelvis-major":         [["Hip bone", "Sacrum"], null],
  "pelvis-minor":         [["Hip bone", "Sacrum", "Coccyx"], null],
  "angulus-subpubicus":   ["Hip bone", "Inferior pubic ramus"],

  /* ─ строение позвонка (на примере III поясничного) ─ */
  "pediculus-arcus-vertebrae":   ["Vertebra L3", "Pedicle of vertebral arch"],
  "lamina-arcus-vertebrae":      ["Vertebra L3", "Lamina of vertebral arch"],
  "incisura-vertebralis-superior": ["Vertebra L3", "Superior vertebral notch"],
  "incisura-vertebralis-inferior": ["Vertebra L3", "Inferior vertebral notch"],
  "processus-articularis-superior": ["Vertebra L3", "Superior articular process of vertebra"],
  "processus-articularis-inferior": ["Vertebra L3", "Inferior articular facet of vertebra"],
  "processus-costalis":          ["Vertebra L3", "Costal part of transverse process"],

  /* ─ атлант и осевой ─ */
  "arcus-anterior":              ["Atlas (C1)", "Anterior arch of atlas"],
  "arcus-posterior":             ["Atlas (C1)", "Posterior arch of atlas"],
  "massa-lateralis":             ["Atlas (C1)", "Lateral mass"],
  "fovea-dentis":                ["Atlas (C1)", "Facet for dens"],
  "sulcus-arteriae-vertebralis": ["Atlas (C1)", "Groove for vertebral artery"],
  "facies-articularis-superior": ["Atlas (C1)", "Superior articular surface of atlas"],
  "facies-articularis-inferior": ["Atlas (C1)", "Inferior articular surface of atlas"],
  "apex-dentis":                 ["Axis (C2)", "Apex of dens axis"],
  "facies-articularis-anterior": ["Axis (C2)", "Anterior articular facet of dens axis"],
  "facies-articularis-posterior":["Axis (C2)", "Posterior articular facet of dens axis"],

  /* ─ крестец и копчик ─ */
  "basis-ossis-sacri":           ["Sacrum", "Base of sacrum"],
  "apex-ossis-sacri":            ["Sacrum", "Apex of sacrum"],
  "ala-ossis-sacri":             ["Sacrum", "Ala of sacrum"],
  "facies-pelvina":              ["Sacrum", "Pelvic surface of sacrum"],
  "facies-dorsalis":             ["Sacrum", "Dorsal surface of sacrum"],
  "lineae-transversae":          ["Sacrum", "Transverse ridges"],
  "foramina-sacralia-anteriora": ["Sacrum", "Anterior sacral foramina"],
  "foramina-sacralia-posteriora":["Sacrum", "Posterior sacral foramina"],
  "pars-lateralis":              ["Sacrum", "Lateral part of sacrum"],
  "facies-auricularis":          ["Sacrum", "Auricular surface of sacrum"],
  "tuberositas-sacralis":        ["Sacrum", "Sacral tuberosity"],
  "crista-sacralis-intermedia":  ["Sacrum", "Intermediate sacral crest"],
  "crista-sacralis-lateralis":   ["Sacrum", "Lateral sacral crest"],
  "cornu-sacrale":               ["Sacrum", "Sacral horn"],
  "cornu-coccygeum":             ["Coccyx", "Coccygeal horn"],

  /* ─ ребро и грудина ─ */
  "corpus-costae":               ["Sixth rib", "Body of rib"],
  "crista-capitis-costae":       ["Sixth rib", "Crest of head of rib"],
  "crista-colli-costae":         ["Sixth rib", "Crest of neck of rib"],
  "facies-articularis-capitis-costae":   ["Sixth rib", "Articular facets of head of rib"],
  "facies-articularis-tuberculi-costae": ["Sixth rib", "Articular facet of tubercle of rib"],
  "incisura-clavicularis":       ["Manubrium of sternum", "Clavicular notch"],
  "incisurae-costales":          ["Body of sternum", "Costal notches"],

  /* ─ свободная нижняя конечность ─ */
  "femur":                ["Femur", "Femur"],
  "caput-femoris":        ["Femur", "Head of femur"],
  "fovea-capitis-femoris":["Femur", "Fovea for ligament of head of femur"],
  "collum-femoris":       ["Femur", "Neck of femur"],
  "trochanter-major":     ["Femur", "Greater trochanter"],
  "trochanter-minor":     ["Femur", "Lesser trochanter"],
  "fossa-trochanterica":  ["Femur", "Trochanteric fossa"],
  "linea-aspera":         ["Femur", "Linea aspera"],
  "condylus-medialis":    ["Femur", "Medial condyle of femur"],
  "fossa-intercondylaris":["Femur", "Intercondylar fossa"],
  "patella":              ["Patella", null],
  "tibia":                ["Tibia", "Tibia"],
  "tuberositas-tibiae":   ["Tibia", "Tibial tuberosity"],
  "fibula":               ["Fibula", "Fibula"],
  "caput-fibulae":        ["Fibula", "Head of fibula"],
  "malleolus-medialis":   ["Tibia", "Medial malleolus"],
  "malleolus-lateralis":  ["Fibula", "Lateral malleolus"],
  "ossa-tarsi":           [G.tarsus, null],
  "talus":                ["Talus", "Body of talus"],
  "calcaneus":            ["Calcaneus", "Calcaneal tuberosity"],
  "tuber-calcanei":       ["Calcaneus", "Calcaneal tuberosity"],
  "os-naviculare":        ["Navicular bone", null],
  "ossa-cuneiformia":     [G.cuneiform, null],
  "os-cuboideum":         ["Cuboid bone", null],
  "ossa-metatarsi":       [G.metatarsus, null],
  "phalanx-distalis":     [G.distPhalFoot, null],
  "arcus-pedis-longitudinalis": [G.arch, null]
};
