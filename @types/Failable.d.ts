export type Result<R> = { isError: false; value: R }
export type Failure<E> = { isError: true; error: E }
export type Failable<R, E> = Result<R> | Failure<E>
