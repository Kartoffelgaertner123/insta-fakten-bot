import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const W = 1080, H = 1350;
const root = path.resolve('.');
const sheets = {
  korea: path.resolve('../generated_images/exec-5f5febc8-bdba-47c8-9281-861df5d14b4f.png'),
  titans: path.resolve('../generated_images/exec-49968c05-7003-4635-bef7-2e16f5d4324e.png')
};

const posts = [
  {
    slug: 'manual-nordkorea', sheet: 'korea', accent: '#52f2cf',
    slides: [
      ['DIESES LAND IST NACHTS|FAST UNSICHTBAR.', 'Nordkorea aus dem All.', 'EIN LAND VOLLER GEHEIMNISSE'],
      ['FAST VÖLLIG|ABGESCHOTTET', 'Rund 26 Millionen Menschen leben hier.', 'NORDKOREA'],
      ['SEIT 1948 DIESELBE|FAMILIE', 'Kim Il Sung → Kim Jong Il → Kim Jong Un', 'EINE DYNASTIE'],
      ['250 KM|SPERRGEBIET', 'Die DMZ ist rund 4 Kilometer breit.', 'DIE GRENZE ZUM SÜDEN'],
      ['INTERNET?|FAST FEHLANZEIGE.', 'Die meisten nutzen nur das staatliche Intranet.', 'DIGITALE ISOLATION'],
      ['EIN HEILIGER|VULKAN', 'Der Paektusan prägt die Mythen beider Koreas.', 'MEHR DAVON? FOLGEN & SPEICHERN']
    ]
  },
  {
    slug: 'manual-griechische-titanen', sheet: 'titans', accent: '#ffc85b',
    slides: [
      ['VOR ZEUS|HERRSCHTEN SIE.', 'Die Titanen waren die alte Göttergeneration.', 'GRIECHISCHE MYTHOLOGIE'],
      ['HIMMEL + ERDE|= 12 TITANEN', 'Uranos und Gaia waren ihre Eltern.', 'DIE ERSTE GENERATION'],
      ['KRONOS VERSCHLANG|SEINE KINDER', 'Aus Angst, von ihnen gestürzt zu werden.', 'EIN DÜSTERER MYTHOS'],
      ['ATLAS TRUG NICHT|DIE ERDE.', 'Seine Strafe war das Himmelsgewölbe.', 'DER BEKANNTESTE IRRTUM'],
      ['ER STAHL DAS|FEUER', 'Prometheus gab es den Menschen.', 'UND WURDE DAFÜR BESTRAFT'],
      ['10 JAHRE|GÖTTERKRIEG', 'Zeus siegte. Die Titanen kamen in den Tartaros.', 'TITANOMACHIE · SPEICHERN & FOLGEN']
    ]
  },
  {
    slug: 'manual-minions', custom: true, accent: '#ffe45c',
    slides: [
      ['SIE SIND ÄLTER ALS|DIE MENSCHHEIT.', 'Zumindest in ihrer Filmwelt.', 'DIE MINIONS'],
      ['IHRE SPRACHE|GIBT ES NICHT.', 'Minionese mixt Wörter aus vielen Sprachen.', 'BANANA! PAPOY! BELLO!'],
      ['SIE SUCHEN IMMER|DEN BÖSESTEN BOSS', 'Ohne Anführer versinken sie im Chaos.', 'IHRE EWIGE MISSION'],
      ['EIN AUGE?|ODER ZWEI?', 'Größe, Haare und Augen machen sie verschieden.', 'NICHT ALLE SIND GLEICH'],
      ['„BANANA“ WURDE|KULT', 'Ein einziges Wort – weltweit verstanden.', 'IHR BERÜHMTESTER SPRUCH'],
      ['ÜBER 1 MILLIARDE|DOLLAR', 'So viel spielte ihr erster Solo-Film weltweit ein.', 'ECHTE KINOSTARS · FOLGEN & SPEICHERN']
    ]
  }
];

const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

function wrapLines(text) { return text.split('|'); }
function textSvg(slide, i, accent, dark=false) {
  const [headline, sub, kicker] = slide;
  const lines = wrapLines(headline);
  const headlineY = lines.length === 1 ? 835 : 780;
  const fill = '#fff';
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02080b" stop-opacity="0"/><stop offset="0.56" stop-color="#02080b" stop-opacity=".15"/><stop offset="1" stop-color="#02080b" stop-opacity=".98"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="url(#fade)"/>
    <rect x="34" y="34" width="267" height="54" rx="27" fill="${accent}"/><text x="168" y="70" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="25" font-weight="800" letter-spacing="2" fill="#061013">TÄGLICH SCHLAUER</text>
    <circle cx="1020" cy="60" r="34" fill="#071015"/><text x="1020" y="69" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#fff">${i+1}/6</text>
    <text x="540" y="${headlineY-58}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="25" font-weight="800" letter-spacing="3" fill="${accent}">${esc(kicker)}</text>
    ${lines.map((l,j)=>`<text x="540" y="${headlineY+j*78}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="70" font-weight="900" fill="${fill}">${esc(l)}</text>`).join('')}
    <text x="540" y="${headlineY + lines.length*78 + 58}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="#fff">${esc(sub)}</text>
    <text x="540" y="1304" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="800" fill="${accent}">@taeglichschlauer</text>
  </svg>`);
}

function minionSvg(i) {
  const bg = ['#372d73','#1c6d89','#9a5530','#214b7d','#7a5d16','#773a72'][i];
  const count = [4,1,3,2,1,5][i];
  let chars='';
  for(let n=0;n<count;n++){
    const x = count===1 ? 540 : 220+n*(640/Math.max(1,count-1));
    const y = 375 + (n%2)*65;
    const scale = 0.78 + (n%3)*0.12;
    const eyes = (i===3 && n===0) || (n%3===0) ? 1 : 2;
    chars += `<g transform="translate(${x} ${y}) scale(${scale})">
      <ellipse cx="0" cy="35" rx="105" ry="175" fill="#ffd92f" stroke="#d5ad00" stroke-width="8"/>
      <rect x="-105" y="55" width="210" height="135" rx="35" fill="#2865a8"/><path d="M-98 55 L-55 105 L55 105 L98 55" fill="#3278bd"/>
      <path d="M-55 40 L-90 0 M55 40 L90 0" stroke="#2865a8" stroke-width="17"/>
      ${eyes===1?`<circle cx="0" cy="0" r="54" fill="#aaa"/><circle cx="0" cy="0" r="39" fill="#fff"/><circle cx="3" cy="2" r="16" fill="#573b20"/>`:`<circle cx="-45" cy="0" r="45" fill="#aaa"/><circle cx="45" cy="0" r="45" fill="#aaa"/><circle cx="-45" cy="0" r="32" fill="#fff"/><circle cx="45" cy="0" r="32" fill="#fff"/><circle cx="-40" cy="2" r="13" fill="#573b20"/><circle cx="40" cy="2" r="13" fill="#573b20"/>`}
      <path d="M-35 68 Q0 100 35 68" fill="none" stroke="#512f21" stroke-width="9" stroke-linecap="round"/>
      <path d="M-76 -22 H76" stroke="#222" stroke-width="14"/>
      <rect x="-62" y="104" width="124" height="62" rx="8" fill="#245b96" stroke="#17436f" stroke-width="5"/>
    </g>`;
  }
  const prop = i===0||i===4 ? `<path d="M720 170 Q860 90 935 245 Q820 205 750 290 Q690 255 720 170" fill="#f7d32f" stroke="#9c7510" stroke-width="12"/>` : i===1 ? `<rect x="785" y="210" width="24" height="320" fill="#222"/><circle cx="797" cy="190" r="58" fill="#333" stroke="#bbb" stroke-width="12"/>` : i===5 ? `<g fill="#ffd92f">${Array.from({length:18},(_,n)=>`<circle cx="${80+(n*79)%930}" cy="${90+(n*113)%540}" r="9"/>`).join('')}</g>` : '';
  return Buffer.from(`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="b"><stop stop-color="${bg}"/><stop offset="1" stop-color="#07151e"/></radialGradient></defs><rect width="1080" height="1350" fill="url(#b)"/>${prop}${chars}</svg>`);
}

for (const post of posts) {
  const outDir = path.join(root, 'public', post.slug);
  await fs.mkdir(outDir, {recursive:true});
  for (let i=0;i<6;i++) {
    let background;
    if (post.custom) {
      background = await sharp(minionSvg(i)).png().toBuffer();
    } else {
      const meta = await sharp(sheets[post.sheet]).metadata();
      const cw = Math.floor(meta.width/3), ch = Math.floor(meta.height/2);
      background = await sharp(sheets[post.sheet])
        .extract({left:i%3*cw, top:Math.floor(i/3)*ch, width:cw, height:ch})
        .resize(W,H,{fit:'cover'}).jpeg({quality:94}).toBuffer();
    }
    await sharp(background).resize(W,H,{fit:'cover'}).composite([{input:textSvg(post.slides[i],i,post.accent)}]).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(path.join(outDir,`${i+1}.jpg`));
  }
}

console.log('Created:', posts.map(p=>p.slug).join(', '));
