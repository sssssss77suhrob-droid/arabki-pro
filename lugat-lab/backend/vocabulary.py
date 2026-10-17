"""Conservative parser: explicit form labels or four forms in declared order."""
import json
import re
import unicodedata
from pathlib import Path

LEXICON=json.loads(Path(__file__).with_name('lexicon.json').read_text(encoding='utf-8'))
LABELS={
 'moziy':'past','mozi':'past','ماضي':'past','الماضي':'past',
 'muzori':'present','muzoriy':'present','muzoriʼ':'present','muzore':'present','مضارع':'present','المضارع':'present',
 'amr':'imperative','أمر':'imperative','الأمر':'imperative','امر':'imperative',
 'masdar':'masdar','مصدر':'masdar','المصدر':'masdar',
 'mutakallim':'first','men':'first','men shakli':'first','1-shaxs':'first','birinchi shaxs':'first',
 'tarjima':'uz','maʼnosi':'uz','manosi':'uz','oʻzbekcha':'uz','uzbekcha':'uz','uz':'uz',
 'koʻplik':'plural','koplik':'plural',
}
def norm(value):
    value=unicodedata.normalize('NFKC',str(value)).lower()
    value=re.sub(r'[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]','',value)
    value=re.sub(r'[‘’ʻʼ`]',"'",value)
    return re.sub(r'\s+',' ',value).strip()
def label_key(value): return re.sub(r"['’‘ʻʼ`:]",'',norm(value)).strip()
LABELS={label_key(k):v for k,v in LABELS.items()}
def has_ar(value):return bool(re.search(r'[\u0621-\u064a\u0671-\u06d3]',value))
def parts(value):return [s.strip() for s in re.split(r'\s*(?:\||/|—|–|→|=>|\t|،|,| - )\s*',value) if s.strip()]
def sides(value):
    p=parts(value)
    arabic=[x for x in p if has_ar(x)]
    meaning=[x for x in p if not has_ar(x)]
    return arabic,'; '.join(meaning)
def known_for(ar):
    key=norm(ar)
    return next((w for w in LEXICON if key and key in [norm(w.get(f,'')) for f in ('ar','first','past','present','imperative','masdar')]),None)

def normalize_words(words):
    out=[];seen={}
    for raw in words:
        w=dict(raw)
        known=known_for(w.get('present') or w.get('ar',''))
        if known:
            w={**known,**{k:v for k,v in w.items() if v not in ('',None,'unknown')}}
            glosses=[re.sub(r'[.!?]+$','',norm(x)).strip() for x in re.split(r'[;/]',w.get('uz',''))]
            allowed={norm(x) for x in known.get('gloss_forms',[])}
            if glosses and all(g in allowed for g in glosses):w['uz']=known['uz']
            if raw.get('type','unknown')=='unknown':
                for field in ('past','present','imperative','masdar','first'):
                    if known.get(field) and norm(raw.get('ar',''))==norm(known[field]):w[field]=raw['ar']
        if w.get('type')=='verb' and w.get('present'):w['ar']=w['present']
        if not w.get('ar') or not w.get('uz'):raise ValueError('Har bir so‘z uchun arabcha shakl va tarjima kerak.')
        key=(norm(w['ar']),norm(w['uz']))
        if key in seen:
            prev=out[seen[key]]
            for f,v in w.items():
                if not prev.get(f) and v:prev[f]=v
            prev['accepted_uz']=list(dict.fromkeys(prev.get('accepted_uz',[])+w.get('accepted_uz',[])))
        else:seen[key]=len(out);out.append(w)
    return out

def parse_input(text):
    out=[];group={};raw_forms=[];last_line=1;explicit=False
    def flush():
        nonlocal group,raw_forms,explicit
        if raw_forms:
            if len(raw_forms)!=4 or not norm(raw_forms[1]).startswith('ي'):
                raise ValueError(f'{last_line}-satr atrofida: shakllarga Moziy/Muzori/Amr/Masdar deb nom bering.')
            group.update(dict(zip(('past','present','imperative','masdar'),raw_forms)))
        if group:
            if not group.get('present') or not group.get('uz'):
                raise ValueError(f'{last_line}-satr atrofida muzori’ va tarjima kerak. Tarjima: yozmoq kabi kiriting.')
            out.append({**group,'ar':group['present'],'type':'verb'})
        group={};raw_forms=[];explicit=False
    for number,source in enumerate(text.replace('\r','').split('\n'),1):
        last_line=number
        line=re.sub(r'^\s*(?:[-*•]\s+|[0-9]+[.)]\s*)','',source.strip()).replace('**','').strip()
        if not line or line.startswith('```'):continue
        match=re.match(r'^([^:：=—–]+)\s*[:：=—–]\s*(.+)$',line)
        label=LABELS.get(label_key(match.group(1))) if match else None
        if label:
            value=match.group(2).strip()
            if label=='uz':
                if group.get('present') and explicit:flush()
                group['uz']=value;explicit=True
                continue
            if label in ('past','present') and group.get(label):flush()
            arabic,meaning=sides(value)
            if len(arabic)!=1:raise ValueError(f'{number}-satrda bitta arabcha shakl kiriting.')
            group[label]=arabic[0]
            if meaning and not explicit and (label=='present' or not group.get('uz')):group['uz']=meaning
            continue
        p=[x.strip() for x in line.split('|')]
        if len(p)>=3 and p[2] in ('verb','noun'):
            if group or raw_forms:flush()
            w={'ar':p[0],'uz':p[1],'type':p[2]}
            if p[2]=='verb':
                if len(p)<7 or not all(p[3:7]):raise ValueError(f'{number}-satr: moziy, muzori’, amr, masdar kerak.')
                w.update(zip(('past','present','imperative','masdar'),p[3:7]))
                w['first']=p[7] if len(p)>7 else ''
                w['accepted_uz']=[x.strip() for x in p[8].split(';') if x.strip()] if len(p)>8 else []
            else:
                w['plural']=p[3] if len(p)>3 else ''
                w['accepted_uz']=[x.strip() for x in p[4].split(';') if x.strip()] if len(p)>4 else []
            out.append(w);continue
        arabic,meaning=sides(line)
        if len(arabic)==4:
            if group.get('present') or raw_forms:flush()
            meaning=meaning or group.get('uz','')
            if not meaning:raise ValueError(f'{number}-satrda to‘rt shakldan keyin — tarjima yozing.')
            group={'uz':meaning,**dict(zip(('past','present','imperative','masdar'),arabic))}
            flush();continue
        if len(arabic)==1 and meaning:
            if raw_forms:
                raw_forms.append(arabic[0]);group['uz']=meaning;flush()
            else:
                if group:flush()
                out.append({'ar':arabic[0],'uz':meaning,'type':'unknown'})
            continue
        if len(arabic)==1 and not meaning:
            if group.get('present'):flush()
            raw_forms.append(arabic[0])
            if len(raw_forms)>4:raise ValueError(f'{number}-satr: to‘rt shaklga tarjima ham qo‘shing.')
            continue
        if not arabic and len(line)<=200:
            if raw_forms:
                group['uz']=line.rstrip(':');flush()
            else:
                if group:flush()
                group={'uz':line.rstrip(':')};explicit=True
            continue
        raise ValueError(f'{number}-satrni ajratib bo‘lmadi. Nomlangan shakllar yoki AI rejimidan foydalaning.')
    if group or raw_forms:flush()
    out=normalize_words(out)
    if not 1<=len(out)<=300:raise ValueError('1–300 ta so‘z yuboring.')
    return out
