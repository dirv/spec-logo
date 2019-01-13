export const save = store => next => action => {
  const result = next(action);
  localStorage.setItem('state', JSON.stringify(store.getState()));
  return result;
};

export const load = () => {
  return JSON.parse(localStorage.getItem('state')) || undefined;
};
