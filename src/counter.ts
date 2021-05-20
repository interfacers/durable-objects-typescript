export class Counter {
  constructor(state, env) {
    // @ts-ignore
    this.state = state
  }

  async initialize() {
    // @ts-ignore
    let stored = await this.state.storage.get('value')
    // @ts-ignore
    this.value = stored || 0
  }

  // Handle HTTP requests from clients.
  async fetch(request: Request) {
    // Make sure we're fully initialized from storage.
    // @ts-ignore
    if (!this.initializePromise) {
      // @ts-ignore
      this.initializePromise = this.initialize().catch(err => {
        // If anything throws during initialization then we need to be
        // sure sure that a future request will retry initialize().
        // Note that the concurrency involved in resetting this shared
        // promise on an error can be tricky to get right -- we don't
        // recommend customizing it.
        // @ts-ignore
        this.initializePromise = undefined
        throw err
      })
    }
    // @ts-ignore
    await this.initializePromise

    // Apply requested action.
    let url = new URL(request.url)
    // @ts-ignore
    let currentValue = this.value
    switch (url.pathname) {
      case '/increment':
        // @ts-ignore
        currentValue = ++this.value
        // @ts-ignore
        await this.state.storage.put('value', this.value)
        break
      case '/decrement':
        // @ts-ignore
        currentValue = --this.value
        // @ts-ignore
        await this.state.storage.put('value', this.value)
        break
      case '/':
        // Just serve the current value. No storage calls needed!
        break
      default:
        return new Response('Not found', { status: 404 })
    }

    // Return `currentValue`. Note that `this.value` may have been
    // incremented or decremented by a concurrent request when we
    // yielded the event loop to `await` the `storage.put` above!
    // That's why we stored the counter value created by this
    // request in `currentValue` before we used `await`.
    return new Response(currentValue)
  }
}
