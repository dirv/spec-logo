export function parseLine(line, { turtle: { x, y, angle } }) {
  const tokens = line.split(' ');
  const integerArgument = parseInt(tokens[1]);
  if (tokens[0] == 'forward') {
    const newX = integerArgument + x;
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
  } else {
    return {
      drawCommands: [],
      turtle: {
        x: x,
        y: y,
        angle: integerArgument + angle
      }
    };
  }
}
