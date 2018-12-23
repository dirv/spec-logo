const radians = angle => Math.PI * angle / 180;

export function moveDistance(state, distanceValue) {
  const { drawCommands, turtle } = state;
  let angle = turtle.angle;
  const radius = distanceValue.get(state);
  let newX = turtle.x + Math.cos(radians(angle)) * radius;
  const newY = turtle.y + Math.sin(radians(angle)) * radius;

  return {
    drawCommands: [
      ...drawCommands,
      { drawCommand: 'drawLine',
        x1: turtle.x,
        y1: turtle.y,
        x2: newX,
        y2: newY
      }
    ],
    turtle: {
      ...turtle,
      x: newX,
      y: newY
    }
  };
}

