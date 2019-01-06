import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback } = React;

export const ScriptOutput = () => {
  const mapState = useCallback(({ script: { present: { drawCommands } } }) => ({ drawCommands }), []);
  const { drawCommands } = useMappedState(mapState);

  return (
    <div id="viewport">
      <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {drawCommands.map(({ id, x1, y1, x2, y2 }) => <line key={id} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" stroke="black" />)}
      </svg>
    </div>
  );
};
