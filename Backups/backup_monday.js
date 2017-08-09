var n = 0;


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
var contentPath_link = require("path").resolve(options.content);

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

var repoName = pathToRepo.substr(pathToRepo.lastIndexOf("/") + 1, pathToRepo.length);

console.log("contentPATH: " + contentPath_link);
fs.writeFileSync(contentPath_link + 'commits_bigquery-format.json', '');
fs.writeFileSync(contentPath_link + 'files_bigquery-format.json', '');
fs.writeFileSync(contentPath_link + 'contents_bigquery-format.json', '');


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


        var promises = [];


        var commitID = String(commit.id());
        console.log("[Good] Walking Over Commit: " + commitID);

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


        // BUG: Absolute Value for time needs to be replaced
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
          "repo_name": repoName
        };


        //Write Object into File New Line and don't store in MEMORY
        fs.appendFileSync(contentPath_link + '/commits_bigquery-format.json', JSON.stringify(commitObject) + os.EOL);


        var diffArray = [];
        var diffContentArray = [];


        function getPatches(diff_parameter) {
          diff_parameter.patches().then(function(arrayConvenientPatch) {
            arrayConvenientPatch.forEach(function(patch) {

            });
          });
        }


        var x = 0;

        function getDiffs(commit_parameter) {
          console.log("n" + String(++n));

          commit_parameter.getDiff()
            .then(function(arrayDiff) {
              console.log("arrayDiff");
              var diffPromises = arrayDiff.map(diff =>
                console.log("diff");
                diff.patches().then(function(arrayConvenientPatch) {
                console.log("arrayConvenientPatch");
                var patchPromises = arrayConvenientPatch.map(patch => patch.hunks().then(function(hunks) {
                  console.log("hunks");

                  var hunkPromises = hunks.map(hunk => hunk.lines().then(function(lines) {
                    console.log("lines");

                    var patchString = lines
                      .map(line => String.fromCharCode(line.origin()) + line.content().trim())
                      .join("\n");
                    // console.log(patchString);

                    //Build Object.
                    return patchString;
                  }));

                  return Promise.all(hunkPromises);
                }));
                return Promise.all(patchPromises);
              }));
              return Promise.all(diffPromises);
            });
        }

        getDiffs(commit);

        //TREE LEVEL (get File Tree of current Commit)
        commit.getTree().then(function(tree) {

          var treeEmitter = tree.walk(false);
          treeEmitter.on('entry', function(treeEntry) {
            // console.log(treeEntry.oid());
            var contentObject = {};
            var fileObject = {};


            //BLOB LEVEL
            if (treeEntry.isBlob()) {
              // console.log("Tree entry is blob");
              treeEntry.getBlob().then(function(blob) {
                var contentObject = {};

                if (blob.isBinary()) {
                  // console.log("BINARY");
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

                  //Write Object into File New Line and don't store in MEMORY
                  fs.appendFileSync(contentPath_link + '/files_bigquery-format.json', JSON.stringify(fileObject) + os.EOL);

                  //Write Object into File New Line and don't store in MEMORY
                  fs.appendFileSync(contentPath_link + '/contents_bigquery-format.json', JSON.stringify(contentObject) + os.EOL);
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
