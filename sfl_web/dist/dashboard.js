"use strict";
const $ = id => document.getElementById(id);
const processes = ["material","verbal","relational","mental","behavioural","existential"];
const outlets = ["BBC","CNN"];
const pageSize = 20;
let page = 0;

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
const capitalise = word => word[0].toUpperCase()+word.slice(1);
for (const type of processes) $("process").add(new Option(capitalise(type),type));
for (const type of [...new Set(clauses.map(row => row.subject_referent))].sort()) {
  $("referent").add(new Option(capitalise(type),type));
}
function selectedRows() {
  const country = $("country").value;
  const referent = $("referent").value;
  return clauses.filter(row => (!country || row.country === country) && (!referent || row.subject_referent === referent));
}
function renderChart() {
  const data = selectedRows();
  const totals = outlets.map(outlet => data.filter(row => row.outlet === outlet).length);
  const share = $("measure").value === "share";
  const counts = processes.map(type => outlets.map(outlet =>
    data.filter(row => row.outlet === outlet && row.process_type === type).length
  ));
  const max = share ? 100 : Math.max(1,...counts.flat());
  $("stats").replaceChildren(...outlets.map((outlet,i) => {
    const stat = node("span");
    stat.append(node("strong",totals[i])," "+outlet+" occurrences");
    return stat;
  }));
  $("scale").textContent = (share ? "Bars use a 0–100% scale." : "Bars share a 0–"+max+" occurrence scale.")+" Select a process to filter the evidence.";
  $("chart").replaceChildren(...processes.map((type,index) => {
    const row = node("div",undefined,"chartrow");
    const button = node("button",capitalise(type));
    button.setAttribute("aria-pressed",String($("process").value === type));
    button.addEventListener("click",() => {
      $("process").value = $("process").value === type ? "" : type;
      refresh();
      $("chart").children[index].firstElementChild.focus();
    });
    const pair = node("div");
    outlets.forEach((outlet,i) => {
      const count = counts[index][i];
      const value = share ? (totals[i] ? 100*count/totals[i] : 0) : count;
      const label = share ? (totals[i] ? value.toFixed(1)+"%" : "—") : String(count);
      const line = node("div",undefined,"barline");
      line.setAttribute("role","img");
      line.setAttribute("aria-label",outlet+" "+label+" ("+count+" of "+totals[i]+")");
      line.title = outlet+" · "+count+" of "+totals[i]+" occurrences";
      const track = node("div",undefined,"track");
      const fill = node("div",undefined,"fill "+outlet.toLowerCase());
      fill.style.width = 100*value/max+"%";
      track.append(fill);
      line.append(track,node("span",label));
      pair.append(line);
    });
    row.append(button,pair);
    return row;
  }));
}
const normalize = text => text.toLowerCase().replaceAll("’","'");
function renderEvidence() {
  const process = $("process").value;
  const outlet = $("outlet").value;
  const query = normalize($("query").value.trim());
  const matches = selectedRows().filter(row => (!process || row.process_type === process)
    && (!outlet || row.outlet === outlet)
    && (!query || normalize([row.source_file,row.source_sentence,row.verb_lemma,row.subject,row.id].join(" ")).includes(query)));
  const first = page*pageSize;
  $("prev").disabled = page === 0;
  $("next").disabled = first+pageSize >= matches.length;
  $("status").textContent = matches.length ? (first+1)+"–"+Math.min(first+pageSize,matches.length)+" of "+matches.length+" occurrences" : "No matching occurrences.";
  $("rows").replaceChildren(...matches.slice(first,first+pageSize).map(row => {
    const tr = node("tr");
    const source = node("td");
    source.append(node("strong",row.source_file+":"+row.source_line),node("br"),node("small",row.outlet+" · "+row.country+" · "+row.id));
    const subject = node("td");
    subject.append(node("strong",row.subject+" · "+row.verb_group),node("br"),node("small",row.voice+" · "+row.subject_referent));
    const coding = node("td");
    coding.append(node("strong",capitalise(row.process_type)),node("br"),node("small",row.subject_participant_role));
    tr.append(source,subject,coding,node("td",row.source_sentence));
    return tr;
  }));
  $("scroll").scrollTop = 0;
}
function refresh() { page=0; renderChart(); renderEvidence(); }
for (const id of ["country","referent","process"]) $(id).addEventListener("change",refresh);
$("measure").addEventListener("change",renderChart);
$("outlet").addEventListener("change",() => { page=0; renderEvidence(); });
$("query").addEventListener("input",() => { page=0; renderEvidence(); });
$("prev").addEventListener("click",() => { page--; renderEvidence(); });
$("next").addEventListener("click",() => { page++; renderEvidence(); });
refresh();
