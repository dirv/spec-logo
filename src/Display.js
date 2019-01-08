import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback, useState, useEffect } = React;

export const DrawingLine = ({ x1, y1, x2, y2, delay, duration }) => {
  const [ endTime, setEndTime ] = useState();
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
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <line x1={x1} y1={y1} x2={currentX2} y2={currentY2} strokeWidth="2" stroke="black" />;
};

export const Drawing = ({ drawCommands }) => {
  const duration = 500;

  const [ delays, setDelays ] = useState({});

  let delay = 0;
  const newDelays = drawCommands.reduce((delays, command) => {
    if (delays[command.id] !== undefined) {
      return delays;
    } else {
      const thisDelay = delay;
      delay += duration;
      return { ...delays, [command.id]: thisDelay };
    }
  }, delays);

  if (delay !== 0) {
    setDelays(newDelays);
  }

  return (
    <div id="viewport">
      <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {drawCommands.map(({ id, x1, y1, x2, y2 }) => {
          return <DrawingLine key={id} x1={x1} y1={y1} x2={x2} y2={y2} duration={duration} delay={delays[id]} />
        })}
      </svg>
    </div>
  );
};

export const ReduxConnectedDisplay = () => {
  const mapState = useCallback(({ script: { present: { drawCommands } } }) => ({ drawCommands }), []);
  const { drawCommands } = useMappedState(mapState);

  return <Drawing drawCommands={drawCommands} />;
};
