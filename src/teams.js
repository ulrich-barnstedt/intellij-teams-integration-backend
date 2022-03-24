const puppeteer = require("puppeteer");

const selectors = {
    assignment : {
        grid : `div[class^="assignment-card-grid__"]`,
        opened : `div[class^="assignment-details-container__"]`
    },
    upload : {
        button : `button[data-test="attach-file"]`,
        hiddenBox : "input[type=file]"
    },
    hyperlink : {
        addButton : `button[data-test="hyperlink-tab"]`,
        inputBox : `input[data-test="hyperlink-url"]`,
        attachButton : `div[class^="footer-container__"]>button[data-test="primary-button"]`
    }
}

const frameIsAssignments = async (frame) => {
    try {
        let expected = await frame.$("html > head > title");
        if (expected === null) return false;

        return (await expected.evaluate(e => e.textContent)).includes("Assignments");
    } catch (e) {
        return false;
    }
}

class Runner {
    constructor (args, done) {
        this.baseUrl = `https://teams.microsoft.com/_#/school/classroom/General?threadId=${args.teamsID}@thread.tacv2&ctx=channel`;
        this.started = false;
        this.args = args;
        this.done = done;
    }

    async #error (msg) {
        console.error(`ERROR: ${msg}`);
        await this.browser.close();
        process.exit(1);
    }

    #log (msg) {
        console.log(`[PPTR] ${msg}`);
    }

    async launch () {
        this.#log("Starting ...");

        //launch browser
        this.browser = await puppeteer.launch({
            headless: false,
            userDataDir: "./.cookies"
        });
        this.page = await this.browser.newPage();

        //handle page changes
        this.page.on("load", () => {
            this.#pageLoad();
        })

        //open teams url
        await this.page.goto(this.baseUrl);
    }

    async #pageLoad () {
        if (this.page.url().slice(8).startsWith("teams.microsoft.com/_#/school") && !this.started) {
            this.started = true;
            await this.#determineFrame();
        }
    }

    async #determineFrame () {
        this.#log("Determining frame ...");

        this.assignmentFrame = await this.page.waitForFrame(frameIsAssignments, { timeout : 0 });

        //select the current assigment after determining the frame
        await this.#selectAssignment();
    }

    async #selectAssignment () {
        this.#log("Opening assignment ...");
        await this.assignmentFrame.waitForSelector(selectors.assignment.grid);
        await new Promise(resolve => setTimeout(resolve, 2000));

        let assignments = await this.assignmentFrame.$$(selectors.assignment.grid);
        if (assignments.length === 0) await this.#error("Could not find any assignments");

        if (assignments.length === 1) {
            await assignments[0].click();
        }

        if (assignments.length > 1) {
            let titles = [];

            for (let i = 0; i < assignments.length; i++) {
                titles.push(
                    (await assignments[i].evaluate(e => e.textContent))
                        .split("•")[0]
                        .toLowerCase()
                        .replaceAll(" ", "")
                );
            }

            let search = this.args.projectName.toLowerCase().replaceAll(" ", "");
            let targetIndex = titles.findIndex((e => e.includes(search) || search.includes(e)));

            if (targetIndex === -1) {
                this.#log("Waiting for the user to select an assigment as none could be determined automatically ... ");
            } else {
                await assignments[targetIndex].click();
            }
        }

        await this.#uploadFiles();

        this.done();
        //await this.browser.close();
    }

    async #uploadFiles () {
        await this.assignmentFrame.waitForSelector(selectors.assignment.opened, {
            timeout : 0
        });

        this.#log("Uploading files to assigment ...");

        //upload the zip folder
        let button = await this.assignmentFrame.waitForSelector(selectors.upload.button);
        await button.click();
        await (await this.assignmentFrame.waitForSelector(selectors.upload.hiddenBox)).uploadFile(this.args.zipPath);

        //add the link
        await new Promise(resolve => setTimeout(resolve, 2000));
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        await (await this.assignmentFrame.waitForSelector(selectors.hyperlink.addButton)).click();

        let frame = await this.page.waitForFrame(frameIsAssignments);
        let inputBox = await frame.waitForSelector(selectors.hyperlink.inputBox);

        await new Promise(resolve => setTimeout(resolve, 500));
        await inputBox.click();
        await inputBox.type(`https://bitbucket.org/htlpinkafeld/${this.args.userRepo}/src/main/POS3/${this.args.projectName}/`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await (await frame.waitForSelector(selectors.hyperlink.attachButton)).click();
    }
}

module.exports = Runner;