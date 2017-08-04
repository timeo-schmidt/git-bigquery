console.log("First run node create_tables.js");
console.log("=> This will create the Tables in BigQuery for you.");

console.log("");

console.log("Secondly run node get_git_files.js and specify your branch and path of the repository you would like to use.");
console.log("=> This will convert your repo to text files, which can then be uploaded by the third command.");

console.log("");

console.log("Finally run node uploadGitFilesToBigQuery.js which will upload the previously created text files to your BigQuery.");
console.log("=> This will create a stream which makes the contents to be uploaded.");

console.log("==============");
console.log("HAVE FUN QUERYING YOUR DATA");
