# TestMyAgent project guide

This workspace compares how BBC and CNN report the Russia–Ukraine war and represent Ukraine- and Russia-linked subjects.

## Data and workflows

- Treat `BBC_Ukraine/` and `CNN_Ukraine/` as source corpora. Preserve the original files and line numbers.
- Use the [corpus comparison skill](skills/corpus-comparison/SKILL.md) for normalized frequencies, log-likelihood keyness, logDice collocations, repeated phrases, and concordance analysis. The existing comparison can be regenerated with `node corpus_analysis.cjs`. Add `--shorter-files` to reproduce the sensitivity comparison.
- Use the [SFL transitivity skill](skills/sfl-transitivity/SKILL.md) for subject–verb extraction and process and participant-role coding. Recheck the source clauses when revising the coding.

## Reports and outputs

- [Complete corpus findings](BBC%20and%20CNN%20Complete%20Corpus%20Findings.docx) is the current consolidated report. It covers keyword rates and G², logDice collocations, exact phrases, concordance examples, sensitivity checks, and the SFL results. [Corpus findings summary](BBC%20and%20CNN%20Corpus%20Findings.docx) is the earlier short report.
- `corpus_results/` holds the main comparison CSVs. Use `frequencies.csv` for normalized rates, `keywords.csv` for keyness and direction, `collocations.csv` for logDice and pair dispersion, `clusters.csv` for exact phrases, and `concordance.csv` for source context. `corpus_results/shorter_files/` holds the comparison excluding the two longest files per outlet.
- `corpus_results/ukraine_russia_subject_verbs.csv` holds the subject–verb inventory. `corpus_results/ukraine_russia_sfl_transitivity.csv` adds process and participant-role codes under the same row IDs.
- `corpus_web/` and `sfl_web/` hold the interactive dashboards. Each has an entry point at `dist/index.html`. Refresh the corresponding dashboard data and review the complete report when the underlying results change.

## Interpretation

Report raw counts and denominators, check source concordances before interpreting patterns, and distinguish grammatical subjecthood from agency. Describe outlet differences as findings about the supplied sample. Account for unmatched topics and formats, overlapping material, and parser or coding uncertainty.
