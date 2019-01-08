export const rotate = (state, angleValue) => {
  const { turtle, drawCommands } = state;
  let { nextDrawCommandId } = state;

  const angleChange = angleValue.get(state);
  return {
    drawCommands: [ ...drawCommands, {
      drawCommand: 'rotate',
      id: nextDrawCommandId++,
      angleChange
    }],
    turtle: { ...turtle, angle: angleChange + turtle.angle }
  };
};
