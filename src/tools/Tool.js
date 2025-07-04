export class Tool {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    getName() {
        throw new Error('getName() must be implemented by subclass');
    }

    getID() {
        throw new Error('getID() must be implemented by subclass');
    }

    getDescription() {
        throw new Error('getDescription() must be implemented by subclass');
    }

    getConfigSchema() {
        throw new Error('getConfigSchema() must be implemented by subclass');
    }

    async run(inputData) {
        throw new Error('run() must be implemented by subclass');
    }

    validateInput(inputData) {
        throw new Error('validateInput() must be implemented by subclass');
    }

    getInputTemplate() {
        throw new Error('getInputTemplate() must be implemented by subclass');
    }

    async preProcess(inputData) {
        return inputData;
    }

    async postProcess(result) {
        return result;
    }

    handleError(error) {
        return {
            success: false,
            error: error.message || 'An unknown error occurred',
            timestamp: new Date().toISOString()
        };
    }

    async execute(inputData) {
        try {
            this.validateInput(inputData);
            const processedInput = await this.preProcess(inputData);
            const result = await this.run(processedInput);
            const processedResult = await this.postProcess(result);
            return {
                success: true,
                data: processedResult,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}
