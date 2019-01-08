import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback, useRef, useState } = React;

const distance = ({ x1, y1, x2, y2 }) => Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

export const AnimatedCommands = ({ drawCommands, startTime }) => {
  const speed = 0.005;
  const drawLineCommands = drawCommands.filter( command => command.drawCommand === 'drawLine');

  const animationTimes = drawLineCommands.reduce((times, command) => {
    const duration = distance(command) * speed;
    return {
      lines: {
        ...times.lines,
        [command.id]: {
          begin: times.currentTime,
          duration
        }
      },
      currentTime: times.currentTime + duration
    };
  }, { lines: {}, currentTime: startTime }).lines;

  return (
    <React.Fragment>
      {drawLineCommands.map(({ id, x1, y1, x2, y2 }) => {
        const times = animationTimes[id];
        return <line key={id} x1={x1} y1={y1} x2={x1} y2={y1} strokeWidth="2" stroke="black">
          <animate attributeName="x2" begin={times.begin} dur={times.duration} to={x2} fill="freeze" />
          <animate attributeName="y2" begin={times.begin} dur={times.duration} to={y2} fill="freeze" />
         </line>})}
    </React.Fragment>
  );
};

export const StaticCommands = ({ drawCommands }) => {
  const drawLineCommands = drawCommands.filter( command => command.drawCommand === 'drawLine');
  return <React.Fragment>
    {drawLineCommands.map(({ id, x1, y1, x2, y2 }) => {
      return <line key={id} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" stroke="black" />})}
    </React.Fragment>;
};

export const Drawing = ({ drawCommands }) => {
  const [ previousDrawCommands, setPreviousDrawCommands ] = useState([]);
  const [ firstCommandToAnimate, setFirstCommandToAnimate ] = useState(0);

  if (previousDrawCommands != drawCommands) {
    setFirstCommandToAnimate(previousDrawCommands.length);
    setPreviousDrawCommands(drawCommands);
  }

  const svgRef = useRef();

  let currentTime;
  if (svgRef.current) {
    currentTime = svgRef.current.getCurrentTime();
  } else {
    currentTime = 0;
  }

  return (
    <div id="viewport">
      <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" ref={svgRef}>
        <StaticCommands drawCommands={drawCommands.slice(0, firstCommandToAnimate)} />
        <AnimatedCommands
          drawCommands={drawCommands.slice(firstCommandToAnimate)}
          startTime={currentTime} />
      </svg>
    </div>
  );
};

export const ReduxConnectedDisplay = () => {
  const mapState = useCallback(({ script: { present: { drawCommands } } }) => ({ drawCommands }), []);
  const { drawCommands } = useMappedState(mapState);

  return <Drawing drawCommands={drawCommands} />;
};
