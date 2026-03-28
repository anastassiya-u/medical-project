/**
 * Add Russian translations for differential diagnosis comparisons
 */

const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '../src/data/cases_russian.json');
const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

console.log('🔄 Adding Russian differential diagnosis translations...\n');

// Manual professional translations for differential diagnoses
const differentialTranslations = {
  // Common diagnoses
  'Acute Appendicitis': 'Острый аппендицит',
  'Acute Appendicitis (Grade II)': 'Острый аппендицит (II степень)',
  'Acute Appendicitis (Grade III)': 'Острый аппендицит (III степень)',
  'Acute Appendicitis (Grade IV)': 'Острый аппендицит (IV степень)',
  'Perforated Appendicitis (Grade IV)': 'Перфоративный аппендицит (IV степень)',
  'Normal Appendix': 'Нормальный аппендикс',

  'Acute Cholecystitis': 'Острый холецистит',
  'Ascending Cholangitis': 'Восходящий холангит',
  'Acute Pancreatitis': 'Острый панкреатит',
  'Biliary Colic': 'Желчная колика',

  'Acute Diverticulitis': 'Острый дивертикулит',
  'Diverticulitis': 'Дивертикулит',
  'Perforated Diverticulitis': 'Перфоративный дивертикулит',

  'Ectopic Pregnancy': 'Внематочная беременность',
  'Ovarian Torsion': 'Перекрут яичника',
  'Pelvic Inflammatory Disease': 'Воспалительное заболевание органов малого таза',
  'Ovarian Cyst Rupture': 'Разрыв кисты яичника',

  'Perforated Peptic Ulcer': 'Перфоративная язва',
  'Perforated Duodenal Ulcer': 'Перфоративная язва двенадцатиперстной кишки',
  'Perforated Gastric Ulcer': 'Перфоративная язва желудка',

  'Small Bowel Obstruction': 'Тонкокишечная непроходимость',
  'Adhesive Small Bowel Obstruction': 'Спаечная тонкокишечная непроходимость',
  'Large Bowel Obstruction': 'Толстокишечная непроходимость',
  'Colonic Pseudo-obstruction (Ogilvie Syndrome)': 'Псевдообструкция толстой кишки (синдром Огилви)',
  'Paralytic Ileus': 'Паралитическая непроходимость',

  'Type A Aortic Dissection': 'Расслоение аорты типа A',
  'Aortic Dissection with Mesenteric Ischemia': 'Расслоение аорты с мезентериальной ишемией',
  'Mesenteric Ischemia': 'Мезентериальная ишемия',
  'Acute Mesenteric Ischemia': 'Острая мезентериальная ишемия',

  'Constipation': 'Запор',
  'Fecal Impaction': 'Каловый завал',
  'Irritable Bowel Syndrome': 'Синдром раздражённого кишечника',
  'Gastroenteritis': 'Гастроэнтерит',
  'Viral Gastroenteritis': 'Вирусный гастроэнтерит',

  'Urinary Tract Infection': 'Инфекция мочевыводящих путей',
  'Pyelonephritis': 'Пиелонефрит',
  'Nephrolithiasis (Kidney Stone)': 'Нефролитиаз (почечный камень)',
  'Renal Colic': 'Почечная колика',
};

// Common medical terms for differentiators
const medicalTerms = {
  'elevated': 'повышен',
  'normal': 'норма',
  'absent': 'отсутствует',
  'present': 'присутствует',
  'negative': 'отрицательный',
  'positive': 'положительный',
  'wall thickening': 'утолщение стенки',
  'perforation': 'перфорация',
  'abscess': 'абсцесс',
  'dilated': 'расширен',
  'pain': 'боль',
  'fever': 'лихорадка',
  'tenderness': 'болезненность',
};

/**
 * Translate diagnosis name
 */
function translateDiagnosis(diagnosis) {
  return differentialTranslations[diagnosis] || diagnosis;
}

/**
 * Translate differentiator text (partial translation of key terms)
 */
function translateDifferentiator(text) {
  // Keep English medical values and add Russian explanation
  // This is a simplified approach - we'll translate key parts
  return text; // Keep original for now as differentiators contain complex medical reasoning
}

let updatedCount = 0;

// Process each case
casesData.cases = casesData.cases.map(caseData => {
  if (caseData.differentialComparison && caseData.differentialComparison.length > 0) {
    // Add Russian version
    caseData.differentialComparison_ru = caseData.differentialComparison.map(item => ({
      diagnosis: translateDiagnosis(item.diagnosis),
      match: item.match, // Keep percentage as is
      differentiator: item.differentiator // Keep detailed medical reasoning in English for now
    }));

    console.log(`✅ ${caseData.id}: Added Russian differential diagnosis (${caseData.differentialComparison.length} items)`);
    updatedCount++;
  }

  return caseData;
});

// Update metadata
casesData.metadata.last_updated = new Date().toISOString().split('T')[0];
casesData.metadata.translation_notes += ' + differential diagnosis names';

// Save
fs.writeFileSync(casesPath, JSON.stringify(casesData, null, 2), 'utf8');

console.log('\n' + '='.repeat(60));
console.log('✅ DIFFERENTIAL DIAGNOSIS TRANSLATION COMPLETE');
console.log('='.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   - Cases with differential diagnosis: ${updatedCount}`);
console.log(`   - Output: src/data/cases_russian.json\n`);
