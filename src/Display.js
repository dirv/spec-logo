import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback, useRef, useState } = React;

export const Drawing = ({ drawCommands }) => {
  const duration = 0.5;

  const svgRef = useRef();

  const [ animationTimes, setAnimationTimes ] = useState({});

  let currentTime;
  if (svgRef.current) {
    currentTime = svgRef.current.getCurrentTime();
  } else {
    currentTime = 0;
  }

  const lineCommands = drawCommands.filter(command => command.drawCommand === 'drawLine');

  const newAnimationTimes = lineCommands.reduce((times, command) => {
    if (times.newAnimationTimes[command.id] === undefined) {
      return {
        newAnimationTimes: {
          ...times.newAnimationTimes,
          [command.id]: times.nextBeginTime
        },
        nextBeginTime: times.nextBeginTime + duration
      };
    }
    return times;
  }, { newAnimationTimes: animationTimes, nextBeginTime: currentTime }).newAnimationTimes;

  if (newAnimationTimes != animationTimes) {
    setAnimationTimes(newAnimationTimes);
  }

  return (
    <div id="viewport">
      <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" ref={svgRef}>
        {lineCommands.map(({ id, x1, y1, x2, y2 }) => {
          return <line key={id} x1={x1} y1={y1} x2={x1} y2={y1} strokeWidth="2" stroke="black">
            <animate attributeName="x2" begin={newAnimationTimes[id]} dur={duration} to={x2} fill="freeze" />
            <animate attributeName="y2" begin={newAnimationTimes[id]} dur={duration} to={y2} fill="freeze" />
        </line>})}
      </svg>
    </div>
  );
};

export const ReduxConnectedDisplay = () => {
  const mapState = useCallback(({ script: { present: { drawCommands } } }) => ({ drawCommands }), []);
  const { drawCommands } = useMappedState(mapState);

  return <Drawing drawCommands={drawCommands} />;
};
