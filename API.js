import APIException from './APIException.js'

/**
 * JavaScript class to handle API transactions as a model.
 * 
 * Some methods requires APIFlow (https://github.com/cloudmonitorapp/apiflow)
 * or custom implementation in backend of those requests in order to work.
 * 
 * Everything is build for Laravel and expects responses to be
 * Laravel API resources (RESTful).
 * 
 * Axios must be attached to window.axios.
 */
export default class API {
    /**
     * Instantiate new API object
     * 
     * @param {string} route 
     * @param {object} init 
     * @param {object} params 
     * @param {object} meta 
     */
    constructor(route, init = null, params = {}, meta = {}, autoload = true) {
        this._route = route
        this._params = params
        this._meta = meta
        this._raw = null
        this._data = []
        this._loading = false
        this._saving = false
        this._debounce = 1000
        this._debouncing = null
        this._endpoints = {
            index: '.index',
            destroy: '.destroy',
            show: '.show',
            store: '.store',
            update: '.update',
        }
        this._callback = null

        if (init) {
            this.data(init.data)
            this.meta(init.meta)
        }

        if (autoload && route) {
            this.get()
        }
    }

    /**
     * Response data
     * 
     * @param {object} data 
     * @returns object
     */
    data(data = null) {
        if (data) {
            this._data = data
            return this
        }

        return this._data
    }

    /**
     * Response meta data
     * 
     * @param {object} meta 
     * @returns object
     */
    meta(meta = null) {
        if (meta) {
            this._meta = meta
            return this
        }

        return this._meta
    }

    /**
     * Request parameters
     * 
     * @param {object} params 
     * @returns object
     */
    params(params) {
        this._params = params
        return this
    }

    /**
     * Get request
     * 
     * @param {object} params 
     * @param {function} callback 
     * @returns API
     */
    get(params = {}, callback = null) {
        let _params = this._params
        clearTimeout(this._debouncing)
        this._loading = true
        Object.assign(this._params, params)

        this._debouncing = setTimeout(() => {
            window.axios.get(window.route(this._route + this._endpoints.index, this._params)).then(r => {
                this._data = r.data.data
                this._meta = r.data.meta
                this._loading = false

                if (callback) {
                    callback(r)
                }
            })
        }, this._debouncing ? this._debounce : 0)

        this.params(_params)

        return this
    }

    /**
     * Show request
     * 
     * @param {object} params 
     * @param {function} callback 
     * @returns API
     */
    show(params = {}, callback = null) {
        let _params = this._params
        clearTimeout(this._debouncing)
        this._loading = true
        Object.assign(this._params, params)

        this._debouncing = setTimeout(() => {
            window.axios.get(window.route(this._route + this._endpoints.show, this._params)).then(r => {
                this._data = r.data.data
                this._meta = r.data.meta
                this._raw = r.data
                this._loading = false

                if (callback) {
                    callback(r)
                }
            })
        }, this._debouncing ? this._debounce : 0)

        this.params(_params)

        return this
    }

    /**
     * Post request
     * 
     * @param {object} params 
     * @param {object} data 
     * @param {function} callback 
     * @returns API
     */
    post(params = {}, data = {}, callback = null) {
        let _params = this._params
        this._saving = true
        Object.assign(this._params, params)

        window.axios.post(window.route(this._route + this._endpoints.store, this._params), data).then(r => {
            this._saving = false

            if (this._callback) {
                this._callback(r)
            }

            if (callback) {
                callback(r)
            }
        }).catch(e => {
            throw new APIException(e)
        })

        this.params(_params)

        return this
    }

    /**
     * Update request
     * 
     * @param {object} params 
     * @param {object} data 
     * @param {function} callback 
     * @returns API
     */
    update(params = {}, data = {}, callback = null) {
        let _params = this._params
        this._saving = true
        Object.assign(this._params, params)

        window.axios.put(window.route(this._route + this._endpoints.update, this._params), data).then(r => {
            this._saving = false

            if (this._callback) {
                this._callback(r)
            }

            if (callback) {
                callback(r)
            }
        })

        this.params(_params)

        return this
    }

    /**
     * Delete request
     * 
     * @param {int} id 
     * @param {function} callback 
     * @param {object} params 
     * @returns API
     */
    delete(id, callback, params = {}) {
        let _params = this._params
        Object.assign(this._params, params, {id: id})

        window.axios.delete(window.route(this._route + this._endpoints.destroy, this._params)).then(r => {
            this.data(this.data().filter(d => {
                return d.id !== id
            }))

            if (callback) {
                callback(r)
            }
        })

        this.params(_params)

        return this
    }

    /**
     * Check if request is loading
     * 
     * @returns bool
     */
    loading() {
        return this._loading
    }

    /**
     * Check if request is saving
     * 
     * @returns bool
     */
    saving() {
        return this._saving
    }

    /**
     * Query keyword
     * 
     * @requires APIFlow
     * 
     * @param {string} keyword 
     * @param {object} params 
     */
    query(keyword = '', params = {}) {
        this.get(Object.assign({query: keyword}, params))
    }

    /**
     * Exclude IDs from response
     * 
     * @requires APIFlow
     * 
     * @param {array} ids 
     * @returns 
     */
    exclude(ids = []) {
        this.params({exclude: ids.join(',')})
        return this
    }

    /**
     * Only return reponse with IDs
     * 
     * @requires APIFlow
     * 
     * @param {array} ids 
     * @returns API
     */
    only(ids = []) {
        this.params({only: ids.join(',')})
        return this
    }

    /**
     * Go to page number
     * 
     * @param {int} pageNumber 
     */
    goTo(pageNumber) {
        this.get({page: pageNumber})
    }

    /**
     * Save current state.
     * Update defines if it will be post or update request
     * 
     * @param {object} data 
     * @param {bool} update 
     * @param {object} id 
     * @param {object} params 
     * @returns API
     */
    save(data = {}, update = false, id = {}, params = {}) {
        update ? this.update(Object.assign(id, params), data) : this.post(params, data)
        return this
    }

    /**
     * Callback function after request is executed
     * 
     * @param {function} callback 
     * @returns API
     */
    onSuccess(callback) {
        this._callback = callback
        return this
    }
}
