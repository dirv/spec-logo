function moveDistance(turtle, distance) {
  const newX = distance + turtle.x;
  return {
    drawCommands: [
      { drawCommand: 'drawLine', x1: turtle.x, y1: turtle.y, x2: newX, y2: turtle.y }
    ],
    turtle: {
      ...turtle,
      x: newX
    }
  };
}

function rotate(turtle, addAngle) {
  return {
    drawCommands: [],
    turtle: {
      ...turtle,
      angle: addAngle + turtle.angle
    }
  };
}

export function parseLine(line, { turtle }) {
  const tokens = line.split(' ');
  const integerArgument = parseInt(tokens[1]);
  switch (tokens[0]) {
  };
  if (tokens[0] == 'forward') {
    return moveDistance(turtle, integerArgument);
  } else if (tokens[0] == 'backward') {
    return moveDistance(turtle, -integerArgument);
  } else if (tokens[0] == 'right') {
    return rotate(turtle, integerArgument);
  } else if (tokens[0] == 'left') {
    return rotate(turtle, -integerArgument);
  } else {
    return {
      error: {
        userText: line,
        description: `Unknown function: ${tokens[0]}`,
        position: { start: 0, end: tokens[0].length - 1 }
      }
    };
  }
}
