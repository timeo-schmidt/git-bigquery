





**Upload Your Local Git Repositories To Google Big Query**
-------------------------------------------------
This is a node.js Project that helps you upload your own local git repositories to your Google Big Query database.
<br><br>
## What's this Project for? ##
There are already public GitHub Datasets available on BigQuery and people have invented a number of queries to analyse these Open Source Repos with the power of Google BigQuery. This project was created to allow you upload your own private repositories to BigQuery and analyse them yourself. The big advantage is that you can just Copy-Paste all the existing Queries, as the table structure was  kept the same. 


----------


## Getting Started ##
**Prerequisites:**
 - A local git repository
 - Node.js installed
 - Google BigQuery Account

**Step1**
Download this project and go into the folder and run:
	

    npm install
   
   In some cases the required node library nodegit throws errors while installing.
   Sometimes running manually `npm install nodegit --save` solved the problem. Otherwise check out the [nodegit issues](https://github.com/nodegit/nodegit/issues). 


----------


<h3>Understanding the Project Structure</h3>
Creating the BigQuery Tables with your git repo content is a three step process:



***A: Creating The Tables***
Creating the tables in an existing BigQuery Dataset by running:
 `node create_tables.js`
 
***B: Getting the Repo Ready for Upload (This is the most important Process)***
In order to upload the data to BigQuery, the content needs to be saved temporarily, so it then can be streamed up to BigQuery.

`node get_git_files.js`

Required Arguments: 
  -b argument must be a branch which is searched (TYPE: string (e.g. master))
  -p argument must lead to a valid git project path (TYPE: path (e.g. ../project/))

Example: 

    node get_git_files.js -b master -p ../sql-api/ -c ../GitUploadRepo/

***C: Uploading Repo To BigQuery***
Simply Run: 

    node uploadFilesToBigQuery.js
This will upload the contents generated in Step C to BigQuery.


----------
## Querying  Your Data ##
As mentioned above, you can most likely use any query about the public GitHub datasets you can find online (just change the table names) .

**Sample Queries**
------------------

**Find How many Times "This Should Never Happen" was in your code**

  

      SELECT count(*)
    FROM (SELECT id, repo_name, path
            FROM [your-files]
          ) AS F
    JOIN (SELECT id
            FROM [your-contents]
           WHERE content CONTAINS 'This should never happen') AS C
    ON F.id = C.id;


**Most Commonly Used Go Packages**

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

    SELECT COUNT(*)
    FROM [your-files]
    WHERE RIGHT(path, 3) = ‘.go’

[**VIEW ALL QUERIES**](blba)
------------------------
*Have you written more interesting queries? - Create a Pull request and we would love to add them here.*

These Queries are copied from [This Medium Post from Francesc Campoy](https://medium.com/google-cloud/analyzing-go-code-with-bigquery-485c70c3b451) and from [This Gist by arfon](https://gist.github.com/arfon/49ca314a5b0a00b1ebf91167db3ff02c). Check these links out for more information. Also check out [This Post by Felipe Hoffa](https://medium.com/google-cloud/github-on-bigquery-analyze-all-the-code-b3576fd2b150) for more info.


----------


Thanks! 

Timeo Schmidt
During my 2 weeks [@freiheit.com](http://www.freiheit.com)
With the help of: [freiheit](https://github.com/freiheit-com)

