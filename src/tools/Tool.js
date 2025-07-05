export class Tool {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    getName() {
        throw new Error('Tool must implement getName()');
    }

    getID() {
        throw new Error('Tool must implement getID()');
    }

    getDescription() {
        throw new Error('Tool must implement getDescription()');
    }

    getConfigSchema() {
        throw new Error('Tool must implement getConfigSchema()');
    }

    async run(inputData) {
        throw new Error('Tool must implement run()');
    }

    validateInput(inputData) {
        throw new Error('Tool must implement validateInput()');
    }
}
