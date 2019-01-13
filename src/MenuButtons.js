import React from 'react';
import { useDispatch, useMappedState } from 'redux-react-hook';
import { defaultState } from './reducers/logo';
const { useCallback } = React;

export const MenuButtons = () => {

  const mapState = useCallback(({
    script: { past, present, future } }) => ({ past, present, future }), []);

  const { past, present, future } = useMappedState(mapState);

  const dispatch = useDispatch();

  const undo = useCallback(() => dispatch({ type: 'UNDO' }));
  const redo = useCallback(() => dispatch({ type: 'REDO' }));
  const reset = useCallback(() => dispatch({ type: 'RESET' }));

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const canReset = present !== defaultState;

  return (
    <React.Fragment>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <button onClick={reset} disabled={!canReset}>Reset</button>
    </React.Fragment>
  );
};
