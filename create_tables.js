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


/*
GITHUB PUBLIC DATASET TABLE STRUCTURE

commit	STRING	NULLABLE

tree	STRING	NULLABLE

parent	STRING	REPEATED

author	RECORD	NULLABLE

author.name	STRING	NULLABLE

author.email	STRING	NULLABLE

author.time_sec	INTEGER	NULLABLE

author.tz_offset	INTEGER	NULLABLE

author.date	TIMESTAMP	NULLABLE

committer	RECORD	NULLABLE

committer.name	STRING	NULLABLE

committer.email	STRING	NULLABLE

committer.time_sec	INTEGER	NULLABLE

committer.tz_offset	INTEGER	NULLABLE

committer.date	TIMESTAMP	NULLABLE

subject	STRING	NULLABLE

message	STRING	NULLABLE

trailer	RECORD	REPEATED

trailer.key	STRING	NULLABLE

trailer.value	STRING	NULLABLE

trailer.email	STRING	NULLABLE

difference	RECORD	REPEATED

difference.old_mode	INTEGER	NULLABLE

difference.new_mode	INTEGER	NULLABLE

difference.old_path	STRING	NULLABLE

difference.new_path	STRING	NULLABLE

difference.old_sha1	STRING	NULLABLE

difference.new_sha1	STRING	NULLABLE

difference.old_repo	STRING	NULLABLE

difference.new_repo	STRING	NULLABLE

difference_truncated	BOOLEAN	NULLABLE

repo_name	STRING	NULLABLE

encoding	STRING	NULLABLE

*/


//Create commits Table
var commitsTable = 'commits';
// var commitsTable_options = {
//   schema: 'commit, tree, parent, author, author.name, author.email, author.time_sec, author.tz_offset, author.date, committer, commiter.name, commiter.email, commiter.time_sec, commiter.tz_offset, commiter.date, subject, message, trailer, trailer.key, trailer.value, trailer.email, difference, difference.old_mode, difference.new_mode, difference.old_path, difference.new_path, difference.old_sha1, difference.new_sh1, difference.old_repo, difference.new_repo, difference_truncated, repo_name, encoding'
// };

//Relevant Table Entries
var commitsTable_options = {
  schema: 'commit, tree, parent, author, author_name, author_time_sec, committer, commiter_name, commiter_email, commiter_time_sec, commiter_tz_offset, subject, message, difference, difference_old_mode, difference_new_mode, difference_old_path, difference_new_path, difference_old_sha1, difference_new_sha1, difference_old_repo, difference_new_repo, difference_truncated, repo_name, encoding'
};

dataset.createTable(commitsTable, commitsTable_options, function(err, table, apiResponse) {
  console.log(apiResponse);
});

/*
GITHUB PUBLIC DATASET TABLE STRUCTURE

id	STRING	NULLABLE

size	INTEGER	NULLABLE

content	STRING	NULLABLE

binary	BOOLEAN	NULLABLE

copies	INTEGER	NULLABLE

sample_repo_name	STRING	NULLABLE

sample_ref	STRING	NULLABLE

sample_path	STRING	NULLABLE

sample_mode	INTEGER	NULLABLE

sample_symlink_target	STRING	NULLABLE

Add New Fields

*/

//create contents Table (GitHub Code)
var contentTable = 'contents';
// var contentsTable_options = {
//   schema: 'id, size, content, binary, copies, sample_repo_name, sample_ref, sample_path, sample_mode, sample_symlink_target'
// };

//Relevant Content Table
var contentsTable_options = {
  schema: 'id, size, content, binary, sample_repo_name, sample_ref, sample_path, sample_mode, sample_symlink_target'
};

dataset.createTable(contentTable, contentsTable_options, function(err, table, apiResponse) {
  console.log(apiResponse);
});



/*

  ISSUES:

  -Nested 'options paramter'  ex: author.name throws error

*/
