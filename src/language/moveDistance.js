const radians = angle => Math.PI * angle / 180;

export function moveDistance(state, distanceValue) {
  let { drawCommands, turtle } = state;
  const angle = turtle.angle;
  const radius = distanceValue.get(state);
  const newX = turtle.x + Math.cos(radians(angle)) * radius;
  const newY = turtle.y + Math.sin(radians(angle)) * radius;

  if (state.pen.down) {
    drawCommands = [ ...drawCommands, {
      drawCommand: 'drawLine',
      x1: turtle.x,
      y1: turtle.y,
      x2: newX,
      y2: newY
    }];
  }

  return {
    drawCommands,
    turtle: {
      ...turtle,
      x: newX,
      y: newY
    }
  };
}

