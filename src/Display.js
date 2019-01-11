import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback, useState, useEffect } = React;

export const AnimatedLine = ({ x1, y1, x2, y2, beginAt, duration }) => {
  const [ currentX2, setCurrentX2 ] = useState(x1);
  const [ currentY2, setCurrentY2 ] = useState(y1);

  useEffect(() => {
    let start;
    let timeoutId;
    let animationFrameId;

    const handleFrame = (time) => {
      if (start === undefined) start = time;
      if (time < start + duration) {
        const elapsed = time - start;
        setCurrentX2(x1 + ((x2 - x1) * (elapsed / duration)));
        setCurrentY2(y1 + ((y2 - y1) * (elapsed / duration)));
        requestAnimationFrame(handleFrame);
      } else {
        setCurrentX2(x2);
        setCurrentY2(y2);
      }
    };
    setTimeout(() => {
      animationFrameId = requestAnimationFrame(handleFrame)
    }, beginAt);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <line x1={x1} y1={y1} x2={currentX2} y2={currentY2} strokeWidth="2" stroke="black" />;
};

const distance = ({ x1, y1, x2, y2 }) => Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
const movementSpeed = 5;

export const AnimatedCommands = ({ drawCommands }) => {
  let delay = 0;
  const lineCommands = drawCommands.filter(command => command.drawCommand === 'drawLine');
  const newDelays = lineCommands.reduce((delays, command) => {
    const duration = distance(command) * movementSpeed;
    const thisDelay = delay;
    delay += duration;
    return {
      ...delays,
      [command.id]: {
        beginAt: thisDelay,
        duration
      }
    };
  }, {});

  return lineCommands.map(({ id, x1, y1, x2, y2 }) => {
    return <AnimatedLine key={id} x1={x1} y1={y1} x2={x2} y2={y2} {...newDelays[id]} />
  });
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

  const previousCommands = drawCommands.slice(0, firstCommandToAnimate);
  const commandsToAnimate = drawCommands.slice(firstCommandToAnimate);

  return (
    <div id="viewport">
      <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <StaticCommands drawCommands={previousCommands} />
        <AnimatedCommands drawCommands={commandsToAnimate} />
      </svg>
    </div>
  );
};

export const ReduxConnectedDisplay = () => {
  const mapState = useCallback(({ script: { present: { drawCommands } } }) => ({ drawCommands }), []);
  const { drawCommands } = useMappedState(mapState);

  return <Drawing drawCommands={drawCommands} />;
};
