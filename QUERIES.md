**ALL QUERIES OVERVIEW**
--------------------
*Note that there are 2 Query Syntaxes for BigQuery. Standard SQL and Legacy SQL. If you are developing new Queries, standard SQL Syntax is preferred. You can change the Syntax Mode of Queries under >Show Options< and then untick Legacy SQL*
<br>

**Find How many Times "This Should Never Happen" was in your code**

  
      #LEGACY SQL SYNTAX
      SELECT count(*)
    FROM (SELECT id, repo_name, path
            FROM [your-files]
          ) AS F
    JOIN (SELECT id
            FROM [your-contents]
           WHERE content CONTAINS 'This should never happen') AS C
    ON F.id = C.id;


**Most Commonly Used Go Packages**

    #LEGACY SQL SYNTAX
    SELECT
      REGEXP_EXTRACT(line, r'"([^"]+)"') AS url,
      COUNT(*) AS count
    FROM FLATTEN(
      (SELECT
      SPLIT(SPLIT(REGEXP_EXTRACT(content, r'.*import\s*[(]([^)]*)[)]'), '\n'), ';') AS line,
      FROM
        (SELECT id, content FROM [your-contents]
         WHERE REGEXP_MATCH(content, r'.*import\s*[(][^)]*[)]')) AS C
        JOIN EACH
        (SELECT id FROM [your-files]
         WHERE path LIKE '%.go' GROUP BY id) AS F
        ON C.id = F.id), line)
    GROUP BY url
    HAVING url IS NOT NULL
    ORDER BY count DESC

**Most Commonly Used Java Packages**

    #LEGACY SQL SYNTAX
    SELECT package, COUNT(*) c
    FROM (
      SELECT REGEXP_EXTRACT(line, r' ([a-z0-9\._]*)\.') package, id
      FROM (
         SELECT SPLIT(content, '\n') line, id
         FROM [your-contents]
         WHERE content CONTAINS 'import'
         AND path LIKE '%.java'
         HAVING LEFT(line, 6)='import'
      )
      GROUP BY package, id
    )
    GROUP BY 1
    ORDER BY c DESC
    LIMIT 500;

**Counting .go Files (Adjust for any other extension)**

    #LEGACY SQL SYNTAX
    SELECT COUNT(*)
    FROM [your-files]
    WHERE RIGHT(path, 3) = ‘.go’

These Queries are copied from [This Medium Post from Francesc Campoy](https://medium.com/google-cloud/analyzing-go-code-with-bigquery-485c70c3b451) and from [This Gist by arfon](https://gist.github.com/arfon/49ca314a5b0a00b1ebf91167db3ff02c). Check these links out for more information. Also check out [This Post by Felipe Hoffa](https://medium.com/google-cloud/github-on-bigquery-analyze-all-the-code-b3576fd2b150) for more info.


----------

**MORE QUERIES**
------------

**Get the most frequently changed files in a repository** <br>
The results show the most frequent files which are found in all commits and shows the average number of affected lines of a file.

    #SQL SYNTAX
    SELECT
      d.new_path,
      repo_name,
      COUNT(*) AS commits,
      ROUND(AVG(d.changed_lines + d.added_lines + d.deleted_lines)) AS affected_lines
    FROM
      `your-commits`,
      UNNEST(difference) AS d
    WHERE
      repo_name="sql-api"
    GROUP BY
      d.new_path,
      repo_name
    ORDER BY
      commits DESC
    LIMIT
