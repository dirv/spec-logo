export const parseCall = ({ currentInstruction: { collectedParameters, functionDefinition } }, nextArg) => {
  if(nextArg) {
    const nextArgName = functionDefinition.parameters[Object.keys(collectedParameters).length];
    collectedParameters = { ...collectedParameters, [nextArgName]: nextArg };
  }
  if (Object.keys(collectedParameters).length === functionDefinition.parameters.length) {
    return { collectedParameters, isComplete: true };
  }
  return { collectedParameters };
};

