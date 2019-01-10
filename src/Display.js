import React from 'react';
import { useMappedState } from 'redux-react-hook';
const { useCallback, useRef, useState } = React;

export const Turtle = ({ animationCommands: { movement, rotate }, turtle }) => {
  const buildPoints = (x, y) => `${x - 5},${y + 5}, ${x},${y - 7}, ${x + 5},${y + 5}`;

  const buildRotation = (angle, x, y) => `${angle + 90}, ${x}, ${y}`;

  return <polygon
    points={buildPoints(turtle.x,turtle.y)}
    fill="green"
    strokeWidth="2"
    stroke="black"
    transform={`rotate(${buildRotation(turtle.angle, turtle.x, turtle.y)})`}>
    {movement.map(({ id, x1, y1, x2, y2, begin, duration, angle }) => {
        return <React.Fragment key={id}>
        <animate attributeName="points"
          begin={begin}
          dur={duration}
          fill="freeze"
          to={buildPoints(x2, y2)} />
        <animateTransform attributeName="transform"
          type="rotate"
          begin={begin}
          dur={duration}
          fill="freeze"
          to={buildRotation(angle, x2, y2)} />
        </React.Fragment>
    })}
    {rotate.map(({ oldAngle, newAngle, x, y, duration, begin }, i) => {
        return <animateTransform
          key={i}
          attributeName="transform"
          type="rotate"
          begin={begin}
          dur={duration}
          fill="freeze"
          to={buildRotation(newAngle, x, y)} />
    })}
    </polygon>;
};

const distance = ({ x1, y1, x2, y2 }) => Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

function drawLineAnimationTimes(command, { movement, currentTime, turtle }) {
  const movementSpeed = 0.005;
  const duration = distance(command) * movementSpeed;
  return {
    movement: [
      ...movement,
      {
        begin: currentTime,
        duration,
        angle: turtle.angle,
        x1: command.x1,
        y1: command.y1,
        x2: command.x2,
        y2: command.y2,
        id: command.id
      }
    ],
    currentTime: currentTime + duration,
    turtle: { ...turtle, x: command.x2, y: command.y2 }
  };
}

function rotationAnimationTimes(command, { rotate, currentTime, turtle }) {
  const rotateSpeed = 2 / 360;
  const duration = Math.abs(command.angle - turtle.angle) * rotateSpeed;
  return {
    rotate: [
      ...rotate,
      { begin: currentTime,
        duration,
        x: turtle.x,
        y: turtle.y,
        oldAngle: turtle.angle,
        newAngle: command.angle
      }
    ],
    currentTime: currentTime + duration,
    turtle: { ...turtle, angle: command.angle }
  };
}
export const AnimatedCommands = ({ drawCommands, startTime, turtle }) => {
  const drawLineCommands = drawCommands.filter( command => command.drawCommand === 'drawLine');

  const animationCommands = drawCommands.reduce((times, command) => {
    if (command.drawCommand === 'drawLine') {
      return { ...times, ...drawLineAnimationTimes(command, times) };
    } else if (command.drawCommand === 'rotate') {
      return { ...times, ...rotationAnimationTimes(command, times) };
    } else {
      return times;
    }
  }, { movement: [], rotate: [], currentTime: startTime, turtle });

  return (
    <React.Fragment>
      {animationCommands.movement.map(({ id, x1, y1, x2, y2, begin, duration }) => {
        return <line key={id} x1={x1} y1={y1} x2={x1} y2={y1} strokeWidth="2" stroke="black">
          <animate attributeName="x2" begin={begin} dur={duration} to={x2} fill="freeze" />
          <animate attributeName="y2" begin={begin} dur={duration} to={y2} fill="freeze" />
         </line>})}
      <Turtle animationCommands={animationCommands} turtle={turtle} />
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

function calculateLastTurtlePosition(previousCommands) {
  const reversedCommands = previousCommands.reverse();
  const lastDrawLineCommand = reversedCommands.find(command => command.drawCommand === 'drawLine');
  const lastRotation = reversedCommands.find(command => command.drawCommand === 'rotate');
  return {
    x: lastDrawLineCommand ? lastDrawLineCommand.x2 : 0,
    y: lastDrawLineCommand ? lastDrawLineCommand.y2 : 0,
    angle: lastRotation ? lastRotation.angle : 0
  };
}

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

  const previousCommands = drawCommands.slice(0, firstCommandToAnimate);

  return (
    <div id="viewport">
      <svg viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" ref={svgRef}>
        <StaticCommands drawCommands={previousCommands} />
        <AnimatedCommands
          drawCommands={drawCommands.slice(firstCommandToAnimate)}
          startTime={currentTime}
          turtle={calculateLastTurtlePosition(previousCommands)} />
      </svg>
    </div>
  );
};

export const ReduxConnectedDisplay = () => {
  const mapState = useCallback(({ script: { present: { drawCommands } } }) => ({ drawCommands }), []);
  const { drawCommands } = useMappedState(mapState);

  return <Drawing drawCommands={drawCommands} />;
};
