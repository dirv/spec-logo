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

export function parseLine(line, state) {
  const tokens = line.split(' ');
  const integerArgument = parseInt(tokens[1]);
  switch (tokens[0]) {
  };
  if (tokens[0] == 'forward') {
    return moveDistance(state, integerArgument);
  } else if (tokens[0] == 'backward') {
    return moveDistance(state, -integerArgument);
  } else if (tokens[0] == 'right') {
    return rotate(state, integerArgument);
  } else if (tokens[0] == 'left') {
    return rotate(state, -integerArgument);
  } else {
    return {
      ...state,
      error: {
        userText: line,
        description: `Unknown function: ${tokens[0]}`,
        position: { start: 0, end: tokens[0].length - 1 }
      }
    };
  }
}
