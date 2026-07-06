// small sample dataset for charts (time / value)
const activity = []
for (let i=0;i<30;i++){
  activity.push({
    time: `Day ${i+1}`,
    value: Math.round(500 + Math.sin(i/3)*80 + Math.random()*120)
  })
}
export default { activity }
