# Broken Filenames

Files found at the root of `/var/www/i_am_running/` on 2026-04-21 with filenames that could only have come from broken shell commands (unclosed heredocs, interrupted `git push`, comments that ended up as filenames).

## Contents (all archived with `2026-04-21-` prefix + sanitized name + `.txt` extension)

| Archived as | Original filename | Original size | Original mtime |
|------------|------------------|---------------|----------------|
| `2026-04-21-extract_only_component-specific_CSS_not_entire_page.txt` | `) extract only component-specific CSS, not entire page` | 8192 bytes | 2026-02-27 |
| `2026-04-21-h_-f_origin_main.txt` | `h -f origin main` | 62618 bytes | 2026-03-22 |
| `2026-04-21-saved_CSS_from_1MB_to_50KB_per_component.txt` | `saved CSS from 1MB+ to ~50KB per component` | 5496 bytes | 2026-02-27 |

## Guessed origin

- First and third: remnants of heredoc commands that were interrupted or mis-quoted during CSS extraction work in late February 2026. The closing `)` and the plain English phrase look like fragments of shell heredoc markers + comments that got written as filenames because of bracket mismatches.
- Second: an interrupted `git push -f origin main` where the `git pus` was typed, shell exited mid-word, and the remaining fragment `h -f origin main` got captured as a filename (possibly through shell redirect to a file whose name was the rest of the command).

## Why kept (not deleted)

Unknown content value. 62k of content in `h -f origin main` might be a backup / dump / forgotten output someone wrote. Preserved for forensic value. Decide delete-vs-keep in a future cleanup pass.

## Rule going forward

Any time you see files in the project root with spaces in the name or non-ASCII starting characters (`)`, `|`, etc.), treat them as broken and archive to this folder with a sanitized name. Don't edit them in place.

---

*Archived during migration Step 1.4 on 2026-04-21.*
