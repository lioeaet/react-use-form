import { useState, useRef, useCallback } from 'react'

export const useReducerWithRef = (reducer, initState, init) => {
  const [state, setState] = useState(init ? init(initState) : initState)
  const stateRef = useRef(state)

  const dispatch = useCallback(
    (action) => {
      const newState = reducer(stateRef.current, action)

      stateRef.current = newState

      setState(newState)
    },
    [reducer]
  )

  return [state, dispatch, stateRef]
}
