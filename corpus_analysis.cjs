const fs = require("node:fs");
const crypto = require("node:crypto");
const nodes = ["ukraine","russia","ukrainian","russian","ukraine's","russia's"];
const terms = ["war","invasion","peace","ceasefire","talks","negotiations","sanctions","nato","US","uk","europe","trump","putin","zelensky","forces","troops","military","attack","attacks","strikes","aid","support","civilians","refugees","missiles","drones","nuclear","moscow","kyiv","kremlin"];
const sensitivity = process.argv.includes("--shorter-files");
const out = sensitivity ? "corpus_results/shorter_files" : "corpus_results";
fs.mkdirSync(out, {recursive:true});
function csv(file, headers, rows) {
  const lines = [headers,...rows].map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(","));
  fs.writeFileSync(out+"/"+file+".csv", "\uFEFF"+lines.join("\r\n")+"\r\n");
}
function add(map,key,file) {
  if (!map.has(key)) map.set(key,{count:0,files:new Set()});
  const item=map.get(key);
  item.count++;
  item.files.add(file);
}
const inventory=[], frequency=[], collocation=[], clusters=[], concordance=[], keywords=[];
const corpora={};
for (const outlet of ["BBC","CNN"]) {
  const dir=outlet+"_Ukraine";
  const vocab=new Map(), coll=new Map(), grams=new Map();
  let total=0;
  const files=fs.readdirSync(dir).filter(file=>file.endsWith(".txt") && (!sensitivity || !["CNN028.txt","CNN031.txt","BBC016.txt","BBC022.txt"].includes(file))).sort();
  for (const file of files) {
    const raw=fs.readFileSync(dir+"/"+file,"utf8");
    let count=0;
    for (const [index,original] of raw.split(/\r?\n/).entries()) {
      if (/^(PreviousNext|Shareclose panel)/.test(original)) break;
      if (/^(Image source,|Image caption,|By [A-Z][a-z]+ [A-Z][a-z]+(?: and [A-Z][a-z]+ [A-Z][a-z]+)?$)/.test(original)) continue;
      const line=original.replace(/[\u00C2-\u00F4][\u0080-\u00BF]{1,3}/g, value=>Buffer.from(value,"latin1").toString("utf8"))
        .replace(/^Link Copied!\s*|^Close(?=President)|^Published\d+\s+(?:hours?|days?)\s+ago/g,"");
      if (/^Inside Ukrainian offensive pushing Russia back - with Starlink playing a key role$|^Zelensky says Ukraine has right to defend itself after Trump calls latest strikes/.test(line)) continue;
      const tokens=[...line.matchAll(/\p{L}+(?:['’]\p{L}+)*/gu)];
      const words=tokens.map(m=>m[0].toLowerCase().replaceAll("’","'"));
      count+=words.length;
      for (const [i,word] of words.entries()) {
        add(vocab,word,file);
        if (word==="us" && tokens[i][0]==="US") add(vocab,"US",file);
        if (!nodes.includes(word)) continue;
        const start=tokens[Math.max(0,i-9)].index;
        const end=tokens[Math.min(tokens.length-1,i+9)];
        concordance.push([outlet,file,index+1,word,line.slice(start,tokens[i].index),tokens[i][0],line.slice(tokens[i].index+tokens[i][0].length,end.index+end[0].length)]);
        for (let j=Math.max(0,i-4);j<=Math.min(words.length-1,i+4);j++) {
          if (j!==i) add(coll,JSON.stringify([word,words[j]]),file);
        }
        for (let size=2;size<=4;size++) {
          for (let j=Math.max(0,i-size+1);j<=Math.min(i,words.length-size);j++) {
            const first=words.indexOf(word,j);
            if (first===i) add(grams,JSON.stringify([word,size,words.slice(j,j+size).join(" ")]),file);
          }
        }
      }
    }
    total+=count;
    inventory.push([outlet,file,count,crypto.createHash("sha256").update(raw.trim()).digest("hex")]);
  }
  corpora[outlet]={vocab,total};
  console.log(outlet,files.length,total);
  for (const term of [...nodes,...terms]) {
    const f=vocab.get(term);
    frequency.push([outlet,term,f?.count??0,f?.files.size??0,((f?.count??0)*10000/total).toFixed(2)]);
  }
  for (const [key,item] of coll) {
    const [node,word]=JSON.parse(key);
    const score=14+Math.log2(2*item.count/(vocab.get(node).count+vocab.get(word).count));
    collocation.push([outlet,node,word,item.count,item.files.size,vocab.get(node).count,vocab.get(word).count,score.toFixed(3)]);
  }
  for (const [key,item] of grams) {
    if (item.count>=2) clusters.push([outlet,...JSON.parse(key),item.count,item.files.size]);
  }
}
const {BBC,CNN}=corpora;
for (const word of new Set([...BBC.vocab.keys(),...CNN.vocab.keys()])) {
  const b=BBC.vocab.get(word), c=CNN.vocab.get(word);
  const x=b?.count??0,y=c?.count??0;
  if (word==="US" || x+y<8 || Math.max(b?.files.size??0,c?.files.size??0)<3) continue;
  const e=(x+y)*BBC.total/(BBC.total+CNN.total);
  const g=2*((x?x*Math.log(x/e):0)+(y?y*Math.log(y/(x+y-e)):0));
  keywords.push([word,x,b?.files.size??0,y,c?.files.size??0,(x*10000/BBC.total).toFixed(2),(y*10000/CNN.total).toFixed(2),(x>e?"BBC":"CNN"),g.toFixed(3)]);
}
csv("inventory",["outlet","file","tokens","trimmed_text_sha256"],inventory);
csv("frequencies",["outlet","term","count","files","per_10000"],frequency);
csv("collocations",["outlet","node","collocate","pairs","files","node_count","collocate_count","logDice"],collocation.sort((a,b)=>b[7]-a[7]));
csv("clusters",["outlet","node","length","phrase","count","files"],clusters.sort((a,b)=>b[4]-a[4]));
csv("concordance",["outlet","file","line","node","left","match","right"],concordance);
csv("keywords",["word","bbc_count","bbc_files","cnn_count","cnn_files","bbc_per_10000","cnn_per_10000","higher_rate","G2"],keywords.sort((a,b)=>b[8]-a[8]));

