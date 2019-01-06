import React from 'react';
import { useDispatch, useMappedState } from 'redux-react-hook';
const { useCallback } = React;

export const MenuButtons = () => {

  const mapState = useCallback(({
    script: { past, future } }) => ({ past, future }), []);

  const { past, future } = useMappedState(mapState);

  const dispatch = useDispatch();

  const undo = useCallback(() => dispatch({ type: 'UNDO' }));
  const redo = useCallback(() => dispatch({ type: 'REDO' }));

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return (
    <React.Fragment>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </React.Fragment>
  );
};
