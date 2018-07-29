/**
 * Async await wrapper for easy error handling
 * @param { Promise } promise
 * @return { Promise }
 */
export function to(promise) {
  return promise
    .then(data => {
      return [null, data]
    })
    .catch(err => [err, undefined])
}
