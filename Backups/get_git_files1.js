/*TEST COMMAND :

node get_git_files.js -b master -p ../sql-api/

*/


//Import Required Packages
const Git = require("nodegit");
const path = require('path');
const commandLineArgs = require('command-line-args');
var _ = require('lodash');

var os = require('os');
var fs = require('fs');


var existingHashes = [];

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
  }
];

const options = commandLineArgs(optionDefinitions);


//CLI Inputs
var branch = options.branch;
var repoDir = options.path;
var contentPath = require("path").resolve(options.content);

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

if (contentPath == undefined) {
  console.error("[ERROR] Required Argument -c (--content) missing.");
  console.error("[INFO] Expecting path to folder where Content gets stored in.");
  process.exit(1);
}

//Resolve Branch Input Path to Absolute Path
var pathToRepo = require("path").resolve(repoDir);

var repoName = pathToRepo.substr(pathToRepo.lastIndexOf("/") + 1, pathToRepo.length);

var diffContentArray = [];

fs.writeFileSync(contentPath + 'commits_bigquery-format.json', '');
fs.writeFileSync(contentPath + 'files_bigquery-format.json', '');
fs.writeFileSync(contentPath + 'contents_bigquery-format.json', '');
fs.writeFileSync(contentPath + 'diffs_bigquery-format.json', '');

var resolves = 0;
var loop = 0;

//Opening Repo
//REPOSITORY LEVEL
Git.Repository.open(pathToRepo).then(function(repo) {
    console.log("[GOOD] The Repository was Opened successfully.");

    //Working with first Commit Object of specified Branch
    repo.getReferenceCommit(branch).then(function(commit) {
      //Creating Commit's History Walker

      var commitHistoryEmitter = commit.history();

      //Commit Walker ToDo when walking over Commit in history
      //COMMIT LEVEL
      commitHistoryEmitter.on('commit', function(commit) {
        var diffArray = [];
        commit.getDiff().then(function(arrayDiff) {
          arrayDiff.forEach(function(diff) {
            console.log("LOOP NO:" + String(++loop));

            diff.patches().then(function(arrayConvenientPatch) {
              console.log("RESOLVE NO:" + String(++resolves));
              arrayConvenientPatch.forEach(function(patch) {

                var lineStats = patch.lineStats();

                var changedLines = lineStats.total_context;
                var addedLines = lineStats.total_additions;
                var deletedLines = lineStats.total_deletions;

                var modifiedLines = lineStats.total_context;
                patch.hunks().then(function(arrayConvenientHunk) {
                  arrayConvenientHunk.forEach(function(hunk) {
                    hunk.lines().then(function(lines) {

                      var linesHeader = hunk.header();

                      var diff_contents_string = "";
                      lines.forEach(function(line) {
                        diff_contents_string += String.fromCharCode(line.origin()) +
                          line.content().trim() + "\n";
                      });

                      var pushDiff_commits = {
                        old_path: patch.oldFile().path(),
                        new_path: patch.newFile().path(),
                        old_sha1: String(patch.oldFile().id()),
                        new_sha1: String(patch.newFile().id()),
                        changed_lines: changedLines,
                        added_lines: addedLines,
                        deleted_lines: deletedLines,
                        line_header: linesHeader
                      };

                      var pushDiff_diffs = {
                        old_path: patch.oldFile().path(),
                        new_path: patch.newFile().path(),
                        old_sha1: String(patch.oldFile().id()),
                        new_sha1: String(patch.newFile().id()),
                        changed_lines: changedLines,
                        added_lines: addedLines,
                        deleted_lines: deletedLines,
                        line_header: linesHeader,
                        diff_contents: diff_contents_string
                      };

                      diffArray.push(pushDiff_commits);
                      diffContentArray.push(pushDiff_diffs);


                    });
                  });
                });
              });
            });
            console.log("foreach: " + commit.id());
          });
          //Retrieved Diffs...Diffs stored into Array...Diff Array is now storded into current Commit Object

          var commitID = String(commit.id());
          console.log("[Good] Walking Over Commit: " + commitID);

          commitParentShas = [];
          var commitParent = commit.parents();
          commitParent.forEach(function(element) {
            commitParentShas.push(String(element));
          });


          console.log("other");

          var commitAuthor_name = commit.author().name();
          var commitAuthor_email = commit.author().email();
          var commitAuthor_time_sec = commit.author().when().time();

          var commitCommitter_name = commit.committer().name();
          var commitCommitter_email = commit.committer().email();
          var commitCommitter_time_sec = commit.committer().when().time();

          var commitMessage = commit.message();
          var commitRepoName = repoName;


          var uniqueDiffs = _.uniqBy(diffArray, "old_path");


          var d = new Date(1456500173 * 1000);
          var ds = d.toISOString();
          var ft = ds.substring(0, 10) + " " + ds.substring(11, 19) + " UTC";


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
            "difference": uniqueDiffs
          };

          var diffObject = {
            "repo_name": repoName,
            "commit": commitID,
            "difference": diffContentArray
          };


          //Write Object into File New Line and don't store in MEMORY
          fs.appendFileSync(contentPath + '/commits_bigquery-format.json', JSON.stringify(commitObject) + os.EOL);


          //Write Object into File New Line and don't store in MEMORY
          fs.appendFileSync(contentPath + '/diffs_bigquery-format.json', JSON.stringify(diffObject) + os.EOL);


        });



        //TREE LEVEL (get File Tree of current Commit)
        commit.getTree().then(function(tree) {

          var treeEmitter = tree.walk(false);
          treeEmitter.on('entry', function(treeEntry) {
            var contentObject = {};
            var fileObject = {};


            //BLOB LEVEL
            if (treeEntry.isBlob()) {
              treeEntry.getBlob().then(function(blob) {
                var contentObject = {};

                if (blob.isBinary()) {
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

                contentObject["id"] = notUndefined(contentID);
                contentObject["size"] = contentSize;
                contentObject["content"] = contentString;
                // contentObject["contentIsBinary"] = contentIsBinary;
                contentObject["repo_name"] = contentRepoName;
                contentObject["path"] = contentPath;


                //Build File Object
                fileObject = {
                  "repo_name": contentRepoName,
                  "ref": notUndefined(String(commitID)),
                  "path": contentPath,
                  "id": contentID
                }

                //Immediatly Append to file and don't push

                if (existingHashes.indexOf(contentID) === -1) {
                  //Content did not exist in existingHashes[]


                  existingHashes.push(contentID);
                  //Write Object into File New Line and don't store in MEMORY
                  fs.appendFileSync(contentPath + '/files_bigquery-format.json', JSON.stringify(fileObject) + os.EOL);


                  //Write Object into File New Line and don't store in MEMORY
                  fs.appendFileSync(contentPath + '/contents_bigquery-format.json', JSON.stringify(contentObject) + os.EOL);

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
