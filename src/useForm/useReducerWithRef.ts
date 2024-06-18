import { useState, useRef, useCallback, MutableRefObject } from 'react'

export function useReducerWithRef<State, Action>(
  reducer: (state: State, action: Action) => State,
  initState: State,
  init?: (value: unknown) => State
): [State, (action: Action) => void, MutableRefObject<State>] {
  const [state, setState] = useState<State>(init ? init(initState) : initState)
  const stateRef = useRef<State>(state)

  const dispatch = useCallback(
    (action: Action) => {
      const newState = reducer(stateRef.current, action)

      stateRef.current = newState

      setState(newState)
    },
    [reducer]
  )

  return [state, dispatch, stateRef]
}
