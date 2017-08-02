var Git = require("nodegit");

const path = require('path');
var pathToRepo = require("path").resolve("git-test");

console.log(pathToRepo);

// var getCommitMessage = function(commit) {
//   return commit.message();
// };
//
// Git.Repository.open(pathToRepo)
//   .then(getMostRecentCommit)
//   .then(getCommitMessage)
//   .then(function(message) {
//     console.log(message);
//   });

Git.Repository.open(pathToRepo).then(function(repo) {
      console.log("it worked :)");
      // console.log(repo);

      //Work with Repo

      repo.getReferenceNames().then(function(arrayString) {
        // Use arrayString
        console.log(arrayString);
      });

      repo.getReferenceCommit("branch2").then(function(commit) {
          // Use commit
          var eventEmitter = commit.history();

          eventEmitter.on('commit', function(commit) {
              // Walks through commits...
              commit.getTree().then(function(tree) {
                  console.log("Getting Entries of Commit");
                  var treeEntries = tree.entries();
                  console.log(treeEntries[0].oid());
                  console.log(treeEntries[0].oid());

                  var eventEmitter = tree.walk([blobsOnly);

                    eventEmitter.on('entry', function(tree) {
                      // Use tree
                    });

                    eventEmitter.on('end', function(trees) {
                      // Use trees
                    });

                    eventEmitter.on('error', function(error) {
                      // Use error
                    });


                     treeEntries[0].getBlob().then(function(blob) {
                      // Use blob
                      var buffer = blob.toString();
                      console.log(buffer);
                    });
                  });
              });

            eventEmitter.on('end', function(commits) {
              // Use commits
            });

            eventEmitter.on('error', function(error) {
              // Use error
            });

            eventEmitter.start()

          });



      })
    .catch(function(reasonForFailure) {
      console.log("Couldn't Open the Repository :(");
      console.log(reasonForFailure);
    });
