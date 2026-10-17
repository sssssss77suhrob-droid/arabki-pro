# Lug‘at Lab

Arabcha–o‘zbekcha lug‘at uchun Telegram bot, Mini App va mustaqil HTML generatori.

## Holati
Web interfeys ishlaydi: namuna, flashcard, yozma javob, yo‘nalish, talaffuz, xatolar, saqlash, o‘chirish, aralashtirish, HTML eksport. Statik Sites havolasi brauzerda saqlash rejimidir; u Telegram bot serveri emas. Bot tokeni va serverga joylashtirish hali bajarilmagan. AI integratsiyasi OpenAI uchun yozilgan, haqiqiy API bilan tekshirilmagan; Gemini hozir yo‘q.

## Windows’da birinchi ishga tushirish
1. ZIP’ni alohida papkaga chiqaring. Python 3.10 yoki yangiroq versiya o‘rnatilgan bo‘lsin.
2. Telegramdagi rasmiy [BotFather](https://t.me/BotFather)ga `/newbot` yuborib bot yarating. Bot nomi va `bot` bilan tugaydigan bo‘sh username tanlang.
3. `SETUP_WINDOWS.bat`ni ikki marta bosing. Alohida Python muhiti va kutubxonalar o‘rnatiladi. So‘ralganda tokenni shu oynaga kiriting: yozganingiz ekranda ko‘rinmaydi.
4. HTTPS Mini App serveri hali yo‘q bo‘lsa manzilni bo‘sh qoldiring. Oddiy bot HTML yaratib yuborishi uchun Mini App shart emas. OpenAI API kaliti ham ixtiyoriy; kalitsiz AI shakllarni to‘ldirmaydi.
5. Sozlagich tokenni tekshiradi, `/start` va `/cancel` menyularini o‘rnatadi. HTTPS manzili berilsa Mini App menyusini ham ulaydi. Eski webhook aniqlansa uni o‘zi o‘chirmaydi.
6. `START_WINDOWS.bat`ni oching. Telegramda botga `/start` yuboring. Noutbuk va ushbu oyna ochiq turganda bot ishlaydi. To‘xtatish — Ctrl+C.
7. Keyinchalik server manzili yoki API kalitini qo‘shish uchun sozlagichni qayta ishga tushiring. Bo‘sh javob mavjud qiymatni saqlaydi.

Token va API kaliti mahalliy `.env` faylida turadi. Ushbu faylni Gitga, chatga yoki boshqalarga yubormang. Noto‘g‘ri token, internet yoki eski webhook bo‘yicha xatolar sozlash oynasida ko‘rsatiladi. Boshqa bot xatolarida Telegramdagi xabarni va server holatini tekshiring.

## Doimiy server va Mini App
Windows’da sinab ko‘rgach, 24/7 ishlashi uchun Docker o‘rnatilgan Linux server va HTTPS domen ishlating.

1. Domenning DNS yozuvini server IP manziliga yo‘naltiring; 80 va 443 portlari ochiq bo‘lsin.
2. `.env.example`ni `.env`ga nusxalab qiymatlarni serverda kiriting. `WEB_APP_URL=https://sizning-domeningiz` va `APP_DOMAIN=sizning-domeningiz` bo‘lsin. ChatGPT’dagi statik namuna havolasini qo‘ymang.
3. `docker compose -f compose.prod.yaml up -d --build` buyrug‘i backend va HTTPS uchun Caddy’ni ko‘taradi. Sertifikat olinishi domen va portlarga bog‘liq.
4. BotFather Mini App sozlamalarida shu HTTPS domenni belgilang. Botning /start menyusida ham Mini App tugmasi paydo bo‘ladi. Sozlash skripti bilan `setChatMenuButton` o‘rnatish mumkin.
5. `/health` manzilida `service: lugat-lab` chiqishi kerak. `bot_configured` faqat token kiritilganini bildiradi, muvaffaqiyatli Telegram ulanishiga kafolat emas.
6. Bir bot uchun **bitta** ishlayotgan nusxa bo‘lsin. Serverga o‘tganda noutbukdagi nusxani to‘xtating. SQLite `lugat_data` volume’ida saqlanadi; zaxira nusxasini oling. `down -v` ma’lumotlarni o‘chiradi, ishlatmang.

Agar tayyor reverse proxy mavjud bo‘lsa, oddiy `compose.yaml` backendni 127.0.0.1:8000 da ishga tushiradi. HTTPS proxy shu portga yo‘naltiriladi.

Docker’siz: `pip install -r requirements.txt`, `python scripts/setup_bot.py`, keyin `python scripts/run.py`. Sozlagich mavjud botning buyruqlar menyusini `/start` va `/cancel`ga yangilaydi; boshqa vazifadagi bot o‘rniga yangi bot ishlating.

## Lug‘at kiritish
Har satrda:
```
كِتَابٌ — kitob
كِتَابٌ | kitob | noun | كُتُبٌ
يَكْتُبُ | yozmoq | verb | كَتَبَ | يَكْتُبُ | اُكْتُبْ | كِتَابَةٌ | أَكْتُبُ
```
Fe’l tartibi: bosh so‘z | tarjima | verb | moziy | muzori’ | amr | masdar | men shakli.
Bir nechta qabul qilinadigan tarjimani `;` orqali ajrating. Fe’l satriga to‘qqizinchi ustun sifatida qo‘shimcha javoblar (`yozadi; yozyapti`), ot satriga esa beshinchi ustunda sinonimlar qo‘shish ham mumkin. AI natijasi `accepted_uz` ro‘yxatini to‘ldiradi. AI uchun botdagi xabarni `/ai` bilan boshlang. Mini Appda AI belgisini yoqing.

## Mantiq va chegaralar
- Bot va haqiqiy Mini App bir SQLite bazaga yozadi. Har foydalanuvchi faqat o‘z to‘plamlarini ko‘radi. Telegram initData HMAC va muddati serverda tekshiriladi.
- Telegramdan tashqari oddiy web va yuklangan HTML brauzer xotirasida saqlaydi. Brauzer ma’lumotlari tozalansa saqlangan to‘plamlar ketadi. HTML faylning o‘zida o‘sha lug‘atlar bor.
- Harakat va tatvil yozma tekshiruvga ta’sir qilmaydi. Hamza kabi boshqa harflar saqlanadi. Muzori’ fe’lning infinitiv tarjimasidan uchinchi shaxsdagi hozirgi variantlar ham qabul qilinadi: yozmoq / yozadi / yozyapti / yozmoqda. Shaxs yoki inkor ma’nosi o‘zgarsa to‘g‘ri hisoblanmaydi. Boshqa sinonimlar `accepted_uz` yoki `;` bilan beriladi.
- Harakatlar bilan sarf tayyorlash uchun AI yoki to‘liq qo‘lda format kerak. Web namunasida ayrim tanilgan so‘zlar avtomatik to‘ldiriladi; noma’lum so‘zdan fe’l/ko‘plik taxmin qilinmaydi.
- AI natijasini foydalanuvchi tekshirishi kerak; har bir so‘zga kafolatli sarf lug‘ati emas.
- Talaffuz Web Speech API orqali. Arabcha tizim ovozi bo‘lmasa yoki brauzer autoplay’ni cheklasa, tugmani bosish / ovoz paketini o‘rnatish kerak. Ovozning offline ishlashi qurilmaga bog‘liq.
- HTMLlar o‘z ichiga UI va lug‘atlarni oladi; mashq uchun server shart emas. Telegram SDK faqat onlayn webda yuklanadi.
- Yozma mashqda xato javobni qayta yozish mumkin; oxirgi tekshirilgan natija hisoblanadi. Javobsiz so‘zlar alohida sanaladi.
- Bot odatda 300 tagacha so‘z qabul qiladi. Botda saqlangan dastlabki 60 to‘plam ko‘rsatiladi; Mini Appda barchasi ochiladi.

## Tekshiruv
`python -m unittest discover -s tests -v` va `node tests/frontend.cjs`
9 ta backend tekshiruvi (jumladan 10 ta umumiy lug‘at formati) va frontend javob tekshiruvlari o‘tdi. Botning HTML yaratish, yuborish, saqlash va Mini Appdan o‘qish oqimi Telegram o‘rniga test javoblari bilan tekshirildi. Real Telegram va OpenAI integratsiyasi tokenlar bilan alohida tekshirilishi kerak. Brauzer avtomatlashtirilgan vizual tekshiruv bajarilmagan.

Rasmiy hujjatlar: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app ; https://developers.openai.com/api/reference/resources/responses/methods/create

## 2026-10-17 yangilanishi
- Yozadi / yozyapti javoblarini rad etish tuzatildi.
- Flashcard va yozma javob ochilganda karta 3D aylanadi.
- Harakat kamaytirish sozlamasini yoqqan qurilmalarda aylanish o‘chadi.
- Windows sozlagichi va server HTTPS konfiguratsiyasi qo‘shildi.

## Nom bilan saqlash va fe’l shakllari
Web/HTMLda «Saqlash» bosilgach nom so‘raladi; bo‘sh nom qabul qilinmaydi. Telegramda ham «Saqlash»dan keyin keyingi xabarda nom yuboriladi. Bot nomlangan HTMLni qayta yuboradi va shu nomda saqlaydi. Nomi 1–80 belgi bo‘lsin.

Quyidagi ikki format AI kalitisiz ham bitta kartaga aylanadi:
```
كَتَبَ / يَكْتُبُ / اُكْتُبْ / كِتَابَةٌ — yozmoq
```
Yoki:
```
Tarjima: yozmoq
Moziy: كَتَبَ
Muzori’: يَكْتُبُ
Amr: اُكْتُبْ
Masdar: كِتَابَةٌ
Men: أَكْتُبُ
```
Asosiy so‘z — يَكْتُبُ; to‘rt shakl kartaning ichida saqlanadi. «Men» maydoni ixtiyoriy. Ta’minlanmagan noma’lum shakllar taxmin qilib yaratilmaydi. To‘rt arabcha shaklni moziy–muzori’–amr–masdar tartibida alohida satrlarda, oxirida tarjimasi bilan yuborish ham mumkin.

Kichik ichki namuna lug‘atidagi tanilgan fe’llarning alohida yuborilgan shakllari ham birlashtiriladi. Bir xil so‘z va bir xil tarjimaning takrorlari olib tashlanadi; ma’nosi boshqa bo‘lsa alohida karta saqlanadi. Umumiy erkin matn, noma’lum tartib yoki yetishmayotgan sarf shakllarini to‘ldirish uchun OpenAI ulanishi kerak.

Parser misollari HTML va serverda bir xil `tests/parser_cases.json` bilan tekshiriladi. HTMLga joylangan parser manbasi `scripts/vocabulary_parser.js`; undagi o‘zgarishni HTMLdagi mos bo‘limga ham ko‘chirish lozim.

## Kerakli ulanishlar
- Telegram bot: BotFather tokeni kerak; boshqa Telegram API ID/API hash kerak emas. Token lokal sozlash oynasiga kiritiladi.
- AI: ushbu versiya `OPENAI_API_KEY` bilan ishlaydi. Kalitsiz nomlangan/standart shakllarni ajratish, HTML yaratish, saqlash va mashqlar ishlaydi. Gemini hozir ulanmagan.
- Mini App: backend joylashgan ochiq HTTPS manzil kerak. Hozirgi ChatGPT Sites sahifasi shu backendning o‘rnini bosa olmaydi.

## Railway orqali serverda ishga tushirish
Windows fayllarini ochish talab qilinmaydi. Kodni alohida private GitHub repozitoriyga joylashtirib, Railway xizmatini shu repozitoriyga ulang. Mavjud boshqa bot repozitoriysini almashtirmang.

1. `railway.json` Dockerfile orqali quradi; `backend.serve` Railway bergan `PORT`da bitta worker bilan ishlaydi. Bitta replica qoldiring: bitta token uchun ikkita polling jarayoni ishlamasligi kerak.
2. Xizmatga doimiy volume ulang: mount path `/app/data`. `DATABASE_PATH=/app/data/lugat.db` qilib belgilang. Volume bo‘lmasa qayta deploy vaqtida lug‘atlar yo‘qolishi mumkin.
3. Railway Variables ichiga `TELEGRAM_BOT_TOKEN`ni kiriting va Seal qiling. Tokenni chatga yoki GitHubga yozmang. `OPENAI_API_KEY` ixtiyoriy, u ham maxfiy variable bo‘lsin.
4. Xizmat uchun public domain yarating. `RAILWAY_PUBLIC_DOMAIN` bo‘lsa Mini App manzili avtomatik olinadi; kerak bo‘lsa `WEB_APP_URL=https://...` bilan aniq belgilang. Domain yaratilgach xizmatni qayta deploy qiling.
5. `/health` javobini tekshiring. `bot_configured: true` token borligini bildiradi, Telegram bilan muvaffaqiyatli aloqa bo‘lganini bildirmaydi. Yakuniy tekshiruv — botga `/start` yuborib HTML yaratish, nom bilan saqlash va Mini App ichida shu to‘plamni ochish.
6. BotFather orqali bot menyusiga shu HTTPS manzilni bering. Oldingi webhook o‘rnatilgan bo‘lsa, uni tekshirib, tasdiqlangan ko‘chirish jarayonida o‘chirish kerak; bu kod webhookni o‘zboshimchalik bilan almashtirmaydi.

Hosting hisobi ulangan bo‘lishi server deploy qilinganini anglatmaydi. Token, doimiy volume, domain va ishlayotgan deployment alohida tekshiriladi. Hosting xarajati Railway tarifiga va resurs sarfiga bog‘liq.
