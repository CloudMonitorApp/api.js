export default class ApiException {
    constructor(error) {
        console.log(error)
        this.message = error.response.data.message
        this.name = 'APIException'
        window.emitter.emit('error-message', error)
    }

    toString() {
        return this.message
    }
}
