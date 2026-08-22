---
title:   "[Title — up to about 60 characters]"
hook:    "[Hook — one sentence, about 140 characters, on what the reader walks away with.]"
date:    2026-08-14
minutes: 7
tags:    [sample]
image:   ""
---

This is a sample post so the writing pages have something to render. Delete it
when you write the real thing.

## [Section heading]

Body copy renders at 17px on a 1.75 line height, capped at 68 characters, with
inline [links](https://example.com), **bold text**, and `inline code`.

- Unordered list items keep the same rhythm as body copy.
- Markers sit in the gutter so the text edge stays straight.

> The model isn't the work. Getting it used is the work.

### [Sub-heading]

1. Numbered steps for anything procedural.
2. They inherit the same spacing as the unordered list.

```python
import pandas as pd

spend = pd.read_parquet("spend.parquet")
weekly = spend.groupby(["week", "channel"])["cost"].sum()
```
