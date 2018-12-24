export const functionWithName = (name, functions) => {
  const lowerCaseName = name.toLowerCase();
  const key = Object.keys(functions).find(k => functions[k].names.includes(lowerCaseName));
  if (key) return functions[key];
};

