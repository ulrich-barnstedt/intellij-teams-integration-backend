const simpleGit = require("simple-git");

class GitRunner {
    constructor (args) {
        this.args = args;
        this.gitInstance = simpleGit({
            baseDir : args.projectDir,
            binary : "git"
        });
    }

    async commitAndPush () {
        await this.#add();
        await this.#commit();
        await this.#push();
    }

    async #add () {
        await this.gitInstance.reset("mixed");
        await this.gitInstance.add(this.args.projectDir + "/\*");
    }

    async #commit () {
        await this.gitInstance.commit(`${this.args.projectName}/${this.args.projectStatus}`);
    }

    async #push () {
        await this.gitInstance.push();
    }
}

module.exports = GitRunner;