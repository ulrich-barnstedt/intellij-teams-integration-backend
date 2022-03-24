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
    userRepo : input[7],
    zipPath :`./temp/${input[4]}_${input[5]}.zip`
};

(async () => {
    console.log("Creating commit and pushing to remote ...");
    let gr = new GitRunner(args);
    //await gr.commitAndPush();
    console.log("Successfully committed and pushed.");

    console.log("Compressing project into zip ...");
    let zip = new ZipCompressor(args);
    await zip.compress();
    console.log("Successfully compressed project.");

    console.log("Opening browser for teams ...");
    let teams = new TeamsRunner(args, () => {
        console.log("Successfully uploaded to teams.");
        console.log("Exiting ...");
    });
    await teams.launch();
})();
