/*TEST COMMAND :

node get_git_files.js -b master -p ../sql-api/

*/

//Import Required Packages
const Git = require("nodegit");
const path = require('path');
const commandLineArgs = require('command-line-args');
const util = require('util');

var os = require('os');
var fs = require('fs');

var globalCommits = [];
var globalContents = {};
var globalFiles = [];



var commitID;


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
  }
];

const options = commandLineArgs(optionDefinitions);


//CLI Inputs
var branch = options.branch;
var repoDir = options.path;

//Check if Branch input is available
if (branch == undefined) {
  console.error("[ERROR] Required Argument -b (--branch) missing.");
  console.log("[INFO] Expecting branch name string or OID");
  process.exit(1);
}

if (repoDir == undefined) {
  console.error("[ERROR] Required Argument - (--path) missing.");
  console.error("[INFO] Expecting path to repository.");
  process.exit(1);
}

//Resolve Branch Input Path to Absolute Path
var pathToRepo = require("path").resolve(repoDir);

var repoName = pathToRepo.substr(pathToRepo.lastIndexOf("/") + 1, pathToRepo.length);

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

        console.log("DiffStuff");
        commit.getDiff().then(function(arrayDiff) {
          arrayDiff.forEach(function(diff) {
            diff.patches().then(function(arrayConvenientPatch) {
              arrayConvenientPatch.forEach(function(patch) {
                patch.hunks().then(function(arrayConvenientHunk) {
                  arrayConvenientHunk.forEach(function(hunk) {
                    hunk.lines().then(function(lines) {

                      var diff_contents_string = "";
                      lines.forEach(function(line) {
                        diff_contents_string += String.fromCharCode(line.origin()) +
                          line.content().trim() + "\n";
                      });


                      var pushDiff = {
                        old_path: patch.oldFile().path(),
                        new_path: patch.newFile().path(),
                        old_sha1: String(patch.oldFile().id()),
                        new_sha1: String(patch.newFile().id()),
                        diff_contents: diff_contents_string
                      };

                      diffArray.push(pushDiff);


                    });
                  });
                });
              });
            });
          });
          //Retrieved Diffs...Diffs stored into Array...Diff Array is now storded into current Commit Object

          var commitObject;

          console.log("[Good] Walking Over Commit");

          commitID = String(commit.id());


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

          commitObject = {
            "commit": commitID,
            "parents": commitParentShas,
            "author": {
              "name": commitAuthor_name,
              "email": commitAuthor_email,
              "time_sec": commitAuthor_time_sec
            },
            "committer": {
              "name": commitCommitter_name,
              "email": commitCommitter_email,
              "time_sec": commitCommitter_time_sec
            },
            "message": commitMessage,
            "repo_name": repoName,
            "difference": diffArray
          };

          console.log(JSON.stringify(diffArray));

          globalCommits.push(commitObject);

        });



        //TREE LEVEL (get File Tree of current Commit)
        commit.getTree().then(function(tree) {

          var treeEmitter = tree.walk(false);
          treeEmitter.on('entry', function(treeEntry) {
            var contentObject = {};
            var fileObject = {};


            // console.log("[Good] Walking Over Tree");


            //BLOB LEVEL
            if (treeEntry.isBlob()) {
              treeEntry.getBlob().then(function(blob) {
                var contentObject = {};

                if (blob.isBinary()) {
                  // console.log("[Good] Binary File Detected. Ignoring it.");
                  return;
                }


                var contentID = String(treeEntry.oid());
                var contentSize = blob.rawsize();
                var contentString = blob.toString();
                // var contentIsBinary = blob.isBinary();
                var contentRepoName = repoName;
                var contentPath = String(treeEntry.path());

                // console.log(contentID);
                // console.log(contentSize);
                // console.log(contentString);
                // console.log(contentIsBinary);
                // console.log(contentRepoName);

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



                // console.log("globalContentsLength" + String(JSON.stringify(contentObject)));


                globalContents[contentObject.id] = contentObject;
                globalFiles.push(fileObject);



                // console.log("global Contents" + JSON.stringify(globalContents));

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


      commitHistoryEmitter.on('end', function(error) {


        //UNCOMMENT IF ACTUAL JSON FILES ARE WANTED
        // fs.writeFile("../GitParsedContent/commits.json", JSON.stringify(globalCommits), function(err) {
        //   if (err) {
        //     return console.log(err);
        //   }
        //
        //   console.log("Commits Written!");
        //
        //   // console.log(JSON.stringify(globalContents));
        //   fs.writeFile("../GitParsedContent/contents.json", JSON.stringify(globalContents), function(err) {
        //     if (err) {
        //       return console.log(err);
        //     }
        //
        //     console.log("Contents Written!");
        //   });
        //
        //   //Write global Files
        //   fs.writeFile("../GitParsedContent/files.json", JSON.stringify(globalFiles), function(err) {
        //     if (err) {
        //       return console.log(err);
        //     }
        //
        //     console.log("Files Written!");
        //   });
        //
        // });

        fs.writeFileSync('../GitParsedContent/commits_bigquery-format.json', '');
        globalCommits.forEach(function(value, i) {
          fs.appendFileSync('../GitParsedContent/commits_bigquery-format.json', JSON.stringify(value) + os.EOL);
        });

        fs.writeFileSync('../GitParsedContent/files_bigquery-format.json', '');
        globalFiles.forEach(function(value, i) {
          fs.appendFileSync('../GitParsedContent/files_bigquery-format.json', JSON.stringify(value) + os.EOL);
        });

        fs.writeFileSync('../GitParsedContent/contents_bigquery-format.json', '');
        Object.keys(globalContents).forEach(function(key, i) {
          fs.appendFileSync('../GitParsedContent/contents_bigquery-format.json', JSON.stringify(globalContents[key]) + os.EOL);
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
