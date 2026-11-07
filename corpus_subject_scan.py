import csv
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(os.environ["TEMP"]) / "codex-corpus-sfg-parser"))
sys.path.insert(0, str(Path.home() / "AppData/Local/Temp/codex-corpus-sfg-parser"))
for optional in ("h5py", "torch", "tensorflow"):
    sys.modules[optional] = None
import spacy

root = Path(__file__).resolve().parent
nlp = spacy.load("en_core_web_sm", disable=["ner"])
target = re.compile(r"\b(ukraine|ukrainians?|russia|russians?)\b", re.I)
subject_deps = {"nsubj", "nsubjpass", "csubj", "csubjpass"}
aux_deps = {"aux", "auxpass", "neg", "prt"}
extras = {"mark", "det", "case", "poss", "amod", "compound", "nmod", "appos", "prep", "pobj", "nummod", "quantmod", "advmod", "predet", "agent", "acl"}
inputs = []
for outlet in ("BBC", "CNN"):
    for path in sorted((root / (outlet + "_Ukraine")).glob("*.txt")):
        for number, line in enumerate(path.read_text(encoding="utf-8-sig").split("\n"), 1):
            line = line.strip()
            if re.match(r"^(PreviousNext|Shareclose panel)", line):
                break
            if re.match(r"^(Image source,|Image caption,|By [A-Z][a-z]+ [A-Z][a-z]+(?: and [A-Z][a-z]+ [A-Z][a-z]+)?$)", line):
                continue
            line = re.sub(r"[\u00C2-\u00F4][\u0080-\u00BF]{1,3}", lambda m: m[0].encode("latin1").decode("utf8", errors="replace"), line)
            line = re.sub(r"^Link Copied!\s*|^Close(?=President)|^Published\d+\s+(?:hours?|days?)\s+ago", "", line)
            if re.match(r"^Inside Ukrainian offensive pushing Russia back - with Starlink playing a key role$|^Zelensky says Ukraine has right to defend itself after Trump calls latest strikes",line):
                continue
            if target.search(line):
                inputs.append((line, (outlet, path.name, number)))

def subject_tokens(head):
    yield head
    for child in head.children:
        if child.dep_ in extras and child.pos_ not in {"VERB","AUX"}:
            yield from subject_tokens(child)

def predicates(head):
    yield head
    for child in head.children:
        if child.dep_ == "conj" and child.pos_ in {"VERB","AUX"} and not any(t.dep_ in subject_deps for t in child.children):
            yield from predicates(child)

def surface(tokens):
    return " ".join(t.text for t in sorted(tokens,key=lambda t:t.i)).replace(" 's","'s").replace(" ’s","’s").replace(" n't","n't")

output = []
missed = []
for doc, (outlet,file,line) in nlp.pipe(inputs, as_tuples=True, batch_size=32):
    covered = set()
    for token in doc:
        if token.dep_ not in subject_deps or token.pos_ in {"VERB", "AUX"}:
            continue
        for subject in [token,*token.conjuncts]:
            members = list(subject_tokens(subject))
            forms = [t for t in members if target.fullmatch(t.text)]
            if not forms:
                continue
            covered.update(t.i for t in forms)
            for verb in predicates(token.head):
                group = [verb,*[t for t in verb.children if t.dep_ in aux_deps]]
                comp = [t for t in verb.children if t.dep_ in {"attr","acomp","oprd","dobj","xcomp","ccomp"}]
                output.append([outlet,file,line,surface(members),subject.text,surface(forms),surface(group),verb.lemma_,verb.dep_,surface(comp),verb.sent.text,subject.i,verb.i])
    for token in doc:
        if target.fullmatch(token.text) and token.i not in covered:
            missed.append([outlet,file,line,token.text,token.dep_,token.head.text,token.sent.text])
folder = root / "corpus_results"
for filename, rows in [("sfg-candidates.tsv",output),("sfg-other.tsv",missed)]:
    with (folder / filename).open("w", encoding="utf-8", newline="") as stream:
        csv.writer(stream,delimiter="\t").writerows(rows)
print(len(output),len(missed))



