// Secrets belong in Project Settings > Script properties, never in source.
function props_(){return PropertiesService.getScriptProperties()}
function tg_(method,data){
 const token=props_().getProperty('TELEGRAM_BOT_TOKEN');if(!token)throw Error('TELEGRAM_BOT_TOKEN kiriting.');
 const multipart=Object.values(data||{}).some(v=>v&&typeof v.getBytes==='function');
 const r=UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/'+method,{method:'post',muteHttpExceptions:true,...(multipart?{payload:data}:{contentType:'application/json',payload:JSON.stringify(data||{})})});
 let j;try{j=JSON.parse(r.getContentText())}catch(e){throw Error('Telegram javobi olinmadi.')}
 if(!j.ok)throw Error('Telegram xatosi: '+r.getResponseCode());return j.result;
}
function setup_(){
 const me=tg_('getMe',{});if(me.username!=='learnararabic_bot')throw Error('Bu learnararabic_bot tokeni emas.');
 if(tg_('getWebhookInfo',{}).url)throw Error('Botda oldingi webhook bor. Avval uni tekshirib olib tashlang.');
 if(!props_().getProperty('FOLDER_ID'))props_().setProperty('FOLDER_ID',DriveApp.createFolder('Lugat Lab — bot saqlanmalari').getId());
 if(!props_().getProperty('SESSION_SECRET'))props_().setProperty('SESSION_SECRET',Utilities.getUuid()+Utilities.getUuid());
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='pollTelegram_'))ScriptApp.newTrigger('pollTelegram_').timeBased().everyMinutes(1).create();
 tg_('setMyCommands',{commands:[{command:'start',description:'Lug‘at Lab menyusi'},{command:'cancel',description:'Joriy yaratishni bekor qilish'}]});
 console.log('Bot sozlandi. Xabarlar taxminan har daqiqada tekshiriladi.');
}
function state_(owner){
 if(!/^\d+$/.test(String(owner)))throw Error('Foydalanuvchi noto‘g‘ri.');
 const folder=DriveApp.getFolderById(props_().getProperty('FOLDER_ID')),files=folder.getFilesByName(owner+'.json');
 const file=files.hasNext()?files.next():folder.createFile(owner+'.json',JSON.stringify({decks:[],step:null}),MimeType.PLAIN_TEXT);
 return {file,data:JSON.parse(file.getBlob().getDataAsString())};
}
function save_(s){s.file.setContent(JSON.stringify(s.data))}
function session_(id){const payload=id+'.'+(Date.now()+86400000),sig=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload,props_().getProperty('SESSION_SECRET'))).replace(/=+$/,'');return payload+'.'+sig}
function owner_(token){
 const p=String(token||'').split('.');if(p.length!==3||!/^\d+$/.test(p[0])||Number(p[1])<Date.now()||Number(p[1])>Date.now()+86460000)throw Error('Havola muddati tugagan. Botdan Mini Appni qayta oching.');
 const sig=Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(p[0]+'.'+p[1],props_().getProperty('SESSION_SECRET'))).replace(/=+$/,'');
 let diff=sig.length^p[2].length;for(let i=0;i<sig.length;i++)diff|=sig.charCodeAt(i)^p[2].charCodeAt(i);if(diff)throw Error('Ruxsat yo‘q.');return p[0];
}
function menu_(id){
 const rows=[[{text:'HTML flashcard',callback_data:'new:flash'},{text:'HTML yozma',callback_data:'new:write'}],[{text:'Saqlangan to‘plamlar',callback_data:'list'}],[{text:'Aralash flashcard',callback_data:'mix:flash'},{text:'Aralash yozma',callback_data:'mix:write'}]];
 const url=props_().getProperty('WEB_APP_URL');if(url)rows.push([{text:'Mini Appni ochish',web_app:{url:url+'?session='+encodeURIComponent(session_(id))}}]);return {inline_keyboard:rows};
}
function say_(id,text,keyboard){return tg_('sendMessage',{chat_id:id,text,...(keyboard?{reply_markup:keyboard}:{})})}
function validDeck_(d){
 if(!d||!['flash','write'].includes(d.mode)||typeof d.name!=='string'||!d.name.trim()||d.name.length>80||!Array.isArray(d.words)||d.words.length<1||d.words.length>300)throw Error('To‘plam: 1–300 so‘z, nom 1–80 belgi.');
 const keys=['ar','uz','type','past','present','imperative','masdar','first','plural'];
 const words=d.words.map(w=>{const out={};for(const k of keys){if(w[k]!=null){if(typeof w[k]!=='string'||w[k].length>500)throw Error('So‘z juda uzun.');out[k]=w[k]}}if(!out.ar||!out.uz)throw Error('Tarjima va arabcha shakl kerak.');if(w.accepted_uz){if(!Array.isArray(w.accepted_uz)||w.accepted_uz.length>30||w.accepted_uz.some(x=>typeof x!=='string'||x.length>500))throw Error('Tarjimalar noto‘g‘ri.');out.accepted_uz=w.accepted_uz}return out});
 return {id:typeof d.id==='string'&&/^[\w-]{1,80}$/.test(d.id)?d.id:Utilities.getUuid(),name:d.name.trim(),mode:d.mode,words};
}
function enrich_(text,s){
 if(typeof text!=='string'||text.length>20000)throw Error('Matn 20000 belgidan oshmasin.');
 const key=props_().getProperty('GEMINI_API_KEY');if(!key)return parseWords_(text);
 const day=new Date().toISOString().slice(0,10);if(s.data.aiDay!==day){s.data.aiDay=day;s.data.aiCount=0}if(s.data.aiCount>=20)throw Error('Kunlik AI limiti: 20 marta.');s.data.aiCount++;save_(s);
 const r=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'post',contentType:'application/json',headers:{'x-goog-api-key':key},muteHttpExceptions:true,payload:JSON.stringify({systemInstruction:{parts:[{text:AI_PROMPT_}]},contents:[{role:'user',parts:[{text}]}],generationConfig:{responseMimeType:'application/json',temperature:0.1}})});
 if(r.getResponseCode()!==200)throw Error('Gemini limiti yoki kalit xatosi. Keyinroq urinib ko‘ring.');
 let words;try{const j=JSON.parse(r.getContentText());words=JSON.parse(j.candidates[0].content.parts.map(p=>p.text||'').join(''))}catch(e){throw Error('AI javobi to‘liq kelmadi. So‘zlarni kamroq yuboring.')}
 return validDeck_({name:'AI',mode:'flash',words}).words;
}
function exportHtml_(d){return APP_HTML_.replace('<script id="embedded" type="application/json">null</script>','<script id="embedded" type="application/json">'+JSON.stringify(d).replace(/</g,'\\u003c')+'</script>')}
function document_(id,d){const html=exportHtml_(d);tg_('sendDocument',{chat_id:String(id),document:Utilities.newBlob(html,'text/html',d.name.replace(/[^\p{L}\p{N}_ -]/gu,'').slice(0,60)+'_'+d.mode+'.html')})}
function deliver_(id,s,d){s.data.pending=d;s.data.nonce=Utilities.getUuid().slice(0,8);s.data.step=null;save_(s);document_(id,d);say_(id,'Tayyor. To‘plamni saqlaysizmi?',{inline_keyboard:[[{text:'Saqlash',callback_data:'save:'+s.data.nonce},{text:'Saqlamaslik',callback_data:'discard:'+s.data.nonce}]]})}
function handle_(u){
 const c=u.callback_query,m=c?c.message:u.message;if(!m||m.chat.type!=='private')return;const id=String(m.chat.id);if(c&&String(c.from.id)!==id)return;
 const s=state_(id),text=m.text||'';
 if(c){tg_('answerCallbackQuery',{callback_query_id:c.id});const [action,arg]=c.data.split(':');
  if(action==='new'){s.data.step=arg;s.data.pending=null;save_(s);say_(id,'So‘zlarni arabcha va o‘zbekcha yuboring. To‘rt shakl bo‘lsa birlashtiraman. /cancel — bekor qilish.');return}
  if(action==='list'){if(!s.data.decks.length){say_(id,'Hali saqlangan to‘plam yo‘q.');return}for(const d of s.data.decks)say_(id,d.name+' · '+d.mode+' · '+d.words.length+' so‘z',{inline_keyboard:[[{text:'Yuklab olish',callback_data:'get:'+d.id},{text:'O‘chirish',callback_data:'delete:'+d.id}]]});return}
  if(action==='get'){const d=s.data.decks.find(x=>x.id===arg);if(d)document_(id,d);return}
  if(action==='delete'){say_(id,'To‘plamni o‘chirish tasdiqlansinmi?',{inline_keyboard:[[{text:'Ha, o‘chirish',callback_data:'confirm:'+arg},{text:'Bekor',callback_data:'menu'}]]});return}
  if(action==='confirm'){s.data.decks=s.data.decks.filter(x=>x.id!==arg);save_(s);say_(id,'O‘chirildi.',menu_(id));return}
  if(action==='mix'){const words=s.data.decks.flatMap(d=>d.words),unique=Array.from(new Map(words.map(w=>[w.ar+'|'+w.uz,w])).values());if(!unique.length){say_(id,'Avval to‘plam saqlang.');return}if(unique.length>300){say_(id,'Aralash to‘plam 300 so‘zdan oshdi. Kamroq to‘plam qoldiring.');return}for(let i=unique.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[unique[i],unique[j]]=[unique[j],unique[i]]}deliver_(id,s,validDeck_({name:'Aralash lug‘at',mode:arg,words:unique}));return}
  if(['save','discard'].includes(action)){if(!s.data.pending||arg!==s.data.nonce){say_(id,'Bu tugma eskirgan.');return}if(action==='save'){s.data.step='name';save_(s);say_(id,'Qanday nom bilan saqlaymiz? 1–80 belgi yozing.')}else{s.data.pending=null;s.data.step=null;save_(s);say_(id,'Saqlanmadi.',menu_(id))}return}
  say_(id,'Lug‘at Lab',menu_(id));return;
 }
 if(['/start','/cancel'].includes(text)){s.data.step=null;s.data.pending=null;save_(s);say_(id,'Lug‘at Lab — kerakli rejimni tanlang.',menu_(id));return}
 if(s.data.step==='name'&&s.data.pending){const d=validDeck_({...s.data.pending,name:text});if(s.data.decks.length>=100)throw Error('Saqlash limiti: 100 ta to‘plam.');s.data.decks.push(d);s.data.pending=null;s.data.step=null;save_(s);say_(id,'“'+d.name+'” saqlandi.',menu_(id));document_(id,d);return}
 if(['flash','write'].includes(s.data.step)){say_(id,'Lug‘at tayyorlanmoqda…');const words=enrich_(text,s);deliver_(id,s,validDeck_({name:'Yangi lug‘at',mode:s.data.step,words}));return}say_(id,'Yaratish tugmasini tanlang.',menu_(id));
}
function pollTelegram_(){
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
 try{const updates=tg_('getUpdates',{offset:Number(props_().getProperty('OFFSET')||0),limit:10,timeout:0,allowed_updates:['message','callback_query']});const start=Date.now();for(const u of updates){if(Date.now()-start>45000)break;try{handle_(u)}catch(e){const chat=u.message?.chat||u.callback_query?.message?.chat;if(chat?.type==='private')try{say_(chat.id,'Amal bajarilmadi. '+String(e.message).slice(0,220))}catch(ignore){}}props_().setProperty('OFFSET',String(u.update_id+1))}}finally{lock.releaseLock()}
}
function rpc(session,path,method,body){
 const id=owner_(session),lock=LockService.getScriptLock();lock.waitLock(10000);try{const s=state_(id);
 if(path==='/export'&&method==='POST')return exportHtml_(validDeck_(body));
 if(path==='/decks'&&method==='GET')return s.data.decks;
 if(path==='/decks'&&method==='POST'){const d=validDeck_(body),index=s.data.decks.findIndex(x=>x.id===d.id);if(index<0){if(s.data.decks.length>=100)throw Error('100 ta to‘plam limiti.');s.data.decks.push(d)}else s.data.decks[index]=d;save_(s);return d}
 if(/^\/decks\/[\w-]+$/.test(path)&&method==='DELETE'){s.data.decks=s.data.decks.filter(d=>d.id!==path.slice(7));save_(s);return {ok:true}}
 if(path==='/enrich'&&method==='POST')return enrich_(body.text,s);
 throw Error('Noma’lum amal.');}finally{lock.releaseLock()}
}
function doGet(e){
 try{const session=e.parameter.session;owner_(session);let html=APP_HTML_;
 html=html.replace(/^async function api\(.*$/m,'function api(path,options={}){return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(e=>reject(Error(e.message))).rpc('+JSON.stringify(session)+',path,options.method||"GET",options.body?JSON.parse(options.body):null))}');
 html=html.replace(/^async function init\(.*$/m,'async function init(){remote=true;reset();try{saved=await api("/decks");$("connection").textContent="● Telegram bilan sinxronlangan"}catch(e){toast(e.message)}}');
 html=html.replace(/^function download\(.*$/m,`async function download(m,d=current){try{const html=await api('/export',{method:'POST',body:JSON.stringify({...d,mode:m})}),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Lugat-'+m+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){toast(e.message)}}`);
 return HtmlService.createHtmlOutput(html).setTitle('Lug‘at Lab').addMetaTag('viewport','width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
 }catch(e){return HtmlService.createHtmlOutput('<h2>Lug‘at Lab</h2><p>Telegram botdagi yangi Mini App tugmasi orqali oching. Havola 24 soat amal qiladi.</p>')}
}

function configureBot(){const email=Session.getActiveUser().getEmail();if(!email||email!==Session.getEffectiveUser().getEmail())throw Error("Faqat loyiha egasi sozlashi mumkin.");setup_();}
