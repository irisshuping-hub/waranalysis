---
name: sfl-transitivity
description: Extract grammatical subject–verb occurrences from a text corpus and classify them by Systemic Functional Linguistics transitivity. Use for studies of agency, state actors, attribution, or process types.
---

# Analyze transitivity

- Define which mentions qualify as subjects. Distinguish bare entity names, affiliated institutions, people or demonyms, and affiliated objects or events. Decide separately whether metonyms, coreference, and nonfinite clauses are in scope.
- Use dependency parsing to surface candidates. Check the full subject phrase and predicate in context. Recover coordinated predicates sharing an overt subject and distinguish separate coordinated subjects. Reject country names that appear solely in objects, incidental location phrases, or unrelated possessors. Review rejected and uncertain parses for omissions, especially in headlines and scraped captions.
- Record one row per qualifying subject–predicate occurrence. Store a stable ID, corpus or outlet, entity, subject phrase, referent category, verb group, lexical lemma, voice, source filename and line, and source sentence. Keep auxiliaries with the verb group. Distinguish lexical have or be from auxiliary uses.
- Code the process in context using material (action or change), mental (cognition, perception, affect, or desire), relational (attribution, identification, or possession), verbal (communication), behavioural (observable physiological or psychological behaviour), or existential (existence or occurrence). Decide borderline cases from clause meaning and complements. Mark uncertainty rather than assigning a universal category to a lemma.
- Code the participant role separately from grammatical subjecthood. For example, a passive subject can be a Goal in a material clause or a Target in a verbal clause. In attributed reporting, distinguish the Sayer of the projecting clause from the actor in the reported clause.
- Save the extraction and coding as separate CSVs joined by stable row ID. Verify row counts, source references, allowed codes, and a sample of positive and excluded cases. Report parser and annotation limitations and any scope exclusions. If visualizing, show counts and within-group shares with visible denominators and let readers inspect the source evidence.
