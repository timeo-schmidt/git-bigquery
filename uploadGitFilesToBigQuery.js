//Imports
const fs = require('fs');
const util = require('util');

const BigQuery = require('@google-cloud/bigquery');

const projectId = 'fdc-test-statistic';

const bigquery = BigQuery({
  projectId: projectId
});

//git Sub Dataset
var dataset = bigquery.dataset('git');



var commitTable = dataset.table('commits');
var filesTable = dataset.table('files');
var contentsTable = dataset.table('contents');
var diffTable = dataset.table('diffs');

function launchStreams() {

  console.log("[Good] Opening Commits File");
  console.log("[Good] Launching Write Stream for Commits");
  fs.createReadStream('../GitParsedContent/commits_bigquery-format.json')
    .pipe(commitTable.createWriteStream('json'))
    .on('complete', function(job) {
      job.on('error', function(err) {
        console.log("ERROR: Commits");
        console.log(err);
      });

      job.on('complete', function(metadata) {
        console.log(util.inspect(metadata, false, null));
        console.log("=======================================");
        console.log("[Awesome: Commits] Uploaded Commits to Database");
        console.log("=======================================");
      });
    });

  console.log("[Good] Opening Diffs File");
  console.log("[Good] Launching Write Stream for Diffs");
  fs.createReadStream('../GitParsedContent/diffs_bigquery-format.json')
    .pipe(diffTable.createWriteStream('json'))
    .on('complete', function(job) {
      job.on('error', function(err) {
        console.log("ERROR: Diffs");
        console.log(err);
      });

      job.on('complete', function(metadata) {
        console.log(util.inspect(metadata, false, null));
        console.log("=======================================");
        console.log("[Awesome: Diffs] Uploaded Diffs to Database");
        console.log("=======================================");
      });
    });


  console.log("[Good] Opening Files File");
  console.log("[Good] Launching Write Stream for Files");
  fs.createReadStream('../GitParsedContent/files_bigquery-format.json')
    .pipe(filesTable.createWriteStream('json'))
    .on('complete', function(job) {
      job.on('error', function(err) {
        console.log("ERROR: Files");
        console.log(err);
      });

      job.on('complete', function(metadata) {
        console.log(util.inspect(metadata, false, null));
        console.log("=======================================");
        console.log("[Awesome: Files] Uploaded Files to Database");
        console.log("=======================================");
      });
    });


  console.log("[Good] Opening Contents File");
  console.log("[Good] Launching Write Stream for Contents");
  fs.createReadStream('../GitParsedContent/contents_bigquery-format.json')
    .pipe(contentsTable.createWriteStream('json'))
    .on('complete', function(job) {
      job.on('error', function(err) {
        console.log("ERROR: Commits");
        console.log(err);
      });

      job.on('complete', function(metadata) {
        console.log(util.inspect(metadata, false, null));
        console.log("=======================================");
        console.log("[Awesome: Contents] Uploaded contents to Database");
        console.log("=======================================");
      });
    });

}

launchStreams();
