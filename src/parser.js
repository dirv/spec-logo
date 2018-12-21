function moveDistance({ x, y }, distance) {
  const newX = distance + x;
  return {
    drawCommands: [
      { drawCommand: 'drawLine', x1: x, y1: y, x2: newX, y2: y }
    ],
    turtle: {
      x: newX,
      y: y,
      angle: 0
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
  } else {
    return rotate(turtle, -integerArgument);
  }
}
