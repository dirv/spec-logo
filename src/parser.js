function moveDistance({ turtle, drawCommands }, distance) {
  const newX = distance + turtle.x;
  return {
    drawCommands: [
      ...drawCommands,
      { drawCommand: 'drawLine', x1: turtle.x, y1: turtle.y, x2: newX, y2: turtle.y }
    ],
    turtle: {
      ...turtle,
      x: newX
    }
  };
}

function rotate({ turtle, drawCommands }, addAngle) {
  return {
    drawCommands: drawCommands,
    turtle: {
      ...turtle,
      angle: addAngle + turtle.angle
    }
  };
}

const builtInFunctions = {
  forward: (state, args) => moveDistance(state, parseInt(args[0])),
  backward: (state, args) => moveDistance(state, -parseInt(args[0])),
  left: (state, args) => rotate(state, -parseInt(args[0])),
  right: (state, args) => rotate(state, parseInt(args[0]))
};

export function parseLine(line, state) {
  if (state.currentFunction) {
    return builtInFunctions[state.currentFunction](state, line.split(' '));
  }
  const [ functionName, ...rest ] = line.split(' ');
  if (rest.length === 0) {
    return { ...state, currentFunction: functionName };
  }
  const foundFunction = builtInFunctions[functionName];
  if (foundFunction) {
    return foundFunction(state, rest);
  } else {
    return {
      ...state,
      error: {
        userText: line,
        description: `Unknown function: ${functionName}`,
        position: { start: 0, end: functionName.length - 1 }
      }
    };
  }
}
