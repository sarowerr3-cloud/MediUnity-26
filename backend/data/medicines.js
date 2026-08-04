/**
 * MediUnity Medicine Database
 * Common medicines with generic names, brand names, dosage forms, and common dosages
 * Based on WHO Essential Medicines List + popular brands globally
 */
const medicines = [
  // === ANALGESICS / PAIN RELIEF ===
  { genericName: "Paracetamol", brandNames: ["Napa", "Ace", "Tylenol", "Panadol", "Calpol"], dosageForms: ["tablet", "syrup", "suppository"], commonDosages: ["500mg", "650mg", "1000mg"], category: "Analgesic" },
  { genericName: "Ibuprofen", brandNames: ["Brufen", "Advil", "Inflam", "Profen"], dosageForms: ["tablet", "capsule", "syrup"], commonDosages: ["200mg", "400mg", "600mg"], category: "NSAID" },
  { genericName: "Diclofenac Sodium", brandNames: ["Voltalin", "Clofenac", "Diclofen", "Voltaren"], dosageForms: ["tablet", "injection", "cream"], commonDosages: ["25mg", "50mg", "75mg"], category: "NSAID" },
  { genericName: "Naproxen", brandNames: ["Naprosyn", "Aleve", "Naprox"], dosageForms: ["tablet"], commonDosages: ["250mg", "500mg"], category: "NSAID" },
  { genericName: "Aspirin", brandNames: ["Ecosprin", "Disprin", "Bayer Aspirin"], dosageForms: ["tablet"], commonDosages: ["75mg", "150mg", "300mg"], category: "Analgesic" },
  { genericName: "Tramadol", brandNames: ["Tramal", "Tramadol", "Tridol"], dosageForms: ["tablet", "capsule", "injection"], commonDosages: ["50mg", "100mg"], category: "Opioid Analgesic" },

  // === ANTIBIOTICS ===
  { genericName: "Amoxicillin", brandNames: ["Moxacil", "Amoxil", "Tycil", "Augmentin"], dosageForms: ["capsule", "syrup"], commonDosages: ["250mg", "500mg"], category: "Antibiotic" },
  { genericName: "Azithromycin", brandNames: ["Azith", "Zimax", "Zithromax", "Azicin"], dosageForms: ["tablet", "capsule", "syrup"], commonDosages: ["250mg", "500mg"], category: "Antibiotic" },
  { genericName: "Ciprofloxacin", brandNames: ["Cipro", "Ciprocin", "Ciproxin"], dosageForms: ["tablet", "injection"], commonDosages: ["250mg", "500mg", "750mg"], category: "Antibiotic" },
  { genericName: "Levofloxacin", brandNames: ["Levoflox", "Tavanic", "Levoquin"], dosageForms: ["tablet", "injection"], commonDosages: ["250mg", "500mg", "750mg"], category: "Antibiotic" },
  { genericName: "Metronidazole", brandNames: ["Flagyl", "Amodis", "Metro"], dosageForms: ["tablet", "injection", "syrup"], commonDosages: ["200mg", "400mg"], category: "Antibiotic" },
  { genericName: "Cefixime", brandNames: ["Cef-3", "Cefix", "Suprax"], dosageForms: ["capsule", "syrup"], commonDosages: ["200mg", "400mg"], category: "Antibiotic" },
  { genericName: "Ceftriaxone", brandNames: ["Ceftron", "Rocephin", "Trixone"], dosageForms: ["injection"], commonDosages: ["500mg", "1g", "2g"], category: "Antibiotic" },
  { genericName: "Doxycycline", brandNames: ["Doxicap", "Vibramycin", "Doxylin"], dosageForms: ["capsule"], commonDosages: ["100mg"], category: "Antibiotic" },
  { genericName: "Flucloxacillin", brandNames: ["Fluclox", "Floxapen"], dosageForms: ["capsule", "syrup"], commonDosages: ["250mg", "500mg"], category: "Antibiotic" },

  // === GASTROINTESTINAL ===
  { genericName: "Omeprazole", brandNames: ["Seclo", "Losec", "Prilosec", "Omefast"], dosageForms: ["capsule"], commonDosages: ["20mg", "40mg"], category: "PPI" },
  { genericName: "Esomeprazole", brandNames: ["Sergel", "Nexium", "Esoral"], dosageForms: ["capsule", "tablet"], commonDosages: ["20mg", "40mg"], category: "PPI" },
  { genericName: "Pantoprazole", brandNames: ["Pantonix", "Pantop", "Protonix"], dosageForms: ["tablet", "injection"], commonDosages: ["20mg", "40mg"], category: "PPI" },
  { genericName: "Ranitidine", brandNames: ["Rantac", "Zantac", "Ranidin"], dosageForms: ["tablet", "injection"], commonDosages: ["150mg", "300mg"], category: "H2 Blocker" },
  { genericName: "Domperidone", brandNames: ["Motilium", "Omidon", "Domin"], dosageForms: ["tablet", "syrup"], commonDosages: ["10mg"], category: "Antiemetic" },
  { genericName: "Metoclopramide", brandNames: ["Maxolon", "Perinorm", "Reglan"], dosageForms: ["tablet", "injection"], commonDosages: ["10mg"], category: "Antiemetic" },
  { genericName: "Ondansetron", brandNames: ["Ondem", "Zofran", "Emistat"], dosageForms: ["tablet", "injection"], commonDosages: ["4mg", "8mg"], category: "Antiemetic" },

  // === ANTIHYPERTENSIVES ===
  { genericName: "Amlodipine", brandNames: ["Amdocal", "Norvasc", "Amlopin"], dosageForms: ["tablet"], commonDosages: ["2.5mg", "5mg", "10mg"], category: "CCB" },
  { genericName: "Losartan", brandNames: ["Losartan", "Cozaar", "Angiazide"], dosageForms: ["tablet"], commonDosages: ["25mg", "50mg", "100mg"], category: "ARB" },
  { genericName: "Atenolol", brandNames: ["Tenormin", "Aten", "Ateno"], dosageForms: ["tablet"], commonDosages: ["25mg", "50mg", "100mg"], category: "Beta Blocker" },
  { genericName: "Metoprolol", brandNames: ["Metocard", "Lopressor", "Betaloc"], dosageForms: ["tablet"], commonDosages: ["25mg", "50mg", "100mg"], category: "Beta Blocker" },
  { genericName: "Enalapril", brandNames: ["Enapril", "Vasotec", "Enalid"], dosageForms: ["tablet"], commonDosages: ["2.5mg", "5mg", "10mg", "20mg"], category: "ACE Inhibitor" },
  { genericName: "Hydrochlorothiazide", brandNames: ["Hydrazide", "Microzide"], dosageForms: ["tablet"], commonDosages: ["12.5mg", "25mg"], category: "Diuretic" },

  // === DIABETES ===
  { genericName: "Metformin", brandNames: ["Comet", "Glucophage", "Novamet"], dosageForms: ["tablet"], commonDosages: ["500mg", "850mg", "1000mg"], category: "Antidiabetic" },
  { genericName: "Glimepiride", brandNames: ["Amaryl", "Glimep", "Diapride"], dosageForms: ["tablet"], commonDosages: ["1mg", "2mg", "4mg"], category: "Sulfonylurea" },
  { genericName: "Insulin (Rapid-Acting)", brandNames: ["NovoRapid", "Humalog", "Apidra"], dosageForms: ["injection"], commonDosages: ["100 IU/ml"], category: "Insulin" },
  { genericName: "Insulin (Long-Acting)", brandNames: ["Lantus", "Levemir", "Tresiba"], dosageForms: ["injection"], commonDosages: ["100 IU/ml"], category: "Insulin" },

  // === ANTIHISTAMINES / ALLERGY ===
  { genericName: "Cetirizine", brandNames: ["Alatrol", "Zyrtec", "Cetzin"], dosageForms: ["tablet", "syrup"], commonDosages: ["5mg", "10mg"], category: "Antihistamine" },
  { genericName: "Fexofenadine", brandNames: ["Fexo", "Allegra", "Telfast"], dosageForms: ["tablet"], commonDosages: ["60mg", "120mg", "180mg"], category: "Antihistamine" },
  { genericName: "Loratadine", brandNames: ["Loraday", "Claritin", "Loratin"], dosageForms: ["tablet", "syrup"], commonDosages: ["10mg"], category: "Antihistamine" },
  { genericName: "Montelukast", brandNames: ["Montair", "Singulair", "Montelair"], dosageForms: ["tablet"], commonDosages: ["4mg", "5mg", "10mg"], category: "Leukotriene Inhibitor" },

  // === RESPIRATORY ===
  { genericName: "Salbutamol", brandNames: ["Ventolin", "Sultolin", "Brodil"], dosageForms: ["inhaler", "syrup", "tablet"], commonDosages: ["100mcg/puff", "2mg", "4mg"], category: "Bronchodilator" },
  { genericName: "Fluticasone", brandNames: ["Flixotide", "Fluticort"], dosageForms: ["inhaler"], commonDosages: ["50mcg", "125mcg", "250mcg"], category: "Corticosteroid" },
  { genericName: "Dextromethorphan + Guaifenesin", brandNames: ["Tus-Q", "Robitussin", "Ambrodil"], dosageForms: ["syrup"], commonDosages: ["5ml", "10ml"], category: "Cough Suppressant" },

  // === ANTIDEPRESSANTS / MENTAL HEALTH ===
  { genericName: "Sertraline", brandNames: ["Serenata", "Zoloft", "Sertima"], dosageForms: ["tablet"], commonDosages: ["25mg", "50mg", "100mg"], category: "SSRI" },
  { genericName: "Escitalopram", brandNames: ["Cipralex", "Lexapro", "Escita"], dosageForms: ["tablet"], commonDosages: ["5mg", "10mg", "20mg"], category: "SSRI" },
  { genericName: "Amitriptyline", brandNames: ["Elavil", "Amitril", "Tryptanol"], dosageForms: ["tablet"], commonDosages: ["10mg", "25mg", "50mg"], category: "TCA" },
  { genericName: "Clonazepam", brandNames: ["Rivotril", "Klonopin", "Clonotril"], dosageForms: ["tablet"], commonDosages: ["0.25mg", "0.5mg", "1mg", "2mg"], category: "Benzodiazepine" },

  // === VITAMINS & SUPPLEMENTS ===
  { genericName: "Calcium + Vitamin D3", brandNames: ["Calbo-D", "Shelcal", "Caltrate"], dosageForms: ["tablet"], commonDosages: ["500mg+200IU", "600mg+400IU"], category: "Supplement" },
  { genericName: "Iron + Folic Acid", brandNames: ["Ferosac", "Hemifer", "FeFol"], dosageForms: ["tablet", "capsule"], commonDosages: ["100mg+0.5mg"], category: "Supplement" },
  { genericName: "Vitamin B Complex", brandNames: ["Becosules", "Neurobion", "Bextra"], dosageForms: ["tablet", "injection"], commonDosages: ["1 tablet"], category: "Supplement" },
  { genericName: "Zinc", brandNames: ["Zincofer", "Zincovit", "Baby Zinc"], dosageForms: ["tablet", "syrup"], commonDosages: ["10mg", "20mg"], category: "Supplement" },
  { genericName: "Multivitamin", brandNames: ["Aristovit", "Centrum", "One-A-Day"], dosageForms: ["tablet", "syrup"], commonDosages: ["1 tablet"], category: "Supplement" },

  // === DERMATOLOGY ===
  { genericName: "Clotrimazole", brandNames: ["Canesten", "Candid", "Fungicare"], dosageForms: ["cream"], commonDosages: ["1%"], category: "Antifungal" },
  { genericName: "Hydrocortisone", brandNames: ["Cortisol", "Hydrosone"], dosageForms: ["cream"], commonDosages: ["0.5%", "1%"], category: "Corticosteroid" },
  { genericName: "Betamethasone", brandNames: ["Betnovate", "Celestone"], dosageForms: ["cream"], commonDosages: ["0.1%"], category: "Corticosteroid" },
  { genericName: "Mupirocin", brandNames: ["Bactroban", "T-Bact", "Mupira"], dosageForms: ["cream"], commonDosages: ["2%"], category: "Antibiotic" },

  // === OPHTHALMOLOGY ===
  { genericName: "Ciprofloxacin Eye Drops", brandNames: ["Ciplox Eye", "Ciloxan"], dosageForms: ["drops"], commonDosages: ["0.3%"], category: "Ophthalmic Antibiotic" },
  { genericName: "Artificial Tears", brandNames: ["Refresh Tears", "Systane", "Tears Naturale"], dosageForms: ["drops"], commonDosages: ["0.5%"], category: "Lubricant" },
];

export default medicines;
