-- The frontend assumes fixed quadrant ids: 1 Techniques, 2 Tools, 3 Platforms,
-- 4 LanguagesFrameworks (the order created in 000002). Some databases ended up
-- with the same names under different ids, which mislabels every technology.
-- Re-point technologies by quadrant name, then rename the rows to the canonical
-- order. A no-op when the ids already match.
UPDATE technology t
SET quadrant_id = CASE q.name
    WHEN 'Techniques' THEN 1
    WHEN 'Tools' THEN 2
    WHEN 'Platforms' THEN 3
    WHEN 'LanguagesFrameworks' THEN 4
END
FROM quadrants q
WHERE q.id = t.quadrant_id
  AND q.name IN ('Techniques', 'Tools', 'Platforms', 'LanguagesFrameworks');

UPDATE quadrants
SET name = CASE id
    WHEN 1 THEN 'Techniques'
    WHEN 2 THEN 'Tools'
    WHEN 3 THEN 'Platforms'
    WHEN 4 THEN 'LanguagesFrameworks'
END
WHERE id IN (1, 2, 3, 4);
