   /////////////////////////////////////////////////////////
  ///   BIG QUERY UPLOAD REPOSITORY TO GCLOUD TABLES    ///
 ///   Project-Id: fdc-test-statistic                 ///
///////////////////////////////////////////////////////


//CL Args
const BigQuery = require('@google-cloud/bigquery');
const commandLineArgs = require('command-line-args');
const request = require("request")


const optionDefinitions = [
  { name: 'username', alias: 'u', type: String },
  { name: 'repo', alias: 'r', type: String }
];

const options = commandLineArgs(optionDefinitions);


const projectId = 'fdc-test-statistic';
const bigquery = BigQuery({
  projectId: projectId
});
var dataset = bigquery.dataset('git');
var tableId = 'new_table';



//Request Commits
const request_options = {
    url: "https://api.github.com/repos/" + options.username + "/" + options.repo + "/commits",
    method: 'GET',
    headers: {
        'User-Agent': options.username
    }
};

request(request_options, function(err, res, body) {
    let json = JSON.parse(body);
    console.log(json);
});
