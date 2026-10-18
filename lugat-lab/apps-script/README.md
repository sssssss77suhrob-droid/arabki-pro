# Google Apps Script — bepul limitlar doirasida

Code.gs bitta fayl: Telegram polling, Drive saqlash, Gemini va HTML interfeys.
Server.gs tahrir uchun manba; Code.gs ichida uning nusxasi va UI/parser bor.

1. Apps Script loyihasiga Code.gs ni kiriting.
2. Project Settings → Script properties: TELEGRAM_BOT_TOKEN (learnararabic_bot), GEMINI_API_KEY (ixtiyoriy, bepul Gemini API loyihasi). Kalitlarni kodga yozmang.
3. Editor → configureBot ni bajaring. Google Drive, tashqi so‘rovlar, trigger yaratish uchun ruxsat kerak. Hisob egasi tasdiqlaydi.
4. Deploy → New deployment → Web app → Execute as Me → access Anyone. /exec manzilini WEB_APP_URL script property sifatida saqlang.
5. Telegramda /start yuboring. Bir daqiqalik trigger sabab javob kechikishi mumkin. Botni boshqa serverda parallel ishlatmang.
6. To‘plam yarating, nom bering, HTMLni oching, Mini Appda saqlangan to‘plamni tekshiring. Token va kalit kiritilmaguncha real integratsiya tekshirilmagan.

Bot va Mini App bir shaxsiy Drive papkasidan foydalanadi. Mini App havolasi 24 soatlik imzolangan kirish havolasi: uni boshqalarga bermang. HTML eksport havola/tokenni o‘z ichiga olmaydi. Mini App Google HtmlService iframe bilan ishlaydi; Telegram mobil qurilmasida va HTML yuklab olishda alohida tekshiruv kerak.

Gemini kalitsiz standart parser ishlaydi; erkin matnni AI tartiblashi uchun kalit kerak. Pullik xizmat avtomatik ulanmaydi. Har foydalanuvchiga 20 AI so‘rovi/kun, 100 to‘plam, har to‘plamga 300 so‘z limiti. Google umumiy kvotalari bundan avval tugashi mumkin. AIga yuborilgan lug‘atlar Google Gemini orqali qayta ishlanadi.

Mahalliy tekshiruv: node apps-script/test.cjs. Live Telegram/Drive/Gemini/OAuth tekshiruvi hali talab qilinadi.

## 400 tuzatish va webhookga ko‘chirish
Kechikkan answerCallbackQuery endi foydalanuvchi amalini bekor qilmaydi. Boshqa Telegram xatolari metod nomi va maxfiy qiymatlarsiz sababi bilan chiqadi.
Webhook kodi mahalliy testdan o‘tgan, jonli ulanish hali tekshirilmagan. Code.gs ni yangilab, yangi Web app versiyasini deploy qiling. WEB_APP_URL /exec manzilini tekshiring, keyin editor ichida enableWebhook bajaring. Eski polling trigger saqlanadi, ammo webhook rejimida xabar olmaydi. /start yuborgach checkWebhookHealth orqali LAST_WEBHOOK_OK va pending sonini tekshiring. Redirect/yetkazish xatosi qolsa restorePolling bilan qayting; to‘g‘ridan-to‘g‘ri Apps Script webhook ishlashini sinovsiz kafolatlamang. Takroriy update IDlar saqlanadi, ammo tashqi yuborish bilan Drive yozuvi atomik emas.
