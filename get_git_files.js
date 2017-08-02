/*TEST COMMAND :

node get_git_files.js -b master -p ../test-repo/

*/

//Import Required Packages
const Git = require("nodegit");
const path = require('path');
const commandLineArgs = require('command-line-args');
const util = require('util');

var fs = require('fs');

var globalCommits = [];
var globalContents = [];


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
        var commitObject;

        console.log("[Good] Walking Over Commit");

        var commitID = String(commit.id());
        var commitTree = String(commit.treeId());
        var commitParent = commit.parents();
        var commitAuthor_name = commit.author().name();
        var commitAuthor_email = commit.author().email();
        var commitAuthor_time_sec = commit.author().when().time();

        var commitCommitter_name = commit.committer().name();
        var commitCommitter_email = commit.committer().email();
        var commitCommitter_time_sec = commit.committer().when().time();

        var commitMessage = commit.message();
        var commitRepoName = repoName;

        console.log("test1");
        // console.log(commitID);
        // console.log(commitTree);
        // console.log(commitParent);
        // console.log(commitAuthor_name);
        // console.log(commitAuthor_email);
        // console.log(commitAuthor_time_sec);
        // console.log(commitCommitter_name);
        // console.log(commitCommitter_email);
        // console.log(commitCommitter_time_sec);
        // console.log(commitMessage);


        console.log("commitID:");
        console.log(commit.id());
        console.log(commitParent.length);



        commitOject = {
          "commit": commitID,
          "tree": commitTree,
          "parent": commitParent,
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
          "repo_name": repoName
        };

        globalCommits.push(commitOject);




        //TREE LEVEL (get File Tree of current Commit)
        commit.getTree().then(function(tree) {

          var treeEmitter = tree.walk(false);
          treeEmitter.on('entry', function(treeEntry) {
            var contentObject = {};

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
                var contentIsBinary = blob.isBinary();
                var contentRepoName = repoName;

                // console.log(contentID);
                // console.log(contentSize);
                // console.log(contentString);
                // console.log(contentIsBinary);
                // console.log(contentRepoName);


                contentOject["contentID"] = contentID;
                contentOject["contentSize"] = contentSize;
                contentOject["contentString"] = contentString;
                contentOject["contentIsBinary"] = contentIsBinary;
                contentOject["contentRepoName"] = contentRepoName;

                var person = {
                  firstName: "John",
                  lastName: "Doe",
                  age: 50,
                  eyeColor: "blue"
                };


                console.log("globalContentsLength" + String(contentObject["contentID"]));


                globalContents.push(contentOject);

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

        fs.writeFile("../commits", JSON.stringify(globalCommits), function(err) {
          if (err) {
            return console.log(err);
          }

          console.log("Commits Written!");

          console.log(JSON.stringify(globalContents))
          fs.writeFile("../contents", JSON.stringify(globalContents), function(err) {
            if (err) {
              return console.log(err);
            }

            console.log("Contents Written!");
          });

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
