export function withUndoRedo(reducer) {
  return (state, action) => {
    if (state === undefined) return {
      past: [],
      future: [],
      present: reducer(undefined, action)
    };

    const { past, present, future } = state;
    switch(action.type) {
      case 'UNDO':
        return {
          past: past.slice(0, -1),
          present: past[past.length - 1],
          future: [ ...future, present ]
        };
      case 'REDO':
        return {
          past: [ ...past, present ],
          present: future[future.length - 1],
          future: future.slice(0, -1)
        };
      default:
        const newInnerState = reducer(present, action);
        const shouldAdvanceState = newInnerState.nextInstructionId != present.nextInstructionId;
        return {
          past: shouldAdvanceState ? [ ...past, present ] : past,
          present: newInnerState,
          future: []
        };
    }
  };
}
