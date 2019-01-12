import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback, useState, useEffect } = React;

export const Turtle = ({ x, y }) => {
  const buildPoints = (x, y) => `${x - 5},${y + 5}, ${x},${y - 7}, ${x + 5},${y + 5}`;

  return <polygon
    points={buildPoints(x, y)}
    fill="green"
    strokeWidth="2"
    stroke="black" />;
};

export const AnimatedLine = ({ commandToAnimate: { drawCommand, x1, y1 }, turtle: { x, y } }) => {
  return <line x1={x1} y1={y1} x2={x} y2={y} strokeWidth="2" stroke="black" />;
};

export const StaticLines = ({ drawCommands }) => {
 return drawCommands.map(({ id, x1, y1, x2, y2 }) =>
   <line key={id} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" stroke="black" />);
};

const isDrawLineCommand = command => command.drawCommand === 'drawLine';
const distance = ({ x1, y1, x2, y2 }) => Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
const movementSpeed = 5;

export const Drawing = ({ drawCommands }) => {

  const [ previousDrawCommands, setPreviousDrawCommands ] = useState([]);
  const [ nextCommandToAnimate, setNextCommandToAnimate ] = useState(0);
  const [ turtle, setTurtle ] = useState({ x: 0, y: 0 });

  if (previousDrawCommands != drawCommands) {
    setNextCommandToAnimate(previousDrawCommands.length);
    setPreviousDrawCommands(drawCommands);
  }

  const commandToAnimate = drawCommands[nextCommandToAnimate];
  const isDrawingLine = commandToAnimate && isDrawLineCommand(commandToAnimate);

  useEffect(() => {
    let start;
    let duration;
    let animationFrameId;

    const handleFrame = (time) => {
      if (start === undefined) start = time;
      if (time < start + duration) {
        const elapsed = time - start;
        setTurtle({
          x: commandToAnimate.x1 + ((commandToAnimate.x2 - commandToAnimate.x1) * (elapsed / duration)),
          y: commandToAnimate.y1 + ((commandToAnimate.y2 - commandToAnimate.y1) * (elapsed / duration))
        });
        requestAnimationFrame(handleFrame);
      } else {
        setNextCommandToAnimate(nextCommandToAnimate + 1);
      }
    };

    if (isDrawingLine) {
      duration = movementSpeed * distance(commandToAnimate);
      animationFrameId = requestAnimationFrame(handleFrame);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [nextCommandToAnimate, drawCommands]);

  const animatedLineCommands = drawCommands.slice(0, nextCommandToAnimate).filter(isDrawLineCommand);

  return (
    <div id="viewport">
      <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <StaticLines drawCommands={animatedLineCommands} />
        { isDrawingLine ? <AnimatedLine commandToAnimate={commandToAnimate} turtle={turtle} /> : null }
        <Turtle {...turtle} />
      </svg>
    </div>
  );
};

export const ReduxConnectedDisplay = () => {
  const mapState = useCallback(({ script: { present: { drawCommands } } }) => ({ drawCommands }), []);
  const { drawCommands } = useMappedState(mapState);

  return <Drawing drawCommands={drawCommands} />;
};
