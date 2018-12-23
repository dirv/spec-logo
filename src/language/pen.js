const changePen = option => state => ({ pen: { ...state.pen, ...option } });

export const penup = {
  initial: { isComplete: true },
  perform: changePen({ down: false })
}

export const pendown = {
  initial: { isComplete: true },
  perform: changePen({ down: true })
}
