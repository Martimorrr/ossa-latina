/* Модели костей и привязка терминов к точкам на них.
   Геометрия и метки: Z-Anatomy (CC BY-SA 4.0), построен на BodyParts3D
   (c) The Database Center for Life Science, CC BY-SA 2.1 Japan. */

const BONES = {
  humerus: { file: "bones/humerus.json", title: "Плечевая кость" }
};

/* id термина → [кость, имя метки внутри модели] */
const TERM_3D = {
  "humerus":                  ["humerus", "Humerus"],
  "caput-humeri":             ["humerus", "Head of humerus"],
  "collum-anatomicum":        ["humerus", "Anatomical neck of humerus"],
  "collum-chirurgicum":       ["humerus", "Surgical neck of humerus"],
  "tuberculum-majus":         ["humerus", "Greater tubercle"],
  "tuberculum-minus":         ["humerus", "Lesser tubercle"],
  "sulcus-intertubercularis": ["humerus", "Intertubercular sulcus"],
  "tuberositas-deltoidea":    ["humerus", "Deltoid tuberosity"],
  "sulcus-nervi-radialis":    ["humerus", "Radial groove"],
  "capitulum-humeri":         ["humerus", "Capitulum of humerus"],
  "trochlea-humeri":          ["humerus", "Trochlea of humerus"],
  "fossa-olecrani":           ["humerus", "Olecranon fossa"],
  "fossa-coronoidea":         ["humerus", "Coronoid fossa"],
  "epicondylus-medialis":     ["humerus", "Medial epicondyle of humerus"],
  "epicondylus-lateralis":    ["humerus", "Lateral epicondyle of humerus"]
};
