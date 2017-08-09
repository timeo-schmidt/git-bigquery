   /////////////////////////////////////////////////////
   ///   BIG CREATE GITHUB BIGQUERY GCLOUD TABLE     ///
   ///   Project-Id: fdc-test-statistic              ///
   /////////////////////////////////////////////////////

   const BigQuery = require('@google-cloud/bigquery');

   const projectId = 'fdc-test-statistic';

   const bigquery = BigQuery({
     projectId: projectId
   });

   //git Sub Dataset
   var dataset = bigquery.dataset('git');



   var commitsTable = "commits";
   var filesTable = "files";
   var contentsTable = "contents";
   var diffTable = "diffs";

   var commitsTable_options = {
     schema: [{
         "mode": "NULLABLE",
         "name": "commit",
         "type": "STRING"
       },
       {
         "mode": "REPEATED",
         "name": "parents",
         "type": "STRING"
       },
       {
         "mode": "NULLABLE",
         "name": "author",
         "type": "RECORD",
         "fields": [{
             "mode": "NULLABLE",
             "name": "name",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "email",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "time_sec",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "tz_offset",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "date",
             "type": "STRING"
           }
         ]
       },
       {
         "mode": "NULLABLE",
         "name": "committer",
         "type": "RECORD",
         "fields": [{
             "mode": "NULLABLE",
             "name": "name",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "email",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "time_sec",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "tz_offset",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "date",
             "type": "STRING"
           }
         ]
       },
       {
         "mode": "NULLABLE",
         "name": "message",
         "type": "STRING"
       },
       {
         "mode": "REPEATED",
         "name": "difference",
         "type": "RECORD",
         "fields": [{
             "mode": "NULLABLE",
             "name": "old_path",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "new_path",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "old_sha1",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "new_sha1",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "changed_lines",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "added_lines",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "deleted_lines",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "line_header",
             "type": "STRING"
           }
         ]
       },
       {
         "mode": "NULLABLE",
         "name": "repo_name",
         "type": "STRING"
       }
     ]
   };


   var filesTable_options = {
     schema: "repo_name:STRING,ref:STRING,path:STRING,id:STRING"
   };


   var contentsTable_options = {
     schema: "id:STRING,size:INTEGER,content:STRING,repo_name:STRING,path:STRING"
   };

   var diffTable_options = {
     schema: [{
         "mode": "NULLABLE",
         "name": "repo_name",
         "type": "STRING"
       },
       {
         "mode": "NULLABLE",
         "name": "commit",
         "type": "STRING"
       },
       {
         "mode": "REPEATED",
         "name": "difference",
         "type": "RECORD",
         "fields": [{
             "mode": "NULLABLE",
             "name": "old_path",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "new_path",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "old_sha1",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "new_sha1",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "changed_lines",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "added_lines",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "deleted_lines",
             "type": "INTEGER"
           },
           {
             "mode": "NULLABLE",
             "name": "line_header",
             "type": "STRING"
           },
           {
             "mode": "NULLABLE",
             "name": "diff_contents",
             "type": "STRING"
           }
         ]
       }
     ]
   }



   console.log("Creating the TABLES...");
   dataset.createTable(commitsTable, commitsTable_options, function(err, table, apiResponse) {
     console.log("COMMITS TABLE WAS CREATED.");
   });
   dataset.createTable(filesTable, filesTable_options, function(err, table, apiResponse) {
     console.log("FILES TABLE WAS CREATED.");
   });
   dataset.createTable(contentsTable, contentsTable_options, function(err, table, apiResponse) {
     console.log("CONTENTS TABLE WAS CREATED.");
   });
   dataset.createTable(diffTable, diffTable_options, function(err, table, apiResponse) {
     console.log("DIFF TABLE WAS CREATED.");
   });
