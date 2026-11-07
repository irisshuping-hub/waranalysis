---
name: corpus-comparison
description: Compare two or more text corpora using normalized frequencies, keyness, collocations, recurrent word sequences, and concordances. Use for comparative corpus studies and their evidence dashboards.
---

# Compare corpora

- Inventory files, token totals, and available date, genre, or topic metadata. Detect exact duplicates, overlapping updates, and scraped boilerplate. Preserve original files and line numbers. Document what is removed, what remains, and the tokenization rules.
- Define the query forms explicitly. Keep bare country names, adjectives, demonyms, and possessives separate unless the analysis calls for pooling. Preserve consistent capitalization rules when a case distinction matters, such as US versus us.
- Report raw counts, files containing the term, and a common token-normalized rate. For comparative keyness, rank by a documented log-likelihood G² calculation, give the direction of the difference and the two rates, and state the expected-count model. Treat rankings as descriptive when documents cluster by event or share content.
- For collocations, use a documented span and boundary rule. A useful starting point is four tokens on either side within a sentence or source line. Report pair counts, file dispersion, and logDice computed as 14 + log₂(2 × pair count / (node count + collocate count)). Apply minimum frequency and dispersion thresholds to interpreted findings. Extract repeated contiguous sequences separately for evidence about exact constructions.
- Read concordances before interpreting frequency or association. Check quotation and attribution, grammatical function, spelling variants, and whether a single document accounts for a pattern. Repeat key comparisons under a defensible sensitivity condition when documents are unusually long or overlap.
- Export evidence as CSVs with source filenames and line numbers where applicable. If building a dashboard, label denominators, show raw counts alongside rates, and let readers inspect the concordances behind the charts.
