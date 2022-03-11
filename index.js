const GitRunner = require("./src/git");
const ZipCompressor = require("./src/zip");
const TeamsRunner = require("./src/teams");

const input = process.argv;
const args = {
    projectDir : input[2],
    teamsID : input[3],
    projectName : input[4],
    projectStatus : input[5],
    taskStatus : input[6],
    zipPath :`./temp/${input[4]}_${input[5]}.zip`
};

(async () => {
    let gr = new GitRunner(args);
    //await gr.commitAndPush();

    let zip = new ZipCompressor(args);
    await zip.compress();

    let teams = new TeamsRunner(args);
    await teams.launch();
})();


//steps:
//git add
//git commit
//git push
//zip
//open teams
//upload

