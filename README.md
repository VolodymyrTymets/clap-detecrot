# Home controll part 2 (cllap detections)

Не так давно я описав у статті , як можна управляти вашим будинком та технікою у ньому, за допомогою вашого смартфона та однокристального компютера Raspberry Py. Згодом я став задумуватися, яким іще чимо можна взаємодіяти із вашим будинком. Тому я став досліджувати це питання в інтернеті ось короткий список того на щоя наткнувся: 
- смартфон інші подібні гаджети;
- камера;
- голосовий сенсор;
- голосове управлянінян;
- [датчики руху](https://www.hackster.io/hardikrathod/pir-motion-sensor-with-raspberry-pi-415c04)
> тут можна детальніше шось пошукати (якщо є бажання  маркетологів)

І я став задумуватися над тим щоб б можна було реалізувати скажімо за вікенд на Node js, для того щоб можна було з легкістю інтегрувати у існуючі проекти. І мій вибір пав на звуковий сенсор. А саме на on/off освітлення за допомогою простого cllap. Я використав звичайні блютусні навушники із мікрофоном  підкоючив їх до Raspberry pi та написав невеликий алгоритм для реакції на хлопок людини.  І ось що у мене вийшло.
![](https://github.com/VolodymyrTymets/clap-detecrot/blob/master/clap-result.gif?raw=true)

> Для наглядності я використав діод тому що не мав під рукою реле. Як підключити ваше разбері до 220 V я детально описував у попередній статті.

## Трошки теорії
Звук сам по собі це коливання повітря. коли людина робить хлопок вона зпричияє різке збурення повітря. Воно у сво чергу здійснює тиск на мембпрну мікрофона. Ций тиск фіксується у вигляді аналового сигналу і предається на звукову карту. Вона ж пеперетворю аналоговий сигал на цифровий. Ось так вглядає запис кількох хлопців людини
![](https://raw.githubusercontent.com/VolodymyrTymets/clap-detecrot/master/cllap-record.PNG)

Вище зображено коливання повітря спричинено хлопком людини, так званна звукова амплітуда. Чим сильніша амплітуда тим і сильніший звук
> A +1-1 (t)

Це можна розуміти як зміну амплітуди(А) від -1 до +1 в залежності від часу (t). В загальному ваша машина сприймає звук як великий масив чисел від -1 до +1, де кожне число представляє значення амплітуди звуку в певний момент часу. І таких моменті дуже багато більше 10 000 значен за 1 секунду (залежить від якості запису).
Отже як визначити хлопок. Все насправді досить просто. Достатньо знйти певний поріг амплітуди обмежений певним моментом часу. Якщо амплітуда звукового сигналу перевицує цей поріг і не перевищує певний момент часу можна сказати що відбувся хлопок. Ці значення можна встанвоити шляхом експеременту.
![](https://raw.githubusercontent.com/VolodymyrTymets/clap-detecrot/master/cllap-record-schema.PNG)
де, t - мінімальний час хлопка, T - поріг максимальної амплітуди
## Реалізація
Перрш за все необхідно заставити вашу програму слухати мікровон. Для цього прекрасне [SOX](http://sox.sourceforge.net/sox.html) протокол обміну звуком. Щоб не розбиратися у всіз насторойка, які виглядають дещо запутано можна використати пакет [mic](https://www.npmjs.com/package/mic). Простий пакет який використовує це є стандарт але з набагато зрозумілішою документацією. Самий прости код запису виглядатиме так
```
const config = {
  rate: 44100,
  channels: 2,
  device: `plughw:${process.argv[2] || 0}`,
  fileType: 'wav',
};

const micInstance =  mic(config);
const stream = micInstance.getAudioStream();

stream.on('data', buffer => {
console.log('chank length ->', buffer.length); // <- recorded data in buffer format 
});
micInstance.start();
```
Як можна було замітити в документації бібліотеки показано як записувати у файл. Але нам цього не потрібно напросто потрібно слухати мікрофон не зберігаючи цб інформацію ніде. Тому ми і не використовуємо жодних файлів.
Настройки передані даній бібліотеці означатимуть що буде здійснбватися двохканальний запис на пристрій `plughw:0`. Список доступних пристрої можна дізнатися за допомогою команди `arecord -l`. Ще один важливий ммент чутливість вшого мікрофона може бути обмежена вашою операційною системою. В такому випадку ви просто запишете тишену. А це не зовсім те що нам потрубно. Її можна регулювати настройках звуку вашої операційної системи. Проте при роботі з raspberry часто доводить працювати тільки за допомогою консолі. То збільшити чи зменшити чутливість мікрофона через консоль можна за допомогою командт `chanhe her?` детальніше [тут]() 
Наступним кроком слід привести наші дані у числовий масив (значення амплітуди в певний момент часу), що мати змогу порівнювати амплітуду із певним порогом. Це можна зробити за допомогою пакету [wav-decoder](https://www.npmjs.com/package/wav-decoder). Проте тут є маленький нюанс. Даний пакет не розроблявся для роботи з потоками а тільки  для роботи із файлами wav. Тому якщо ви спробуєте напряму декодувати `buffer` у вас нічого не получиться. А всо тому що mic записує дані у `raw` форматі (чисті дані). Для того щоб успіно перетворити `raw` у `wav` потрібен header. Header це інформація про тип і додаткові налаштування запису які ми власне і прередавали у бібліотеку `mic`. Тут нам допоможе пакет [waveheader](https://www.npmjs.com/package/waveheader). Ось як тепер виглядатиме наш метод `on data`.

```
stream.on('data', buffer => {
    const headerBuf = header(config.rate, config);
    WavDecoder.decode(Buffer.concat([headerBuf, buffer], 2))
      .then(audioData => {
        const wave = audioData.channelData[0];
      })
      .catch(console.log);
  }
});
```
Тепер можна працювати із звуковою хвилею у числовому форматі. Можна найти максимальне значення `wave` та порівняти його із пороговим значення. Погогове значення можна встановити ексеперментальним шляхом я встановив що для коректної роботи воно становить > 0.7 (70 % від максимального значення амплітуди мікрофона).
```
const max = _.max(wave);
if (max > threshold) ...
```
Проте ми ще не врахували часовий інтервал. Даний метод `on data` виникає приьлизно кожні 90 mc. Но цього явно не достатньо для мінімального часового інтервалу для тривалості хлопка. Я взяв за це значення 500 мс. Тому я став обробляти дані і перевіряти чи перетнув звуковий сигнал тільки після того як пройшов цей час. 
```
const minTime = 500; // ms
const threshold = 0.7;
let time = null;
let buffers = [];
const micInstance =  mic(config);
const stream = micInstance.getAudioStream();

stream.on('data', buffer => {
  const newTime = new Date().getTime(); // -> get new time
  buffers.push(buffer); // -> save previous recorded data
  if(newTime - time > minTime) { // -> start do something if min time pass
    const headerBuf = header(config.rate, config); // ->  create wav header
    buffers.unshift(headerBuf); // -> set header in top of buffers
    const length = _.sum(buffers.map(b => b.length));
    
    WavDecoder.decode(Buffer.concat(buffers, length)) // -> decode buffers to float array
      .then(audioData => {
        const wave = audioData.channelData[0];
        const maxAmplitude = _.max(wave);
        if (maxAmplitude > threshold) {
         console.log('-----> clap'); // -> any logic here
        }
      })
      .catch(console.log);
    time = newTime; // -> reset the timer
    buffers = []; // free recorded data
  }
});

time = new Date().getTime();
micInstance.start();
```
Збереження буферу даний потрібне для більш точного декодування даних. Це пригодиться при роботі із більш складними алгоритмами обробки звукових хвиль. Проте можна і декодувати зразу і просто зберігати масив декодованих чисел.
Ось таким нескладним спомобом можна програмувати логіку обробки на хлопок людини. Все що залишається це упрапляти одним із виходів Raspberry pi підключеного до джерела живлення у вашому домі. Як це можна зробити розглядалося у попередній статті.

## Можливі Проблеми та варіанти вирішення
Розглянутий вище алгоритм, це всього лиш ідея того як можна реалізувати вирішення даної задачі. Звісно він не ідеальний оскільки був пидуманий і написаний за вікенд просто для розваги. Тому в ньому також є свої недоліки які можна вдосконатлити в подальшому. нижче наведено лише декілька із них.
- Шум

Нуми можуть спричинити велику пробелему для роботи даного алкогитму. Наприклад при неголосному прослуховуванню музкики пробоем не повинно виникнути. Проте якщо увімкнути її досить голосно палгоритм може досить некорекно працювати. Оскільки багато раз амплітуда звукк буде перетинати межу. Щоб цього уникнути можна враховувати період хлопка, під час якого максимальна амплітуда буде досить висока. У свою чергу у періоди перед та після хлопка повинна бути певна тиша. Схематично це виглядає так.

![](https://github.com/VolodymyrTymets/clap-detecrot/blob/master/cllap-record-schema_1.PNG?raw=true)
Під час періоду t максимальна амплідуда повинна бути більша за межу T, а під час періодів t-1 та t +1  повинна бути менша за межу T.

- двойний хлопок

Також можна написати алuоритм для визначення двойного хлопка. Я став задумуватися як це можна реалізувати. Я зроби кілька зап  записів і дізнався що період одного хлопка триваю +- 100 mc між лопками іде приблизно такий же період тиші + перед посатком та кінце серії хлопців також повинна в теорію бути тиша. Схематично це можа зобразити наступним чином.
![](https://github.com/VolodymyrTymets/clap-detecrot/blob/master/cllap-record-schema_2.PNG?raw=true)
Отже слід враховувати період хлопків під час яких максимальна амплітуда буде більша за межу. Та час між ними де максимальна амплітуда буде менша за межу.
- [перетворення фурє](https://en.wikipedia.org/wiki/Fast_Fourier_transform)

Для більш складиних алгоритмів роботи зі звуком використовують спектральний аналіз та алгоритм перетворення фурє. Даний алгоритм дозволяє показати при якій частоті звуковий сигнал дозяшав свого максимального знаачення. Я знаходив кілька його реалізацій в екоситсемі npm. особисто користувався оьсь цим [frequencyjs](https://www.npmjs.com/package/frequencyjs). 

## Висновки

Дану статтю варто розглядати теоретичні рішення поставленної задачі а не як готовий алгоритм. Доволі простий і примітивний алгоритм написаний за одні вижіні проосто для розваги. у даній статті я хотів показати щоб будь яку ідею можна втілити у життя якщо є бажання і фантазія. До того усе мона зроиби за допомогою платворми node js, що не може мене не радувати. Адже для втілення задуму мен не прийшлося тратити час на вивчення іної  мови.  
