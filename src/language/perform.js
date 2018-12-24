export function perform(state) {
  const { currentInstruction, collectedParameters } = state;
  if (currentInstruction && currentInstruction.isComplete) {
    const stateWithParams = { ...state, collectedParameters: { ...collectedParameters, ...currentInstruction.collectedParameters } };
    return {
      ...state,
      ...currentInstruction.functionDefinition.perform(stateWithParams),
      currentInstruction: undefined
    };
  }
  return state;
}

export const performAll = (state, instructions) => {
  return instructions.reduce((state, instruction) => perform({ ...state, currentInstruction: instruction }), state);
};

