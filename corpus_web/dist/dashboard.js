"use strict";

const $ = id => document.getElementById(id);
const nodes = ["ukraine", "russia", "ukrainian", "russian", "ukraine's", "russia's"];
const terms = ["putin", "zelensky", "US", "officials", "nuclear", "germany", "invasion"];
const labels = {putin:"Putin", zelensky:"Zelensky", germany:"Germany"};
for (const node of nodes) $("node").add(new Option(node[0].toUpperCase()+node.slice(1), node));

function element(tag, value, className) {
  const item = document.createElement(tag);
  if (value !== undefined) item.textContent = value;
  if (className) item.className = className;
  return item;
}

function renderChart() {
  const data = corpus[$("sample").value];
  $("size").textContent = ["BBC","CNN"].map(outlet => {
    const files = data.inventory.filter(row => row.outlet === outlet);
    const tokens = files.reduce((sum, row) => sum + Number(row.tokens), 0);
    return outlet+" "+files.length+" files / "+tokens.toLocaleString("en-US")+" tokens";
  }).join(" · ");
  const max = Math.ceil(Math.max(...terms.flatMap(term => ["BBC","CNN"].map(outlet => Number(rate(data, term, outlet).rate))))/10)*10;
  $("chart").replaceChildren(...terms.map(term => {
    const row = element("div", undefined, "row");
    const pair = element("div", undefined, "pair");
    row.append(element("strong", labels[term] ?? term), pair);
    for (const outlet of ["BBC","CNN"]) {
      const stat = rate(data, term, outlet);
      const line = element("div", undefined, "barline");
      const track = element("div", undefined, "track");
      const fill = element("div", undefined, "fill "+outlet.toLowerCase());
      fill.style.width = (100*Number(stat.rate)/max)+"%";
      line.title = outlet+" · "+stat.count+" occurrences in "+stat.files+" files";
      line.setAttribute("aria-label", outlet+" "+stat.rate+" per 10,000 tokens");
      track.append(fill);
      line.append(track, element("span", stat.rate, "value"));
      pair.append(line);
    }
    return row;
  }));
}

function rate(data, term, outlet) {
  if (term === "officials" || term === "germany") {
    const row = data.keywords.find(item => item.word === term);
    const prefix = outlet.toLowerCase();
    return {rate:row[prefix+"_per_10000"], count:row[prefix+"_count"], files:row[prefix+"_files"]};
  }
  const row = data.frequencies.find(item => item.outlet === outlet && item.term === term);
  return {...row, rate:row.per_10000};
}

function renderTable() {
  const view = $("view").value;
  const outlet = $("outlet").value;
  const query = $("query").value.trim().toLowerCase().replaceAll("’","'");
  const node = $("node").value;
  const columns = {
    collocations:["Outlet","Nearby word","Pairs","Files","LogDice"],
    clusters:["Outlet","Exact phrase","Occurrences","Files"],
    concordance:["Outlet","Source","Context"]
  };
  const descriptions = {
    collocations:"Ranked by logDice. Common function words are excluded. Showing associations found in at least two files.",
    clusters:"Ranked by count. Showing phrases found in at least two files.",
    concordance:"Source order. The selected form is highlighted."
  };
  const rows = corpus[$("sample").value][view].filter(row => {
    if (row.node !== node || (outlet && row.outlet !== outlet)) return false;
    if (view !== "concordance" && Number(row.files) < 2) return false;
    const searchable = row.collocate ?? row.phrase ?? [row.file,row.left+row.match+row.right].join(" ");
    return searchable.toLowerCase().replaceAll("’","'").includes(query);
  });
  const head = element("tr");
  for (const name of columns[view]) {
    const th = element("th", name);
    th.scope = "col";
    head.append(th);
  }
  $("head").replaceChildren(head);
  const limit = 100;
  $("context").textContent = descriptions[view]+" Showing "+Math.min(rows.length,limit)+" of "+rows.length+" matches.";
  $("body").replaceChildren(...rows.slice(0,limit).map(row => {
    const tr = element("tr");
    const values = view === "collocations" ? [row.outlet,row.collocate,row.pairs,row.files,row.logDice]
      : view === "clusters" ? [row.outlet,row.phrase,row.count,row.files]
      : [row.outlet,row.file+":"+row.line];
    tr.append(...values.map(value => element("td", value)));
    if (view === "concordance") {
      const td = element("td");
      td.append(row.left,element("mark",row.match),row.right);
      tr.append(td);
    }
    return tr;
  }));
}

function renderKeywords() {
  const outlet = $("keyword-outlet").value;
  const query = $("keyword-query").value.trim().toLowerCase();
  const matches = corpus[$("sample").value].keywords.filter(row =>
    (!outlet || row.higher_rate === outlet) && row.word.toLowerCase().includes(query)
  );
  const limit = 100;
  $("keyword-status").textContent = "Showing "+Math.min(limit,matches.length)+" of "+matches.length+" keywords.";
  $("keyword-rows").replaceChildren(...matches.slice(0,limit).map(row => {
    const tr = element("tr");
    tr.append(...[row.word,row.bbc_per_10000,row.cnn_per_10000,row.bbc_files,row.cnn_files,row.higher_rate,row.G2]
      .map(value => element("td",value)));
    return tr;
  }));
}

$("keyword-outlet").addEventListener("change",renderKeywords);
$("keyword-query").addEventListener("input",renderKeywords);
renderKeywords();
$("sample").addEventListener("change", () => { renderChart(); renderTable(); renderKeywords(); });
for (const id of ["node","outlet","view"]) $(id).addEventListener("change",renderTable);
$("query").addEventListener("input",renderTable);
renderChart();
renderTable();


