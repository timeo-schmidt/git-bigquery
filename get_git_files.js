/*

INFO:
  -b argument must be a branch which is searched (TYPE: string (e.g. master))
  -p argument must lead to a valid git project path (TYPE: path (e.g. ../project/))
  -c argument is the path where the content of the git repo may get temporarily stored in (TYPE: path (e.g. ../contents/) )
  -d argument may be used if upload is not required - Debugging Purposes (TYPE: Boolean (e.g. just leave it out if debugging is not required))


node get_git_files.js -b master -p ../sql-api/

*/


//Import
const Git = require("nodegit");
const path = require('path');
const commandLineArgs = require('command-line-args');
var _ = require('lodash');
var os = require('os');
var fs = require('fs');


//Passed Arguments via commandLineArgs
const optionDefinitions = [{
    name: 'branch',
    alias: 'b',
    type: String
  },
  {
    name: 'path',
    alias: 'p',
    type: String
  },
  {
    name: 'content',
    alias: 'c',
    type: String
  },
  {
    name: 'debug',
    alias: 'd',
    type: Boolean
  }
];

const options = commandLineArgs(optionDefinitions);


//CLI Inputs
var branch = options.branch;
var repoDir = options.path;
var contentPath_link = require("path").resolve(options.content);
var debug = options.debug;


//Check if Branch input is available
if (branch == undefined) {
  console.error("[ERROR] Required Argument -b (--branch) missing.");
  console.log("[INFO] Expecting branch name string or OID");
  process.exit(1);
}

if (repoDir == undefined) {
  console.error("[ERROR] Required Argument -p (--path) missing.");
  console.error("[INFO] Expecting path to repository.");
  process.exit(1);
}

if (contentPath_link == undefined) {
  console.error("[ERROR] Required Argument -c (--content) missing.");
  console.error("[INFO] Expecting path to folder where Content gets stored in.");
  process.exit(1);
}

//Resolve Branch Input Path to Absolute Path
var pathToRepo = require("path").resolve(repoDir);

//Get Repo Name -> This is done by getting the specified folder name of the repo path
var repoName = pathToRepo.substr(pathToRepo.lastIndexOf("/") + 1, pathToRepo.length);

console.log("contentPATH: " + contentPath_link);
fs.writeFileSync(contentPath_link + 'commits_bigquery-format.json', '');
fs.writeFileSync(contentPath_link + 'diffs_bigquery-format.json', '');
fs.writeFileSync(contentPath_link + 'files_bigquery-format.json', '');
fs.writeFileSync(contentPath_link + 'contents_bigquery-format.json', '');

//Global Variables
//Existing Hashes of (Commits/Diffs) and of (Files/Contents) are stored here, in  order to avoid duplicates
var existingHashes_commits = [];
var existingHashes_files = [];

//Object where the File Streams are specified
const streamConfig = {
  commit_stream: fs.createWriteStream(contentPath_link + '/commits_bigquery-format.json'),
  diff_stream: fs.createWriteStream(contentPath_link + '/diffs_bigquery-format.json'),
  file_stream: fs.createWriteStream(contentPath_link + '/files_bigquery-format.json'),
  content_stream: fs.createWriteStream(contentPath_link + '/contents_bigquery-format.json')
}


//Commit Object is built here
function buildCommitObject(commit, commit_diff) {
  var commitID = String(commit.id());

  commitParentShas = [];
  var commitParent = commit.parents();
  commitParent.forEach(function(element) {
    commitParentShas.push(String(element));
  });


  var commitAuthor_name = commit.author().name();
  var commitAuthor_email = commit.author().email();
  var commitAuthor_time_sec = commit.author().when().time();

  var commitCommitter_name = commit.committer().name();
  var commitCommitter_email = commit.committer().email();
  var commitCommitter_time_sec = commit.committer().when().time();

  var commitMessage = commit.message();
  var commitRepoName = repoName;


  var ds = new Date(commitCommitter_time_sec * 1000).toISOString();
  var committerTimeString = ds.substring(0, 10) + " " + ds.substring(11, 19) + " UTC";

  ds = new Date(commitAuthor_time_sec * 1000).toISOString();
  var authorTimeString = ds.substring(0, 10) + " " + ds.substring(11, 19) + " UTC";


  var author_offset = commit.author().when().offset();
  var committer_offset = commit.committer().when().offset();


  var commitObject = {
    "commit": commitID,
    "parents": commitParentShas,
    "author": {
      "name": commitAuthor_name,
      "email": commitAuthor_email,
      "time_sec": commitAuthor_time_sec,
      "tz_offset": author_offset,
      "date": authorTimeString
    },
    "committer": {
      "name": commitCommitter_name,
      "email": commitCommitter_email,
      "time_sec": commitCommitter_time_sec,
      "tz_offset": committer_offset,
      "date": committerTimeString
    },
    "message": commitMessage,
    "repo_name": repoName,
    "difference": commit_diff
  }

  return commitObject;
}

//MAIN FUNCTION
//The File Streams are all happening...Also here is the repository scanned
function stream_git_data(streamConfig) {
  Git.Repository.open(pathToRepo).then(function(repo) {
      console.log("[GOOD] The Repository was Opened successfully.");

      //Working with first Commit Object of specified Branch

      repo.getReferenceCommit(branch).then(function(commit) {
        //Creating Commit's History Walker
        var commitHistoryEmitter = commit.history();

        //COMMIT LEVEL
        commitHistoryEmitter.on('commit', function(commit) {

          //If current commit exists in BigQuery, it is imediatly skipped
          if (existingHashes_commits.indexOf(String(commit.id())) != -1) {
            return;
          };



          //Functions to add to the File Stream
          function streamCommits(commit_diff) {
            streamConfig.commit_stream.write(JSON.stringify(buildCommitObject(commit, commit_diff)) + os.EOL);
          }

          function streamDiffs(diff_contents) {
            streamConfig.diff_stream.write(JSON.stringify(diff_contents) + os.EOL);
          }

          //Diffs are generated in this function
          function getDiffs(commit_parameter) {

            console.log("getDiffs");
            commit_parameter.getDiff()
              .then(function(arrayDiff) {
                console.log("diffs");
                var diffPromises = arrayDiff.map(diff => diff.patches().then(function(arrayConvenientPatch) {
                  console.log("patches");
                  var patchPromises = arrayConvenientPatch.map(patch => patch.hunks().then(function(hunks) {
                    console.log("hunks");

                    var hunkPromises = hunks.map(hunk => hunk.lines().then(function(lines) {
                      console.log("lines");


                      //Variables required for Object Building

                      //Line stats
                      var lineStats = patch.lineStats();
                      var changedLines = lineStats.total_context;
                      var addedLines = lineStats.total_additions;
                      var deletedLines = lineStats.total_deletions;
                      var lineHeader = hunk.header();
                      //Path
                      var oldPath = patch.oldFile().path();
                      var newPath = patch.newFile().path();
                      //Hashes
                      var old_sha1 = String(patch.oldFile().id());
                      var new_sha1 = String(patch.newFile().id());
                      //Contents
                      var patchString = lines
                        .map(line => String.fromCharCode(line.origin()) + line.content().trim())
                        .join("\n");

                      // Commit Object (including basic diff information)
                      var commit_diff = {
                        "old_path": oldPath,
                        "new_path": newPath,
                        "old_sha1": old_sha1,
                        "new_sha1": new_sha1,
                        "changed_lines": changedLines,
                        "added_lines": addedLines,
                        "deleted_lines": deletedLines,
                        "line_header": lineHeader
                      }

                      streamCommits(commit_diff);

                      // Diff Contents (+basic diff info)
                      var content_diff = {
                        "repo_name": repoName,
                        "commit": String(commit.id()),
                        "difference": {
                          "old_path": oldPath,
                          "new_path": newPath,
                          "old_sha1": old_sha1,
                          "new_sha1": new_sha1,
                          "changed_lines": changedLines,
                          "added_lines": addedLines,
                          "deleted_lines": deletedLines,
                          "line_header": lineHeader,
                          "diff_contents": patchString
                        }
                      }

                      streamDiffs(content_diff);


                      return patchString;
                    }));

                    return Promise.all(hunkPromises);
                  }));
                  return Promise.all(patchPromises);
                }));
                return Promise.all(diffPromises).then(function() {});
              });

          }
          getDiffs(commit);

          //TREE LEVEL (get File Tree of current Commit)
          commit.getTree().then(function(tree) {

            //This is the tree walker and it goes through every file and directory in the current commit
            var treeEmitter = tree.walk(false);
            treeEmitter.on('entry', function(treeEntry) {


              console.log(treeEntry.path());
              //BLOB LEVEL
              if (treeEntry.isFile()) {
                //The Blob is retrieved at this point (Actual File Content)
                treeEntry.getBlob().then(function(blob) {
                  console.log("BINARY: " + String(blob.isBinary()));
                  if (blob.isBinary()) {
                    //Binary Files are skipped and never uploaded to BigQuery DB
                    return;
                  }



                  var contentID = String(treeEntry.oid());
                  var contentSize = blob.rawsize();
                  var contentString = blob.toString();
                  // var contentIsBinary = blob.isBinary();
                  var contentRepoName = repoName;
                  var contentPath = String(treeEntry.path());

                  var notUndefined = function(param) {
                    if (param == undefined || param == "undefined") {
                      return null;
                    } else {
                      return param;
                    }
                  }

                  //The Row for the contents table is built here
                  const contentObject = {
                    "id": notUndefined(contentID),
                    "size": contentSize,
                    "content": contentString,
                    "repo_name": contentRepoName,
                    "path": contentPath
                  }


                  //The Row for the files table is built here
                  const fileObject = {
                    "id": notUndefined(contentID),
                    "repo_name": contentRepoName,
                    "ref": notUndefined(String(commit.id())),
                    "path": contentPath
                  }


                  //Immediatly Stream if file entry is not part of the existing Hashes
                  if (existingHashes_files.indexOf(contentID) === -1) {

                    //Content did not exist in existingHashes[] => Add it now
                    existingHashes_files.push(contentID);

                    //Write Object into File New Line and don't store in MEMORY
                    streamConfig.file_stream.write(JSON.stringify(fileObject) + os.EOL);

                    //Write Object into File New Line and don't store in MEMORY
                    streamConfig.content_stream.write(JSON.stringify(contentObject) + os.EOL);

                    return;

                  }

                });
              }

            });

            treeEmitter.on('error', function(error) {
              console.log(error);
              process.exit(1);
            });


            treeEmitter.on('end', function(trees) {

            });

            treeEmitter.start();

          });

        });


        commitHistoryEmitter.on('error', function(error) {
          console.log(error);
          process.exit(1);
        });

        commitHistoryEmitter.start()

      });
    })

    .catch(function(reasonForFailure) {
      console.log("[ERROR] Repository Could not be found. Check your path.");
      console.log(reasonForFailure);
    });

}


//Opening Repo
//REPOSITORY LEVEL

// Get Existing Hashes for Commits and Files and then run main stream git data code ... The hashes of the online BigQuery tables are retrived and stored in to Global Variables
function getExisting() {

  const BigQuery = require('@google-cloud/bigquery');

  const projectId = 'fdc-test-statistic';

  const bigquery = BigQuery({
    projectId: projectId
  });

  //git Sub Dataset
  var dataset = bigquery.dataset('git');


  var commitTable = dataset.table('commits');
  var filesTable = dataset.table('files');

  commitTable.createReadStream()
    .on('error', console.error)
    .on('data', function(row) {
      existingHashes_commits.push(row.commit);
    })
    .on('end', function() {

      filesTable.createReadStream()
        .on('error', console.error)
        .on('data', function(row) {
          existingHashes_files.push(row.id);
        })
        .on('end', function() {

          // Run main Function, once the existing Hashes are retrieved => This is done to avoid duplicate entries in the BigQuery Tables
          stream_git_data(streamConfig);
        });

    });
}

getExisting();
