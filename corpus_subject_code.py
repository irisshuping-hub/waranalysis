import csv
import re
from collections import Counter
from pathlib import Path

folder = Path(__file__).resolve().parent / "corpus_results"
with (folder / "sfg-candidates.tsv").open(encoding="utf8", newline="") as file:
    candidates = list(csv.reader(file, delimiter="\t"))

# Exclusions identified in concordance review: unrelated heads, broken parses,
# appositive-only matches, or repeats introduced within a parsed sentence.
exclude = {
    1,23,40,47,50,59,65,67,74,78,83,88,89,103,104,120,122,126,127,
    147,152,158,166,172,185,187,189,190,201,209,212,224,225,226,
    236,238,240,242,248,256,263,265,269,270,281,284,287,288,295,296,
    302,304,313,315,316,322,326,331,336,337,345,361,368,373,374,376,377,
    391,396,398,403,405,408,414,415,416,428,437,438,439,440,455,
    466,470,471,475,476,478,479,482,483,486,495,511,523,533,548,549,550,
    552,553,565,567,578,581,608,609,621,623,624,631,638,645,646,
}
# Replace the displayed verbal group and lemma after checking the source clause.
repairs = {
    14:("has admitted","admit"), 23:("have slowed","slow"),
    26:("stands accused","accuse"), 45:("was prepared","prepare"), 51:("never join","join"),
     85:("concerned","concern"),
    97:("would have to seize","seize"), 108:("could keep coming back","come"),
    126:("are held","hold"), 
    
    229:("retook","retake"),
    253:("repel","repel"),
    274:("continued attacking","attack"), 275:("continued attacking","attack"),
    279:("has finished building","build"), 283:("did not stop hitting","hit"),
    289:("was planning","plan"), 310:("has to do","do"),
    390:("has continued to burn through","burn through"),
    402:("appears to have realized","realize"), 407:("have to prevent","prevent"),
    422:("is going to need","need"), 461:("would continue to support","support"),
    506:("continues to pour","pour"), 515:("failed to take","take"),
    521:("are having to commit","commit"), 526:("proved to be","be"),
    536:("has done","do"), 544:("is going to have to transition","transition"),
    545:("can out-suffer","out-suffer"), 546:("can out-suffer","out-suffer"),
    556:("does not have to rely","rely"), 563:("has taken","take"),
    582:("are going to deliver","deliver"), 585:("praises","praise"), 303:("continues striking","strike"), 250:("continues to suffer","suffer"), 143:("made the point","make"),
    597:("appears to have recanted","recant"), 606:("are","be"),
    629:("has yet to move","move"), 632:("continue to control","control"),
    635:("admit","admit"), 643:("continue to control","control"),
}
for index in (23,126,185,187,189,194,224,225,236,238,248,256,263,265,269,281,284,287,302,313,315,397,551):
    exclude.discard(index)

# Explicit subjects for headline or coordinated clauses split incorrectly.
extra = [
    (254,"Ukraine","Ukraine","has made","make"),
    (585,"Sergei Lavrov","Russian","speaks","speak"),
    (546,"Russians","Russians","out-suffered","out-suffer"),

    (615,"Russian Foreign Minister Sergey Lavrov","Russian","speaks","speak"),
    (621,"Russian foreign ministry","Russian","summons","summon"),
    (635,"Two Russians","Russians","claiming","claim"),
    (545,"Russians","Russians","out-suffered","out-suffer"),
    (583,"Russia","Russia","deploying","deploy"),
]
# Corrections of misleading subject spans caused by merged captions, dates and
# appositives. The sentence column retains the source evidence.
subject_repairs = {
    23:"Russian efforts to encircle the capital Kyiv",126:"Hundreds of captured Russian soldiers, conscripts, and mercenaries",
    160:"Ukraine",253:"Ukraine",291:"Ukrainian drones",356:"25-year-old Arina",
    397:"Russian forces",407:"They [Russia]",428:"Kluge's visit",
    310:"Russia",459:"new Russian offensive in eastern Ukraine",477:"Russian drone and missile attacks in Ukraine",
    480:"Russian drone and missile attacks in Ukraine",505:"additional Russian troops pouring into Ukraine",
    585:"Russian foreign minister",615:"Russian foreign minister",635:"Two Russians",
}

verbal = set("""accuse acknowledge admit announce apologize appeal argue ask boast call claim comment confess confirm declare demand deny describe discuss dismiss express indicate insist issue mock note praise question recant reject reply report respond rule say speak suggest talk taunt tell tweet urge warn""".split())
mental = set("""anticipate await believe choose concern decide deserve expect fear feel hear hope intend know learn need out-suffer plan realize recognise recognize see seek spot struggle think understand want""".split())
relational = set("""be become characterize constitute contain face mean remain represent share stay vary""".split())
behavioural = set("""celebrate watch""".split())
existential = {"exist", "happen", "occur"}
context_types = {
    26:"verbal", 85:"mental", 96:"material", 143:"verbal",
    125:"material", 156:"mental", 184:"existential",
    218:"material", 237:"material", 258:"relational",
    305:"verbal", 306:"verbal", 343:"mental", 346:"verbal", 352:"mental",
    367:"mental", 382:"material", 402:"mental", 424:"verbal",
    443:"verbal", 461:"mental", 469:"mental", 473:"mental",
    505:"relational", 526:"relational", 541:"material", 542:"material",
    543:"material", 583:"material", 599:"verbal", 616:"relational",
    630:"verbal", 634:"relational", 647:"relational",
}
passive = set("""accuse allow arrest authorise authorize avert ban barricade cleanse convict create design draft drive expose fold force free give hold jail kill lock move oust reduce return say see send shoot spot target use wound""".split())
media_or_nonactor = re.compile(r"\b(airspace|attack[s]?|casualties|confidence|data|defence$|destruction|drones?|efforts?|flag|frustration|grain|inadequacies|invasion|losses|morale|offensive|onslaught|population|public focus|radar|shells?|siege tactics|strikes?|strategy|tactics|vehicle|warplanes?|weapons?|will$|missiles?|fighter jet|helicopter|drills|Grand Prix|wreckage|oil refineries|nuclear power plant)\b", re.I)
# Country names occurring only in the location, target, or beneficiary of the
# actual subject do not assign that subject to the country.
incidental = re.compile(r"\b(?:in|across|around|against|towards?|for|near|on|into|between|by|from)\s+(?:(?:the|modern)\s+)?(?:Ukraine|Russia)\b", re.I)

def entity(subject, forms):
    relevant = incidental.sub("", subject)
    match = re.search(r"\b(ukrain\w*|russia\w*)\b", relevant, re.I)
    if not match:
        return ""
    return "Ukraine" if match[0].lower().startswith("ukrain") else "Russia"

def category(subject, country):
    if re.fullmatch(r"(?:modern |Soviet )?(?:Ukraine|Russia)|They \[Russia\]", subject, re.I):
        return "country name"
    if media_or_nonactor.search(subject):
        return "affiliated entity, event or object"
    if re.search(r"\b(people|citizens|civilians|children|men|fathers|Russians|Ukrainians|prisoners|convicts|billionaire|bloggers|journalist|activist|Arina)\b", subject, re.I):
        return "people or demonym"
    return "institution or institutional actor"

def classify(index, group, lemma, sentence):
    if index in context_types:
        return context_types[index]
    if lemma == "have" or group == "being":
        return "relational"
    if lemma == "go" and "going backwards" not in sentence:
        return "material"
    if lemma in existential or (lemma == "begin" and re.search(r"\binvasion\b", sentence, re.I)):
        return "existential"
    if lemma in verbal:
        return "verbal"
    if lemma in mental:
        return "mental"
    if lemma in relational:
        return "relational"
    if lemma in behavioural:
        return "behavioural"
    return "material"

roles = {
    "material":("Actor / affected participant","Goal or affected participant"),
    "mental":("Senser","Phenomenon"),
    "verbal":("Sayer","Receiver, Target or Verbiage"),
    "relational":("Carrier or Token","Carrier or Token"),
    "behavioural":("Behaver","Behaver"),
    "existential":("Existent","Existent"),
}
verbs = []
coded = []
seen = set()
def add(index, row, subject, forms, group, lemma, *, is_extra=False):
    outlet, file, line, _, _, _, _, _, dep, _, sentence, si, vi = row
    country = entity(subject,forms)
    if not country and (is_extra or index in subject_repairs):
        country = "Ukraine" if forms.lower().startswith("ukrain") else "Russia"
    if not country or not group or lemma in {"fifth","high","offensive","part","market"}:
        return
    key = (file,line,subject.lower(),group.lower(),sentence)
    if key in seen:
        return
    seen.add(key)
    if lemma == "annexed":
        lemma = "annex"
    passive_voice = index == 26 or (lemma in passive and bool(re.search(r"\b(?:am|is|are|was|were|be|been|being)\b", group, re.I)) and not group.endswith("ing"))
    voice = "passive" if passive_voice else "active / non-passive"
    ref = f"S{len(verbs)+1:04d}"
    base = [ref,outlet,country,file,line,subject,category(subject,country),forms,group,lemma,voice,sentence]
    verbs.append(base)
    process = classify(index,group,lemma,sentence) if not is_extra else classify(-1,group,lemma,sentence)
    role = roles[process][int(passive_voice)]
    if process == "material" and not passive_voice:
        role = "affected participant" if lemma in {"die","suffer","receive","lose","encounter"} else "Actor"
    note = {
        "material":"Action, event or change in the clause",
        "mental":"Cognition, perception, affect or desire in the clause",
        "verbal":"Communication, attribution or a speech act",
        "relational":"Attribution, identification, location or possession",
        "behavioural":"Observable physiological or psychological behaviour",
        "existential":"Existence or occurrence",
    }[process]
    coded.append(base+[process,role,note])

for index,row in enumerate(candidates):
    if index in exclude:
        continue
    subject, forms = subject_repairs.get(index,row[3]),row[5]
    group, lemma = repairs.get(index,(row[6],row[7]))
    add(index,row,subject,forms,group,lemma)
for index,subject,forms,group,lemma in extra:
    add(index,candidates[index],subject,forms,group,lemma,is_extra=True)

headers = ["id","outlet","country","source_file","source_line","subject","subject_referent","matched_form","verb_group","verb_lemma","voice","source_sentence"]
for name,fields,rows in [
    ("ukraine_russia_subject_verbs.csv",headers,verbs),
    ("ukraine_russia_sfl_transitivity.csv",headers+["process_type","subject_participant_role","coding_basis"],coded),
]:
    with (folder / name).open("w",encoding="utf-8-sig",newline="") as file:
        writer=csv.writer(file)
        writer.writerow(fields)
        writer.writerows(rows)
print("Rows:",len(verbs))
print("By outlet/country:",sorted(Counter((r[1],r[2]) for r in verbs).items()))
print("By process:",sorted(Counter(r[-3] for r in coded).items()))


