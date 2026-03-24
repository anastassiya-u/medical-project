# **Протокол сбора данных: Сравнительный анализ «Оракула» и «Критика»** 

Исследование организовано как *between-subjects experiment* (межсубъектный эксперимент), где участники случайным образом распределяются в одну из двух групп взаимодействия с ИИ.

## **1\. Дизайн экспериментальных интерфейсов**

Вам необходимо реализовать два типа логики взаимодействия, которые фундаментально различаются по уровню поддержки агентности врача.

* **Группа А: «Оракул» (*Directive XAI*).** Система работает по модели *recommend-and-defend*: сначала выдается готовый диагноз, а затем — *unilateral explanation* (одностороннее объяснение), перечисляющее признаки, подтверждающие правоту ИИ.  
* **Группа Б: «Критикующий» (*Evaluative AI*).** Система реализует гипотезо-ориентированный подход: она не дает ответа, пока студент не введет свой диагноз, после чего выдает *contrastive explanation* (контрастивное объяснение) с уликами «за» и «против» версии студента.

## **2\. Процедура сбора данных (Flow)**

Для корректного анализа (ANCOVA) процесс должен быть разделен на четыре строгих этапа:

1. **Пре-тест (Pre-intervention):** Студент решает 5 клинических кейсов самостоятельно без поддержки ИИ для оценки базовых знаний.  
2. **Анкетирование NFC:** Студент заполняет сокращенную шкалу *Need for Cognition* (NFC) для оценки склонности к аналитическому мышлению.  
3. **Интервенция (Intervention):** Студент решает 14–15 кейсов с помощью назначенного ИИ («Оракула» или «Критика»). В 30% случаев ИИ дает неверные советы для измерения калибровки доверия.  
4. **Пост-тест (Post-intervention):** Студент решает еще 5 новых кейсов снова без ИИ, чтобы измерить реальный прирост навыков **через неделю**.   
5. **Субъективная оценка и Интервью:** Заполнение шкал Ликерта и проведение полуструктурированного интервью.

## **3\. Целевые метрики и инструменты измерения**

Для устранения несоответствий мы выделяем три группы данных, которые будут собираться в ходе логирования и опросов.

### **А. Объективные метрики производительности (Логи системы)**

* **Initial Accuracy (Пре-тест):** Точность ответов до получения помощи ИИ.  
* **Overreliance Rate (Интервенция):** Процент случаев, когда студент согласился с ошибочной рекомендацией ИИ.  
* **Task Completion Time:** Время с момента предъявления кейса до финального ответа (показатель когнитивной нагрузки).  
* **Learning Gain (недельная проверка):** Разница в точности между пост-тестом и пре-тестом, показывающая, развил ли студент клиническое мышление.  
* Overalll accuracy

### **Б. Субъективные метрики (Шкалы Likert)**

Используются 5-балльные шкалы для оценки внутреннего состояния студента:

* **Perceived Autonomy:** Степень ощущения контроля над решением (адаптировано из IMI).  
* **Trust Calibration:** Субъективное доверие к логике системы («Я доверяю тому, как ИИ взвешивает симптомы»).  
* **NASA TL x**

### **В. Качественные данные (Интервью)**

Block 1: Warm-up questions (Establishing contact and context)

* How often do you use digital reference books or decision support systems in the learning process?  
* What is your general attitude towards the introduction of AI in hospitals in Kazakhstan: is it an assistant or a substitute for a doctor?  
* Do you think that the current medical education at your university provides enough knowledge to critically evaluate the work of medical algorithms?

Block 2: The main part (The experience of interacting with the interface)

* In which of the two systems did you feel more control over the final diagnosis? Why?  
* Was there a moment when the “Oracle” offered an answer that you didn't agree with? How did you check his correctness?  
* Describe your feelings when working with the "Critic": did it bother you that the system did not give a direct answer but required your hypothesis first?  
* What exactly are the elements of the explanation (graphs of the importance of features, lists of "pros" and "cons") were they the most convincing for you?

Block 3: Thematic block (Socio-cultural specifics of Kazakhstan)

* If an experienced doctor-professor at the department had given you advice without explaining it, and the AI had offered a different solution with detailed justification, who would you trust first?  
* Do you think that clinics in Kazakhstan encourage discussion and challenge the opinions of colleagues or does the principle of "authority is always right" prevail?  
* Do you think the "Criticism" format will help young doctors adapt faster to work in conditions of a shortage of specialized specialists in the regions of the Republic of Kazakhstan?

Block 4: Closing questions

* What interface would you like to see on your work tablet in 5 years?  
* Is there anything else you've noticed about the systems that we haven't talked about?

## **4\. План анализа данных**

Теперь план анализа (пункт 5\) напрямую отвечает на метрики (пункт 3).

1. **Анализ ANCOVA:** Мы используем результаты пре-теста как ковариату, чтобы доказать, что разница в *Learning Gain* между группами «Оракула» и «Критика» вызвана именно дизайном объяснений, а не разным уровнем изначальных знаний студентов.  
2. **Модерация через NFC:** Мы проверяем гипотезу о том, что «Критик» дает больше преимуществ студентам с высоким уровнем *Need for Cognition*, в то время как студенты с низким NFC могут показывать более высокий *Overreliance*.  
3. **Тематическое кодирование:** Анализ транскриптов интервью для подтверждения связи между дизайном интерфейса и культурной привычкой доверять «авторитетным» источникам без верификации (проблема *verifiability*).

This study aims to determine whether the directive logic of the “Oracle” or the evaluative support of the “Critic” is more conducive to building strategic trust among medical students in Kazakhstan. By testing these paradigms under varying levels of AI accuracy, the research seeks to establish the first empirically grounded guidelines for XAI implementation in Kazakhstan’s clinical education. To achieve this, the following hypotheses are proposed:  
1\. Hypothesis 1 (H1): the “Critic” paradigm leads to significantly better trust calibration, comparing to the “Oracle”, fostering clinical autonomy of a user.

2\. Hypothesis 2 (H2): explanations that prioritize "verifiability" will trigger slow, analytical thinking, thereby reducing the negative synergy often observed in human-AI collaboration

3\. Hypothesis 3 (H3): The historical legacy of the centralized "Semashko" system, characterized by top-down communication, will increase the baseline rate of overreliance on AI advice unless specific "cognitive forcing" functions are applied

These hypotheses explore the research question from different angles. H1 will help to determine the optimal interaction paradigm (XAI or Evaluative AI). H2 will contribute to evaluating the specific functional quality of explanations—verifiability—that makes adoption safe rather than just intuitive. Finally, H3 accounts for the unique cultural variables of Kazakhstan, ensuring that the resulting guidelines are not just western-centric but are calibrated for regions with high authority deference. Together, these findings will provide a comprehensive roadmap for integrating AI that enhances the expertise of future clinicians